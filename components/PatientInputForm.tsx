'use client';

import React, { useState } from 'react';
import { Play, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface PatientInputFormProps {
  onSubmit: (summary: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

const PRESETS = [
  {
    label: "COPD & Pneumonia",
    summary: `Patient: John Doe, 65yo male.
Admitted for: Exacerbation of COPD and mild pneumonia.
Discharge meds:
- Prednisone 40mg daily
- Albuterol inhaler q4h PRN
- Azithromycin 250mg daily
- Lisinopril 10mg daily
Allergies: Penicillin, Macrolides (severe anaphylactic rash).
Notes: Patient lives alone, history of non-compliance. Follow-up with Pulmonology in 1 week.`
  },
  {
    label: "Congestive Heart Failure",
    summary: `Patient: Sarah Jenkins, 74yo female.
Admitted for: Acute decompensated heart failure (NYHA Class III).
Discharge meds:
- Lisinopril 10mg daily
- Carvedilol 12.5mg BID
- Sulfamethoxazole-Trimethoprim (Bactrim) DS daily
Allergies: Sulfa drugs (SJS).
Notes: Lives alone, history of multiple readmissions, persistent bilateral pedal edema.`
  }
];

export default function PatientInputForm({ onSubmit, isLoading, initialValue = "" }: PatientInputFormProps) {
  const [summary, setSummary] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (summary.trim().length >= 10) {
      onSubmit(summary);
    }
  };

  return (
    <div id="patient-input-form-container" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Clinical Input Summary</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Provide the patient&apos;s discharge summary or choose a preset.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="discharge-summary-textarea" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Discharge Summary Text
          </label>
          <textarea
            id="discharge-summary-textarea"
            className="w-full h-48 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 leading-relaxed transition-colors resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/30 custom-scrollbar"
            placeholder="Type or paste the clinical discharge summary here (at least 10 characters)..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">Load Presets:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSummary(p.summary)}
              disabled={isLoading}
              className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || summary.trim().length < 10}
          className={`w-full py-3.5 px-5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 select-none ${
            isLoading || summary.trim().length < 10
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-lg hover:shadow-emerald-500/15 cursor-pointer font-semibold transform hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Analyzing Clinical Data...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-slate-950 fill-current" />
              <span>Run Multi-Agent Analysis</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
