import { z } from "zod";
import { runGroqAgent } from "./client";

export const SchedulingResponseSchema = z.object({
  timeframe: z.string().describe("The general timeframe for these appointments (e.g., 'Within 7 days')."),
  appointmentsNeeded: z.array(z.string()).describe("List of departments, specialists, or clinical clinics needed for follow-up.")
});

export type SchedulingResponse = z.infer<typeof SchedulingResponseSchema>;

export async function runSchedulingAgent(patientSummary: string): Promise<SchedulingResponse> {
  const systemInstruction = "You are a care navigator. Your job is to extract all follow-up care, clinics, and appointment requirements from the discharge summary and structure the appointment requests.";
  
  const schemaDescription = `{
    timeframe: string,
    appointmentsNeeded: string[]
  }`;

  const rawResult = await runGroqAgent(systemInstruction, patientSummary, schemaDescription);
  return SchedulingResponseSchema.parse(rawResult);
}
