'use client';

import React from 'react';
import { Network, BrainCircuit, Pill, Calendar, AlertTriangle, HeartHandshake, ArrowRight, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

export type AgentStatus = 'idle' | 'running' | 'complete' | 'error';

interface ExecutionTrajectoryProps {
  status: {
    medication: AgentStatus;
    scheduling: AgentStatus;
    risk: AgentStatus;
    sdoh: AgentStatus;
    synthesis: AgentStatus;
  };
  durations?: {
    medication?: number;
    scheduling?: number;
    risk?: number;
    sdoh?: number;
    synthesis?: number;
  };
}

export default function ExecutionTrajectory({ status, durations }: ExecutionTrajectoryProps) {
  const getStatusConfig = (s: AgentStatus) => {
    switch (s) {
      case 'running':
        return {
          bg: 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-amber-500/5',
          indicator: 'bg-amber-500',
          pulse: 'animate-ping bg-amber-500',
          label: 'Processing',
          icon: <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
        };
      case 'complete':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/5',
          indicator: 'bg-emerald-500',
          pulse: '',
          label: 'Success',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        };
      case 'error':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-500/5',
          indicator: 'bg-rose-500',
          pulse: '',
          label: 'Error',
          icon: <XCircle className="w-4 h-4 text-rose-400" />
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-800 text-slate-500 shadow-none',
          indicator: 'bg-slate-700',
          pulse: '',
          label: 'Pending',
          icon: <div className="w-4 h-4 rounded-full border border-dashed border-slate-600" />
        };
    }
  };

  const medConfig = getStatusConfig(status.medication);
  const schedConfig = getStatusConfig(status.scheduling);
  const riskConfig = getStatusConfig(status.risk);
  const sdohConfig = getStatusConfig(status.sdoh);
  const synthConfig = getStatusConfig(status.synthesis);

  const isAnyRunning = 
    status.medication === 'running' || 
    status.scheduling === 'running' || 
    status.risk === 'running' || 
    status.sdoh === 'running' || 
    status.synthesis === 'running';

  return (
    <div id="execution-trajectory-container" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">Execution Trajectory</h2>
            <p className="text-xs text-slate-400">Real-time status of the multi-agent clinical consensus pool.</p>
          </div>
        </div>
        {isAnyRunning && (
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full animate-pulse border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Executing
          </div>
        )}
      </div>

      {/* Trajectory Flow Map */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-center relative">
        
        {/* Step 1: Input / Care Coordinator Router */}
        <div className="xl:col-span-1 flex flex-col items-center">
          <div className="w-full max-w-[180px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-center shadow-md relative group hover:border-slate-700 transition-colors">
            <div className="mx-auto w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-300 mb-2">
              <BrainCircuit className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Orchestrator</div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">Dispatches tasks</div>
            
            <div className="absolute right-[-14px] top-1/2 -translate-y-1/2 hidden xl:block text-slate-600">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Step 2: Parallel Specialist Pool */}
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          
          {/* Connector Line helpers on desktop xl */}
          <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 w-6 hidden xl:block" />
          <div className="absolute right-[-24px] top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 w-6 hidden xl:block" />

          {/* Med Agent */}
          <div className={`rounded-xl border p-3.5 shadow-sm transition-all duration-300 relative ${medConfig.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Medication Rx</span>
              </div>
              <div className="relative flex h-2 w-2">
                {medConfig.pulse && <span className={`${medConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${medConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[10px] leading-snug text-slate-400 mb-2">Cross-references allergies and drug interactions.</p>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 mt-1.5">
              <span className="text-[9px] font-mono text-slate-500">{medConfig.label}</span>
              {durations?.medication !== undefined && (
                <span className="text-[9px] font-mono text-slate-400">{durations.medication}ms</span>
              )}
            </div>
          </div>

          {/* Sched Agent */}
          <div className={`rounded-xl border p-3.5 shadow-sm transition-all duration-300 relative ${schedConfig.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Scheduling</span>
              </div>
              <div className="relative flex h-2 w-2">
                {schedConfig.pulse && <span className={`${schedConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${schedConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[10px] leading-snug text-slate-400 mb-2">Extracts follow-up clinic consults and guidelines.</p>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 mt-1.5">
              <span className="text-[9px] font-mono text-slate-500">{schedConfig.label}</span>
              {durations?.scheduling !== undefined && (
                <span className="text-[9px] font-mono text-slate-400">{durations.scheduling}ms</span>
              )}
            </div>
          </div>

          {/* Risk Agent */}
          <div className={`rounded-xl border p-3.5 shadow-sm transition-all duration-300 relative ${riskConfig.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Risk Assessor</span>
              </div>
              <div className="relative flex h-2 w-2">
                {riskConfig.pulse && <span className={`${riskConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${riskConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[10px] leading-snug text-slate-400 mb-2">Evaluates clinical readmission risk levels.</p>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 mt-1.5">
              <span className="text-[9px] font-mono text-slate-500">{riskConfig.label}</span>
              {durations?.risk !== undefined && (
                <span className="text-[9px] font-mono text-slate-400">{durations.risk}ms</span>
              )}
            </div>
          </div>

          {/* SDoH Agent */}
          <div className={`rounded-xl border p-3.5 shadow-sm transition-all duration-300 relative ${sdohConfig.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">SDoH Social</span>
              </div>
              <div className="relative flex h-2 w-2">
                {sdohConfig.pulse && <span className={`${sdohConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${sdohConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[10px] leading-snug text-slate-400 mb-2">Analyzes support barriers, transit, and finance.</p>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 mt-1.5">
              <span className="text-[9px] font-mono text-slate-500">{sdohConfig.label}</span>
              {durations?.sdoh !== undefined && (
                <span className="text-[9px] font-mono text-slate-400">{durations.sdoh}ms</span>
              )}
            </div>
          </div>

        </div>

        {/* Step 3: Synthesis Coordinator */}
        <div className="xl:col-span-1 flex flex-col items-center">
          <div className={`w-full max-w-[180px] rounded-xl border p-4 text-center shadow-md relative transition-all duration-300 ${synthConfig.bg}`}>
            <div className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-2 bg-slate-950 border border-slate-800 text-slate-300">
              {synthConfig.icon}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider">Synthesis</div>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal">Compiles consensus Handoff Report</p>
            
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2.5">
              <span className="text-[10px] font-mono text-slate-500">{synthConfig.label}</span>
              {durations?.synthesis !== undefined && (
                <span className="text-[10px] font-mono text-slate-400">{durations.synthesis}ms</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
