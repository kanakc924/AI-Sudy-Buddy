# AI Study Buddy

## Build an AI-Powered Learning Companion with the MERN Stack

---

## Overview

Build a full-stack web application where users can upload their study materials (typed notes, photos of handwritten notes, textbook pages, diagrams, PDFs) and an AI assistant generates flashcards, quizzes, and summaries from that content. Users track their learning progress over time with streaks, scores, and performance analytics.

**What makes this project stand out:** You will integrate the **OpenRouter API** using the official **@openrouter/ai-sdk-provider** with the **Vercel AI SDK**, a production-grade toolkit used by thousands of companies. You will work with a **free vision-capable AI model**, meaning your app can "see" and understand images, not just text. An intern who ships this demonstrates they can work with modern AI tooling, handle multimodal input, manage costs (free tier limits), and build a complete product.

---

## Why OpenRouter + Vercel AI SDK?

**OpenRouter** is a unified API gateway that gives you access to hundreds of AI models from different providers (Google, Meta, Mistral, Qwen, and more) through a single API. **Vercel AI SDK** (`ai` package) is the industry-standard TypeScript toolkit for building AI-powered applications. Together, they give you:

- **`generateText`** and **`generateObject`** functions that handle all the complexity of calling AI models.
- **`generateObject` with Zod schemas** for type-safe, validated structured output (no more manual JSON parsing from raw AI responses).
- **Built-in support for multimodal messages** (text + images) using a clean, typed API.
- **Model swapping by changing one string**, no code rewrite needed.
- Several powerful models are **completely free**, including ones with **vision capabilities**.
- No credit card required to get started.

### Recommended Free Vision Model

Use **`google/gemma-3-27b-it:free`** as your primary model. It supports both text and image inputs, has a 131K token context window, and is completely free.

**Fallback options** (if the primary model is unavailable or rate-limited):

| Model ID | Provider | Context | Strengths |
|---|---|---|---|
| `google/gemma-3-12b-it:free` | Google | 33K | Lighter, faster responses |
| `qwen/qwen2.5-vl-72b-instruct:free` | Qwen | 32K | Strong vision understanding |
| `mistralai/mistral-small-3.1-24b-instruct:free` | Mistral | 128K | Good at structured output |
| `meta-llama/llama-3.2-11b-vision-instruct:free` | Meta | 128K | Solid all-rounder |

> **Pro tip:** OpenRouter also offers `openrouter/free`, a meta-router that automatically picks from available free models based on your request's needs (text-only, vision, tool use, etc.). You can use this as an ultimate fallback.

### Free Tier Rate Limits

Free models on OpenRouter typically allow **20 requests per minute** and **200 requests per day**. Your app must handle these limits gracefully. This is actually a great learning opportunity because real production apps deal with rate limits constantly.

---

## Core User Stories

### Authentication

- As a user, I can register with my email and password.
- As a user, I can log in and receive a JWT token that persists across browser sessions.
- As a user, I can log out, and my token is invalidated on the client.
- As a user, I can access only my own study materials and progress (no cross-user data leaks).

### Study Material Management

- As a user, I can create a **Subject** (e.g., "Biology 101", "JavaScript Fundamentals").
- As a user, I can create **Topics** within a subject (e.g., "Cell Division" under Biology 101).
- As a user, I can paste or type notes into a topic.
- As a user, I can upload a PDF or text file, and the app extracts the text content from it.
- As a user, I can **upload an image** (photo of handwritten notes, a textbook page, a whiteboard, a diagram) and the AI extracts and organizes the content from it using vision capabilities.
- As a user, I can edit or delete my notes, topics, and subjects.

### AI-Powered Generation

- As a user, I can click "Generate Flashcards" on any topic, and the AI creates question/answer pairs from my notes.
- As a user, I can click "Generate Quiz" on any topic, and the AI creates multiple-choice questions with explanations for correct answers.
- As a user, I can click "Generate Summary" on any topic, and the AI produces a concise, structured summary of my notes.
- As a user, I can **upload an image directly** to any generation endpoint (e.g., snap a photo of a textbook page and generate a quiz from it without manually typing the content first).
- As a user, I can regenerate any of the above if I'm not satisfied with the output.
- As a user, I can edit AI-generated content (fix a wrong flashcard, adjust a quiz question).

### Image-Powered Features (Vision)

- As a user, I can upload a photo of my **handwritten notes** and the AI extracts the text, cleans it up, and saves it as typed notes in my topic.
- As a user, I can upload a **diagram or chart** and the AI generates a text explanation of what it shows, which becomes part of my study material.
- As a user, I can upload a **textbook page or screenshot** and generate flashcards or quizzes directly from the image without any manual transcription.

### Study Sessions

- As a user, I can start a **Flashcard Session** where cards are shown one at a time. I mark each as "Got it" or "Missed it".
- As a user, I can start a **Quiz Session** where I answer multiple-choice questions and see my score at the end with explanations for wrong answers.
- As a user, I see a **Summary View** that presents the AI summary in a clean, readable format.

### Progress Tracking

- As a user, I can see my **study streak** (consecutive days I've completed at least one session).
- As a user, I can see my **quiz score history** per topic over time (line chart).
- As a user, I can see a **dashboard** showing: total subjects, total study sessions, average quiz score, current streak, and a heatmap of study activity (like GitHub's contribution graph).
- As a user, I can see which topics I struggle with most (lowest average quiz scores).

---

## Technical Requirements

### Backend (Node.js + Express + MongoDB)

#### API Design

Build a RESTful API with the following resource structure:

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me                    (get current user from token)

Subjects
  GET    /api/subjects                   (all subjects for logged-in user)
  POST   /api/subjects
  PUT    /api/subjects/:id
  DELETE /api/subjects/:id

Topics
  GET    /api/subjects/:subjectId/topics
  POST   /api/subjects/:subjectId/topics
  PUT    /api/topics/:id
  DELETE /api/topics/:id

Notes
  PUT    /api/topics/:topicId/notes      (add/update notes text)
  POST   /api/topics/:topicId/upload     (upload PDF/text file)
  POST   /api/topics/:topicId/upload-image (upload image for vision extraction)

AI Generation
  POST   /api/topics/:topicId/generate/flashcards
  POST   /api/topics/:topicId/generate/quiz
  POST   /api/topics/:topicId/generate/summary
  POST   /api/generate/from-image        (generate directly from uploaded image)

Flashcards
  GET    /api/topics/:topicId/flashcards
  PUT    /api/flashcards/:id             (edit a flashcard)
  DELETE /api/flashcards/:id

Quizzes
  GET    /api/topics/:topicId/quizzes
  PUT    /api/quizzes/:id

Sessions
  POST   /api/sessions                   (log a completed study session)
  GET    /api/sessions/stats             (aggregated stats for dashboard)
  GET    /api/sessions/streak            (current streak info)
  GET    /api/sessions/heatmap           (activity data for heatmap)
```

#### Authentication & Security

- Use **bcrypt** for password hashing (minimum 10 salt rounds).
- Use **jsonwebtoken** for JWT generation and verification.
- Create an `auth` middleware that verifies the JWT on every protected route.
- Store the JWT secret in environment variables (never hardcode).
- Every database query for user-owned resources must filter by `userId`. This is the number one security mistake juniors make.

#### Database Schema Design

Design your MongoDB schemas thoughtfully. Here is the expected data model:

**User**
```
{
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  createdAt: Date
}
```

**Subject**
```
{
  userId: ObjectId (ref: User, required),
  title: String (required),
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Topic**
```
{
  subjectId: ObjectId (ref: Subject, required),
  userId: ObjectId (ref: User, required),
  title: String (required),
  notes: String (the raw study material text),
  summary: String (AI-generated summary, nullable),
  sourceImages: [
    {
      url: String (Cloudinary URL),
      publicId: String (Cloudinary public ID for deletion),
      extractedText: String (text the AI extracted from this image),
      uploadedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Flashcard**
```
{
  topicId: ObjectId (ref: Topic, required),
  userId: ObjectId (ref: User, required),
  question: String (required),
  answer: String (required),
  isEdited: Boolean (default: false),
  createdAt: Date
}
```

**Quiz**
```
{
  topicId: ObjectId (ref: Topic, required),
  userId: ObjectId (ref: User, required),
  questions: [
    {
      question: String,
      options: [String] (exactly 4),
      correctIndex: Number (0-3),
      explanation: String
    }
  ],
  isEdited: Boolean (default: false),
  createdAt: Date
}
```

**StudySession**
```
{
  userId: ObjectId (ref: User, required),
  topicId: ObjectId (ref: Topic, required),
  type: String (enum: "flashcard", "quiz"),
  score: Number (percentage, 0-100),
  totalQuestions: Number,
  correctAnswers: Number,
  completedAt: Date
}
```

> **Design Decision to Think About:** Why does every document have `userId` even though you could traverse Subject -> Topic -> Flashcard? Because querying "all flashcards for this user" without denormalizing userId would require multiple lookups or aggregation pipelines. In MongoDB, duplicating a reference for query efficiency is a standard and accepted pattern. This tradeoff between normalization and query performance is something you will encounter constantly in real work.

#### File Upload & Processing

- Use **Multer** middleware to handle file uploads.
- Accept `.pdf`, `.txt`, `.png`, `.jpg`, `.jpeg`, and `.webp` files (validate MIME type on the server, don't trust the client).
- Use **pdf-parse** to extract text from PDFs.
- For images: store them in **Cloudinary** (free tier: 25GB storage, 25GB bandwidth/month) and save the returned URL in MongoDB. Do NOT store binary image data in your database.
- Set a file size limit (e.g., 5MB) to prevent abuse.
- For text files and PDFs, store extracted text in the Topic's `notes` field.
- For images, send the image to the AI vision model for text extraction, then store both the image URL and extracted text.

---

#### OpenRouter AI Integration (Using @openrouter/ai-sdk-provider + Vercel AI SDK)

This is the most important technical section. Read it carefully.

**Why this stack instead of the raw `openai` package?**

The `openai` npm package gives you low-level HTTP calls and raw string responses. The **Vercel AI SDK** (`ai` package) combined with **@openrouter/ai-sdk-provider** gives you:

- **`generateObject`** with **Zod schemas**: Instead of prompting the AI for "valid JSON" and hoping it complies, you define a typed schema and the SDK handles validation, retries, and parsing for you. No more `JSON.parse()` on raw strings that might fail.
- **`generateText`** for free-form text generation (summaries, text extraction).
- **Typed multimodal messages**: Send images as `{ type: "image", image: buffer }` with proper typing, not hand-crafted JSON.
- **Provider abstraction**: The same code works if you later switch from OpenRouter to a direct provider. Change one import, everything else stays the same.

**Step 1: Install the packages**

```bash
npm install @openrouter/ai-sdk-provider ai zod
```

- `@openrouter/ai-sdk-provider`: The official OpenRouter provider for the Vercel AI SDK.
- `ai`: The Vercel AI SDK core, gives you `generateText`, `generateObject`, etc.
- `zod`: Schema validation library used by the AI SDK for structured output.

**Step 2: Create the AI Service (`services/ai.service.js`)**

```javascript
const { createOpenRouter } = require("@openrouter/ai-sdk-provider");
const { generateText, generateObject } = require("ai");
const { z } = require("zod");

// Create the OpenRouter provider instance
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Model references
const PRIMARY_MODEL = process.env.OPENROUTER_PRIMARY_MODEL;   // "google/gemma-3-27b-it:free"
const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL;  // "qwen/qwen2.5-vl-72b-instruct:free"

function getModel(useFallback = false) {
  const modelId = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
  return openrouter(modelId);
}
```

**Step 3: Text generation with `generateText` (for summaries and text extraction)**

```javascript
async function generateSummary(notes) {
  try {
    const { text } = await generateText({
      model: getModel(),
      prompt: `You are an expert tutor. Summarize the following study notes 
in a clear, structured format with key concepts highlighted.

Notes:
${notes}`,
    });

    return text;
  } catch (error) {
    if (error.statusCode === 429) {
      // Rate limited on primary, try fallback
      const { text } = await generateText({
        model: getModel(true),
        prompt: `Summarize these study notes clearly and concisely:\n\n${notes}`,
      });
      return text;
    }
    throw error;
  }
}
```

**Step 4: Structured output with `generateObject` + Zod (for flashcards and quizzes)**

This is the key upgrade over the raw `openai` approach. Instead of asking the AI for JSON and parsing it yourself, you define a Zod schema and the SDK guarantees the output matches:

```javascript
// ---- Zod Schemas (define these in a schemas/ folder) ----

const FlashcardSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string().describe("A clear, specific question testing one concept"),
      answer: z.string().describe("A concise but complete answer"),
    })
  ),
});

const QuizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe("A clear question testing understanding"),
      options: z
        .array(z.string())
        .length(4)
        .describe("Exactly 4 answer choices"),
      correctIndex: z
        .number()
        .min(0)
        .max(3)
        .describe("Index of the correct answer (0-3)"),
      explanation: z
        .string()
        .describe("Why the correct answer is right"),
    })
  ),
});

// ---- Generation Functions ----

async function generateFlashcards(notes, count = 10) {
  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: FlashcardSchema,
      prompt: `You are an expert tutor. Generate exactly ${count} flashcards 
from these study notes. Each flashcard should test one specific concept.

Notes:
${notes}`,
    });

    // object.flashcards is fully typed and validated
    return object.flashcards;
  } catch (error) {
    if (error.statusCode === 429) {
      const { object } = await generateObject({
        model: getModel(true),
        schema: FlashcardSchema,
        prompt: `Generate ${count} flashcards from these notes:\n\n${notes}`,
      });
      return object.flashcards;
    }
    throw error;
  }
}

async function generateQuiz(notes, count = 5) {
  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: QuizSchema,
      prompt: `You are an expert tutor. Generate exactly ${count} multiple-choice 
questions from these study notes. Make the wrong options plausible but 
clearly incorrect to someone who studied the material.

Notes:
${notes}`,
    });

    // object.questions is fully typed and validated
    return object.questions;
  } catch (error) {
    if (error.statusCode === 429) {
      const { object } = await generateObject({
        model: getModel(true),
        schema: QuizSchema,
        prompt: `Generate ${count} quiz questions from these notes:\n\n${notes}`,
      });
      return object.questions;
    }
    throw error;
  }
}
```

> **Why this is a massive improvement over manual JSON parsing:** With the raw `openai` package, you would send a prompt asking for "valid JSON", get back a raw string, strip markdown fences, try `JSON.parse()`, handle failures, and pray the shape matches what you expect. With `generateObject` + Zod, the SDK handles all of that. If the AI returns malformed output, the SDK retries automatically. The returned `object` is guaranteed to match your Zod schema, with full TypeScript type inference if you ever add types. This is how production AI applications are built.

**Step 5: Vision (processing images of notes, diagrams, textbook pages)**

The Vercel AI SDK uses `{ type: "image" }` parts in the messages array to send images. You can pass either a base64 string, a `Uint8Array` buffer, or a URL:

```javascript
const fs = require("fs");

// From a file on disk (e.g., after Multer saves an upload)
async function extractTextFromImage(filePath, mimeType) {
  const imageBuffer = fs.readFileSync(filePath);

  try {
    const { text } = await generateText({
      model: getModel(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a precise text extraction assistant. Look at this image and:
1. Extract ALL text content you can see, including handwritten text.
2. Organize it logically (preserve headings, bullet points, numbered lists).
3. If you see a diagram or chart, describe what it shows in clear text.
4. If handwriting is unclear, make your best guess and put uncertain words in [brackets].

Respond with ONLY the extracted and organized text. No commentary.`,
            },
            {
              type: "image",
              image: imageBuffer,
              mimeType: mimeType, // "image/png", "image/jpeg", etc.
            },
          ],
        },
      ],
    });

    return text;
  } catch (error) {
    if (error.statusCode === 429) {
      const { text } = await generateText({
        model: getModel(true),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all text from this image:" },
              { type: "image", image: imageBuffer, mimeType },
            ],
          },
        ],
      });
      return text;
    }
    throw error;
  }
}

// From a Cloudinary URL (for images already stored)
async function extractTextFromImageUrl(imageUrl) {
  const { text } = await generateText({
    model: getModel(),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all text from this image. Organize logically.",
          },
          {
            type: "image",
            image: new URL(imageUrl),
          },
        ],
      },
    ],
  });

  return text;
}
```

**Step 6: Vision + Structured Output combined (generate flashcards directly from an image)**

This is the most powerful pattern: send an image and get back structured, validated data:

```javascript
async function generateFlashcardsFromImage(filePath, mimeType, count = 10) {
  const imageBuffer = fs.readFileSync(filePath);

  const { object } = await generateObject({
    model: getModel(),
    schema: FlashcardSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are an expert tutor. Look at this image of study material 
and generate exactly ${count} flashcards based on the content you see. 
Each flashcard should test one specific concept from the image.`,
          },
          {
            type: "image",
            image: imageBuffer,
            mimeType: mimeType,
          },
        ],
      },
    ],
  });

  return object.flashcards;
}

async function generateQuizFromImage(filePath, mimeType, count = 5) {
  const imageBuffer = fs.readFileSync(filePath);

  const { object } = await generateObject({
    model: getModel(),
    schema: QuizSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Look at this image of study material and generate exactly ${count} 
multiple-choice questions based on what you see.`,
          },
          {
            type: "image",
            image: imageBuffer,
            mimeType: mimeType,
          },
        ],
      },
    ],
  });

  return object.questions;
}
```

> **What just happened:** You sent an image of a textbook page and got back a fully validated array of quiz questions with typed fields. No JSON parsing. No string cleaning. No "please respond in valid JSON" prompts. The Zod schema defines the contract, and the AI SDK enforces it. This is the pattern that separates junior code from production code.

**Step 7: Export everything cleanly**

```javascript
module.exports = {
  generateSummary,
  generateFlashcards,
  generateQuiz,
  extractTextFromImage,
  extractTextFromImageUrl,
  generateFlashcardsFromImage,
  generateQuizFromImage,
};
```

---

#### Using the AI Service in Controllers

Here is how your route controllers consume the AI service:

```javascript
// controllers/ai.controller.js
const aiService = require("../services/ai.service");
const Topic = require("../models/Topic");
const Flashcard = require("../models/Flashcard");

async function generateFlashcardsForTopic(req, res, next) {
  try {
    const topic = await Topic.findOne({
      _id: req.params.topicId,
      userId: req.user.id,   // ALWAYS scope to logged-in user
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: { message: "Topic not found", code: "NOT_FOUND" },
      });
    }

    if (!topic.notes || topic.notes.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "Topic has no notes to generate from", code: "NO_CONTENT" },
      });
    }

    // generateFlashcards returns validated, typed data
    const flashcards = await aiService.generateFlashcards(topic.notes);

    // Save to database
    const savedCards = await Flashcard.insertMany(
      flashcards.map((card) => ({
        topicId: topic._id,
        userId: req.user.id,
        question: card.question,
        answer: card.answer,
      }))
    );

    res.status(201).json({ success: true, data: savedCards });
  } catch (error) {
    next(error);
  }
}
```

Notice how clean this is: `aiService.generateFlashcards()` returns an array of `{ question, answer }` objects that are already validated. No try/catch around `JSON.parse`, no stripping markdown fences, no "retry if the AI returned garbage". The SDK handles all of that internally.

---

#### Caching AI Responses

Cache AI-generated content in the database. If flashcards already exist for a topic, do not call the AI again unless the user explicitly clicks "Regenerate". This is critical because:
- Free tier rate limits are strict (200 requests/day).
- Every unnecessary API call wastes your limited daily budget.
- Users should see instant results when revisiting content they already generated.

#### Rate Limit Handling

Build a rate limit tracking system on your backend:

```javascript
// middleware/aiRateLimiter.js
const rateLimitMap = new Map(); // In production, use Redis

function aiRateLimiter(req, res, next) {
  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 15; // Stay under OpenRouter's 20/min to have buffer

  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, []);
  }

  const timestamps = rateLimitMap
    .get(userId)
    .filter((t) => now - t < windowMs);
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);

  if (timestamps.length > maxRequests) {
    return res.status(429).json({
      success: false,
      error: {
        message:
          "You are generating too fast. Please wait a moment before trying again.",
        code: "AI_RATE_LIMIT",
        retryAfter: Math.ceil(windowMs / 1000),
      },
    });
  }

  next();
}

module.exports = aiRateLimiter;
```

> **Why not just rely on OpenRouter's rate limit?** Because a 429 from OpenRouter means your request was rejected and you got nothing back. By rate-limiting on your own server first, you can give the user a friendly message before they waste a request. Defense in depth.

#### Input Validation & Error Handling

- Use **express-validator** or **Zod** (you already have it installed for the AI SDK) to validate ALL incoming request bodies. Never trust client data.
- Create a centralized error handling middleware (`middleware/errorHandler.js`). Every error should return a consistent JSON shape:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "VALIDATION_ERROR"
  }
}
```

- Use proper HTTP status codes: 400 for validation errors, 401 for unauthenticated, 403 for unauthorized, 404 for not found, 429 for rate limiting, 500 for server errors.

---

### Frontend (React)

#### Tech Stack

- **React 18+** with functional components and hooks only (no class components).
- **React Router v6** for client-side routing.
- **Axios** or **fetch** with a configured API client (base URL, interceptors for attaching JWT).
- **A charting library** (Recharts recommended) for the dashboard.
- **CSS**: Use CSS Modules, Tailwind CSS, or a component library like Chakra UI or ShadCN. Pick one and be consistent.

#### Page Structure

```
/                     -> Landing page (if not logged in) or redirect to /dashboard
/register             -> Registration form
/login                -> Login form
/dashboard            -> Main dashboard with stats, streaks, heatmap
/subjects             -> List of all subjects
/subjects/:id         -> Single subject with its topics listed
/topics/:id           -> Single topic: notes editor, image upload, generate buttons
/topics/:id/flashcards-> Flashcard study session (card flip interface)
/topics/:id/quiz      -> Quiz session (one question at a time, score at end)
/settings             -> User profile and account settings
```

#### State Management Rules

- Use **React Context + useReducer** for auth state (current user, token).
- Use **local component state** (useState) for form inputs and UI toggles.
- Use **custom hooks** to encapsulate data fetching logic. For example:
  - `useSubjects()` returns `{ subjects, loading, error, createSubject, deleteSubject }`
  - `useFlashcardSession(topicId)` returns `{ cards, currentIndex, next, previous, markCorrect, markMissed, results }`
- Do NOT install Redux for this project. It is overkill here and will slow you down. Context + hooks is the correct tool for this scope.

#### Key UI Components to Build

**Image Upload Area**
- Drag-and-drop zone or click-to-upload for images.
- Show image preview after selection (use `URL.createObjectURL`).
- Display a loading/processing state while the AI analyzes the image.
- After processing, show the extracted text and let the user review/edit it before saving to notes.
- Support multiple images per topic (displayed as thumbnails with extracted text beneath each).

**Flashcard Viewer**
- Card flip animation (CSS transform, `rotateY`).
- Shows question on front, answer on back.
- Navigation: Previous, Next, "Got it", "Missed it" buttons.
- Progress bar showing card X of Y.
- Results screen at the end with score and breakdown.

**Quiz Interface**
- One question at a time with 4 clickable options.
- After selecting an answer, immediately show correct/incorrect with the explanation.
- "Next Question" button to proceed.
- Final score screen with option to review wrong answers.

**Dashboard**
- Stat cards: Total subjects, Total sessions, Average score, Current streak.
- Line chart: Quiz scores over time (use Recharts `<LineChart>`).
- Activity heatmap: A grid showing study activity over the last 12 weeks (similar to GitHub contributions). This is a great component to build from scratch.
- Weak topics list: Topics with the lowest average scores, so the user knows where to focus.
- AI usage indicator: Show how many of the daily free-tier requests have been used (helps the user understand rate limits and plan their study sessions).

**Notes Editor**
- A `<textarea>` or a basic rich text area for notes.
- Character count display.
- "Upload PDF" button that opens a file picker, uploads to the server, and populates the notes field with extracted text.
- "Upload Image" button (or drag-and-drop zone) for vision-based extraction.
- Loading indicator while file is being processed.

**AI Generation Panel**
- Three buttons: "Generate Flashcards", "Generate Quiz", "Generate Summary".
- An additional "Generate from Image" option that lets users upload an image and pick what to generate (flashcards, quiz, or summary) in one flow.
- Each shows a loading/spinner state while the AI is working.
- If content already exists, show a "Regenerate" button with a confirmation dialog (this will overwrite existing content).
- Display generated content inline below the buttons.
- Show a clear message when rate-limited instead of a cryptic error.

#### Protected Routes

- Create a `<ProtectedRoute>` wrapper component that checks for a valid JWT.
- If no token exists, redirect to `/login`.
- On app load, call `GET /api/auth/me` to verify the token is still valid before rendering protected content.

---

### Environment Variables

Your `.env` file should contain (provide a `.env.example` in the repo without actual values):

```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-study-buddy

# Auth
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# OpenRouter (free, no credit card required)
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_PRIMARY_MODEL=google/gemma-3-27b-it:free
OPENROUTER_FALLBACK_MODEL=qwen/qwen2.5-vl-72b-instruct:free

# Cloudinary (for image storage, free tier)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# File Upload
MAX_FILE_SIZE=5242880
```

---

## Getting Your OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai) and create an account (no credit card needed).
2. Navigate to your dashboard and click "Create API Key".
3. Copy the key and add it to your `.env` file as `OPENROUTER_API_KEY`.
4. That is it. Free models require zero credits, zero payment. You can start making requests immediately.

### Verify It Works

Before writing any app code, test the SDK in a standalone script:

```javascript
// test-ai.js
require("dotenv").config();
const { createOpenRouter } = require("@openrouter/ai-sdk-provider");
const { generateText } = require("ai");

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function test() {
  const { text } = await generateText({
    model: openrouter("google/gemma-3-27b-it:free"),
    prompt: "Explain photosynthesis in 2 sentences.",
  });
  console.log("Response:", text);
}

test().catch(console.error);
```

Run it with `node test-ai.js`. If you see a response, your setup is correct.

---

## Stretch Goals

Complete the core requirements above first. Then pick from these to level up:

### Spaced Repetition (Difficulty: Medium)

Implement the **Leitner system** for flashcards. Cards you get wrong appear more frequently, cards you get right appear less often. This requires adding a `box` field (1-5) to each flashcard and a `nextReviewDate` field. Research the Leitner system before implementing.

### AI Chat with Your Notes (Difficulty: Medium-Hard)

Add a chat interface where the user can ask questions about their notes, and the AI answers based only on that context. This teaches you about context window management (what happens when notes are too long for a single API call) and conversational memory (sending chat history with each request).

### Explain This Diagram (Difficulty: Medium)

When a user uploads a diagram/flowchart/chart image, the AI not only extracts information but generates a step-by-step walkthrough explanation. Think of it like a mini lecture generated from a single image. This pushes you to write more sophisticated vision prompts and structure longer AI outputs.

### Multi-Model Comparison (Difficulty: Easy-Medium)

Let users generate flashcards from two different free models side by side and pick the better set. This teaches A/B testing patterns and gives users a sense of how different models perform. Since you are using OpenRouter, switching models is just changing the model string passed to `openrouter()`.

### Export to Anki (Difficulty: Easy-Medium)

Generate an `.apkg` file (Anki deck format) from flashcards so users can import them into Anki. This teaches you about generating binary file formats and file downloads from the server.

### Dark Mode & Theming (Difficulty: Easy)

Implement a theme toggle using CSS custom properties and React Context. Store the preference in localStorage. Sounds simple, but doing it cleanly with no flash of wrong theme on page load is trickier than expected.

---

## Evaluation Criteria

Your project will be assessed on these dimensions:

| Area | What "Good" Looks Like |
|---|---|
| **Code Organization** | Clear folder structure. Routes, controllers, services, and models are separated. No 500-line files. |
| **API Design** | RESTful conventions followed. Consistent response shapes. Proper status codes. |
| **Security** | Passwords hashed. JWT implemented correctly. Every query scoped to the logged-in user. Input validated on the server. |
| **Error Handling** | No unhandled promise rejections. User-friendly error messages on the frontend. Centralized error middleware on the backend. |
| **AI Integration** | OpenRouter + AI SDK connected properly. `generateObject` used with Zod schemas for structured output. `generateText` used for free-form text. Fallback model works when primary is rate-limited. Responses are cached. |
| **Vision Features** | Image upload works for multiple formats. AI extracts text from handwritten notes and diagrams via `{ type: "image" }` message parts. Extracted text is editable by the user before saving. |
| **Rate Limit Management** | App tracks usage against free tier limits. User sees clear messages when rate-limited. Caching minimizes unnecessary API calls. |
| **UI/UX** | Loading states shown during async operations. Empty states handled (no blank screens). Forms validate before submission. Responsive on mobile. |
| **Git Practices** | Meaningful commit messages. Feature branches. A clear README with setup instructions. `.env.example` included. `.env` is gitignored. |
| **README Quality** | Explains what the app does, how to set it up locally, what environment variables are needed, and includes a screenshot or demo GIF. |

---

## Suggested Folder Structure

```
ai-study-buddy/
├── client/                    # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── common/        # Button, Modal, Spinner, Card, etc.
│   │   │   ├── flashcards/    # FlashcardViewer, FlashcardCard
│   │   │   ├── quiz/          # QuizQuestion, QuizResults
│   │   │   ├── dashboard/     # StatCard, Heatmap, ScoreChart
│   │   │   ├── upload/        # ImageUpload, PDFUpload, DragDropZone
│   │   │   └── layout/        # Navbar, Sidebar, Footer
│   │   ├── pages/             # Page-level components (one per route)
│   │   ├── hooks/             # Custom hooks (useAuth, useSubjects, etc.)
│   │   ├── context/           # React Context providers (AuthContext)
│   │   ├── services/          # API client and request functions
│   │   ├── utils/             # Helper functions, constants
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/                    # Express backend
│   ├── config/                # Database connection, environment config
│   ├── controllers/           # Route handler logic
│   ├── middleware/             # auth, errorHandler, aiRateLimiter, upload
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Route definitions
│   ├── services/              # Business logic (ai.service.js, cloudinary.service.js)
│   ├── schemas/               # Zod schemas for AI structured output
│   ├── utils/                 # Helpers
│   ├── server.js              # Entry point
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

> **Note on folder changes from a typical MERN setup:** The `prompts/` folder from a raw-API approach is gone. With `generateObject` + Zod, your prompt is just a string in the service function, and the *schema* (in `schemas/`) defines the output structure. The prompts folder only made sense when you needed elaborate "respond ONLY in JSON" instructions to control AI output format. The SDK handles that now.

---

## Getting Started: First Steps

1. Initialize the repo and set up the folder structure above.
2. Set up Express with MongoDB connection and verify it works.
3. Build the User model and auth routes (register, login, me) first. Test with Postman or Thunder Client.
4. Build the Subject and Topic CRUD routes. Test them.
5. Set up Cloudinary and add file upload for PDF/text extraction. Test it.
6. Install `@openrouter/ai-sdk-provider`, `ai`, and `zod`. Run the test script above to verify your API key works.
7. Build `ai.service.js` with `generateText` for summaries and `generateObject` for flashcards/quizzes. Test with hardcoded notes.
8. Add image upload and test vision-based text extraction using `{ type: "image" }` message parts.
9. Test `generateObject` with image input to generate flashcards directly from a photo.
10. Start the React app. Build the auth flow (register, login, protected routes) first.
11. Build pages one at a time: Subjects list -> Topic detail with image upload -> Flashcard session -> Quiz session -> Dashboard.
12. Add polish: loading states, error handling, empty states, rate limit indicators, responsive design.
13. Write the README, record a demo, deploy.

**Do not skip steps.** Each one builds on the previous. Resist the urge to jump to the "fun" parts before the foundation is solid.

---

## Free Services Cheat Sheet

Everything in this project can be built and deployed at **zero cost**:

| Service | Free Tier | What You Use It For |
|---|---|---|
| **OpenRouter** | 200 requests/day, no credit card | AI text + vision generation |
| **MongoDB Atlas** | 512MB storage | Database |
| **Cloudinary** | 25GB storage, 25GB bandwidth/mo | Image storage for uploaded notes |
| **Render or Railway** | Free tier available | Backend hosting |
| **Vercel or Netlify** | Generous free tier | Frontend hosting |
| **GitHub** | Unlimited public repos | Version control |

---

## Key Packages Reference

| Package | Version | Purpose |
|---|---|---|
| `@openrouter/ai-sdk-provider` | latest | Official OpenRouter provider for Vercel AI SDK |
| `ai` | latest | Vercel AI SDK core (`generateText`, `generateObject`) |
| `zod` | latest | Schema validation for structured AI output |
| `express` | 4.x | Web framework |
| `mongoose` | 8.x | MongoDB ODM |
| `bcrypt` | 5.x | Password hashing |
| `jsonwebtoken` | 9.x | JWT auth |
| `multer` | 1.x | File upload middleware |
| `pdf-parse` | 1.x | PDF text extraction |
| `cloudinary` | 2.x | Image storage |
| `express-rate-limit` | 7.x | General API rate limiting |

---

> **A Note on Free Tier Limitations:**
> Working within free tier limits is not a compromise, it is a feature of this project. Real-world engineers constantly work within API rate limits, storage quotas, and budget constraints. Learning to cache aggressively, batch requests wisely, and degrade gracefully when limits are hit is more valuable than learning to throw money at unlimited API calls. The constraints will make you a better engineer.
