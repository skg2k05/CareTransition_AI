import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { report, language } = await req.json();

    if (!report) {
      return NextResponse.json({ error: "No report provided" }, { status: 400 });
    }

    const selectedLanguage = language || "English";

    const systemInstruction = `You are a warm, compassionate patient advocate and clinical care coordinator. 
Your task is to take a highly complex medical discharge report (including medications, follow-up scheduling, readmission risks, social determinants of health, and clinical synthesis) and simplify it completely.

Rules:
1. Translate and write EVERYTHING in the selected language: "${selectedLanguage}".
2. Target a 5th-grade reading level. Use extremely simple, clear words. Avoid medical jargon. If you must use a medical term, define it simply in parentheses.
3. Make the tone warm, comforting, encouraging, and clear.
4. Fill in the requested JSON structure. Keep instructions highly actionable and clear.
5. Create a seamless spoken narration script (narrationScript) in "${selectedLanguage}" that will be read aloud to the patient using text-to-speech. Make it sound extremely natural, friendly, slow, and easy to follow.`;

    const prompt = `Here is the complex medical transition report:
${JSON.stringify(report, null, 2)}

Please simplify and translate this report to "${selectedLanguage}" at a 5th-grade reading level. Follow the schema strictly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            welcomeMessage: {
              type: Type.STRING,
              description: "A warm, welcoming, friendly opening message to the patient (e.g., 'Hello! We want to help you feel your best as you go home...')."
            },
            patientSummary5thGrade: {
              type: Type.STRING,
              description: "A very clear, simple explanation of the patient's condition, why they were in the hospital, and what the main goals are now. Written at a 5th-grade level."
            },
            checklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A checklist of 3-5 critical, simple daily tasks for the patient (e.g., 'Check your weight first thing in the morning', 'Avoid eating salty foods')."
            },
            medications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Simple/brand name of the medicine." },
                  purpose: { type: Type.STRING, description: "What this medicine does in simple terms (e.g., 'Helps lower your blood pressure')." },
                  instructions: { type: Type.STRING, description: "When and how to take it (e.g., 'Take one tablet by mouth every morning with a full glass of water')." }
                },
                required: ["name", "purpose", "instructions"]
              },
              description: "The list of medications simplified for a patient."
            },
            appointments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  who: { type: Type.STRING, description: "The doctor or clinic name (e.g., 'Dr. Green (Heart Doctor)')." },
                  when: { type: Type.STRING, description: "The time or timeframe of the visit (e.g., 'Within 5 days')." },
                  why: { type: Type.STRING, description: "The simple reason for the visit (e.g., 'To check how your heart is pumping')." }
                },
                required: ["who", "when", "why"]
              },
              description: "Simplified upcoming clinic follow-ups."
            },
            support: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Simple support resources and tips, including SDoH-related help (e.g., 'If you need a free ride, call Social Work at 555-0199', 'Ask your daughter to help fill your pill box')."
            },
            narrationScript: {
              type: Type.STRING,
              description: "A fully continuous, cohesive, spoken-script version of this entire guide. It will be read aloud to the patient, so make it sound very natural, slow-paced, clear, comforting, and direct."
            }
          },
          required: ["welcomeMessage", "patientSummary5thGrade", "checklist", "medications", "appointments", "support", "narrationScript"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in patient-mode API:", error);
    return NextResponse.json({ error: error.message || "Failed to process patient-friendly summary" }, { status: 500 });
  }
}
