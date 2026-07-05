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

      {/* Trajectory Flow Map */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 w-full mt-6">
        
        {/* Step 1: Orchestrator */}
        <div className="xl:col-span-1 h-full w-full">
          <div className="w-full h-full bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 text-center shadow-lg relative group hover:border-slate-700 transition-colors flex flex-col justify-center">
            <div className="mx-auto w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-slate-300 mb-3 shadow-inner">
              <BrainCircuit className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-200 break-words px-1">CORE</div>
            <div className="text-[10px] text-slate-500 mt-1.5 font-mono bg-slate-900/50 py-1 px-2 rounded-md">Dispatches tasks</div>
            
            {/* Arrow (Right) */}
            <div className="hidden xl:block absolute -right-6 top-1/2 -translate-y-1/2 text-slate-700 z-10">
              <ArrowRight className="w-5 h-5" />
            </div>
            {/* Arrow (Down) */}
            <div className="xl:hidden absolute -bottom-5 left-1/2 -translate-x-1/2 text-slate-700 z-10">
              <ArrowRight className="w-5 h-5 rotate-90" />
            </div>
          </div>
        </div>

        {/* Step 2: Parallel Specialist Pool (Grid) */}
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 relative">
          
          {/* Med Agent */}
          <div className={`rounded-xl border p-3.5 shadow-md transition-all duration-300 relative ${medConfig.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Med Rx</span>
              </div>
              <div className="relative flex h-2 w-2">
                {medConfig.pulse && <span className={`${medConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${medConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[10px] leading-snug text-slate-400 mb-2">Cross-ref allergies & interactions.</p>
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-mono font-medium">{medConfig.label}</span>
              {durations?.medication !== undefined && durations.medication > 0 && (
                <span className="text-[10px] font-mono opacity-80">{durations.medication}ms</span>
              )}
            </div>
          </div>

          {/* Sched Agent */}
          <div className={`rounded-xl border p-3.5 shadow-md transition-all duration-300 relative ${schedConfig.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Schedule</span>
              </div>
              <div className="relative flex h-2 w-2">
                {schedConfig.pulse && <span className={`${schedConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${schedConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[10px] leading-snug text-slate-400 mb-2">Extracts follow-up consults.</p>
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-mono font-medium">{schedConfig.label}</span>
              {durations?.scheduling !== undefined && durations.scheduling > 0 && (
                <span className="text-[10px] font-mono opacity-80">{durations.scheduling}ms</span>
              )}
            </div>
          </div>

          {/* Risk Agent */}
          <div className={`rounded-xl border p-3.5 shadow-md transition-all duration-300 relative ${riskConfig.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Risk</span>
              </div>
              <div className="relative flex h-2 w-2">
                {riskConfig.pulse && <span className={`${riskConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${riskConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[10px] leading-snug text-slate-400 mb-2">Evaluates readmission risk.</p>
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-mono font-medium">{riskConfig.label}</span>
              {durations?.risk !== undefined && durations.risk > 0 && (
                <span className="text-[10px] font-mono opacity-80">{durations.risk}ms</span>
              )}
            </div>
          </div>

          {/* SDoH Agent */}
          <div className={`rounded-xl border p-3.5 shadow-md transition-all duration-300 relative ${sdohConfig.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">SDoH</span>
              </div>
              <div className="relative flex h-2 w-2">
                {sdohConfig.pulse && <span className={`${sdohConfig.pulse} absolute inline-flex h-full w-full rounded-full opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${sdohConfig.indicator}`} />
              </div>
            </div>
            <p className="text-[10px] leading-snug text-slate-400 mb-2">Social & financial barriers.</p>
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-mono font-medium">{sdohConfig.label}</span>
              {durations?.sdoh !== undefined && durations.sdoh > 0 && (
                <span className="text-[10px] font-mono opacity-80">{durations.sdoh}ms</span>
              )}
            </div>
          </div>

        </div>

        {/* Step 3: Synthesis Coordinator */}
        <div className="xl:col-span-1 h-full w-full">
          <div className={`w-full h-full rounded-2xl border p-5 text-center shadow-lg relative flex flex-col justify-center transition-all duration-300 ${synthConfig.bg}`}>
            {/* Arrow (Left) */}
            <div className="hidden xl:block absolute -left-6 top-1/2 -translate-y-1/2 text-slate-700 z-10">
              <ArrowRight className="w-5 h-5" />
            </div>
            {/* Arrow (Up) */}
            <div className="xl:hidden absolute -top-5 left-1/2 -translate-x-1/2 text-slate-700 z-10">
              <ArrowRight className="w-5 h-5 rotate-90" />
            </div>

            <div className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-slate-950 border border-slate-800 text-slate-300 shadow-inner">
              {synthConfig.icon}
            </div>
            <div className={`text-xs font-bold uppercase tracking-widest`}>Synthesis</div>
            <div className="text-[10px] opacity-70 mt-1.5 font-mono py-1 px-2 rounded-md bg-black/20">Compiles consensus</div>
            
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800/60 mt-4">
              <span className="text-[10px] font-mono font-medium">{synthConfig.label}</span>
              {durations?.synthesis !== undefined && durations.synthesis > 0 && (
                <span className="text-[10px] font-mono opacity-80">{durations.synthesis}ms</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}