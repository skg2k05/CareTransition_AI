import { NextResponse } from "next/server";
import { runMedicationAgent } from "@/lib/agents/medication";
import { runRiskAgent } from "@/lib/agents/risk";

interface TestCase {
  id: string;
  description: string;
  summary: string;
  expectedRisk: "LOW" | "MEDIUM" | "HIGH";
  expectedAllergiesFlagged: boolean;
}

const TEST_CASES: TestCase[] = [
  {
    id: "TC-001",
    description: "Standard low-risk appendectomy, no allergy flags",
    summary: "Patient: 28yo female. Post-op day 1 following uncomplicated laparoscopic appendectomy. Discharging home. Meds: Ibuprofen 600mg PRN pain. No allergies. Lives with husband. Return to work in 1 week. Follow up with general surgery in 2 weeks.",
    expectedRisk: "LOW",
    expectedAllergiesFlagged: false
  },
  {
    id: "TC-002",
    description: "High-risk COPD with Penicillin/Macrolide allergy conflict",
    summary: "Patient: John Doe, 65yo male. Admitted for: Exacerbation of COPD and mild pneumonia. Discharge meds: Prednisone 40mg daily, Albuterol inhaler q4h PRN, Azithromycin 250mg daily. Allergies: Penicillin, Macrolides (causes severe anaphylactic rash). Notes: Patient lives alone. Has a history of missing appointments. Follow up requested with Pulmonology in 1 week.",
    expectedRisk: "HIGH",
    expectedAllergiesFlagged: true
  },
  {
    id: "TC-003",
    description: "Healthy newborn discharge, routine care",
    summary: "Infant: 3-day-old male born at 39 weeks via uncomplicated vaginal delivery. Breastfeeding well, gaining weight. Discharging home with mother. No known allergies. Meds: None (routine Vitamin K and Hep B administered at birth). Follow-up with pediatrician in 48 hours.",
    expectedRisk: "LOW",
    expectedAllergiesFlagged: false
  },
  {
    id: "TC-004",
    description: "Severe Heart Failure with Sulfa allergy interaction",
    summary: "Patient: 74yo female with NYHA Class III Congestive Heart Failure. Admitted for acute decompensated heart failure. Discharge meds: Lisinopril 10mg daily, Carvedilol 12.5mg BID, Sulfamethoxazole-Trimethoprim (Bactrim) DS daily for minor cellulitis. Allergies: Sulfa drugs (causes Stevens-Johnson syndrome). Notes: History of 3 readmissions this year, unstable vitals, severe edema.",
    expectedRisk: "HIGH",
    expectedAllergiesFlagged: true
  },
  {
    id: "TC-005",
    description: "Stabilized Diabetic Ketoacidosis (DKA) with medium risk",
    summary: "Patient: 19yo male with Type 1 Diabetes Mellitus, admitted for DKA due to insulin non-compliance. Stabilized, pH normalized, tolerating diet. Discharge meds: Insulin glargine (Lantus) 22 units daily, Insulin lispro (Humalog) sliding scale with meals. No known drug allergies. Lives with parents who help manage medications.",
    expectedRisk: "MEDIUM",
    expectedAllergiesFlagged: false
  },
  {
    id: "TC-006",
    description: "Asthma exacerbation, prescribed contraindicated Aspirin",
    summary: "Patient: 34yo female with chronic asthma and nasal polyps (Aspirin-exacerbated respiratory disease / Samter's triad). Admitted for acute asthma flare-up. Discharging with Prednisone taper and Aspirin 325mg daily for new mild joint pain. Allergies: Aspirin (triggers severe bronchospasm).",
    expectedRisk: "MEDIUM",
    expectedAllergiesFlagged: true
  },
  {
    id: "TC-007",
    description: "Uncomplicated Total Knee Arthroplasty (TKA)",
    summary: "Patient: 62yo male. Post-op day 3 following elective total knee replacement. Physical therapy targets met, ambulating with walker. Discharge meds: Oxycodone 5mg q6h PRN pain, Celebrex 100mg daily, Lovenox 40mg SQ daily for DVT prophylaxis. No known drug allergies. Good family support.",
    expectedRisk: "LOW",
    expectedAllergiesFlagged: false
  },
  {
    id: "TC-008",
    description: "Elderly UTI with Sulfa allergy prescribed Bactrim",
    summary: "Patient: 88yo female. Admitted for confusion secondary to Urinary Tract Infection. Mentation returned to baseline with IV fluids. Discharge meds: Sulfamethoxazole-Trimethoprim (Bactrim) 800-160mg BID. Allergies: Sulfa drugs (documented severe hives). Notes: Lives in assisted living facility.",
    expectedRisk: "MEDIUM",
    expectedAllergiesFlagged: true
  },
  {
    id: "TC-009",
    description: "Elderly Pneumonia, lives alone with cognitive impairment",
    summary: "Patient: 82yo male. Admitted for community-acquired pneumonia, treated with IV antibiotics. Discharge meds: Amoxicillin-Clavulanate (Augmentin) 875mg BID. No allergies. Notes: Patient lives alone, has mild dementia, has missed multiple clinic appointments in the past, and has no local family support.",
    expectedRisk: "HIGH",
    expectedAllergiesFlagged: false
  },
  {
    id: "TC-010",
    description: "High risk Sepsis with fluoroquinolone tendonitis conflict",
    summary: "Patient: 59yo male, post-ICU discharge following severe sepsis from urinary source. Discharging home on Ciprofloxacin 500mg BID. Allergies: Fluoroquinolones (caused Achilles tendonitis in the past). Notes: Extremely frail, uses a wheelchair, has history of recurrent UTIs and multiple recent hospitalizations.",
    expectedRisk: "HIGH",
    expectedAllergiesFlagged: true
  }
];

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const results = [];
    
    let medPassedCount = 0;
    let riskPassedCount = 0;

    for (const tc of TEST_CASES) {
      try {
        // Run Risk Agent
        const riskData = await runRiskAgent(tc.summary);
        
        // Run Medication Agent
        const medData = await runMedicationAgent(tc.summary);

        const riskPassed = riskData.readmissionRisk === tc.expectedRisk;
        const medPassed = medData.allergiesFlagged === tc.expectedAllergiesFlagged;

        if (riskPassed) riskPassedCount++;
        if (medPassed) medPassedCount++;

        results.push({
          id: tc.id,
          description: tc.description,
          risk: {
            expected: tc.expectedRisk,
            actual: riskData.readmissionRisk,
            passed: riskPassed
          },
          medication: {
            expected: tc.expectedAllergiesFlagged,
            actual: medData.allergiesFlagged,
            passed: medPassed
          },
          overallPassed: riskPassed && medPassed
        });
      } catch (err: any) {
        console.error(`Error processing test case ${tc.id}:`, err);
        results.push({
          id: tc.id,
          description: tc.description,
          error: err.message || "Failed test run",
          overallPassed: false
        });
      }
    }

    const totalCases = TEST_CASES.length;
    const medPassRate = (medPassedCount / totalCases) * 100;
    const riskPassRate = (riskPassedCount / totalCases) * 100;

    return NextResponse.json({
      results,
      metrics: {
        totalCases,
        medPassed: medPassedCount,
        medPassRatePercent: medPassRate,
        riskPassed: riskPassedCount,
        riskPassRatePercent: riskPassRate,
        overallSuccessRatePercent: ((results.filter(r => r.overallPassed).length) / totalCases) * 100
      }
    });

  } catch (error: any) {
    console.error("Evaluation route failed:", error);
    return NextResponse.json(
      { error: error.message || "Evaluation execution failed" },
      { status: 500 }
    );
  }
}
