import { z } from "zod";
import { runGroqAgent } from "./client";

export const MedicationResponseSchema = z.object({
  interactionsFound: z.boolean().describe("True if any drug-drug interactions or conflicts are found."),
  allergiesFlagged: z.boolean().describe("True if prescribed medications conflict with patient allergies."),
  recommendations: z.array(z.string()).describe("Specific recommendations, warnings, or adjustments for the prescriber.")
});

export type MedicationResponse = z.infer<typeof MedicationResponseSchema>;

export async function runMedicationAgent(patientSummary: string): Promise<MedicationResponse> {
  const systemInstruction = "You are a clinical pharmacist AI. Your job is to strictly cross-check the provided discharge summary for medication allergies and drug-drug interactions. Be thorough and highly precise.";
  
  const schemaDescription = `{
    interactionsFound: boolean,
    allergiesFlagged: boolean,
    recommendations: string[]
  }`;

  const rawResult = await runGroqAgent(systemInstruction, patientSummary, schemaDescription);
  return MedicationResponseSchema.parse(rawResult);
}
