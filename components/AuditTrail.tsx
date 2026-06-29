'use client';

import React, { useState } from 'react';
import { Clock, Terminal, ChevronDown, ChevronUp, FileJson, Layers, Settings, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface LogEntry {
  time: string;
  agent: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'system';
  payload?: any;
}

interface AuditTrailProps {
  logs: LogEntry[];
  onClear?: () => void;
}

export default function AuditTrail({ logs, onClear }: AuditTrailProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const getLogColors = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return {
          text: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
          indicator: 'bg-emerald-500'
        };
      case 'warn':
        return {
          text: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
          indicator: 'bg-amber-500'
        };
      case 'error':
        return {
          text: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
          indicator: 'bg-rose-500'
        };
      case 'system':
        return {
          text: 'text-sky-600 dark:text-sky-400',
          bg: 'bg-sky-500/5 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20',
          indicator: 'bg-sky-400'
        };
      default:
        return {
          text: 'text-slate-700 dark:text-slate-300',
          bg: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/40',
          indicator: 'bg-slate-500'
        };
    }
  };

  const toggleExpand = (idx: number) => {
    if (expandedIndex === idx) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(idx);
    }
  };

  return (
    <div id="audit-trail-container" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[520px]">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">Clinical Consensus Audit Trail</h3>
            <p className="text-[10px] text-slate-500">Live system execution traces and deep JSON logs.</p>
          </div>
        </div>

        {onClear && logs.length > 0 && (
          <button
            onClick={onClear}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
            title="Clear logs"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Logs stream container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 italic py-12">
            <Layers className="w-8 h-8 text-slate-700 mb-2 stroke-[1.5]" />
            No execution sequences recorded. Click &quot;Run Analysis&quot; to trace.
          </div>
        ) : (
          logs.map((log, i) => {
            const colors = getLogColors(log.type);
            const isExpanded = expandedIndex === i;
            return (
              <div
                key={i}
                className={`rounded-xl border transition-all duration-150 ${colors.bg}`}
              >
                {/* Header row */}
                <div 
                  onClick={() => log.payload && toggleExpand(i)}
                  className={`flex items-start md:items-center justify-between gap-3 p-3 text-xs cursor-pointer ${log.payload ? 'hover:bg-slate-100 dark:hover:bg-slate-800/30' : 'cursor-default'}`}
                >
                  <div className="flex items-start md:items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-slate-600" />
                      {log.time}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${colors.text} bg-slate-950/10 dark:bg-slate-950/50`}>
                      {log.agent}
                    </span>
                    <span className={`text-[11px] truncate font-sans ${colors.text}`}>
                      {log.message}
                    </span>
                  </div>
                  
                  {log.payload && (
                    <div className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-0.5 rounded transition-colors ml-1">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  )}
                </div>

                {/* Expandable JSON Payload */}
                <AnimatePresence>
                  {isExpanded && log.payload && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden border-t border-slate-800/40"
                    >
                      <div className="p-4 bg-slate-950 text-[11px] font-mono text-emerald-400 overflow-x-auto rounded-b-xl max-h-64 custom-scrollbar">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-900 text-slate-500 text-[10px]">
                          <span className="flex items-center gap-1">
                            <FileJson className="w-3.5 h-3.5" />
                            RAW MODEL OUTPUT
                          </span>
                          <span>JSON Object</span>
                        </div>
                        <pre className="leading-relaxed">{JSON.stringify(log.payload, null, 2)}</pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
