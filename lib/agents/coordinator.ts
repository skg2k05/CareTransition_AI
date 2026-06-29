import { runMedicationAgent, MedicationResponse } from "./medication";
import { runSchedulingAgent, SchedulingResponse } from "./scheduling";
import { runRiskAgent, RiskResponse } from "./risk";
import { runSdohAgent, SdohResponse } from "./sdoh";
import { runSynthesisAgent, SynthesisResponse } from "./synthesis";

export interface CoordinatorTrajectory {
  medication: { durationMs: number };
  scheduling: { durationMs: number };
  risk: { durationMs: number };
  sdoh: { durationMs: number };
  synthesis: { durationMs: number };
  totalMs: number;
}

export interface CoordinatorReport {
  medication: MedicationResponse;
  scheduling: SchedulingResponse;
  risk: RiskResponse;
  sdoh: SdohResponse;
  synthesis: SynthesisResponse;
  trajectory: CoordinatorTrajectory;
}

export async function runCoordinator(patientSummary: string): Promise<CoordinatorReport> {
  const overallStartTime = Date.now();

  // Run the diagnostic agents in parallel
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

  // Feed inputs to Synthesis Agent
  const synthStart = Date.now();
  const synthRes = await runSynthesisAgent(
    patientSummary,
    medRes.data,
    schedRes.data,
    riskRes.data,
    sdohRes.data
  );
  const synthDurationMs = Date.now() - synthStart;

  const overallEndTime = Date.now();

  return {
    medication: medRes.data,
    scheduling: schedRes.data,
    risk: riskRes.data,
    sdoh: sdohRes.data,
    synthesis: synthRes,
    trajectory: {
      medication: { durationMs: medRes.durationMs },
      scheduling: { durationMs: schedRes.durationMs },
      risk: { durationMs: riskRes.durationMs },
      sdoh: { durationMs: sdohRes.durationMs },
      synthesis: { durationMs: synthDurationMs },
      totalMs: overallEndTime - overallStartTime
    }
  };
}
