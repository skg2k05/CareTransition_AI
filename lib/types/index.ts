export interface MedicationResult {
  interactionsFound: boolean;
  allergiesFlagged: boolean;
  recommendations: string[];
}

export interface SchedulingResult {
  timeframe: string;
  appointmentsNeeded: string[];
}

export interface RiskResult {
  readmissionRisk: "LOW" | "MEDIUM" | "HIGH";
  analysis: string;
}

export interface SdohResult {
  socialRiskFactors: string[];
  barriersToCare: string[];
  recommendations: string[];
}

export interface SynthesisResult {
  overallStatus: string;
  patientSummary: string;
  criticalAlerts: string[];
  actionPlan: string[];
}

export interface AgentResult {
  medication: MedicationResult;
  scheduling: SchedulingResult;
  risk: RiskResult;
  sdoh: SdohResult;
  synthesis: SynthesisResult;
}

export interface FinalReport {
  medication: MedicationResult;
  scheduling: SchedulingResult;
  risk: RiskResult;
  sdoh: SdohResult;
  synthesis: SynthesisResult;
  trajectory: {
    medication: { durationMs: number };
    scheduling: { durationMs: number };
    risk: { durationMs: number };
    sdoh: { durationMs: number };
    synthesis: { durationMs: number };
    totalMs: number;
  };
}

export interface PatientState {
  patientSummary: string;
  isLoading: boolean;
  report: FinalReport | null;
  errorMessage: string | null;
}

export interface EvaluationCase {
  id: string;
  description: string;
  summary: string;
  expectedRisk: "LOW" | "MEDIUM" | "HIGH";
  expectedAllergiesFlagged: boolean;
}

// lib/types/index.ts
// Add this line at the top
export type AgentStatus = 'idle' | 'running' | 'complete' | 'error';

