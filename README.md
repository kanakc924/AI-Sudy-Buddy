# AI Study Buddy 🎓

AI Study Buddy is a premium, AI-powered educational platform designed to help students organize their study material, generate interactive learning content, and track their academic progress. Built with a sophisticated **Dark Academia** aesthetic, it combines modern AI capabilities with a timeless design.

![AI Study Buddy Dashboard](https://raw.githubusercontent.com/kanakc924/AI-Sudy-Buddy/main/public/preview.png) *(Note: Placeholder for actual preview if available)*

## ✨ Key Features

- **🧠 AI Content Generation**: Instantly generate high-quality Flashcards, Quizzes, and Topic Summaries using advanced AI models via OpenRouter.
- **📄 Smart Document Processing**: Upload PDF and TXT files (up to 5MB) to extract key information and generate study aids automatically.
- **📊 Progress Dashboard**: Track your learning journey with a contribution heatmap, study streaks, and performance trends over time.
- **🎨 Premium Dark Academia UI**: A meticulously designed interface featuring glassmorphism, elegant serif typography, and smooth Framer Motion animations.
- **📱 Fully Responsive**: Seamless experience across mobile, tablet, and desktop devices.
- **🔐 Secure Authentication**: Robust JWT-based authentication system with a seamless login/register flow.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: [OpenRouter API](https://openrouter.ai/)
- **Charts**: [Recharts](https://recharts.org/)
- **Components**: Radix UI / shadcn/ui

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.x or later
- MongoDB instance (local or Atlas)
- OpenRouter API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kanakc924/AI-Sudy-Buddy.git
   cd AI-Sudy-Buddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📸 Screenshots

*(Add screenshots of your beautiful UI here!)*

## 📄 License

This project is licensed under the MIT License.
