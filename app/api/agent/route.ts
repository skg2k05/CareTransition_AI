import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { agentType, summary, context } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let schema;
    let systemInstruction;
    let prompt = summary;

    switch (agentType) {
      case 'medication':
        schema = {
          type: Type.OBJECT,
          properties: {
            interactionsFound: { type: Type.BOOLEAN, description: "True if any drug-drug interactions or allergies are found." },
            allergiesFlagged: { type: Type.BOOLEAN, description: "True if prescribed meds conflict with patient allergies." },
            analysis: { type: Type.STRING, description: "Detailed explanation of the medication review." },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific changes or warnings for the prescriber." }
          },
          required: ["interactionsFound", "allergiesFlagged", "analysis", "recommendations"]
        };
        systemInstruction = "You are the Medication Reconciliation Agent. Your job is to strictly cross-check the provided discharge summary for medication allergies and drug-drug interactions. Return your findings in a structured format.";
        break;

      case 'scheduling':
        schema = {
          type: Type.OBJECT,
          properties: {
            appointmentsNeeded: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of departments or specialists needed for follow-up." },
            timeframe: { type: Type.STRING, description: "The general timeframe for these appointments (e.g., 'Within 7 days')." },
            analysis: { type: Type.STRING, description: "Explanation of why these appointments are needed based on the summary." }
          },
          required: ["appointmentsNeeded", "timeframe", "analysis"]
        };
        systemInstruction = "You are the Follow-up Scheduling Agent. Your job is to extract all follow-up care requirements from the discharge summary and structure the appointment requests.";
        break;

      case 'risk':
        schema = {
          type: Type.OBJECT,
          properties: {
            readmissionRisk: { type: Type.STRING, description: "Must be 'LOW', 'MEDIUM', or 'HIGH'." },
            riskFactors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific factors contributing to the risk level." },
            analysis: { type: Type.STRING, description: "Detailed rationale for the assigned risk level." }
          },
          required: ["readmissionRisk", "riskFactors", "analysis"]
        };
        systemInstruction = "You are the Risk Flag Agent. Evaluate the discharge summary for readmission probability using clinical and social criteria (e.g., living alone, history of non-compliance, severe conditions). Assign a risk level and justify it.";
        break;

      case 'synthesis':
        schema = {
          type: Type.OBJECT,
          properties: {
            patientSummary: { type: Type.STRING, description: "A brief, 1-2 sentence overview of the patient and admission reason." },
            criticalAlerts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "High-priority alerts combined from medication and risk agents." },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step handoff action plan." },
            overallStatus: { type: Type.STRING, description: "Overall system status: 'READY FOR DISCHARGE' or 'HOLD - REQUIRES REVIEW'." }
          },
          required: ["patientSummary", "criticalAlerts", "actionPlan", "overallStatus"]
        };
        systemInstruction = "You are the Coordinator Synthesis Agent. You will be given the original summary AND the outputs from the Medication, Scheduling, and Risk agents. Synthesize this into a final, highly structured Handoff Report.";
        prompt = `Original Summary:\n${summary}\n\nAgent Context:\n${JSON.stringify(context)}`;
        break;

      default:
        return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
    }

    const generateWithRetry = async (promptText: string, config: any, retries = 5): Promise<any> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          return await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText,
            config,
          });
        } catch (error: any) {
          if (attempt === retries) throw error;
          
          const status = error.status || error?.error?.status;
          // Retry on 503 Service Unavailable or 429 Too Many Requests
          if (status === 'UNAVAILABLE' || status === 503 || status === 'RESOURCE_EXHAUSTED' || status === 429 || error.message?.includes('503') || error.message?.includes('unavailable') || error.message?.includes('high demand')) {
            console.warn(`Retry attempt ${attempt} due to ${status || 'unavailable'}...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 3000));
          } else {
            throw error;
          }
        }
      }
    };

    const response = await generateWithRetry(prompt, {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: schema,
    });

    return NextResponse.json(JSON.parse(response.text || "{}"));

  } catch (error: any) {
    console.error(`Error in agent route:`, error);
    return NextResponse.json({ error: error.message || "Failed to process agent request" }, { status: 500 });
  }
}
