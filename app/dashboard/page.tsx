'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Network, 
  LogOut, 
  Stethoscope, 
  User, 
  FileText,
  Pill,
  Calendar,
  AlertTriangle,
  HeartHandshake,
  ChevronRight,
  Clock,
  CheckCircle2,
  LayoutDashboard,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Import your existing components (adjust paths as needed)
import PatientInputForm from '@/components/PatientInputForm';
import ExecutionTrajectory from '@/components/ExecutionTrajectory';
import ReportView from '@/components/ReportView';
import AuditTrail, { LogEntry } from '@/components/AuditTrail';
import ClinicianReview from '@/components/ClinicianReview';
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

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, logout, role } = useAuth();
  const isDoctor = role === 'doctor';

  // Doctor states
  const [activeTab, setActiveTab] = useState<'analysis' | 'report'>('analysis');
  const [patientSummary, setPatientSummary] = useState(DEFAULT_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      time: "System Init",
      agent: 'System',
      message: `Welcome, ${user?.name || 'User'}. ${isDoctor ? 'Doctor' : 'Patient'} dashboard loaded.`,
      type: 'system'
    }
  ]);

  // Patient states
  const [patientReports, setPatientReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const addLog = (agent: string, message: string, type: LogEntry['type'] = 'info', payload?: any) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, agent, message, type, payload }]);
  };

  const handleHandoffSubmit = async (summary: string) => {
    if (!isDoctor) return;
    
    setPatientSummary(summary);
    setIsLoading(true);
    setErrorMessage(null);
    setReport(null);
    setShowReviewPanel(false);
    setIntermediateData(null);

    setStatus({
      medication: 'running',
      scheduling: 'running',
      risk: 'running',
      sdoh: 'running',
      synthesis: 'idle'
    });

    addLog('Orchestrator', 'Started multi-agent clinical consensus orchestration...', 'info');

    try {
      const stage = reviewModeEnabled ? 'parallel' : undefined;
      const response = await fetch('/api/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          patientSummary: summary,
          ...(stage && { stage })
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze patient discharge summary.');
      }

      const data = await response.json();
      
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
        synthesis: reviewModeEnabled ? 'idle' : 'complete'
      });

      addLog('Medication Agent', 'Medication reconciliation validated.', 'success', data.medication);
      addLog('Scheduling Agent', 'Follow-up appointments constructed.', 'success', data.scheduling);
      addLog('Risk Assessor', 'Readmission risk calculated.', 'success', data.risk);
      addLog('SDoH Agent', 'Social barriers assessed.', 'success', data.sdoh);

      if (reviewModeEnabled) {
        addLog('Orchestrator', 'Workflow paused for Clinician Review.', 'warn');
        setIntermediateData(data);
        setShowReviewPanel(true);
        setActiveTab('report');
      } else {
        setReport(data);
        addLog('System', `Consensus finished in ${(data.trajectory?.totalMs / 1000).toFixed(2)}s.`, 'system');
        setActiveTab('report');
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
      setErrorMessage(err.message || 'An unexpected error occurred.');
      addLog('System', `Pipeline aborted: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClinicianReviewContinue = async (reviewedData: any) => {
    if (!intermediateData || !isDoctor) return;

    setIsSynthesizing(true);
    setErrorMessage(null);
    
    addLog('Orchestrator', 'Clinician approved. Running Synthesis...', 'info');
    reviewedData.auditLog?.forEach((logLine: string) => {
      addLog('Clinician Override', logLine, 'warn');
    });

    setStatus(prev => ({ ...prev, synthesis: 'running' }));

    try {
      const response = await fetch('/api/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(errorData.error || 'Failed to synthesize report.');
      }

      const data = await response.json();

      setDurations(prev => ({
        ...prev,
        synthesis: data.trajectory?.synthesis?.durationMs || 0
      }));

      setStatus(prev => ({ ...prev, synthesis: 'complete' }));
      addLog('Synthesis Agent', 'Report synthesized successfully.', 'success', data.synthesis);
      
      setReport(data);
      setShowReviewPanel(false);
      setActiveTab('report');
      addLog('System', `Consensus finished in ${(data.trajectory?.totalMs / 1000).toFixed(2)}s.`, 'system');

    } catch (err: any) {
      console.error(err);
      setStatus(prev => ({ ...prev, synthesis: 'error' }));
      setErrorMessage(err.message || 'Synthesis failed.');
      addLog('System', `Synthesis failed: ${err.message}`, 'error');
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
    addLog('Orchestrator', 'Pipeline canceled by clinician.', 'info');
    setActiveTab('analysis');
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // Mock patient reports for demo
  useEffect(() => {
    if (!isDoctor) {
      setPatientReports([
        {
          id: 'rep_001',
          date: '2026-06-28',
          doctor: 'Dr. Sharma',
          hospital: 'City General Hospital',
          status: 'Approved',
          summary: 'COPD Exacerbation - Discharged with medication plan'
        },
        {
          id: 'rep_002',
          date: '2026-06-15',
          doctor: 'Dr. Patel',
          hospital: 'City General Hospital',
          status: 'Pending Review',
          summary: 'Post-surgery follow-up required'
        }
      ]);
    }
  }, [isDoctor]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-100">
      
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-900/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Network className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                CareTransition AI
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-emerald-500/20">
                  {isDoctor ? 'DOCTOR' : 'PATIENT'}
                </span>
              </span>
              <p className="text-[9px] text-slate-400 font-medium">
                {isDoctor ? 'Multi-Agent Clinical Discharge Coordinator' : 'Your Care Transition Portal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {isDoctor ? <Stethoscope className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{user?.name || 'User'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AnimatePresence mode="wait">
          
          {isDoctor ? (
            /* DOCTOR DASHBOARD */
            <motion.div
              key="doctor-dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Taskbar / Tabs */}
              <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit mb-4">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'analysis' 
                      ? 'bg-slate-800 text-emerald-400 shadow-md border-b border-emerald-500/20' 
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Analysis & Tracking
                </button>
                <button
                  onClick={() => setActiveTab('report')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'report' 
                      ? 'bg-slate-800 text-emerald-400 shadow-md border-b border-emerald-500/20' 
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Generated Report
                </button>
              </div>

              {activeTab === 'analysis' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Pipeline Settings */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-slate-200">
                        <Stethoscope className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Doctor Controls</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                        <div className="space-y-1 pr-4">
                          <label className="text-xs font-semibold text-slate-200 block">Clinician Review Mode</label>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Pause for manual verification before synthesizing.
                          </p>
                        </div>
                        <button
                          onClick={() => setReviewModeEnabled(!reviewModeEnabled)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                            reviewModeEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow transition duration-200 ${
                            reviewModeEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <PatientInputForm 
                      onSubmit={handleHandoffSubmit} 
                      isLoading={isLoading || isSynthesizing || showReviewPanel} 
                      initialValue={patientSummary} 
                    />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <ExecutionTrajectory status={status} durations={durations} />
                    <AuditTrail logs={logs} onClear={() => setLogs([])} />
                  </div>
                </div>
              )}

              {activeTab === 'report' && (
                <div className="space-y-4">
                  {errorMessage && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm">Pipeline Error</h4>
                        <p className="text-xs mt-1 text-slate-300">{errorMessage}</p>
                      </div>
                    </div>
                  )}

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
                          Enter a discharge summary and click Run Analysis.
                        </p>
                      </div>
                    )
                  )}

                  {isLoading && (
                    <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-10 text-center flex flex-col items-center justify-center text-slate-400 h-[320px] relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 animate-pulse" />
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <h3 className="font-semibold text-slate-200 text-sm">Asynchronous Execution Pool Engaged</h3>
                      <p className="text-xs max-w-sm mx-auto mt-2 text-slate-400">
                        Llama 3.3 querying parallel clinical experts...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            /* PATIENT DASHBOARD */
            <motion.div
              key="patient-dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-1">My Care Reports</h2>
                <p className="text-xs text-slate-400">View your discharge reports and care plans shared by your doctors.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientReports.map((rep) => (
                  <div 
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200">{rep.id}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        rep.status === 'Approved' 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-slate-100 mb-1">{rep.summary}</h3>
                    
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-3">
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        {rep.doctor}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rep.date}
                      </span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                      View Report <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>

              {selectedReport && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Report Details</h3>
                    <button 
                      onClick={() => setSelectedReport(null)}
                      className="text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      Close
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Full report view would appear here. Connect with backend to load actual report data.
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