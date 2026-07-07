# Care Transition AI

Care Transition AI is an advanced, multi-agent AI system designed to streamline the hospital discharge and patient transition process. It eliminates dangerous communication gaps between clinical teams and patients by providing real-time, comprehensive clinical handoff reports for doctors and personalized, plain-language recovery guides for patients.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-AI-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)

Beta Version will be live soon!

---

## Key Features

- **Multi-Agent Architecture**: Powered by specialized AI agents (Medication, Scheduling, Risk, Social Determinants of Health) orchestrated by a core coordinator to analyze raw EMR data in parallel.
- **Patient Mode (Health Literacy)**: Automatically translates complex medical jargon into a 5th-grade reading level care plan, available in 10+ languages with text-to-speech audio support.
- **Clinical Handoff Dashboard**: A detailed, structured transition handoff report highlighting medical overrides, social risk factors, scheduling needs, and pharmacological interactions for the receiving care team.
- **Interactive UI**: A beautiful, real-time interface built with Glassmorphism aesthetics and smooth Framer Motion animations that visualizes the execution trajectory of the AI agents processing the patient data.
- **Secure Passwordless Auth**: State-of-the-art OTP (One-Time Password) email authentication system using **Resend**, ensuring data privacy and strict role-based access control (Doctor vs. Patient).

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4, Framer Motion, Lucide React
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Authentication Services**: Resend API (Email OTP)
- **Language**: TypeScript

## Getting Started

Follow these instructions to set up the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/skg2k05/CareTransition_AI.git
cd caretransition-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory and add your API keys:
```bash
# Google Gemini for AI Agents
GEMINI_API_KEY="your_google_gemini_api_key_here"

# Resend for Email OTP Authentication
RESEND_API_KEY="re_your_resend_api_key_here"
```
*(You can get a Gemini API key from [Google AI Studio](https://aistudio.google.com/)*

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Project Structure

```text
├── .env.example
├── .env.local
├── .eslintrc.json
├── .gitignore
├── app
│   ├── api
│   │   ├── agent
│   │   │   └── route.ts
│   │   ├── auth
│   │   │   ├── logout
│   │   │   │   └── route.ts
│   │   │   ├── send-otp
│   │   │   │   ├── route.ts
│   │   │   │   └── verify-otp
│   │   │   │       └── route.ts
│   │   │   ├── verify-otp
│   │   │   │   └── route.ts
│   │   │   └── _otp.ts
│   │   ├── evaluate
│   │   │   └── route.ts
│   │   ├── handoff
│   │   │   └── route.ts
│   │   ├── health
│   │   │   └── route.ts
│   │   └── patient-mode
│   │       └── route.ts
│   ├── auth
│   │   ├── login
│   │   │   └── page.tsx
│   │   └── verify
│   │       └── page.tsx
│   ├── dashboard
│   │   └── page.tsx
│   ├── error.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── assets
│   └── .aistudio
│       └── .gitignore
├── components
│   ├── AuditTrail.tsx
│   ├── auth
│   │   ├── AuthProvider.tsx
│   │   └── ProtectedRoute.tsx
│   ├── ClinicianReview.tsx
│   ├── ExecutionTrajectory.tsx
│   ├── PatientInputForm.tsx
│   └── ReportView.tsx
├── eslint.config.mjs
├── hooks
│   └── use-mobile.ts
├── lib
│   ├── agents
│   │   ├── client.ts
│   │   ├── coordinator.ts
│   │   ├── medication.ts
│   │   ├── risk.ts
│   │   ├── scheduling.ts
│   │   ├── sdoh.ts
│   │   └── synthesis.ts
│   ├── types
│   │   └── index.ts
│   └── utils.ts
├── metadata.json
├── middleware.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   └── icon.svg
├── README.md
├── tsconfig.json
└── tsconfig.tsbuildinfo
```

## Architecture Overview

The system runs on a **Coordinator-Worker Agent Pattern**. When clinical notes are submitted, the `CoordinatorAgent` splits the context and tasks to 4 worker agents operating in parallel:
1. `MedicationAgent`: Analyzes polypharmacy risks and generates the medication regimen.
2. `RiskAgent`: Evaluates readmission and clinical deterioration risks.
3. `SDOHAgent`: Identifies Social Determinants of Health (e.g., transportation, housing).
4. `SchedulingAgent`: Maps out follow-up appointments and lab timelines.

Once the parallel processing finishes, the `SynthesisAgent` aggregates their findings into a cohesive JSON schema, which powers the beautiful Dual-View Dashboard.

## Contributing
Contributions, issues, and feature requests are welcome! 
- Always ensure responsive design (Mobile-first approach).
- Maintain the premium, glassmorphic UI aesthetics.
- Adhere to the established multi-agent pattern inside `lib/agents/` when extending AI capabilities.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
