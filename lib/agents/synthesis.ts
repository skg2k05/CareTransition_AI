import { z } from "zod";
import { runGroqAgent } from "./client";

export const SynthesisResponseSchema = z.object({
  overallStatus: z.string().describe("Overall status or recommendation for discharge eligibility (e.g. READY FOR DISCHARGE, HOLD - REQUIRES REVIEW)."),
  patientSummary: z.string().describe("A concise summary (1-2 sentences) of the patient and discharge state."),
  criticalAlerts: z.array(z.string()).describe("High-priority alerts or warnings gathered or inferred from clinical risk and medication findings."),
  actionPlan: z.array(z.string()).describe("Step-by-step handoff/discharge checklist action plan.")
});

export type SynthesisResponse = z.infer<typeof SynthesisResponseSchema>;

export async function runSynthesisAgent(
  originalSummary: string,
  medicationOutput: any,
  schedulingOutput: any,
  riskOutput: any,
  sdohOutput: any
): Promise<SynthesisResponse> {
  const systemInstruction = "You are the lead care transition coordinator. You will be given the original patient summary and the diagnostic outputs from the Medication, Scheduling, Risk, and SDoH (Social Determinants of Health) agents. Synthesize this into a final, highly structured Handoff Report.";
  
  const promptContent = `Original Summary:\n${originalSummary}\n\nMedication Reconciliation Output:\n${JSON.stringify(medicationOutput)}\n\nFollow-up Scheduling Output:\n${JSON.stringify(schedulingOutput)}\n\nReadmission Risk Output:\n${JSON.stringify(riskOutput)}\n\nSocial Determinants of Health (SDoH) Output:\n${JSON.stringify(sdohOutput)}`;

  const schemaDescription = `{
    overallStatus: string,
    patientSummary: string,
    criticalAlerts: string[],
    actionPlan: string[]
  }`;

  const rawResult = await runGroqAgent(systemInstruction, promptContent, schemaDescription);
  return SynthesisResponseSchema.parse(rawResult);
}
