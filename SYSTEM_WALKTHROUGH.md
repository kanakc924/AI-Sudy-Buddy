# AI Study Buddy — System Architecture Walkthrough

> **Intended audience:** A developer joining this project for the first time. After reading this document, they should be able to understand every system boundary, data flow, design decision, and non-obvious implementation detail without asking a single question.

---

## Table of Contents

1. [Technology Stack & Library Audit](#1-technology-stack--library-audit)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Data Life Cycle: Image Upload End-to-End](#3-data-life-cycle-image-upload-end-to-end)
4. [Database Layer: Models & Relationships](#4-database-layer-models--relationships)
5. [API Layer: Route Handlers in Depth](#5-api-layer-route-handlers-in-depth)
6. [Authentication System](#6-authentication-system)
7. [AI Service Layer](#7-ai-service-layer)
8. [Frontend Architecture](#8-frontend-architecture)
9. [UI/UX Design System](#9-uiux-design-system)
10. [Rate Limiting & Usage Tracking](#10-rate-limiting--usage-tracking)
11. [Analytics: Streaks & Heatmaps](#11-analytics-streaks--heatmaps)

---

## 1. Technology Stack & Library Audit

### Runtime & Framework

#### `next` v16 (Next.js App Router)
**Function:** The single runtime for both the frontend UI and all backend API routes. This is a "full-stack" Next.js application—there is no separate Express server; all API logic lives in `app/api/**` as Route Handler files.

**Justification:** Using Next.js eliminates CORS configuration entirely (frontend and API are on the same origin). The App Router enables React Server Components for non-interactive pages (landing, auth), while Client Components handle interactive state. Collocating the full stack in one `next dev` process dramatically simplifies local development and deployment.

**Key convention:** Every directory under `app/api/` that contains a `route.ts` file becomes an HTTP endpoint. For example, `app/api/topics/[id]/generate/flashcards/route.ts` handles `POST /api/topics/:id/generate/flashcards`.

---

#### `react` v19 + `react-dom` v19
**Function:** UI rendering library. All pages marked `'use client'` run as Client Components (stateful, interactive). Pages without this directive are Server Components by default in the App Router.

---

### Database

#### `mongoose` v9
**Function:** Object-Document Mapper (ODM) for MongoDB. Provides schema definitions, type-safe JavaScript interfaces, automatic `timestamps` (`createdAt`/`updatedAt`), and powerful query builders.

**Justification:** Raw MongoDB driver requires manual type coercion and no schema enforcement. Mongoose gives the project a guarantee at the application level that documents have the correct shape—for example, a `Topic` always has `userId`, `subjectId`, and `sourceMaterials`. This prevents undefined-field bugs without requiring a full SQL schema migration.

**Critical pattern — connection caching:**
```typescript
// lib/db.ts
let cached = global.mongoose;                 // 1. Check if a connection is already cached
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;        // 2. Return existing connection if present

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, { bufferCommands: false });
  }
  cached.conn = await cached.promise;         // 3. Await and cache the new connection
  return cached.conn;
}
```
**Why this matters:** Next.js Route Handlers are stateless serverless functions. Without this cache, every API request would create a new TCP connection to MongoDB, exhausting the Atlas connection pool within seconds under any real load. The `global.mongoose` object persists between hot reloads in development and between invocations in production (within a worker instance).

---

### Security

#### `bcryptjs` v3
**Function:** Hashes user passwords before storage and verifies them during login.

**Usage:**
```typescript
// app/api/auth/register/route.ts
const salt = await bcrypt.genSalt(10); // Work factor 10 = ~100ms per hash
const hashedPassword = await bcrypt.hash(password, salt);
// Stored hash looks like: $2b$10$N9qo8uLOickgx2...
```
**Justification:** Bcrypt is adaptive—the `10` work factor can be increased over time as hardware gets faster, maintaining security without a schema change. Never store plaintext or MD5/SHA passwords. bcryptjs is the pure-JavaScript port, which works on any environment without native compilation.

#### `jsonwebtoken` v9
**Function:** Issues and verifies signed JSON Web Tokens for stateless authentication.

**Usage:**
```typescript
// lib/auth.ts
export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

export const verifyToken = (token: string): JwtPayload | null => {
  try { return jwt.verify(token, JWT_SECRET) as JwtPayload; }
  catch { return null; }
};
```
**Why Bearer tokens over httpOnly cookies:** The PRD targets a self-contained full-stack Next.js app. Bearer tokens in `localStorage` are simpler to implement across Next.js API Routes (no cookie configuration, no CSRF protection needed). The tradeoff is XSS vulnerability, which is mitigated by Next.js's built-in output encoding and a strict Content Security Policy.

**Token payload:** Only `{ id, email }` is embedded. This minimizes the token size and avoids storing sensitive data. The `id` field is a MongoDB ObjectId string used to scope all database queries.

---

### Cloud Storage

#### `cloudinary` v2
**Function:** Stores uploaded images (handwritten notes, diagrams) in Cloudinary's CDN and returns a permanent `secure_url`.

**Why Cloudinary over local disk or S3:** Next.js serverless functions do not have a persistent writable filesystem. Images must be stored externally. Cloudinary's free tier (25GB storage, 25GB bandwidth/month) covers the entire free-use case of this app. Its SDK provides a streaming upload API that avoids loading the entire file into memory.

**Implementation:**
```typescript
// services/cloudinary.service.ts
const uploadStream = cloudinary.uploader.upload_stream(
  { folder: "ai-study-buddy" },
  (error, result) => {
    if (result) resolve({ url: result.secure_url, publicId: result.public_id });
  }
);
uploadStream.end(fileBuffer); // Pipe the Buffer into the upload stream
```
The `publicId` is saved to MongoDB alongside the `secure_url` so images can be deleted later via `cloudinary.uploader.destroy(publicId)`.

---

### AI Integration

#### `@openrouter/ai-sdk-provider` v2 + `ai` v6 (Vercel AI SDK)
**Function:** The `ai` package provides two core functions:
- `generateText()` — for free-form text output (summaries, OCR extraction, diagram explanations)
- `generateObject()` — for structured JSON output validated against a Zod schema (flashcards, quiz questions)

The `@openrouter/ai-sdk-provider` package is the adapter that connects the Vercel AI SDK to OpenRouter.ai's unified model API, giving access to dozens of free LLMs through a single endpoint.

**Why `generateObject` over `generateText` for structured data:** Without `generateObject`, you must prompt the LLM to "respond ONLY in JSON" and then manually parse and validate the response. Free models often fail this, producing prose or malformed JSON. `generateObject` internally handles the structured output negotiation (using JSON Schema mode or function calling), automatically retries on parse failure, and validates the final output against the Zod schema before returning it. The Zod schema also serves as live documentation of what the AI is expected to produce.

#### `zod` v4
**Function:** Runtime type validation for both AI output schemas and API request body validation.

**Dual use:**
1. **AI Output Schema:** Defines the exact shape of flashcard/quiz JSON the AI must produce.
   ```typescript
   // schemas/flashcard.schema.ts
   export const FlashcardOutputSchema = z.object({
     flashcards: z.array(z.object({
       question: z.string().describe("A clear, specific question testing one concept"),
       answer: z.string().describe("A concise but complete answer"),
     }))
   });
   ```
2. **API Validation:** Validates incoming request bodies in route handlers.
   ```typescript
   // app/api/sessions/route.ts
   const validation = CreateSessionSchema.safeParse(body);
   if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
   ```

---

### File Processing

#### `pdf-parse` v1
**Function:** Extracts raw text content from PDF buffers on the server side without any browser involvement.

**Usage flow:** Client uploads a `.pdf` file → route handler reads it as an `ArrayBuffer` → converts to `Buffer` → passes to `extractTextFromPdf(buffer)` → returns raw text string.

#### `multer` v2
**Function:** Multipart form-data middleware for parsing `FormData` file uploads. In this Next.js App Router context, file uploads are handled via the built-in `req.formData()` Web API rather than multer middleware directly.

---

### Frontend Libraries

#### `framer-motion` v12
**Function:** Declarative animation library for React. Used for:
- Page mount transitions (`initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`)
- Card slide animations in the flashcard deck (`AnimatePresence` with `mode="wait"`)
- Collapsible panel height animations on the dashboard

#### `recharts` v3
**Function:** SVG-based chart library. Used for the Dashboard's Performance Trend `AreaChart` and the Topic Detail's Study Activity `BarChart`.

#### `@radix-ui/*` (28 packages)
**Function:** Unstyled, accessible component primitives. Every dialog, tooltip, dropdown, tab, and progress bar in the UI is a Radix primitive with custom Tailwind CSS styling applied. This ensures keyboard navigation, ARIA attributes, and focus management are correct without manual implementation.

#### `sonner` v2
**Function:** Toast notification system. A single `<Toaster />` is mounted in `app/layout.tsx`, and `toast.success()`, `toast.error()`, `toast.warning()` can be called from anywhere in the application without prop drilling.

#### `tailwindcss` v4
**Function:** Utility-first CSS framework. All styling is done via utility classes directly in JSX. Custom design tokens (colors, fonts, border radius) are defined in `app/globals.css` as CSS Custom Properties and exposed to Tailwind via `@theme inline`.

#### `lucide-react` v0.577
**Function:** Icon library. 500+ SVG icons as React components. Used throughout for all icons (navigation, actions, states).

#### `react-markdown` v10
**Function:** Renders AI-generated summary text (which arrives as Markdown) into properly formatted HTML with headings, bullet points, and code blocks.

#### `react-hook-form` v7 + `@hookform/resolvers` v5
**Function:** Form state management and validation. Controls the login/register forms, integrating with Zod for schema-based field validation.

#### `clsx` v2 + `tailwind-merge` v3 + `class-variance-authority` v0.7
**Function:** Utility trio for conditional and merged class names. `clsx` conditionally joins class strings. `tailwind-merge` resolves Tailwind class conflicts (e.g., `p-4 p-6` → `p-6`). `cva` creates component variants (e.g., `Button` with `variant="outline"` or `variant="default"`).

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Next.js 16 App Router               │
│                                                     │
│  ┌─────────────────────┐  ┌───────────────────────┐ │
│  │   Frontend (Client) │  │   Backend (API Routes)│ │
│  │                     │  │                       │ │
│  │  app/(auth)/        │  │  app/api/auth/        │ │
│  │  app/(dashboard)/   │  │  app/api/subjects/    │ │
│  │  components/        │  │  app/api/topics/      │ │
│  │  context/           │  │  app/api/sessions/    │ │
│  │  services/api.ts    │←─→  app/api/generate/    │ │
│  │  (HTTP fetch calls) │  │                       │ │
│  └─────────────────────┘  └──────────┬────────────┘ │
└─────────────────────────────────────┼───────────────┘
                                       │ Services Layer
                      ┌────────────────┼────────────────┐
                      ▼                ▼                 ▼
               ┌────────────┐  ┌────────────┐  ┌──────────────┐
               │  MongoDB   │  │ Cloudinary │  │  OpenRouter  │
               │  (Atlas)   │  │   (CDN)    │  │ (AI Models)  │
               └────────────┘  └────────────┘  └──────────────┘
```

### Route Groups (Next.js App Router)

The `app/` directory uses **Route Groups** (parentheses in folder names) to apply different layouts without affecting the URL:

- **`app/(auth)/`** — Contains `login/` and `register/` pages. These share no sidebar or navigation, just a centered auth form layout.
- **`app/(dashboard)/`** — Contains `dashboard/`, `subjects/`, and `topics/[id]/` pages. Every page here is wrapped in the **DashboardLayout** which renders the `Sidebar`, `MobileNav`, and main content area.
- **`app/api/`** — Server-side Route Handlers. Never renders HTML. Returns JSON only.

### Client vs. Server Components

| Component Type | Marker | Examples |
|---|---|---|
| Client Component | `'use client'` at top | All dashboard pages, flashcard session, auth pages |
| Server Component | No marker (default) | `app/layout.tsx`, `app/page.tsx` (landing) |
| Route Handler | No marker, exports `GET`/`POST`/`PUT`/`DELETE` | All files under `app/api/` |

**Rule of thumb:** If a component uses `useState`, `useEffect`, browser APIs (`localStorage`, `window`), or event handlers, it must be a Client Component. The `'use client'` directive is placed at the top of the file.

### Data Flow: Client → API → Database

1. A component calls a function from `services/api.ts` (e.g., `generateFlashcards(topicId)`)
2. `services/api.ts` calls the internal `apiFetch()` helper, which:
   a. Reads the JWT from `localStorage`
   b. Makes a `fetch` call to `/api/topics/:id/generate/flashcards`
   c. Attaches `Authorization: Bearer <token>` header
   d. Parses the response JSON
   e. Captures `X-RateLimit-*` headers and attaches them as `json._usage`
3. The Next.js Route Handler receives the request
4. `withAuth()` middleware extracts and verifies the JWT, attaching the decoded payload to `req.user`
5. The handler calls `connectDB()` to get the cached Mongoose connection
6. Database queries run with `userId` from the token (never from the request body)
7. The handler returns a `NextResponse.json()` with the standard `{ success, data }` shape

---

## 3. Data Life Cycle: Image Upload End-to-End

This is the most complex flow in the system. Tracing a single handwritten note photo from the user's device to a searchable text entry in MongoDB:

```
Step 1: User selects a JPG file in <ImageUpload /> component
Step 2: Frontend sends FormData to POST /api/topics/:id/upload-image
Step 3: Route handler validates file (type + 5MB limit)
Step 4: Route handler checks AI rate limit (DB + in-memory)
Step 5: Buffer uploaded to Cloudinary → returns { url, publicId }
Step 6: Buffer sent to OpenRouter AI Vision → returns raw extracted text
Step 7: Raw text passed to sanitizeText() → AI reformats for readability
Step 8: Topic document updated with new sourceMaterial entry
Step 9: Response returns sanitized text + rate limit headers
Step 10: Frontend shows extracted text in editable textarea
Step 11: User saves text to notes or discards
```

### Step 3 — Validation
```typescript
// app/api/topics/[id]/upload-image/route.ts
if (file.size > 5 * 1024 * 1024) {            // 5MB = 5 × 1024 × 1024 bytes
  return NextResponse.json({ error: "Image size exceeds 5MB limit" }, { status: 400 });
}
const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
if (!allowed.includes(file.type)) { /* reject */ }
```

### Step 5 — Cloudinary Upload
```typescript
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);       // Node.js Buffer for Cloudinary
const uint8Array = new Uint8Array(arrayBuffer);// Uint8Array for AI service

const cloudinaryResult = await uploadImageToCloudinary(buffer);
// Returns: { url: "https://res.cloudinary.com/...", publicId: "ai-study-buddy/abc123" }
```

### Step 6 — AI Vision Extraction
```typescript
const rawExtractedText = await extractTextFromImage(uint8Array, file.type);
// Inside extractTextFromImage:
const base64Image = Buffer.from(imageBuffer).toString('base64');
const imageUri = `data:image/jpeg;base64,${base64Image}`;
// Passed to OpenRouter as: { type: 'image', image: imageUri }
```
The AI model receives the image as a base64 data URI in the `messages` array alongside the extraction prompt.

### Step 7 — Text Sanitization (Two-Pass Approach)

OCR and AI vision often produce merged words (e.g., `"Theconceptofpolymorphism"`) and broken line continuations. The AI service runs two passes:

**Pass 1 — Regex pre-processing:**
```typescript
// services/ai.service.ts
let processedText = rawText.replace(/([^.!?:])\\n([a-z\\s])/g, '$1 $2');
// If a line doesn't end in sentence-ending punctuation AND the next line
// starts with a lowercase letter, the newline was a false line break.
// Replace it with a space to merge the sentence.
```

**Pass 2 — AI-powered word segmentation:**
A second, lighter AI call (using `gemma-3-12b-it:free`) is made with a "text formatter" prompt. This handles merged words that regex cannot solve (e.g., `"Acomputeris"` → `"A computer is"`). If this call fails, the regex-processed text is returned as a graceful fallback.

### Step 8 — MongoDB Update
```typescript
await Topic.findOneAndUpdate(
  { _id: id, userId },                         // userId guard: can't update another user's topic
  { $push: {
    sourceMaterials: {                          // Append to the sourceMaterials array
      type: 'image',
      title: file.name,
      url: cloudinaryResult.url,               // CDN URL for display
      publicId: cloudinaryResult.publicId,     // Identifier for deletion
      extractedText: extractedText,            // Sanitized AI output
      uploadedAt: new Date(),
    }
  }},
  { new: true }                                // Return the updated document
);
```

---

## 4. Database Layer: Models & Relationships

### Entity Relationship Overview

```
User (1) ──────────< Subject (N)
Subject (1) ────────< Topic (N)
Topic (1) ──────────< Flashcard (N)
Topic (1) ──────────< Quiz (N)
Topic (1) ──────────< Session (N)
User (1) ────────────< ApiUsage (N) [one per calendar day]
Topic (1) ──────────< ISourceMaterial[] [embedded subdocument array]
```

All relationships use MongoDB `ObjectId` references. There is **no JOIN** — related data is fetched either via `populate()` or via separate queries.

### User Model
```typescript
// models/User.ts
const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true }, // unique index prevents duplicate accounts
  password: { type: String, required: true },            // bcrypt hash, never plaintext
  name: { type: String, required: true },
}, { timestamps: true }); // adds createdAt, updatedAt automatically
```
**Note:** The `password` field in the TypeScript interface uses `password?: string` (optional). This allows you to safely spread a user document into an API response without forgetting to strip the password—though you should always explicitly omit it.

### Subject Model
```typescript
const subjectSchema = new Schema<ISubject>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // ownership
  title: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });
```
**Relationship:** Every Subject belongs to exactly one User. Enforced by the `required: true` on `userId`, and all queries include `{ userId }` in the filter.

### Topic Model (most complex)
```typescript
const topicSchema = new Schema<ITopic>({
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  userId:    { type: Schema.Types.ObjectId, ref: "User",    required: true },
  title:     { type: String, required: true },
  notes:     { type: String, default: "" },      // Free-form study notes, editable by user
  summary:   { type: String },                   // AI-generated markdown summary
  sourceImages: [],                              // DEPRECATED — legacy field, use sourceMaterials
  sourceMaterials: [{                            // Embedded array of uploaded files
    type:          { type: String, enum: ['image', 'pdf', 'text', 'note', 'diagram'] },
    title:         { type: String, required: true },
    url:           { type: String },             // Cloudinary CDN URL (images only)
    publicId:      { type: String },             // Cloudinary public ID (for deletion)
    extractedText: { type: String },             // AI-extracted or PDF-parsed text
    content:       { type: String },             // Manual note content
    fileName:      { type: String },
    fileExtension: { type: String },
    uploadedAt:    { type: Date, default: Date.now },
  }],
}, { timestamps: true });
```

**Why `sourceMaterials` is an embedded array:** This is a deliberate denormalization choice. Source materials are always fetched with their parent topic, never queried independently. Embedding them avoids an extra collection and a `populate()` call while keeping the data access pattern simple.

**Development schema hot-reload:**
```typescript
if (process.env.NODE_ENV === 'development' && mongoose.models.Topic) {
  delete mongoose.models.Topic; // Force schema re-registration on hot reload
}
```
Without this, adding a new field to `topicSchema` in development would silently use the cached (old) schema, making the new field invisible until a server restart.

### Flashcard Model
```typescript
const flashcardSchema = new Schema<IFlashcard>({
  topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
  userId:  { type: Schema.Types.ObjectId, ref: "User",  required: true },
  question: { type: String, required: true },
  answer:   { type: String, required: true },
  isEdited: { type: Boolean, default: false }, // flagged when manually edited by user
}, { timestamps: true });
```
**Note on `isEdited`:** When a user manually edits a flashcard via the Edit Modal during a study session, `isEdited` is set to `true`. This flag can be used for analytics (e.g., "how many AI-generated cards were corrected?") and provides an audit trail.

### Quiz Model
```typescript
const quizSchema = new Schema<IQuiz>({
  topicId:   Schema.Types.ObjectId, // ref: "Topic"
  userId:    Schema.Types.ObjectId, // ref: "User"
  questions: [{
    question:     String,           // The MCQ question text
    options:      [String],         // Exactly 4 answer choices
    correctIndex: Number,           // 0-3, index into the options array
    explanation:  String,           // AI-generated explanation of the correct answer
  }],
  isEdited: Boolean,
});
```
**Design note:** The `correctIndex` (integer) approach is used instead of storing the correct answer text. This prevents the need to string-compare answers and makes the grading logic a simple `selectedIndex === question.correctIndex`.

### Session Model
```typescript
const sessionSchema = new Schema<ISession>({
  userId:          Schema.Types.ObjectId,       // Owner
  topicId:         Schema.Types.ObjectId,       // Which topic was studied
  type:            { type: String, enum: ["flashcard", "quiz"] },
  score:           { type: Number, min: 0, max: 100 }, // Percentage 0-100
  totalQuestions:  Number,
  correctAnswers:  Number,
  answers: [{                                   // Per-card/question granular results
    questionId:  String,                        // MongoDB ObjectId of the flashcard/question
    isCorrect:   Boolean,
  }],
  duration:        { type: Number, default: 0 },// Seconds elapsed during session
  completedAt:     { type: Date, default: Date.now },
});
```
**Why `completedAt` instead of relying on `createdAt`:** A session document is created at the moment of completion (the final card is graded). `completedAt` makes the intent explicit and supports future implementations where a session might be started separately from when it is completed.

### ApiUsage Model
```typescript
const ApiUsageSchema = new Schema<IApiUsage>({
  userId: Schema.Types.ObjectId,
  date:   String,   // "2026-04-02" — ISO date string, not a Date object
  count:  Number,
});
ApiUsageSchema.index({ userId: 1, date: 1 }, { unique: true }); // Compound unique index
```
**Why a string for `date`:** Using `"YYYY-MM-DD"` strings makes the daily aggregation trivial — `new Date().toISOString().split("T")[0]` produces the key directly. Storing as `Date` objects would require `$dateToString` aggregation operators in queries.

**The compound unique index** `{ userId, date }` means each user can have at most one usage document per calendar day. Upserting this document correctly tracks cumulative daily AI requests.

---

## 5. API Layer: Route Handlers in Depth

### Standard Response Shape

Every API response conforms to this envelope:
```json
// Success
{ "success": true, "data": { ... } }

// Validation Error
{ "success": false, "error": { "message": "...", "code": "VALIDATION_ERROR", "details": [...] } }

// Rate Limit
{ "success": false, "error": "...", "code": "AI_RATE_LIMITED" }
```

### Centralized Error Handler (`lib/handleApiError.ts`)

Rather than repeating `try/catch` logic in every route, a shared `errorResponse()` function classifies errors by inspecting the error object:
```typescript
export function classifyError(error: ApiError): { status: number; message: string; code: string } {
  const isRateLimit = error?.status === 429 || error?.message?.includes('rate');
  const isCastError = error?.code === 'CastError'; // Invalid MongoDB ObjectId
  const isNotFound  = error?.status === 404 || error?.message?.includes('not found');
  // ...determine correct HTTP status and user-facing message
}

export function errorResponse(error: any) {
  const { status, message, code } = classifyError(error);
  return NextResponse.json({ success: false, error: message, code }, { status });
}
```
Route handlers `catch` blocks simply call `return errorResponse(error)`.

### Topic Cascade Delete
When a topic is deleted, all related data must be cleaned up atomically:
```typescript
// app/api/topics/[id]/route.ts (DELETE handler)
const topic = await Topic.findOneAndDelete({ _id: id, userId }); // Only deletes if owned by user

await Flashcard.deleteMany({ topicId: id, userId }); // Scoped by userId for safety
await Quiz.deleteMany({ topicId: id, userId });
await Session.deleteMany({ topicId: id, userId });
```
**Why `userId` on cascade deletes?** Even though MongoDB would reject the deletion of the parent topic for a different user, including `userId` in the cascade deletes provides an extra layer of protection against a theoretical bug where `id` could be manipulated.

### Generate → Save Pattern

All generation endpoints follow the same 5-step pattern:
```typescript
// Exemplified by: app/api/topics/[id]/generate/flashcards/route.ts

// 1. Check rate limit
const { limitedResponse, limit, remaining, reset } = await aiRateLimiter(req, userId);
if (limitedResponse) return limitedResponse;

// 2. Fetch topic (scoped to userId)
const topic = await Topic.findOne({ _id: id, userId });
if (!topic.notes) return 400 error;

// 3. Call AI service
const flashcardsData = await generateFlashcards(topic.notes);

// 4. If replace mode, delete existing data
if (replace) await Flashcard.deleteMany({ topicId: id, userId });

// 5. Save new data + return with rate limit headers
const saved = await Flashcard.insertMany(flashcardsData.map(card => ({ ...card, topicId, userId })));
return NextResponse.json({ success: true, data: saved }, { status: 201, headers });
```

The `replace` flag comes from the request body and allows users to regenerate content without accumulating stale flashcard sets.

---

## 6. Authentication System

### Registration Flow

```
POST /api/auth/register
  ├── Validate: email, password, name present
  ├── Check: User.findOne({ email }) → 409 CONFLICT if exists
  ├── Hash: bcrypt.genSalt(10) + bcrypt.hash(password, salt)
  ├── Create: User.create({ email, name, hashedPassword })
  ├── Sign: jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "1d" })
  └── Return: { token, user: { id, email, name } }
```

### Login Flow

```
POST /api/auth/login
  ├── Find: User.findOne({ email }) → 401 if not found
  ├── Verify: bcrypt.compare(rawPassword, user.password) → 401 if mismatch
  ├── Sign: jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "1d" })
  └── Return: { token, user: { id, email, name } }
```

### Token Storage & Usage

The JWT is stored in `localStorage` under the key `'study_buddy_token'`. On every API call, `services/api.ts` reads this value and attaches it:
```typescript
const apiFetch = async (path: string, options?: RequestInit) => {
  const token = localStorage.getItem('study_buddy_token');
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  // ...
};
```

### `withAuth` Middleware (Higher-Order Function)

```typescript
// lib/middleware.ts
export function withAuth(
  handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]) => {
    const authHeader = req.headers.get("authorization"); // "Bearer eyJhbGci..."
    if (!authHeader?.startsWith("Bearer ")) return 401;

    const token = authHeader.split(" ")[1];               // Extract token part
    const decoded = verifyToken(token);                   // jwt.verify()
    if (!decoded) return 401;

    (req as AuthenticatedRequest).user = decoded;         // Attach { id, email }
    return await handler(req as AuthenticatedRequest, ...args);
  };
}
```

**Usage:** Instead of `export const POST = myHandler`, every protected route exports `export const POST = withAuth(myHandler)`. This is the Higher-Order Function (HOF) pattern — `withAuth` wraps any handler function and returns a new function that performs authentication before calling the original.

### `AuthContext` — Frontend Session State

```typescript
// context/AuthContext.tsx
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('study_buddy_token');
    if (stored) checkAuthWithToken(stored); // On mount, verify token is still valid
  }, []);

  const checkAuthWithToken = async (t: string) => {
    const res = await getMe(); // GET /api/auth/me — verifies token server-side
    setUser(res.user);         // Populates user context with fresh data
  };

  const login = (token: string, user: User) => {
    localStorage.setItem('study_buddy_token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('study_buddy_token');
    setUser(null); // Clears all UI state, triggering redirects
  };

  const updateAiUsage = (total: number) => {
    if (user) setUser({ ...user, aiUsageToday: total }); // Real-time sidebar sync
  };
};
```

`GET /api/auth/me` returns the user's current data including `aiUsageToday` and `aiDailyLimit` from the `ApiUsage` collection. This is the only time the entire user profile is fetched — subsequent AI usage updates happen via header parsing (see Section 10).

---

## 7. AI Service Layer

### Model Chain (`services/ai.service.ts`)

```typescript
const MODELS = [
  'google/gemma-3-27b-it:free',   // Primary: most capable free model
  'google/gemma-3-12b-it:free',   // Fallback 1: faster, slightly less capable
  process.env.OPENROUTER_FALLBACK_MODEL || 'openrouter/auto', // Fallback 2: environment-configured
]
```

### `withFallback` — Resilience Pattern

This is the core reliability mechanism. All AI calls are wrapped in this function:

```typescript
async function withFallback<T>(
  models: string[],
  fn: (modelId: string) => Promise<T>
): Promise<T> {
  let lastError: any;

  for (const modelId of models) {
    try {
      const result = await fn(modelId);    // Attempt with current model
      return result;                        // Return on first success
    } catch (error: any) {
      lastError = error;

      // Determine if this is a RECOVERABLE error (try next model)
      const isRecoverable =
        error?.statusCode === 429 ||                                    // Rate limited
        error?.message?.includes('rate') ||                            // Rate limit message
        error?.name === 'AI_ObjectGenerationError' ||                  // JSON parsing failed
        error?.message?.includes('Failed to process successful response') || // Vercel AI SDK parse error
        error?.message?.includes('timeout');                           // Network timeout

      if (isRecoverable) {
        console.warn(`Model ${modelId} failed. Trying next model...`);
        continue; // Skip to the next model in the array
      }

      throw error; // Non-recoverable (e.g., invalid API key) — fail immediately
    }
  }
  throw new Error(`All models exhausted.`);
}
```

**Why catch `AI_ObjectGenerationError`:** Free LLMs occasionally produce JSON that is syntactically valid but doesn't match the expected schema (e.g., a quiz question with 3 options instead of 4). The Vercel AI SDK throws `AI_ObjectGenerationError` in this case. By catching it, the fallback chain automatically tries the next model, greatly improving reliability.

### Prompt Engineering

#### Summary Prompt (Free-form)
```
"You are an expert tutor. Summarize the following study notes
in a clear, structured format with key concepts highlighted.

Notes: ${notes}"
```
**Strategy:** Simple role + instruction. `generateText()` is used — no structured schema needed since the output is displayed as rendered Markdown as-is.

#### Flashcard Prompt (Structured)
```
"You are an expert tutor. Generate exactly ${count} flashcards
from these study notes. Each flashcard should test one specific concept.

Notes: ${notes}"
```
**Strategy:** The prompt says "exactly ${count}" to constrain the output quantity. The Zod schema enforces the `{ question, answer }` structure, so the prompt focuses only on content quality rather than format.

The `.describe()` annotations in the Zod schema are forwarded to the AI as JSON Schema `description` fields:
```typescript
question: z.string().describe("A clear, specific question testing one concept")
// → AI sees: { "type": "string", "description": "A clear, specific question testing one concept" }
```
This is the key mechanism for guiding output quality without verbose format instructions in the prompt.

#### Quiz Prompt (Structured, MCQ)
```
"You are an expert tutor. Generate exactly ${count} multiple-choice questions
from these study notes. Make the wrong options plausible but clearly incorrect
to someone who studied the material.

Notes: ${notes}"
```
**Strategy:** The instruction to "make wrong options plausible but clearly incorrect" is critical for quiz quality. Without this, AI models tend to generate obviously wrong distractors that make the quiz trivially easy. The schema enforces `options: z.array(z.string()).length(4)` (exactly 4 options) and `correctIndex: z.number().min(0).max(3)`.

#### Vision Extraction Prompt
```
"You are a precise text extraction assistant. Look at this image and:
1. Extract ALL text content you can see, including handwritten text.
2. Organize it logically (preserve headings, bullet points, numbered lists).
3. If you see a diagram or chart, describe what it shows in clear text.
4. If handwriting is unclear, make your best guess and put uncertain words in [brackets].

Respond with ONLY the extracted and organized text. No commentary."
```
**Strategy:** Numbered list of instructions with explicit formatting rules. "No commentary" prevents the AI from prefacing the output with "Sure! Here is the text:". The `[brackets]` hint for uncertain words is a UX feature — users can manually correct uncertain words.

#### Diagram Explanation Prompt
```
"You are an expert educator. Look at this diagram, chart, or image
and provide a clear step-by-step explanation of:
1. What the diagram shows overall
2. Each key component or element
3. How the parts relate to each other
4. What concept or process it is illustrating

Write in clear, simple language a student would understand."
```
**Strategy:** The four numbered sub-tasks guide the AI to produce a complete, structured explanation rather than a vague summary.

---

## 8. Frontend Architecture

### Route Structure (Dashboard Group)

```
app/(dashboard)/
├── dashboard/page.tsx          → /dashboard  (main analytics)
├── subjects/page.tsx           → /subjects   (subject list + CRUD)
└── topics/[id]/
    ├── page.tsx                → /topics/:id  (topic detail, 3-tab view)
    ├── flashcards/page.tsx     → /topics/:id/flashcards (study session)
    ├── quiz/page.tsx           → /topics/:id/quiz
    └── summary/page.tsx        → /topics/:id/summary
```

### Topic Detail Page — State Management Deep Dive

The `TopicDetailPage` (`app/(dashboard)/topics/[id]/page.tsx`) is the most stateful component in the application. Here is a complete map of its state:

```typescript
// Data state
const [topic, setTopic]       = useState<any>(null)      // Full topic document
const [notes, setNotes]       = useState('')              // Current editor content
const [flashcards, setFlashcards] = useState<Flashcard[]>([])
const [quizzes, setQuizzes]   = useState<QuizQuestion[]>([])
const [sessions, setSessions] = useState<any[]>([])

// UI/Loading state
const [isSaving, setIsSaving]         = useState(false)
const [saveStatus, setSaveStatus]     = useState<'idle'|'saving'|'saved'>('idle')
const [activeGen, setActiveGen]       = useState<string | null>(null) // Which AI gen is running
const [rateLimited, setRateLimited]   = useState(false)               // Rate limit cooldown active

// Edit state (modals)
const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null)
const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false)

// Material management
const [extractedText, setExtractedText] = useState('')                // From upload
const [selectedMaterial, setSelectedMaterial] = useState<any>(null)   // Library viewer

// Regeneration confirmation
const [isRegenConfirmOpen, setIsRegenConfirmOpen] = useState(false)
const [regenType, setRegenType] = useState<'flashcards' | 'quiz' | 'summary' | null>(null)
```

### Auto-Save with Debounce

Notes are saved automatically 2 seconds after the user stops typing:

```typescript
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const val = e.target.value;
  setNotes(val);
  setSaveStatus('saving');

  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); // Cancel previous timer

  saveTimeoutRef.current = setTimeout(async () => {                  // Set new 2s timer
    try {
      await updateNotes(topicId, val);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);                 // Reset indicator
    } catch (err) {
      toast.error('Failed to save notes');
    }
  }, 2000);
};
```
`useRef` is used for the timeout ID instead of `useState` because changing the timeout ID should not trigger a re-render.

### Flashcard Session State Machine

The `FlashcardSessionPage` implements a linear UI state machine:

```
State: loading → cards = []
         └─── toast.error + empty state UI

State: loading = false → cards.length > 0
         └─── Study mode:
              - isFlipped = false (show question)
              - User clicks card → isFlipped = true (show answer)
              - User clicks "Got it" → handleNext(true)
              - User clicks "Missed it" → handleNext(false)

State: currentIndex === cards.length - 1 && handleNext called
         └─── completed = true
              - logSession() called (POST /api/sessions)
              - Score circle rendered
              - Missed cards listed for review
```

**Keyboard shortcut system:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (completed || loading) return;
    if (e.code === 'Space')                    setIsFlipped(prev => !prev);
    else if (e.code === 'KeyG' && isFlipped)   handleNext(true);   // G = "Got it"
    else if (e.code === 'KeyM' && isFlipped)   handleNext(false);  // M = "Missed it"
    else if (e.code === 'ArrowRight' && isFlipped) handleNext(true);
    else if (e.code === 'ArrowLeft'  && isFlipped) handleNext(false);
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown); // Cleanup on unmount
}, [completed, loading, cards.length, isFlipped, handleNext]);       // Proper dependency array
```
The `return () => removeEventListener` pattern is the standard cleanup for `useEffect` subscriptions, preventing memory leaks when the component unmounts.

### Sidebar — Live AI Usage Bar

```typescript
// components/layout/Sidebar.tsx
{user && (
  <div className="px-4 py-3 rounded-lg bg-surface2">
    <Progress
      value={Math.min(100, ((user.aiUsageToday || 0) / (user.aiDailyLimit || 200)) * 100)}
      className="h-1.5"
    />
    {/* Warning threshold at 80% */}
    {(user.aiUsageToday || 0) / (user.aiDailyLimit || 200) >= 0.8 && (
      <AlertTriangle className="text-destructive" />
    )}
  </div>
)}
```

The `user.aiUsageToday` value is updated in real-time via the `updateAiUsage()` function from `AuthContext`, which is called after each AI generation:
```typescript
// After generateFlashcards() call succeeds
const res = await generateFlashcards(topicId, replace);
if (res?._usage) {
  updateAiUsage(res._usage.limit - res._usage.remaining);
}
```

---

## 9. UI/UX Design System

### "Soft Dark" Color Palette

The entire design system is defined as CSS Custom Properties in `app/globals.css` and toggled by adding/removing the `.dark` class on `<html>`.

#### Light Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#F0F2F5` | Page background |
| `--foreground` | `#1C1E26` | Primary text |
| `--card` | `#FFFFFF` | Card backgrounds |
| `--primary` | `#6C63FF` | Buttons, links, active states |
| `--border` | `#E0E0E0` | Card and input borders |
| `--muted-foreground` | `#60677A` | Subtext, placeholders |

#### Dark Mode (Default)
| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#1C1E26` | Main dark background |
| `--card` | `#252833` | Elevated card surface |
| `--primary` | `#8F8DF2` | Buttons, active states (lighter than light primary) |
| `--border` | `#323645` | Subtle separator lines |
| `--muted-foreground` | `#A0A6B8` | Secondary text, labels |

**Why the primary shifts from `#6C63FF` to `#8F8DF2` in dark mode:** A pure `#6C63FF` on a dark `#1C1E26` background fails WCAG AA contrast ratios. The lighter `#8F8DF2` maintains the same purple hue while meeting accessibility requirements.

#### Semantic Accent Colors (same in both modes)
| Token | Hex | Usage |
|-------|-----|-------|
| `--gold` | `#D4A853` | Streak counter, premium accents |
| `--mint` | `#34D399` (light) / `#C4F2E8` (dark) | Success, "Got it" button |
| `--destructive` | `#E54D4D` | Errors, delete actions |

### Typography

Three typefaces are loaded from Google Fonts in `app/layout.tsx`:

```typescript
const dmSans   = DM_Sans({ variable: '--font-dm-sans' });    // Body text: geometric sans-serif
const playfair = Playfair_Display({ variable: '--font-playfair' }); // Headings: elegant serif
const geistMono= Geist_Mono({ variable: '--font-geist-mono' }); // Code, stats: monospace
```

Usage pattern:
- `font-sans` → DM Sans (default body)
- `font-serif` → Playfair Display (page titles, card headings — e.g., "Session Complete!")
- `font-dm-mono` → Geist Mono (scores, dates, streak numbers)

### Glassmorphism Cards

```css
/* app/globals.css */
.glass-card {
  background: rgba(26, 25, 23, 0.7);    /* Semi-transparent dark background */
  backdrop-filter: blur(12px);           /* Frosted-glass blur of content behind */
  border: 1px solid rgba(46, 44, 41, 0.6);
}
```

In light mode:
```css
html:not(.dark) .glass-card {
  background: rgba(255, 255, 255, 0.7);  /* Semi-transparent white */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(229, 231, 235, 0.6);
}
```

### Flashcard 3D Flip Animation

```css
.flip-card { perspective: 1000px; }       /* Establishes 3D perspective context */

.flip-card-inner {
  transition: transform 0.6s;             /* Smooth 600ms flip */
  transform-style: preserve-3d;           /* Children maintain 3D positions */
}

.flip-card.flipped .flip-card-inner {
  transform: rotateY(180deg);             /* Rotate around Y-axis when .flipped is added */
}

.flip-card-front, .flip-card-back {
  backface-visibility: hidden;            /* Hide the back face when facing away */
  -webkit-backface-visibility: hidden;    /* Safari prefix */
}

.flip-card-back {
  transform: rotateY(180deg);             /* Start back face pre-rotated */
}
```

**How the flip is triggered:** The `<Flashcard />` component toggles `isFlipped` state by calling `onFlip()`. The parent passes `isFlipped` as a prop:
```tsx
<div className={`flip-card-inner ${isFlipped ? 'rotateY-180' : ''}`}>
  <div className="flip-card-front">Q: {card.question}</div>
  <div className="flip-card-back">A: {card.answer}</div>
</div>
```

### Theme Flash Prevention

A critical piece of inline JavaScript in `app/layout.tsx` prevents the "flash of wrong theme" on page load:
```tsx
<script dangerouslySetInnerHTML={{ __html: `
  try {
    var t = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.add(t);
  } catch(e) {}
` }} />
```
This script runs **before** React hydrates (because it's in `<head>`). Without it, the page would flash light (the browser default) before React reads the stored theme preference and applies the `.dark` class.

### Theme Toggle (next-themes)

```typescript
// app/layout.tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
```
`next-themes` manages the `.dark` class on `<html>`. Setting `attribute="class"` means themes are toggled via CSS classes (matching the CSS `&:is(.dark *)` variant). `enableSystem={false}` means the app ignores OS-level dark/light preference, always defaulting to dark.

---

## 10. Rate Limiting & Usage Tracking

The AI rate limiter (`lib/rateLimiter.ts`) implements a two-layer defense:

### Layer 1 — In-Memory Sliding Window (Per-Minute)

```typescript
const rateLimitMap = new Map<string, number[]>(); // userId → [timestamps]
const windowMs = 60 * 1000;  // 1 minute
const maxRequestsMinute = 15; // Max 15 AI requests per minute

let timestamps = rateLimitMap.get(userId)!.filter(t => now - t < windowMs); // Keep only recent

if (timestamps.length >= maxRequestsMinute) {
  return { limitedResponse: 429, ... }; // Throttle immediately
}
```
This prevents burst abuse (a user triggering 100 requests in 5 seconds). The `Map` lives in Node.js memory, so it resets on server restart—appropriate for a per-minute short-term throttle.

### Layer 2 — Database Daily Counter

```typescript
const todayStr = new Date().toISOString().split("T")[0]; // "2026-04-02"
let usage = await ApiUsage.findOne({ userId, date: todayStr });

if (usage && usage.count >= dailyLimit) {
  return { limitedResponse: 429, ... }; // Daily limit exceeded
}

// Increment counter (upsert pattern)
if (!usage) {
  usage = new ApiUsage({ userId, date: todayStr, count: 1 });
} else {
  usage.count += 1;
}
await usage.save();
```
The daily limit (200 requests/day) matches OpenRouter's free tier. Persisting in MongoDB means the counter survives server restarts and correctly spans calendar days.

### Rate Limit Headers

Every successful AI generation response includes:
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 187
X-RateLimit-Reset: 45120    (seconds until midnight UTC)
```

These headers are set in the route handler and parsed by `apiFetch()`:
```typescript
const limit     = res.headers.get('X-RateLimit-Limit');
const remaining = res.headers.get('X-RateLimit-Remaining');
if (limit && remaining) {
  json._usage = { limit: parseInt(limit), remaining: parseInt(remaining) };
}
return json;
```

The `_usage` field is then read in `TopicDetailPage` to call `updateAiUsage()`, updating the sidebar bar in real time without a network round-trip.

---

## 11. Analytics: Streaks & Heatmaps

### Streak Algorithm (`app/api/sessions/streak/route.ts`)

```typescript
// 1. Fetch all sessions, sorted ascending, extract only completedAt
const sessions = await Session.find({ userId }).sort({ completedAt: 1 }).select("completedAt");

// 2. Build an activity map: { "2026-04-02": 3, "2026-04-01": 1, ... }
const activityMap: Record<string, number> = {};
sessions.forEach(session => {
  const dateStr = new Date(session.completedAt).toISOString().split("T")[0];
  activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
});

// 3. Walk backwards from today
let dateToCheck = new Date();
dateToCheck.setHours(0, 0, 0, 0); // Normalize to midnight
let currentStreak = 0;

while (true) {
  const dateStr = dateToCheck.toISOString().split("T")[0];

  if (activityMap[dateStr] > 0) {
    // This date has activity — increment streak and go to previous day
    currentStreak++;
    dateToCheck.setDate(dateToCheck.getDate() - 1);
  } else if (currentStreak === 0) {
    // No activity today — check yesterday (grace period for end-of-day users)
    const yesterday = new Date(dateToCheck);
    yesterday.setDate(yesterday.getDate() - 1);
    if (activityMap[yesterday.toISOString().split("T")[0]] > 0) {
      currentStreak++;
      dateToCheck.setDate(dateToCheck.getDate() - 2);
    } else {
      break; // Neither today nor yesterday — streak is 0
    }
  } else {
    break; // Gap found — streak ends
  }
}
```

**The grace period:** A streak of 0 doesn't break immediately if the user hasn't studied today yet—it checks yesterday. This means a user who studied yesterday and hasn't studied today yet will still see their streak intact.

### Heatmap Algorithm (`app/api/sessions/heatmap/route.ts`)

```typescript
// Build: { "2026-04-01": 2, "2026-03-31": 5, ... }
const activityHeatmapMap: Record<string, number> = {};
sessions.forEach(session => {
  const dateStr = new Date(session.completedAt).toISOString().split("T")[0];
  activityHeatmapMap[dateStr] = (activityHeatmapMap[dateStr] || 0) + 1;
});

// Convert to array: [{ date: "2026-04-01", count: 2 }, ...]
return Object.keys(activityHeatmapMap).map(date => ({
  date,
  count: activityHeatmapMap[date]
}));
```

The frontend Dashboard renders this data as a grid of colored cells where darker colors represent more activity. The `date` string is used to match sessions to grid cells.

### Weak Topics Algorithm (`app/api/sessions/stats/route.ts`)

```typescript
// Calculate average score per topic from last 50 sessions
const topicScores: Record<string, { total: number, count: number, title: string }> = {};

recentSessions.forEach(session => {
  const tId = session.topicId._id.toString();
  if (!topicScores[tId]) topicScores[tId] = { total: 0, count: 0, title: session.topicId.title };
  topicScores[tId].total += session.score;
  topicScores[tId].count += 1;
});

const weakTopics = Object.keys(topicScores)
  .map(tId => ({ ...topicScores[tId], score: Math.round(topicScores[tId].total / topicScores[tId].count) }))
  .filter(t => t.score < 75)   // Only topics below 75% average
  .sort((a, b) => a.score - b.score) // Worst first
  .slice(0, 3);                // Top 3 weakest
```

A topic is considered "weak" if the user's average score across all recent sessions for that topic is below 75%. The threshold is intentionally forgiving — 75% (not 50%) — to surface topics that need attention before they become critical knowledge gaps.

---

## Environment Variables Reference

| Variable | Description | Required |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | Secret for signing/verifying JWTs | ✅ |
| `OPENROUTER_API_KEY` | API key for OpenRouter.ai | ✅ |
| `OPENROUTER_PRIMARY_MODEL` | Primary AI model ID | Optional (has default) |
| `OPENROUTER_FALLBACK_MODEL` | Fallback AI model ID | Optional (has default) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | ✅ for image upload |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ for image upload |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ for image upload |

All variables are loaded from `.env.local` in development. The `.env.local` file is listed in `.gitignore` and must never be committed. A `.env.example` file (without real values) should be committed for onboarding.

---

*End of System Walkthrough — Generated 2026-04-02*
