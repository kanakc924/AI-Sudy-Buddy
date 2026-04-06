# AI Study Buddy
### "The study partner that never sleeps."

**AI Study Buddy** is a sophisticated, high-fidelity MERN application built with Next.js designed to transform passive study material into an active, high-yield learning experience. Whether you are uploading textbooks, snapped photos of handwritten notes, or complex diagrams, our AI-driven engine extracts, summarizes, and generates interactive materials to help you master any subject.

---

## 🚀 Core Feature Showcase

*   **Multimodal Smart Uploads**: Directly upload `.pdf` textbooks, `.txt` files, or images of notes. Our system handles text extraction and complex OCR fallbacks for scanned materials.
*   **Automated AI Insights**:
    *   **Summaries**: Structured, high-level breakdowns of your notes.
    *   **Flashcards**: Spaced-repetition friendly cards generated directly from source material.
    *   **Adaptive Quizzes**: Multiple-choice assessments to test your retention and understanding.
*   **Deep-Dive Diagram Explanation**: Specialized Vision AI logic that breaks down flowcharts, cycles, and anatomical diagrams step-by-step.
*   **Professional Library Dashboard**: Centralized management for all your subjects and topics. Includes clickable file previews, metadata tracking, and easy content management.
*   **Study Analytics**: Track your consistency with GitHub-inspired **Activity Heatmaps** and monitor your quiz performance history.
*   **Enterprise-Grade Security**: Full JWT-based authentication using `httpOnly` secure cookies, paired with a robust password recovery system.

---

## 🛠 Technical Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router) | High-performance React framework with server-side rendering. |
| **Styling** | Tailwind CSS & Framer Motion | "Soft Dark" aesthetic with fluid micro-animations. |
| **Backend** | Node.js & Mongoose | Robust API layer with MongoDB object modeling. |
| **Database** | MongoDB Atlas | Distributed document-based storage for user and study data. |
| **Storage** | Cloudinary | High-performance hosting for images and source documents. |
| **AI Engine** | OpenRouter SDK | Bridging access to state-of-the-art models (Gemini-3, Claude-3). |
| **Parsing** | PDF.js & Napi-RS Canvas | High-fidelity server-side PDF rendering and OCR processing. |

---

## 🏗 Installation & Setup

Get your local development environment up and running in minutes:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/AI-Study-Buddy.git
cd AI-Study-Buddy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and populate it with the following:
```env
# Database & Auth
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret

# AI & Providers
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_FALLBACK_MODEL=google/gemma-3-12b-it:free

# Storage (Cloudinary)
CLOUDINARY_URL=your_cloudinary_url
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Deployment
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Launch the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the application in action.

---

## 🎨 UI/UX Design Principles

**AI Study Buddy** follows a bespoke **"Soft Dark"** design system optimized for long study sessions:

*   **Color Palette**:
    *   Background: `#1C1E26` (Deep Navy/Black)
    *   Surface: `#252833` (Muted Slate)
    *   Accent: `#8F8DF2` (Soft Lavender/Indigo)
*   **Interactions**: Micro-animations powered by Framer Motion provide tactile feedback without distraction.
*   **Focus-First Layout**: A clean, distraction-free interface ensures you spend more time learning and less time navigating.

---

## 🔄 Recent Updates

*   **Streamlined Upload Flow**: Transitioned to a unified 3-column "Topic Overview" layout.
*   **Smart Parsing Engine**: Implemented an automated OCR fallback for scanned PDFs and handwritten notes.
*   **Enhanced Dashboard**: Removed redundant UI controls to maximize screen real estate for your notes and library.

---

## 🛡 Security & Best Practices

*   **Cookie-Based Storage**: JWTs are stored in `httpOnly` and `Secure` cookies to prevent XSS-based token theft.
*   **Input Sanitization**: All AI-extracted text is sanitized via a dedicated service layer before being stored or presented.
*   **Middleware Protection**: Protected routes are gated by a custom `withAuth` middleware that validates sessions server-side.

---

**AI Study Buddy** — Built for students, by students. Master your curriculum with precision.
