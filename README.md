# CareTransition AI 🏥🤖

CareTransition AI is a multi-agent clinical discharge coordinator built with Next.js and the Gemini API. It leverages advanced Large Language Models to read complex clinical discharge summaries and automatically perform multi-dimensional cross-referencing—assessing readmission risk, catching medication conflicts, structuring follow-up schedules, and identifying social determinants of health (SDoH).

## ✨ Features

- **Multi-Agent Architecture**: Uses discrete AI "agents" (Med Rx, Schedule, Risk, SDoH) running in parallel to analyze clinical data comprehensively.
- **Synthesis Coordinator**: A final synthesis step compiles the consensus of all agents into a unified, actionable handoff report.
- **Patient Mode (My Recovery Guide)**: Translates complex medical jargon into a simple, 5th-grade reading level guide for patients.
- **Multilingual TTS**: Features text-to-speech audio narration in multiple languages (English, Hindi, Kannada, etc.) to ensure accessibility for all patients.
- **Premium UI/UX**: Built with Tailwind CSS, utilizing glassmorphism, responsive grids, and real-time execution trajectory visualization.

## 📂 Project Structure

```text
caretransition-ai/
├── app/                       # Next.js App Router 
│   ├── api/                   # Backend API Routes
│   │   ├── agent/             # Multi-agent specialized endpoints
│   │   ├── analyze/           # Full pipeline entry point
│   │   ├── evaluate/          # Trajectory evaluation
│   │   ├── handoff/           # Final handoff compiler
│   │   ├── health/            # System health checks
│   │   └── patient-mode/      # Patient simplification & translation API
│   ├── dashboard/             # Main Application Dashboard
│   ├── globals.css            # Tailwind & Global Styles
│   ├── layout.tsx             # Root Layout
│   └── page.tsx               # Landing Page
├── components/                # Reusable React Components
│   ├── ExecutionTrajectory.tsx# Real-time agent status visualization
│   ├── ReportView.tsx         # Clinical vs Patient view toggle and TTS
│   ├── ui/                    # Base UI components (shadcn-like)
│   └── ...                    
├── lib/                       # Utility Functions & Configuration
├── hooks/                     # Custom React Hooks
├── assets/                    # Static Assets (Images, Icons)
├── middleware.ts              # Next.js Edge Middleware for routing/auth
├── next.config.ts             # Next.js Configuration
├── tailwind.config.ts         # Tailwind CSS Configuration
└── package.json               # Dependencies and Scripts
```

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Set up Environment Variables:**
   Create a `.env.local` file and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
4. **Open in Browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Built With

- **[Next.js 15](https://nextjs.org/)** - React Framework
- **[React 19](https://react.dev/)** - UI Library
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Google Gemini API](https://ai.google.dev/)** - LLM Engine (gemini-2.5-flash)
- **[Lucide React](https://lucide.dev/)** - Iconography

## 📝 License

This project is licensed under the MIT License.
