import { z } from "zod";
import { runGroqAgent } from "./client";

export const SdohResponseSchema = z.object({
  socialRiskFactors: z.array(z.string()).describe("Identified social risk factors, such as living alone, lack of support, or housing security."),
  barriersToCare: z.array(z.string()).describe("Identified barriers to accessing care, such as transportation, financial, language, or geographical obstacles."),
  recommendations: z.array(z.string()).describe("SDoH recommendations, interventions, or social work/case management referrals.")
});

export type SdohResponse = z.infer<typeof SdohResponseSchema>;

export async function runSdohAgent(patientSummary: string): Promise<SdohResponse> {
  const systemInstruction = "You are an SDoH (Social Determinants of Health) clinical specialist and social worker. Evaluate the patient summary for living situation (alone, family, nursing home), transportation access, insurance/financial barriers, language/communication needs, and accessibility issues (e.g., distance to specialists). Generate social risk factors, care barriers, and actionable social work/support recommendations.";
  
  const schemaDescription = `{
    socialRiskFactors: string[],
    barriersToCare: string[],
    recommendations: string[]
  }`;

  const rawResult = await runGroqAgent(systemInstruction, patientSummary, schemaDescription);
  return SdohResponseSchema.parse(rawResult);
}
