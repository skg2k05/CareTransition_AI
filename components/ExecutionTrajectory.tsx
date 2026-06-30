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
    <div id="execution-trajectory-container" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl relative">
      {/* Header — COMPACT */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 font-sans tracking-tight">Execution Trajectory</h2>
            <p className="text-[10px] text-slate-400">Real-time status of the multi-agent clinical consensus pool.</p>
          </div>
        </div>
        {isAnyRunning && (
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Executing
          </div>
        )}
      </div>

      {/* Trajectory Flow Map — RESPONSIVE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 items-center relative">
        
        {/* Step 1: Orchestrator */}
        <div className="xl:col-span-1 flex flex-col items-center">
          <div className="w-full max-w-[160px] bg-slate-950 border border-slate-800 rounded-xl p-3 text-center shadow-md relative group hover:border-slate-700 transition-colors">
            <div className="mx-auto w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-300 mb-1.5">
              <BrainCircuit className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Orchestrator</div>
            <div className="text-[9px] text-slate-500 mt-0.5 font-mono">Dispatches tasks</div>
            
            <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 hidden xl:block text-slate-600">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Step 2: Parallel Specialist Pool */}
        <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-2 relative">
          
          {/* Connector Lines */}
          <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 w-4 hidden xl:block" />
          <div className="absolute right-[-16px] top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 w-4 hidden xl:block" />

          {/* Med Agent */}
          <div className={`rounded-xl border p-2.5 shadow-sm transition-all duration-300 relative ${medConfig.bg}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <Pill className="w-3 h-3 shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Med Rx</span>
              </div>
              <div className="relative flex h-1.5 w-1.5">
                {medConfig.pulse && <span className={`${medConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${medConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[9px] leading-snug text-slate-400 mb-1.5">Cross-ref allergies & interactions.</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
              <span className="text-[8px] font-mono text-slate-500">{medConfig.label}</span>
              {durations?.medication !== undefined && durations.medication > 0 && (
                <span className="text-[8px] font-mono text-slate-400">{durations.medication}ms</span>
              )}
            </div>
          </div>

          {/* Sched Agent */}
          <div className={`rounded-xl border p-2.5 shadow-sm transition-all duration-300 relative ${schedConfig.bg}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Schedule</span>
              </div>
              <div className="relative flex h-1.5 w-1.5">
                {schedConfig.pulse && <span className={`${schedConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${schedConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[9px] leading-snug text-slate-400 mb-1.5">Extracts follow-up consults.</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
              <span className="text-[8px] font-mono text-slate-500">{schedConfig.label}</span>
              {durations?.scheduling !== undefined && durations.scheduling > 0 && (
                <span className="text-[8px] font-mono text-slate-400">{durations.scheduling}ms</span>
              )}
            </div>
          </div>

          {/* Risk Agent */}
          <div className={`rounded-xl border p-2.5 shadow-sm transition-all duration-300 relative ${riskConfig.bg}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Risk</span>
              </div>
              <div className="relative flex h-1.5 w-1.5">
                {riskConfig.pulse && <span className={`${riskConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${riskConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[9px] leading-snug text-slate-400 mb-1.5">Evaluates readmission risk.</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
              <span className="text-[8px] font-mono text-slate-500">{riskConfig.label}</span>
              {durations?.risk !== undefined && durations.risk > 0 && (
                <span className="text-[8px] font-mono text-slate-400">{durations.risk}ms</span>
              )}
            </div>
          </div>

          {/* SDoH Agent */}
          <div className={`rounded-xl border p-2.5 shadow-sm transition-all duration-300 relative ${sdohConfig.bg}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <HeartHandshake className="w-3 h-3 shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider">SDoH</span>
              </div>
              <div className="relative flex h-1.5 w-1.5">
                {sdohConfig.pulse && <span className={`${sdohConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${sdohConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[9px] leading-snug text-slate-400 mb-1.5">Social & financial barriers.</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
              <span className="text-[8px] font-mono text-slate-500">{sdohConfig.label}</span>
              {durations?.sdoh !== undefined && durations.sdoh > 0 && (
                <span className="text-[8px] font-mono text-slate-400">{durations.sdoh}ms</span>
              )}
            </div>
          </div>

        </div>

        {/* Step 3: Synthesis Coordinator */}
        <div className="xl:col-span-1 flex flex-col items-center">
          <div className={`w-full max-w-[160px] rounded-xl border p-3 text-center shadow-md relative transition-all duration-300 ${synthConfig.bg}`}>
            <div className="mx-auto w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 bg-slate-950 border border-slate-800 text-slate-300">
              {synthConfig.icon}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider">Synthesis</div>
            <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Compiles consensus report</p>
            
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 mt-2">
              <span className="text-[9px] font-mono text-slate-500">{synthConfig.label}</span>
              {durations?.synthesis !== undefined && durations.synthesis > 0 && (
                <span className="text-[9px] font-mono text-slate-400">{durations.synthesis}ms</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}