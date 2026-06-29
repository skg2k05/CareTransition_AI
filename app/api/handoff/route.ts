import { NextResponse } from "next/server";
import { z } from "zod";
import { runCoordinator } from "@/lib/agents/coordinator";
import { runMedicationAgent } from "@/lib/agents/medication";
import { runSchedulingAgent } from "@/lib/agents/scheduling";
import { runRiskAgent } from "@/lib/agents/risk";
import { runSdohAgent } from "@/lib/agents/sdoh";
import { runSynthesisAgent } from "@/lib/agents/synthesis";

const HandoffRequestSchema = z.object({
  patientSummary: z.string().min(10, "Patient summary must be at least 10 characters long."),
  stage: z.enum(["full", "parallel", "synthesis"]).optional(),
  medication: z.any().optional(),
  scheduling: z.any().optional(),
  risk: z.any().optional(),
  sdoh: z.any().optional(),
  trajectory: z.any().optional()
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request parameters using Zod
    const validationResult = HandoffRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { patientSummary, stage = "full", medication, scheduling, risk, sdoh, trajectory } = validationResult.data;
    
    if (stage === "parallel") {
      const medStart = Date.now();
      const schedStart = Date.now();
      const riskStart = Date.now();
      const sdohStart = Date.now();

      const [medRes, schedRes, riskRes, sdohRes] = await Promise.all([
        runMedicationAgent(patientSummary).then(data => ({ data, durationMs: Date.now() - medStart })),
        runSchedulingAgent(patientSummary).then(data => ({ data, durationMs: Date.now() - schedStart })),
        runRiskAgent(patientSummary).then(data => ({ data, durationMs: Date.now() - riskStart })),
        runSdohAgent(patientSummary).then(data => ({ data, durationMs: Date.now() - sdohStart }))
      ]);

      return NextResponse.json({
        medication: medRes.data,
        scheduling: schedRes.data,
        risk: riskRes.data,
        sdoh: sdohRes.data,
        trajectory: {
          medication: { durationMs: medRes.durationMs },
          scheduling: { durationMs: schedRes.durationMs },
          risk: { durationMs: riskRes.durationMs },
          sdoh: { durationMs: sdohRes.durationMs },
          synthesis: { durationMs: 0 },
          totalMs: Date.now() - medStart
        }
      });
    } else if (stage === "synthesis") {
      if (!medication || !scheduling || !risk || !sdoh) {
        return NextResponse.json(
          { error: "Missing required agent data for synthesis stage." },
          { status: 400 }
        );
      }
      
      const synthStart = Date.now();
      const synthRes = await runSynthesisAgent(
        patientSummary,
        medication,
        scheduling,
        risk,
        sdoh
      );
      const synthDurationMs = Date.now() - synthStart;
      const prevTotalMs = trajectory?.totalMs || 0;

      return NextResponse.json({
        medication,
        scheduling,
        risk,
        sdoh,
        synthesis: synthRes,
        trajectory: {
          medication: trajectory?.medication || { durationMs: 0 },
          scheduling: trajectory?.scheduling || { durationMs: 0 },
          risk: trajectory?.risk || { durationMs: 0 },
          sdoh: trajectory?.sdoh || { durationMs: 0 },
          synthesis: { durationMs: synthDurationMs },
          totalMs: prevTotalMs + synthDurationMs
        }
      });
    } else {
      // Run the multi-agent transition coordinator (original full pipeline)
      const report = await runCoordinator(patientSummary);
      return NextResponse.json(report);
    }
    
  } catch (error: any) {
    console.error("Error in multi-agent handoff pipeline:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process multi-agent care transition handoff report" },
      { status: 500 }
    );
  }
}
