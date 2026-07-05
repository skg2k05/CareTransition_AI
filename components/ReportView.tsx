'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, 
  Pill, 
  Calendar, 
  AlertTriangle, 
  HeartHandshake,
  Check, 
  Copy, 
  Download, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  ShieldCheck,
  Clock,
  ArrowRight,
  Play,
  Pause,
  Square,
  Volume2,
  Sparkles,
  BookOpen,
  User,
  Globe,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportViewProps {
  report: {
    medication: {
      interactionsFound: boolean;
      allergiesFlagged: boolean;
      recommendations: string[];
    };
    scheduling: {
      timeframe: string;
      appointmentsNeeded: string[];
    };
    risk: {
      readmissionRisk: "LOW" | "MEDIUM" | "HIGH";
      analysis: string;
    };
    sdoh?: {
      socialRiskFactors: string[];
      barriersToCare: string[];
      recommendations: string[];
    };
    synthesis: {
      overallStatus: string;
      patientSummary: string;
      criticalAlerts: string[];
      actionPlan: string[];
    };
    trajectory?: {
      totalMs: number;
    };
  };
}

// Safe rendering helpers
const renderString = (value: any): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return JSON.stringify(value);
};

const renderArray = (arr: any[] | undefined): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => typeof item === 'string' ? item : JSON.stringify(item));
};

export default function ReportView({ report }: ReportViewProps) {
  const [copied, setCopied] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});

  // Patient Mode state
  const [isPatientMode, setIsPatientMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [patientData, setPatientData] = useState<any | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [patientCheckedTasks, setPatientCheckedTasks] = useState<Record<number, boolean>>({});

  // Audio / Speech state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const fetchPatientModeData = async (lang: string) => {
    await Promise.resolve();
    setIsLoadingPatient(true);
    setPatientError(null);
    try {
      const res = await fetch('/api/patient-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report,
          language: lang
        })
      });
      if (!res.ok) {
        throw new Error('Failed to load patient translation.');
      }
      const data = await res.json();
      setPatientData(data);
    } catch (err: any) {
      console.error(err);
      setPatientError(err.message || 'Error simplifying report.');
    } finally {
      setIsLoadingPatient(false);
    }
  };

  useEffect(() => {
    if (isPatientMode) {
      const triggerFetch = async () => {
        await fetchPatientModeData(selectedLanguage);
      };
      triggerFetch();
    } else {
      stopNarration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPatientMode, selectedLanguage]);

  // ─── CUSTOM GOOGLE TRANSLATE TTS API WORKAROUND ──────────────────────
  const startNarration = async (text: string) => {
    stopNarration();

    // Map to Google Translate language codes
    const langMap: Record<string, string> = {
      'English': 'en-US',
      'Hindi': 'hi-IN',
      'Kannada': 'kn-IN',
      'Tamil': 'ta-IN',
      'Telugu': 'te-IN',
      'Bengali': 'bn-IN',
      'Marathi': 'mr-IN',
      'Gujarati': 'gu-IN',
      'Malayalam': 'ml-IN',
      'Punjabi': 'pa-IN',
      'Urdu': 'ur-IN',
      'Odia': 'or-IN'
    };

    const tl = langMap[selectedLanguage] || 'en-US';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = tl;
    
    // Attempt to find a suitable voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(tl.split('-')[0]));
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const pauseNarration = () => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopNarration = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleCopy = async () => {
    const textToCopy = `DISCHARGE CARE TRANSITION REPORT
=================================
Status: ${report.synthesis.overallStatus}
Summary: ${report.synthesis.patientSummary}

CRITICAL ALERTS:
${report.synthesis.criticalAlerts.map(a => `- ${a}`).join('\n') || "None flagged"}

ACTION PLAN:
${report.synthesis.actionPlan.map((p, i) => `${i + 1}. ${p}`).join('\n')}

MEDICATION OVERRIDES:
- Allergies Flagged: ${report.medication.allergiesFlagged ? 'YES' : 'NO'}
- Drug Interactions Flagged: ${report.medication.interactionsFound ? 'YES' : 'NO'}
- Recommendations:
${report.medication.recommendations.map(r => `  * ${r}`).join('\n')}

FOLLOW-UP SCHEDULE:
- Timeframe: ${report.scheduling.timeframe}
- Consultations: ${report.scheduling.appointmentsNeeded.join(', ')}

READMISSION RISK:
- Level: ${report.risk.readmissionRisk}
- Clinical Justification: ${report.risk.analysis}

${report.sdoh ? `SOCIAL DETERMINANTS OF HEALTH (SDoH):
- Social Risk Factors: ${report.sdoh.socialRiskFactors?.join(', ') || 'None'}
- Barriers to Care: ${report.sdoh.barriersToCare?.join(', ') || 'None'}
- Recommendations:
${report.sdoh.recommendations?.map(r => `  * ${r}`).join('\n') || '  * None'}
` : ''}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const textToCopy = `DISCHARGE CARE TRANSITION REPORT
=================================
Status: ${report.synthesis.overallStatus}
Summary: ${report.synthesis.patientSummary}

CRITICAL ALERTS:
${report.synthesis.criticalAlerts.map(a => `- ${a}`).join('\n') || "None flagged"}

ACTION PLAN:
${report.synthesis.actionPlan.map((p, i) => `${i + 1}. ${p}`).join('\n')}

MEDICATION OVERRIDES:
- Allergies Flagged: ${report.medication.allergiesFlagged ? 'YES' : 'NO'}
- Drug Interactions Flagged: ${report.medication.interactionsFound ? 'YES' : 'NO'}
- Recommendations:
${report.medication.recommendations.map(r => `  * ${r}`).join('\n')}

FOLLOW-UP SCHEDULE:
- Timeframe: ${report.scheduling.timeframe}
- Consultations: ${report.scheduling.appointmentsNeeded.join(', ')}

READMISSION RISK:
- Level: ${report.risk.readmissionRisk}
- Clinical Justification: ${report.risk.analysis}

${report.sdoh ? `SOCIAL DETERMINANTS OF HEALTH (SDoH):
- Social Risk Factors: ${report.sdoh.socialRiskFactors?.join(', ') || 'None'}
- Barriers to Care: ${report.sdoh.barriersToCare?.join(', ') || 'None'}
- Recommendations:
${report.sdoh.recommendations?.map(r => `  * ${r}`).join('\n') || '  * None'}
` : ''}`;

    const element = document.createElement("a");
    const file = new Blob([textToCopy], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `care-transition-handoff-report-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const toggleTask = (index: number) => {
    setCheckedTasks(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getRiskColor = (level: "LOW" | "MEDIUM" | "HIGH") => {
    switch (level) {
      case "HIGH":
        return {
          border: 'border-rose-500/30',
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        };
      case "MEDIUM":
        return {
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
      default:
        return {
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };
    }
  };

  const riskStyles = getRiskColor(report.risk.readmissionRisk);

  return (
    <div id="report-view-container" className="space-y-4">
      
      {/* View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md transition-colors duration-200">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-500 animate-pulse" />
            Report View Perspective
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between the detailed clinical coordinator report and the simplified patient-friendly discharge guide.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-900 self-start sm:self-auto transition-colors">
          <button
            onClick={() => setIsPatientMode(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 select-none ${
              !isPatientMode
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Clinical View
          </button>
          <button
            onClick={() => setIsPatientMode(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 select-none ${
              isPatientMode
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Patient Mode
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isPatientMode ? (
          /* PATIENT-FRIENDLY INTERACTIVE REPORT */
          <motion.div
            key="patient-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            id="patient-dashboard-container"
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-colors duration-200">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">My Recovery Guide</h2>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        5th-Grade Level
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Your clear, simple care plan translated into your language with voice read-aloud support.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* ─── INDIAN LANGUAGE SELECTOR ───────────────────────── */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 transition-colors">
                    <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-transparent dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none border-none cursor-pointer pr-1"
                    >
                      {/* Top 3 Priority */}
                      <option value="English">English</option>
                      <option value="Hindi">हिन्दी (Hindi)</option>
                      <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                      
                      {/* Other Indian Languages */}
                      <option value="Tamil">தமிழ் (Tamil)</option>
                      <option value="Telugu">తెలుగు (Telugu)</option>
                      <option value="Bengali">বাংলা (Bengali)</option>
                      <option value="Marathi">मराठी (Marathi)</option>
                      <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                      <option value="Malayalam">മലയാളം (Malayalam)</option>
                      <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                      <option value="Urdu">اردو (Urdu)</option>
                      <option value="Odia">ଓଡ଼ିଆ (Odia)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-850 transition-colors">
                    <button
                      onClick={() => {
                        if (patientData?.narrationScript) {
                          if (isPlaying) {
                            pauseNarration();
                          } else {
                            startNarration(patientData.narrationScript);
                          }
                        }
                      }}
                      disabled={isLoadingPatient || !patientData?.narrationScript}
                      className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isPlaying && !isPaused
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-900'
                      } disabled:opacity-50`}
                      title={isPlaying && !isPaused ? "Pause Audio Summary" : "Read Summary Aloud"}
                    >
                      {isPlaying && !isPaused ? <Pause className="w-3.5 h-3.5 text-slate-950" /> : <Play className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
                      <span>{isPlaying && !isPaused ? "Pause" : "Listen"}</span>
                    </button>

                    {isPlaying && (
                      <button
                        onClick={stopNarration}
                        className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-900 cursor-pointer"
                        title="Stop Audio Narration"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient Content Panel */}
              {isLoadingPatient ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                  <Sparkles className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono animate-pulse">
                    Translating and simplifying report to {selectedLanguage}...
                  </p>
                </div>
              ) : patientError ? (
                <div className="py-16 text-center text-rose-500 dark:text-rose-400 text-xs space-y-3">
                  <AlertTriangle className="w-8 h-8 mx-auto text-rose-500/70" />
                  <p className="font-semibold">{patientError}</p>
                  <button
                    onClick={() => fetchPatientModeData(selectedLanguage)}
                    className="px-4 py-2 bg-slate-150 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all font-bold"
                  >
                    Try Again
                  </button>
                </div>
              ) : patientData ? (
                <div className="mt-6 space-y-6">
                  
                  {isPlaying && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 animate-pulse transition-colors">
                      <span className="flex items-center gap-2 font-medium">
                        <Volume2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                        {isPaused ? "Speech narration is paused." : `Now reading aloud in ${selectedLanguage} voice...`}
                      </span>
                      <button onClick={stopNarration} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
                        Stop Voice
                      </button>
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl transition-colors mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 font-mono">Welcome Home Summary</span>
                    <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium">
                      {renderString(patientData.welcomeMessage)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl transition-colors">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3 font-mono">My Checklist (Check items as you do them!)</span>
                        
                        <div className="space-y-2.5">
                          {renderArray(patientData.dailyChecklist || patientData.checklist).map((task: string, i: number) => {
                            const isChecked = !!patientCheckedTasks[i];
                            return (
                              <div
                                key={i}
                                onClick={() => setPatientCheckedTasks(prev => ({ ...prev, [i]: !prev[i] }))}
                                className={`flex gap-3.5 items-start p-3.5 rounded-xl border transition-all duration-200 select-none cursor-pointer ${
                                  isChecked 
                                    ? 'bg-slate-200/40 dark:bg-slate-950/20 border-emerald-500/20 text-slate-400 dark:text-slate-500' 
                                    : 'bg-white dark:bg-slate-950/50 border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-sm'
                                }`}
                              >
                                <div className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${
                                  isChecked 
                                    ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                                    : 'border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 hover:border-slate-500'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3.5] text-slate-950" />}
                                </div>
                                <span className={`text-xs leading-relaxed font-semibold transition-all ${isChecked ? 'line-through opacity-60' : ''}`}>
                                  {task}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <Pill className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">My Discharge Medications</span>
                        </div>
                        
                        <div className="space-y-3">
                          {(patientData.medications || []).map((m: any, i: number) => (
                            <div key={i} className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl space-y-1 shadow-sm transition-colors">
                              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                {renderString(m.name)}
                              </h4>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                <strong className="text-slate-800 dark:text-slate-300">Why I take it:</strong> {renderString(m.reason || m.purpose)}
                              </p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                <strong className="text-slate-800 dark:text-slate-300">How I take it:</strong> {renderString(m.instructions)}
                              </p>
                            </div>
                          ))}
                          {!(patientData.medications || []).length && (
                            <p className="text-xs text-slate-450 italic">No medications listed for this discharge plan.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-violet-500 animate-pulse" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">My Appointments</span>
                        </div>
                        
                        <div className="space-y-2.5">
                          {renderArray(patientData.appointments).map((appt: string, i: number) => (
                            <div key={i} className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex gap-2.5 items-start shadow-sm transition-colors">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400 mt-1.5 shrink-0" />
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{appt}</p>
                            </div>
                          ))}
                          {!renderArray(patientData.appointments).length && (
                            <p className="text-xs text-slate-450 italic">No doctor appoinments scheduled.</p>
                          )}
                        </div>
                      </div>

                      {renderArray(patientData.supportAndRides || patientData.support).length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <HeartHandshake className="w-4 h-4 text-sky-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Support & Transport Services</span>
                          </div>
                          
                          <ul className="space-y-2.5">
                            {renderArray(patientData.supportAndRides || patientData.support).map((help: string, i: number) => (
                              <li key={i} className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/40 p-2.5 rounded-lg flex items-start gap-2 leading-relaxed transition-colors">
                                <ChevronRight className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                                <span>{help}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-20 text-center text-xs text-slate-500 italic">
                  No Patient Recovery plan generated yet.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* STANDARD DETAILED CLINICAL OVERVIEW REPORT */
          <motion.div
            key="clinical-view"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Report Header Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-colors duration-200">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Transition Handoff Report</h2>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        report.synthesis.overallStatus.includes('HOLD') 
                          ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/20' 
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      }`}>
                        {report.synthesis.overallStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">Synthesized clinical discharge roadmap with multi-agent overrides check.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-250 dark:border-slate-700/50 flex items-center gap-2 transition-all cursor-pointer hover:shadow-md"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Report</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-950" />
                    <span>Download Text</span>
                  </button>
                </div>
              </div>

              {/* Clinical Summary & Risk */}
              <div className="flex flex-col gap-4">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Clinical Overview Summary</span>
                    <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-sans font-medium">
                      {report.synthesis.patientSummary}
                    </p>
                  </div>
                </div>
                
                {/* Risk Card */}
                <div className={`p-4 rounded-xl border ${riskStyles.border} ${riskStyles.bg} flex flex-col justify-between transition-colors`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Readmission Risk</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${riskStyles.badge}`}>
                        {report.risk.readmissionRisk} RISK
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                      {report.risk.analysis}
                    </p>
                  </div>
                  </div>
                </div>
              </div>

            {/* Critical Warnings (Full Width) */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-rose-500/20 dark:border-rose-500/20 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-200">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-rose-500 to-rose-600" />
                <div className="flex items-center gap-2.5 mb-5 pl-2">
                  <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-500 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Critical Clinical Warnings</h3>
                </div>

                <div className="flex-1 space-y-3.5 pl-2">
                  {report.synthesis.criticalAlerts.length > 0 ? (
                    report.synthesis.criticalAlerts.map((alert, i) => (
                      <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{alert}</p>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center py-8 text-center text-xs text-slate-550 italic">
                      No acute safety conflicts or interactions flagged.
                    </div>
                  )}
                </div>
            </div>

            {/* Overrides Validation (Pharmacist & Scheduling) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              
              {/* Medication Agent Panel */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-2xl relative transition-colors duration-200">
                <div className="flex items-center justify-between mb-3 pl-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Care Transition Action Plan</h3>
                  </div>
                </div>
                <p className="text-[11px] text-slate-550 dark:text-slate-400 mb-4 pl-2">Interact and tick items below to certify readiness verification.</p>

                <div className="flex-1 space-y-2.5 pl-2">
                  {report.synthesis.actionPlan.map((action, i) => {
                    const isChecked = !!checkedTasks[i];
                    return (
                      <div
                        key={i}
                        onClick={() => toggleTask(i)}
                        className={`flex gap-3.5 items-start p-3.5 rounded-xl border transition-all duration-200 select-none cursor-pointer ${
                          isChecked 
                            ? 'bg-slate-200/40 dark:bg-slate-950/20 border-emerald-500/20 text-slate-450 dark:text-slate-500' 
                            : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-350 dark:hover:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-950/80 shadow-sm'
                        }`}
                      >
                        <div className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${
                          isChecked 
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3.5] text-slate-950" />}
                        </div>
                        <span className={`text-xs leading-relaxed font-bold transition-all ${isChecked ? 'line-through opacity-60' : ''}`}>
                          {action}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Stacked Pharmacist and Scheduling */}
              <div className="flex flex-col gap-4">
                
                {/* Pharmacist Agent Panel */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-2xl transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-500 dark:text-sky-400">
                      <Pill className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Pharmacist Overrides</h4>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      report.medication.allergiesFlagged 
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20' 
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}>
                      Allergies: {report.medication.allergiesFlagged ? 'FLAGGED' : 'CLEARED'}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      report.medication.interactionsFound 
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20' 
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}>
                      Interactions: {report.medication.interactionsFound ? 'FLAGGED' : 'CLEARED'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mt-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Pharmacology Recommendations:</span>
                  <ul className="space-y-2.5">
                    {report.medication.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/40 flex items-start gap-3.5 transition-colors">
                        <ChevronRight className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Scheduling Panel */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-2xl transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-violet-500/10 rounded-lg text-violet-500 dark:text-violet-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Scheduling Overrides</h4>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/20">
                    TIMEFRAME: {report.scheduling.timeframe}
                  </span>
                </div>

                <div className="space-y-2 mt-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Follow-up Clinics Engaged:</span>
                  <div className="flex flex-wrap gap-2">
                    {report.scheduling.appointmentsNeeded.map((dept, idx) => (
                      <div key={idx} className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-sm transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />
                        {dept}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              </div>
            </div>

            {/* Row 2: SDoH Full Width */}
            <div>
              {/* SDoH Social Determinants Panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg relative transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Social Determinants</h4>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 animate-pulse">
                    SDoH ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-200 dark:border-slate-850">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Social Risk Factors & Barriers:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[...(report.sdoh?.socialRiskFactors || []), ...(report.sdoh?.barriersToCare || [])].map((factor, idx) => (
                        <div key={idx} className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
                          {factor}
                        </div>
                      ))}
                      {(!report.sdoh?.socialRiskFactors?.length && !report.sdoh?.barriersToCare?.length) && (
                        <span className="text-xs text-slate-500 italic">No social barriers or risks identified.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Social Work Interventions:</span>
                    <ul className="space-y-2.5">
                      {(report.sdoh?.recommendations || []).map((rec, idx) => (
                        <li key={idx} className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/40 flex items-start gap-3.5 transition-colors">
                          <ChevronRight className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                      {!report.sdoh?.recommendations?.length && (
                        <li className="text-xs font-bold text-slate-500 italic p-3.5">No custom social support recommendations.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          {/* Footer Diagnostic Metadata */}
            <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850/50 rounded-xl px-4 py-3.5 flex items-center justify-between text-xs text-slate-500 transition-colors duration-200">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                Handoff report audit certified & compliant.
              </span>
              {report.trajectory?.totalMs && (
                <span className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Consensus complete in {(report.trajectory.totalMs / 1000).toFixed(2)}s
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}