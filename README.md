<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/aecc07ea-5892-45f2-a20c-dad29f1eb4d3

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Project Structure

```text
.
├── app/
│   ├── api/
│   │   ├── agent/
│   │   ├── evaluate/
│   │   ├── handoff/
│   │   ├── health/
│   │   └── patient-mode/
│   ├── auth/
│   │   ├── login/
│   │   └── verify/
│   ├── dashboard/
│   ├── error.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── assets/
├── components/
│   ├── auth/
│   ├── AuditTrail.tsx
│   ├── ClinicianReview.tsx
│   ├── ExecutionTrajectory.tsx
│   ├── PatientInputForm.tsx
│   └── ReportView.tsx
├── hooks/
│   └── use-mobile.ts
├── lib/
│   ├── agents/
│   ├── types/
│   └── utils.ts
├── .env.example
├── .env.local
├── eslint.config.mjs
├── metadata.json
├── next.config.ts
├── package.json
└── tsconfig.json
```
