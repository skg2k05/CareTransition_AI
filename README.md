# Care Transition AI

Care Transition AI is an advanced, multi-agent AI system designed to streamline the hospital discharge and patient transition process. It provides personalized, plain-language patient recovery guides (translated into multiple languages with voice support) and detailed clinical handoff reports for healthcare providers.

## Key Features
- **Multi-Agent Architecture**: Uses specialized AI agents (Medication, Scheduling, Risk, Social Determinants of Health) orchestrated by a core coordinator to generate comprehensive reports.
- **Patient Mode**: A 5th-grade reading level translation of the patient's care plan, available in 10+ languages with text-to-speech audio narration.
- **Clinical Overview**: A detailed transition handoff report highlighting medical overrides, social risk factors, scheduling needs, and pharmacological recommendations for the care team.
- **Interactive Dashboard**: A beautiful, real-time UI showing the execution trajectory of the AI agents processing the patient data.
- **Secure Authentication**: OTP-based authentication system ensuring data privacy and role-based access for both Doctors and Patients.

## Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Framer Motion, Lucide React
- **Backend**: Next.js App Router (API Routes)
- **AI Integration**: Google Gemini API via `@google/genai`
- **Language & Styling**: TypeScript, Tailwind classes for complex UI/UX (Glassmorphism, animations)

## Project Structure

```text
caretransition-ai/
├── app/                        # Next.js App Router (Pages & API)
│   ├── api/                    # Backend API Routes
│   │   ├── agent/              # Central agent coordinator API
│   │   ├── auth/               # OTP generation and verification
│   │   ├── evaluate/           # Evaluation logic for transitions
│   │   ├── handoff/            # Handoff report generation
│   │   ├── health/             # Health check endpoints
│   │   └── patient-mode/       # Translation and summarization for patients
│   ├── auth/                   # Authentication UI (Login & Verify)
│   ├── dashboard/              # Main dashboard application UI
│   ├── globals.css             # Global Tailwind and base styles
│   ├── layout.tsx              # Root application layout
│   └── page.tsx                # Landing page
├── components/                 # React UI Components
│   ├── auth/                   # Protected route and Auth providers
│   ├── AuditTrail.tsx          # Diagnostic metadata display
│   ├── ClinicianReview.tsx     # Review interface for doctors
│   ├── ExecutionTrajectory.tsx # Multi-agent processing visualizer
│   ├── PatientInputForm.tsx    # Form for entering raw patient data
│   └── ReportView.tsx          # Dual-view component (Clinical/Patient)
├── hooks/                      # Custom React Hooks
│   └── use-mobile.ts           # Responsive layout hook
├── lib/                        # Core Application Logic
│   ├── agents/                 # Individual AI Agents
│   │   ├── client.ts           # Gemini API client configuration
│   │   ├── coordinator.ts      # Core orchestrator logic
│   │   ├── medication.ts       # Pharmacological analysis agent
│   │   ├── risk.ts             # Clinical risk assessment agent
│   │   ├── scheduling.ts       # Appointments and follow-ups agent
│   │   ├── sdoh.ts             # Social Determinants of Health agent
│   │   └── synthesis.ts        # Final report synthesis agent
│   ├── types/                  # TypeScript interface definitions
│   │   └── index.ts            
│   └── utils.ts                # General utility functions
├── middleware.ts               # Next.js edge middleware for routing/auth
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind styling system config
└── package.json                # Project dependencies and scripts
```

## Getting Started

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env.local` file in the root directory based on `.env.example` and add your API keys (e.g., Google Gemini API key).
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Development Guidelines
- Always ensure responsive design (Mobile-first approach).
- Maintain the premium, glassmorphic UI aesthetics across new components.
- Adhere to the established multi-agent patterns inside `lib/agents/` when extending AI capabilities.
