import { z } from "zod";
import { runGroqAgent } from "./client";

export const RiskResponseSchema = z.object({
  readmissionRisk: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Readmission risk assessment level."),
  analysis: z.string().describe("Detailed clinical reasoning for the assigned risk level.")
});

export type RiskResponse = z.infer<typeof RiskResponseSchema>;

export async function runRiskAgent(patientSummary: string): Promise<RiskResponse> {
  const systemInstruction = "You are a clinical risk assessor. Evaluate the discharge summary for readmission probability using clinical and social criteria (e.g., living alone, history of non-compliance, severe conditions). Assign a risk level and justify it.";
  
  const schemaDescription = `{
    readmissionRisk: "LOW" | "MEDIUM" | "HIGH",
    analysis: string
  }`;

  const rawResult = await runGroqAgent(systemInstruction, patientSummary, schemaDescription);
  return RiskResponseSchema.parse(rawResult);
}
