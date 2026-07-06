'use client';

import React, { useState, useEffect } from 'react';
import { 
  Network, 
  TestTube2, 
  BrainCircuit, 
  Play, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Moon,
  Sun,
  Activity,
  Settings,
  RefreshCw,
  Clock,
  ArrowRight,
  Sparkles,
  Stethoscope,
  Check,
  X
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

// Import our custom modular components
import PatientInputForm from '@/components/PatientInputForm';
import ExecutionTrajectory from '@/components/ExecutionTrajectory';
import ReportView from '@/components/ReportView';
import AuditTrail, { LogEntry } from '@/components/AuditTrail';
import ClinicianReview from '@/components/ClinicianReview';

// Import types
import { AgentStatus } from '@/lib/types';

const DEFAULT_SUMMARY = `Patient: John Doe, 65yo male.
Admitted for: Exacerbation of COPD and mild pneumonia.
Discharge meds:
- Prednisone 40mg daily
- Albuterol inhaler q4h PRN
- Azithromycin 250mg daily
- Lisinopril 10mg daily
Allergies: Penicillin, Macrolides (causes severe rash).
Notes: Patient lives alone, history of non-compliance. Follow-up with Pulmonology in 1 week.`;

export default function App() {
  const [activeTab, setActiveTab] = useState<'orchestrator' | 'evaluator'>('orchestrator');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Pipeline Orchestrator State
  const [patientSummary, setPatientSummary] = useState(DEFAULT_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Clinician Review Mode Settings and states
  const [reviewModeEnabled, setReviewModeEnabled] = useState(true);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [intermediateData, setIntermediateData] = useState<any | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const [status, setStatus] = useState<{
    medication: AgentStatus;
    scheduling: AgentStatus;
    risk: AgentStatus;
    sdoh: AgentStatus;
    synthesis: AgentStatus;
  }>({
    medication: 'idle',
    scheduling: 'idle',
    risk: 'idle',
    sdoh: 'idle',
    synthesis: 'idle'
  });

  const [durations, setDurations] = useState({
    medication: 0,
    scheduling: 0,
    risk: 0,
    sdoh: 0,
    synthesis: 0
  });

  // Logs / Audit Trail State — FIX: static time to avoid hydration error
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      time: "System Init",
      agent: 'System',
      message: 'CareTransition AI Orchestrator initialized. Ready to process clinical handoffs.',
      type: 'system'
    }
  ]);

  // Automated Regression Evaluator State
  const [evalStatus, setEvalStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [evalResults, setEvalResults] = useState<any[]>([]);
  const [evalMetrics, setEvalMetrics] = useState<any | null>(null);

  const addLog = (agent: string, message: string, type: LogEntry['type'] = 'info', payload?: any) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, agent, message, type, payload }]);
  };

  // Handoff analysis workflow
  const handleHandoffSubmit = async (summary: string) => {
    setPatientSummary(summary);
    setIsLoading(true);
    setErrorMessage(null);
    setReport(null);
    setShowReviewPanel(false);
    setIntermediateData(null);
    
    // Set diagnostic agent statuses to running
    setStatus({
      medication: 'running',
      scheduling: 'running',
      risk: 'running',
      sdoh: 'running',
      synthesis: 'idle'
    });

    addLog('Orchestrator', 'Started multi-agent clinical consensus orchestration sequence...', 'info');

    try {
      if (reviewModeEnabled) {
        addLog('Orchestrator', 'Clinician Review mode active. Dispatched Medication, Scheduling, Risk, and SDoH agents in parallel.', 'info');
        
        const response = await fetch('/api/handoff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            patientSummary: summary,
            stage: 'parallel'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to analyze patient discharge summary.');
        }

        const data = await response.json();
        
        // Update individual agent timings and results
        setDurations({
          medication: data.trajectory?.medication?.durationMs || 0,
          scheduling: data.trajectory?.scheduling?.durationMs || 0,
          risk: data.trajectory?.risk?.durationMs || 0,
          sdoh: data.trajectory?.sdoh?.durationMs || 0,
          synthesis: 0
        });

        setStatus({
          medication: 'complete',
          scheduling: 'complete',
          risk: 'complete',
          sdoh: 'complete',
          synthesis: 'idle'
        });

        addLog('Medication Agent', 'Medication reconciliation & allergy matching successfully validated.', 'success', data.medication);
        addLog('Scheduling Agent', 'Specialist follow-up appointments and timeframes constructed.', 'success', data.scheduling);
        addLog('Risk Assessor', 'Discharge readmission probability and social determinants calculated.', 'success', data.risk);
        addLog('SDoH Agent', 'Social determinants, geographic and financial barriers assessed.', 'success', data.sdoh);
        addLog('Orchestrator', 'Diagnostic agents complete. Workflow paused for Clinician Review.', 'warn');

        setIntermediateData(data);
        setShowReviewPanel(true);
      } else {
        addLog('Orchestrator', 'Dispatched Medication, Scheduling, Risk, and SDoH agents in parallel.', 'info');
        
        const response = await fetch('/api/handoff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ patientSummary: summary })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to analyze patient discharge summary.');
        }

        const data = await response.json();
        
        // Update individual agent timings and results
        setDurations({
          medication: data.trajectory?.medication?.durationMs || 0,
          scheduling: data.trajectory?.scheduling?.durationMs || 0,
          risk: data.trajectory?.risk?.durationMs || 0,
          sdoh: data.trajectory?.sdoh?.durationMs || 0,
          synthesis: data.trajectory?.synthesis?.durationMs || 0
        });

        setStatus({
          medication: 'complete',
          scheduling: 'complete',
          risk: 'complete',
          sdoh: 'complete',
          synthesis: 'running'
        });

        addLog('Medication Agent', 'Medication reconciliation & allergy matching successfully validated.', 'success', data.medication);
        addLog('Scheduling Agent', 'Specialist follow-up appointments and timeframes constructed.', 'success', data.scheduling);
        addLog('Risk Assessor', 'Discharge readmission probability and social determinants calculated.', 'success', data.risk);
        addLog('SDoH Agent', 'Social determinants, geographic and financial barriers assessed.', 'success', data.sdoh);
        
        // Simulate synthesis processing briefly
        await new Promise(resolve => setTimeout(resolve, 800));

        setStatus(prev => ({ ...prev, synthesis: 'complete' }));
        addLog('Synthesis Agent', 'Transition roadmap synthesized into unified care handoff report.', 'success', data.synthesis);
        
        setReport(data);
        addLog('System', `Consensus execution finished successfully in ${(data.trajectory?.totalMs / 1000).toFixed(2)}s.`, 'system');
      }

    } catch (err: any) {
      console.error(err);
      setStatus({
        medication: 'error',
        scheduling: 'error',
        risk: 'error',
        sdoh: 'error',
        synthesis: 'error'
      });
      setErrorMessage(err.message || 'An unexpected error occurred during multi-agent synthesis.');
      addLog('System', `Pipeline aborted: ${err.message || 'Verification failure'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClinicianReviewContinue = async (reviewedData: {
    medication: any;
    scheduling: any;
    risk: any;
    sdoh: any;
    auditLog: string[];
  }) => {
    if (!intermediateData) return;

    setIsSynthesizing(true);
    setErrorMessage(null);
    
    addLog('Orchestrator', 'Clinician verified and approved diagnostics. Deploying custom overrides and running Synthesis coordinator...', 'info');
    reviewedData.auditLog.forEach(logLine => {
      addLog('Clinician Override', logLine, 'warn');
    });

    setStatus(prev => ({
      ...prev,
      synthesis: 'running'
    }));

    try {
      const response = await fetch('/api/handoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientSummary,
          stage: 'synthesis',
          medication: reviewedData.medication,
          scheduling: reviewedData.scheduling,
          risk: reviewedData.risk,
          sdoh: reviewedData.sdoh,
          trajectory: intermediateData.trajectory
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to synthesize care handoff report.');
      }

      const data = await response.json();

      // Update durations (especially synthesis)
      setDurations({
        medication: data.trajectory?.medication?.durationMs || 0,
        scheduling: data.trajectory?.scheduling?.durationMs || 0,
        risk: data.trajectory?.risk?.durationMs || 0,
        sdoh: data.trajectory?.sdoh?.durationMs || 0,
        synthesis: data.trajectory?.synthesis?.durationMs || 0
      });

      setStatus(prev => ({
        ...prev,
        synthesis: 'complete'
      }));

      addLog('Synthesis Agent', 'Transition roadmap successfully customized and synthesized into care handoff report.', 'success', data.synthesis);
      
      setReport(data);
      setShowReviewPanel(false);
      addLog('System', `Consensus execution finished successfully in ${(data.trajectory?.totalMs / 1000).toFixed(2)}s.`, 'system');

    } catch (err: any) {
      console.error(err);
      setStatus(prev => ({
        ...prev,
        synthesis: 'error'
      }));
      setErrorMessage(err.message || 'An unexpected error occurred during synthesis.');
      addLog('System', `Synthesis failed: ${err.message || 'Execution error'}`, 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleClinicianReviewCancel = () => {
    setShowReviewPanel(false);
    setIntermediateData(null);
    setStatus({
      medication: 'idle',
      scheduling: 'idle',
      risk: 'idle',
      sdoh: 'idle',
      synthesis: 'idle'
    });
    addLog('Orchestrator', 'Pipeline execution canceled by clinician.', 'info');
  };

  // Run Regression Suite
  const handleRunEvaluation = async () => {
    setEvalStatus('running');
    setEvalResults([]);
    setEvalMetrics(null);
    addLog('Evaluator', 'Launching care transition automated regression suite (10 test cases)...', 'info');

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Evaluation endpoint failed with internal error.');
      }

      const data = await response.json();
      setEvalResults(data.results);
      setEvalMetrics(data.metrics);
      setEvalStatus('complete');
      addLog('Evaluator', `Regression suite completed. Metrics calculated. Overall Pass Rate: ${data.metrics.overallSuccessRatePercent.toFixed(1)}%`, 'success');
    } catch (err: any) {
      console.error(err);
      setEvalStatus('idle');
      addLog('Evaluator', `Regression suite failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans transition-colors duration-200 selection:bg-emerald-500/30 selection:text-emerald-100`}>
      
      {/* Top Professional Banner — COMPACT */}
      <header className={`border-b ${isDarkMode ? 'border-slate-900 bg-slate-900/30' : 'border-slate-200 bg-white/80'} backdrop-blur-md sticky top-0 z-50 transition-colors duration-200`}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Network className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className={`text-sm font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2 transition-colors`}>
                CareTransition AI
                <span className="text-[9px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded-full border border-sky-400/50 text-sky-400 bg-sky-400/10 shadow-[0_0_8px_rgba(56,189,248,0.3)]">Beta</span>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-emerald-500/20 ml-1">v1.2</span>
              </span>
              <p className={`text-[9px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Multi-Agent Clinical Discharge Coordinator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Navigation Tabs — COMPACT */}
            <nav className={`flex space-x-1 ${isDarkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-100 border-slate-200'} p-0.5 rounded-lg border transition-colors`}>
              <button
                onClick={() => setActiveTab('orchestrator')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'orchestrator'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : `${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-950'}`
                }`}
              >
                Pipeline
              </button>
              <button
                onClick={() => setActiveTab('evaluator')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'evaluator'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : `${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-950'}`
                }`}
              >
                Regression
              </button>
            </nav>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container — TIGHTER */}
      <main className="max-w-5xl mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          
          {/* ORCHESTRATOR VIEW */}
          {activeTab === 'orchestrator' && (
            <motion.div
              key="orchestrator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* CHANGED: 4/8 split, tighter gap */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Left Controls Column — 4 cols, COMPACT */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Pipeline Settings Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Settings className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">Pipeline Settings</span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                      <div className="space-y-1 pr-4">
                        <label htmlFor="clinician-review-toggle" className="text-xs font-semibold text-slate-200 cursor-pointer block">Clinician Review Mode</label>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Pause workflow for manual verification & overrides before synthesizing care transition plans.
                        </p>
                      </div>
                      <button
                        id="clinician-review-toggle"
                        onClick={() => setReviewModeEnabled(!reviewModeEnabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          reviewModeEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                            reviewModeEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <PatientInputForm 
                    onSubmit={handleHandoffSubmit} 
                    isLoading={isLoading || isSynthesizing || showReviewPanel} 
                    initialValue={patientSummary} 
                  />
                  <AuditTrail logs={logs} onClear={() => setLogs([])} />
                </div>

                {/* Right Results Column — 8 cols, MORE SPACE */}
                <div className="lg:col-span-8 space-y-4">
                  
                  {/* Status Trajectory Indicator */}
                  <ExecutionTrajectory status={status} durations={durations} />

                  {/* Errors display */}
                  {errorMessage && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3">
                      <XCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm">Pipeline Error</h4>
                        <p className="text-xs mt-1 leading-relaxed text-slate-300">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Main Output Report or Clinician Review Checklist */}
                  {showReviewPanel && intermediateData ? (
                    <ClinicianReview 
                      originalMedication={intermediateData.medication}
                      originalScheduling={intermediateData.scheduling}
                      originalRisk={intermediateData.risk}
                      originalSdoh={intermediateData.sdoh}
                      onContinue={handleClinicianReviewContinue}
                      onCancel={handleClinicianReviewCancel}
                      isSynthesizing={isSynthesizing}
                    />
                  ) : report ? (
                    <ReportView report={report} />
                  ) : (
                    !isLoading && !errorMessage && (
                      <div className="bg-slate-900/50 border border-slate-900 border-dashed rounded-xl p-10 text-center flex flex-col items-center justify-center text-slate-500 h-[320px]">
                        <Stethoscope className="w-10 h-10 text-slate-700 mb-3 stroke-[1.5]" />
                        <h3 className="font-semibold text-slate-300 text-sm">Handoff Report Awaiting Generation</h3>
                        <p className="text-xs max-w-sm mx-auto mt-2 text-slate-500">
                          Provide a clinical summary on the left, then click "Run Analysis" to initialize the consensus sequence.
                        </p>
                      </div>
                    )
                  )}

                  {/* Loading placeholder */}
                  {isLoading && (
                    <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-10 text-center flex flex-col items-center justify-center text-slate-400 h-[320px] relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 animate-pulse" />
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
                      <h3 className="font-semibold text-slate-200 text-sm">Asynchronous Execution Pool Engaged</h3>
                      <p className="text-xs max-w-sm mx-auto mt-2 text-slate-400 leading-relaxed">
                        Llama 3.3 querying parallel clinical experts and synthesizing discharge roadmap.
                      </p>
                    </div>
                  )}

                </div>

              </div>
            </motion.div>
          )}

          {/* REGRESSION EVALUATOR VIEW — COMPACT */}
          {activeTab === 'evaluator' && (
            <motion.div
              key="evaluator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Evaluator Header — COMPACT */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/15 rounded-lg text-emerald-400 border border-emerald-500/20">
                      <TestTube2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">Regression Suite</h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        10 clinical test cases measuring prediction fidelity.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRunEvaluation}
                    disabled={evalStatus === 'running'}
                    className={`px-4 py-2.5 rounded-lg font-bold text-[11px] flex items-center gap-2 transition-all uppercase tracking-wider cursor-pointer ${
                      evalStatus === 'running'
                        ? 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/15'
                    }`}
                  >
                    {evalStatus === 'running' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Run Suite</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Metrics Breakdown — COMPACT */}
                {evalMetrics && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800/80">
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Pharma Match</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold text-emerald-400">{evalMetrics.medPassRatePercent.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Risk Match</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold text-emerald-400">{evalMetrics.riskPassRatePercent.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-lg border border-emerald-500/20 shadow-md">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Overall Accuracy</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold text-emerald-300">{evalMetrics.overallSuccessRatePercent.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Test cases results list — COMPACT */}
              {evalResults.length > 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Results</span>
                    <span className="text-[10px] text-emerald-400 font-medium font-mono">10 cases</span>
                  </div>

                  <div className="divide-y divide-slate-800/80 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/40 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          <th className="py-2.5 px-5">ID & DESC</th>
                          <th className="py-2.5 px-5">EXP RISK</th>
                          <th className="py-2.5 px-5">ACTUAL</th>
                          <th className="py-2.5 px-5">ALLERGY</th>
                          <th className="py-2.5 px-5 text-right">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-[11px]">
                        {evalResults.map((tc) => (
                          <tr key={tc.id} className="hover:bg-slate-850/30 transition-colors">
                            <td className="py-3.5 px-5 max-w-xs">
                              <span className="font-mono font-bold text-emerald-400 text-[10px] block">{tc.id}</span>
                              <span className="text-slate-300 font-medium mt-0.5 block leading-relaxed">{tc.description}</span>
                            </td>
                            <td className="py-3.5 px-5 font-mono font-bold text-slate-400">
                              {tc.risk?.expected}
                            </td>
                            <td className="py-3.5 px-5 font-mono">
                              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                tc.risk?.passed 
                                  ? 'text-emerald-400 bg-emerald-500/10' 
                                  : 'text-rose-400 bg-rose-500/10'
                              }`}>
                                {tc.risk?.actual}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 font-mono">
                              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                tc.medication?.passed 
                                  ? 'text-emerald-400 bg-emerald-500/10' 
                                  : 'text-rose-400 bg-rose-500/10'
                              }`}>
                                {tc.medication?.actual ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                                tc.overallPassed 
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                              }`}>
                                {tc.overallPassed ? 'PASS' : 'FAIL'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                evalStatus !== 'running' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center flex flex-col items-center justify-center text-slate-500 min-h-[250px]">
                    <TestTube2 className="w-10 h-10 text-slate-700 mb-3 stroke-[1.5]" />
                    <h3 className="font-semibold text-slate-300 text-sm">Evaluator Idle</h3>
                    <p className="text-xs max-w-sm mx-auto mt-2 text-slate-500">
                      Click "Run Suite" to execute 10 test cases.
                    </p>
                  </div>
                )
              )}

              {/* Loader during regression evaluation */}
              {evalStatus === 'running' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center flex flex-col items-center justify-center text-slate-400 min-h-[250px]">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
                  <h3 className="font-semibold text-slate-200 text-sm">Running Regression Trials</h3>
                  <p className="text-xs max-w-sm mx-auto mt-2 text-slate-500 leading-relaxed">
                    Executing 10 patient summaries against clinical classifiers...
                  </p>
                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}