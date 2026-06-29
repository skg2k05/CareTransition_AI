'use client';

import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Calendar, 
  AlertTriangle, 
  HeartHandshake,
  Check, 
  X, 
  Plus, 
  Trash2, 
  History, 
  Sparkles, 
  UserCheck, 
  CheckCircle2, 
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MedicationResponse } from '@/lib/agents/medication';
import { SchedulingResponse } from '@/lib/agents/scheduling';
import { RiskResponse } from '@/lib/agents/risk';
import { SdohResponse } from '@/lib/agents/sdoh';

interface ClinicianReviewProps {
  originalMedication: MedicationResponse;
  originalScheduling: SchedulingResponse;
  originalRisk: RiskResponse;
  originalSdoh: SdohResponse;
  onContinue: (reviewedData: {
    medication: MedicationResponse;
    scheduling: SchedulingResponse;
    risk: RiskResponse;
    sdoh: SdohResponse;
    auditLog: string[];
  }) => void;
  onCancel: () => void;
  isSynthesizing: boolean;
}

export default function ClinicianReview({
  originalMedication,
  originalScheduling,
  originalRisk,
  originalSdoh,
  onContinue,
  onCancel,
  isSynthesizing
}: ClinicianReviewProps) {
  // Current values
  const [med, setMed] = useState<MedicationResponse>({ ...originalMedication });
  const [sched, setSched] = useState<SchedulingResponse>({ ...originalScheduling });
  const [risk, setRisk] = useState<RiskResponse>({ ...originalRisk });
  const [sdoh, setSdoh] = useState<SdohResponse>({ ...originalSdoh });

  // Approval Statuses
  const [medApproved, setMedApproved] = useState<boolean | null>(null);
  const [schedApproved, setSchedApproved] = useState<boolean | null>(null);
  const [riskApproved, setRiskApproved] = useState<boolean | null>(null);
  const [sdohApproved, setSdohApproved] = useState<boolean | null>(null);

  // New list item input states
  const [newRec, setNewRec] = useState('');
  const [newAppt, setNewAppt] = useState('');
  const [newSdohFactor, setNewSdohFactor] = useState('');
  const [newSdohBarrier, setNewSdohBarrier] = useState('');
  const [newSdohRec, setNewSdohRec] = useState('');

  // Calculate differences in real-time
  const auditDiffs = (() => {
    const diffs: string[] = [];

    // Medication changes
    if (med.interactionsFound !== originalMedication.interactionsFound) {
      diffs.push(`Medication - Interactions: changed from [${originalMedication.interactionsFound ? 'YES' : 'NO'}] to [${med.interactionsFound ? 'YES' : 'NO'}]`);
    }
    if (med.allergiesFlagged !== originalMedication.allergiesFlagged) {
      diffs.push(`Medication - Allergies: changed from [${originalMedication.allergiesFlagged ? 'YES' : 'NO'}] to [${med.allergiesFlagged ? 'YES' : 'NO'}]`);
    }
    
    // Check recommendations list changes
    const recsAdded = med.recommendations.filter(r => !originalMedication.recommendations.includes(r));
    const recsRemoved = originalMedication.recommendations.filter(r => !med.recommendations.includes(r));
    recsAdded.forEach(r => diffs.push(`Medication - Added Recommendation: "${r}"`));
    recsRemoved.forEach(r => diffs.push(`Medication - Removed Recommendation: "${r}"`));

    // Scheduling changes
    if (sched.timeframe !== originalScheduling.timeframe) {
      diffs.push(`Scheduling - Timeframe: changed from "${originalScheduling.timeframe}" to "${sched.timeframe}"`);
    }
    const apptsAdded = sched.appointmentsNeeded.filter(a => !originalScheduling.appointmentsNeeded.includes(a));
    const apptsRemoved = originalScheduling.appointmentsNeeded.filter(a => !sched.appointmentsNeeded.includes(a));
    apptsAdded.forEach(a => diffs.push(`Scheduling - Added Appointment: "${a}"`));
    apptsRemoved.forEach(a => diffs.push(`Scheduling - Removed Appointment: "${a}"`));

    // Risk changes
    if (risk.readmissionRisk !== originalRisk.readmissionRisk) {
      diffs.push(`Risk Assessor - Readmission Risk: changed from [${originalRisk.readmissionRisk}] to [${risk.readmissionRisk}]`);
    }
    if (risk.analysis !== originalRisk.analysis) {
      diffs.push('Risk Assessor - Clinical reasoning/analysis was customized by clinician.');
    }

    // SDoH changes
    const sdohFactorsAdded = sdoh.socialRiskFactors.filter(f => !originalSdoh.socialRiskFactors.includes(f));
    const sdohFactorsRemoved = originalSdoh.socialRiskFactors.filter(f => !sdoh.socialRiskFactors.includes(f));
    sdohFactorsAdded.forEach(f => diffs.push(`SDoH - Added Social Risk Factor: "${f}"`));
    sdohFactorsRemoved.forEach(f => diffs.push(`SDoH - Removed Social Risk Factor: "${f}"`));

    const sdohBarriersAdded = sdoh.barriersToCare.filter(b => !originalSdoh.barriersToCare.includes(b));
    const sdohBarriersRemoved = originalSdoh.barriersToCare.filter(b => !sdoh.barriersToCare.includes(b));
    sdohBarriersAdded.forEach(b => diffs.push(`SDoH - Added Barrier to Care: "${b}"`));
    sdohBarriersRemoved.forEach(b => diffs.push(`SDoH - Removed Barrier to Care: "${b}"`));

    const sdohRecsAdded = sdoh.recommendations.filter(r => !originalSdoh.recommendations.includes(r));
    const sdohRecsRemoved = originalSdoh.recommendations.filter(r => !sdoh.recommendations.includes(r));
    sdohRecsAdded.forEach(r => diffs.push(`SDoH - Added Social Work Recommendation: "${r}"`));
    sdohRecsRemoved.forEach(r => diffs.push(`SDoH - Removed Social Work Recommendation: "${r}"`));

    // Add status of approvals/rejections if set
    if (medApproved === true) diffs.push('Medication: Approved by clinician.');
    if (medApproved === false) diffs.push('Medication: Rejected/overridden by clinician.');
    if (schedApproved === true) diffs.push('Scheduling: Approved by clinician.');
    if (schedApproved === false) diffs.push('Scheduling: Rejected/overridden by clinician.');
    if (riskApproved === true) diffs.push('Risk Assessor: Approved by clinician.');
    if (riskApproved === false) diffs.push('Risk Assessor: Rejected/overridden by clinician.');
    if (sdohApproved === true) diffs.push('SDoH Agent: Approved by clinician.');
    if (sdohApproved === false) diffs.push('SDoH Agent: Rejected/overridden by clinician.');

    return diffs;
  })();

  // Medication handlers
  const handleAddRec = () => {
    if (newRec.trim()) {
      setMed(prev => ({
        ...prev,
        recommendations: [...prev.recommendations, newRec.trim()]
      }));
      setNewRec('');
    }
  };

  const handleRemoveRec = (index: number) => {
    setMed(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index)
    }));
  };

  const handleEditRec = (index: number, value: string) => {
    setMed(prev => {
      const updated = [...prev.recommendations];
      updated[index] = value;
      return { ...prev, recommendations: updated };
    });
  };

  // Scheduling handlers
  const handleAddAppt = () => {
    if (newAppt.trim()) {
      setSched(prev => ({
        ...prev,
        appointmentsNeeded: [...prev.appointmentsNeeded, newAppt.trim()]
      }));
      setNewAppt('');
    }
  };

  const handleRemoveAppt = (index: number) => {
    setSched(prev => ({
      ...prev,
      appointmentsNeeded: prev.appointmentsNeeded.filter((_, i) => i !== index)
    }));
  };

  const handleEditAppt = (index: number, value: string) => {
    setSched(prev => {
      const updated = [...prev.appointmentsNeeded];
      updated[index] = value;
      return { ...prev, appointmentsNeeded: updated };
    });
  };

  // SDoH handlers
  const handleAddSdohFactor = () => {
    if (newSdohFactor.trim()) {
      setSdoh(prev => ({
        ...prev,
        socialRiskFactors: [...prev.socialRiskFactors, newSdohFactor.trim()]
      }));
      setNewSdohFactor('');
    }
  };

  const handleRemoveSdohFactor = (index: number) => {
    setSdoh(prev => ({
      ...prev,
      socialRiskFactors: prev.socialRiskFactors.filter((_, i) => i !== index)
    }));
  };

  const handleEditSdohFactor = (index: number, value: string) => {
    setSdoh(prev => {
      const updated = [...prev.socialRiskFactors];
      updated[index] = value;
      return { ...prev, socialRiskFactors: updated };
    });
  };

  const handleAddSdohBarrier = () => {
    if (newSdohBarrier.trim()) {
      setSdoh(prev => ({
        ...prev,
        barriersToCare: [...prev.barriersToCare, newSdohBarrier.trim()]
      }));
      setNewSdohBarrier('');
    }
  };

  const handleRemoveSdohBarrier = (index: number) => {
    setSdoh(prev => ({
      ...prev,
      barriersToCare: prev.barriersToCare.filter((_, i) => i !== index)
    }));
  };

  const handleEditSdohBarrier = (index: number, value: string) => {
    setSdoh(prev => {
      const updated = [...prev.barriersToCare];
      updated[index] = value;
      return { ...prev, barriersToCare: updated };
    });
  };

  const handleAddSdohRec = () => {
    if (newSdohRec.trim()) {
      setSdoh(prev => ({
        ...prev,
        recommendations: [...prev.recommendations, newSdohRec.trim()]
      }));
      setNewSdohRec('');
    }
  };

  const handleRemoveSdohRec = (index: number) => {
    setSdoh(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index)
    }));
  };

  const handleEditSdohRec = (index: number, value: string) => {
    setSdoh(prev => {
      const updated = [...prev.recommendations];
      updated[index] = value;
      return { ...prev, recommendations: updated };
    });
  };

  const handleContinue = () => {
    onContinue({
      medication: med,
      scheduling: sched,
      risk: risk,
      sdoh: sdoh,
      auditLog: auditDiffs
    });
  };

  const isAllReviewed = medApproved !== null && schedApproved !== null && riskApproved !== null && sdohApproved !== null;

  return (
    <div id="clinician-review-root" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 dark:text-amber-400 border border-amber-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Clinician Review Checklist
              <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-mono border border-amber-500/20 uppercase tracking-wider">
                Pending Verification
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verify, edit, and approve each agent output before finalizing the synthesized care handoff.
            </p>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-250 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all"
        >
          Cancel Pipeline
        </button>
      </div>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* CARD 1: MEDICATION AGENT */}
        <div id="medication-review-card" className={`bg-slate-50 dark:bg-slate-950/80 p-5 rounded-xl border transition-all ${
          medApproved === true ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/5' :
          medApproved === false ? 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/5' :
          'border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Medication reconciliation</h3>
            </div>
            
            {/* Status indicators */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setMedApproved(true)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  medApproved === true 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Approve Medication Output"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMedApproved(false)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  medApproved === false 
                    ? 'bg-rose-500 text-slate-950' 
                    : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Override / Flag Output"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Boolean checkboxes */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={med.interactionsFound}
                  onChange={(e) => setMed(prev => ({ ...prev, interactionsFound: e.target.checked }))}
                  className="rounded text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Interactions Found</span>
              </label>

              <label className="flex items-center gap-2 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={med.allergiesFlagged}
                  onChange={(e) => setMed(prev => ({ ...prev, allergiesFlagged: e.target.checked }))}
                  className="rounded text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Allergies Flagged</span>
              </label>
            </div>

            {/* Recommendations List */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Pharmacology Recommendations</span>
              
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {med.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/60 p-1.5 rounded-lg">
                    <Edit3 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                    <input
                      type="text"
                      value={rec}
                      onChange={(e) => handleEditRec(idx, e.target.value)}
                      className="w-full bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:text-slate-900 dark:focus:text-white"
                    />
                    <button
                      onClick={() => handleRemoveRec(idx)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {med.recommendations.length === 0 && (
                  <div className="text-center py-4 text-slate-500 italic text-[11px]">
                    No recommendations listed.
                  </div>
                )}
              </div>

              {/* Add item input */}
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Add prescription override..."
                  value={newRec}
                  onChange={(e) => setNewRec(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRec()}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 px-2 py-1 rounded text-slate-750 dark:text-slate-300 focus:outline-none focus:border-slate-400 dark:focus:border-slate-700"
                />
                <button
                  onClick={handleAddRec}
                  className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 px-2 rounded text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: SCHEDULING AGENT */}
        <div id="scheduling-review-card" className={`bg-slate-50 dark:bg-slate-950/80 p-5 rounded-xl border transition-all ${
          schedApproved === true ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/5' :
          schedApproved === false ? 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/5' :
          'border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Follow-up Scheduling</h3>
            </div>
            
            {/* Status indicators */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setSchedApproved(true)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  schedApproved === true 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Approve Scheduling Output"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSchedApproved(false)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  schedApproved === false 
                    ? 'bg-rose-500 text-slate-950' 
                    : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Override / Flag Output"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Timeframe selector */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">General Timeframe</span>
              <input
                type="text"
                value={sched.timeframe}
                onChange={(e) => setSched(prev => ({ ...prev, timeframe: e.target.value }))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-700"
              />
            </div>

            {/* Appointments List */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Required Appointments</span>
              
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {sched.appointmentsNeeded.map((appt, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/60 p-1.5 rounded-lg">
                    <Edit3 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                    <input
                      type="text"
                      value={appt}
                      onChange={(e) => handleEditAppt(idx, e.target.value)}
                      className="w-full bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:text-slate-900 dark:focus:text-white"
                    />
                    <button
                      onClick={() => handleRemoveAppt(idx)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {sched.appointmentsNeeded.length === 0 && (
                  <div className="text-center py-4 text-slate-500 italic text-[11px]">
                    No appointments listed.
                  </div>
                )}
              </div>

              {/* Add item input */}
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Add specialist referral..."
                  value={newAppt}
                  onChange={(e) => setNewAppt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAppt()}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 px-2 py-1 rounded text-slate-750 dark:text-slate-300 focus:outline-none focus:border-slate-400 dark:focus:border-slate-700"
                />
                <button
                  onClick={handleAddAppt}
                  className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 px-2 rounded text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: RISK ASSESSOR AGENT */}
        <div id="risk-review-card" className={`bg-slate-50 dark:bg-slate-950/80 p-5 rounded-xl border transition-all ${
          riskApproved === true ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/5' :
          riskApproved === false ? 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/5' :
          'border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Readmission Risk Assessor</h3>
            </div>
            
            {/* Status indicators */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setRiskApproved(true)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  riskApproved === true 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Approve Risk Output"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setRiskApproved(false)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  riskApproved === false 
                    ? 'bg-rose-500 text-slate-950' 
                    : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Override / Flag Output"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Risk Dropdown */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Readmission Probability</span>
              <select
                value={risk.readmissionRisk}
                onChange={(e) => setRisk(prev => ({ ...prev, readmissionRisk: e.target.value as "LOW" | "MEDIUM" | "HIGH" }))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-750 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-700"
              >
                <option value="LOW">LOW RISK</option>
                <option value="MEDIUM">MEDIUM RISK</option>
                <option value="HIGH">HIGH RISK</option>
              </select>
            </div>

            {/* Risk Reasoning analysis text */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Clinical Assessment Reasoning</span>
              <textarea
                value={risk.analysis}
                onChange={(e) => setRisk(prev => ({ ...prev, analysis: e.target.value }))}
                rows={5}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 font-sans text-xs"
                placeholder="Reasoning justification..."
              />
            </div>
          </div>
        </div>

        {/* CARD 4: SDoH SOCIAL AGENT */}
        <div id="sdoh-review-card" className={`bg-slate-50 dark:bg-slate-950/80 p-5 rounded-xl border transition-all ${
          sdohApproved === true ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/5' :
          sdohApproved === false ? 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/5' :
          'border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-500 dark:text-emerald-400 animate-pulse" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">SDoH Social Determinants</h3>
            </div>
            
            {/* Status indicators */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setSdohApproved(true)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  sdohApproved === true 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Approve SDoH Output"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSdohApproved(false)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  sdohApproved === false 
                    ? 'bg-rose-500 text-slate-950' 
                    : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Override / Flag Output"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Social Risk Factors */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Social Risk Factors</span>
              <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                {sdoh.socialRiskFactors.map((factor, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center bg-slate-900/30 border border-slate-800/60 p-1.5 rounded-lg">
                    <Edit3 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <input
                      type="text"
                      value={factor}
                      onChange={(e) => handleEditSdohFactor(idx, e.target.value)}
                      className="w-full bg-transparent text-slate-300 focus:outline-none focus:text-white"
                    />
                    <button
                      onClick={() => handleRemoveSdohFactor(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {sdoh.socialRiskFactors.length === 0 && (
                  <div className="text-[10px] text-slate-500 italic">No social risk factors listed.</div>
                )}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Add factor (e.g., lives alone)..."
                  value={newSdohFactor}
                  onChange={(e) => setNewSdohFactor(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSdohFactor()}
                  className="w-full bg-slate-900 border border-slate-850 px-2 py-1 rounded text-slate-300 focus:outline-none focus:border-slate-700 text-[11px]"
                />
                <button
                  onClick={handleAddSdohFactor}
                  className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2 rounded text-slate-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Barriers to Care */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Barriers to Care</span>
              <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                {sdoh.barriersToCare.map((barrier, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center bg-slate-900/30 border border-slate-800/60 p-1.5 rounded-lg">
                    <Edit3 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <input
                      type="text"
                      value={barrier}
                      onChange={(e) => handleEditSdohBarrier(idx, e.target.value)}
                      className="w-full bg-transparent text-slate-300 focus:outline-none focus:text-white"
                    />
                    <button
                      onClick={() => handleRemoveSdohBarrier(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {sdoh.barriersToCare.length === 0 && (
                  <div className="text-[10px] text-slate-500 italic">No barriers to care listed.</div>
                )}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Add barrier (e.g., no transit)..."
                  value={newSdohBarrier}
                  onChange={(e) => setNewSdohBarrier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSdohBarrier()}
                  className="w-full bg-slate-900 border border-slate-850 px-2 py-1 rounded text-slate-300 focus:outline-none focus:border-slate-700 text-[11px]"
                />
                <button
                  onClick={handleAddSdohBarrier}
                  className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2 rounded text-slate-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Social Work Recommendations</span>
              <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                {sdoh.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center bg-slate-900/30 border border-slate-800/60 p-1.5 rounded-lg">
                    <Edit3 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <input
                      type="text"
                      value={rec}
                      onChange={(e) => handleEditSdohRec(idx, e.target.value)}
                      className="w-full bg-transparent text-slate-300 focus:outline-none focus:text-white"
                    />
                    <button
                      onClick={() => handleRemoveSdohRec(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {sdoh.recommendations.length === 0 && (
                  <div className="text-[10px] text-slate-500 italic">No recommendations listed.</div>
                )}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Add social support recommendation..."
                  value={newSdohRec}
                  onChange={(e) => setNewSdohRec(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSdohRec()}
                  className="w-full bg-slate-900 border border-slate-850 px-2 py-1 rounded text-slate-300 focus:outline-none focus:border-slate-700 text-[11px]"
                />
                <button
                  onClick={handleAddSdohRec}
                  className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2 rounded text-slate-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Audit Trail Panel showing Real-Time Clinician vs. AI Original */}
      <div id="clinician-review-audit-trail" className="bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <History className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider">Clinician override audit log ({auditDiffs.length})</span>
        </div>

        <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-2 font-mono text-[10px] text-slate-600 dark:text-slate-400 divide-y divide-slate-200 dark:divide-slate-900">
          {auditDiffs.map((diff, i) => (
            <div key={i} className="pt-1.5 text-amber-600 dark:text-amber-400/90 flex items-start gap-1">
              <span className="text-slate-400 dark:text-slate-600 shrink-0">▸</span>
              <span>{diff}</span>
            </div>
          ))}

          {auditDiffs.length === 0 && (
            <div className="text-slate-400 dark:text-slate-500 italic py-2">
              No modifications detected. Clinical outputs match original AI-generated models.
            </div>
          )}
        </div>
      </div>

      {/* Footer controls: Submit & Continue */}
      <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 gap-4">
        <div className="text-xs text-slate-550 dark:text-slate-400 flex items-center gap-2">
          {isAllReviewed ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> All cards reviewed and verified.
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
              Please review (approve or flag) all 4 cards before continuing.
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSynthesizing}
            className="px-5 py-2.5 bg-slate-950 border border-slate-850 text-slate-300 hover:bg-slate-900 rounded-xl font-bold text-xs transition-colors uppercase tracking-wider"
          >
            Cancel Run
          </button>
          
          <button
            onClick={handleContinue}
            disabled={!isAllReviewed || isSynthesizing}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all select-none uppercase tracking-wider cursor-pointer ${
              !isAllReviewed || isSynthesizing
                ? 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/15'
            }`}
          >
            {isSynthesizing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                <span>Synthesizing Report...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Approve & Continue</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
