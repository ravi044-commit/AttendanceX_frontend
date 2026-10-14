import React, { useState, useEffect } from 'react';
import {
  X, Mail, Check, Edit2, AlertCircle, CheckCircle,
  Hash, Award, Building2, TrendingUp, Sparkles, User
} from 'lucide-react';
import { api } from '../utils/api';
import { cleanAvatarUrl } from '../utils/avatarUtils';

export const StudentPreviewModal = ({ student, onClose, onStudentUpdated }) => {
  const [currentStudent, setCurrentStudent] = useState(student);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(student?.email || '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  useEffect(() => {
    setCurrentStudent(student);
    setEmailInput(student?.email || '');
    setIsEditingEmail(false);
    setEmailError('');
    setEmailSuccess('');
  }, [student]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!currentStudent) return null;

  const rawPct = currentStudent.percentage ?? 0;
  const pct = Math.min(rawPct, 95);
  const isEligible = pct >= 75;
  const isDetained = currentStudent.status === 'Detained';

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (pct / 100) * circumference;

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setSavingEmail(true);
    try {
      // Update in backend via updateUserEmail and updateStudent
      await api.updateUserEmail(currentStudent.uid, trimmed);

      const updated = {
        ...currentStudent,
        email: trimmed
      };
      setCurrentStudent(updated);
      setIsEditingEmail(false);
      setEmailSuccess('Email updated successfully');
      setTimeout(() => setEmailSuccess(''), 3000);

      if (onStudentUpdated) {
        onStudentUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to update email:', err);
      setEmailError(err.message || 'Failed to update email address');
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-preview-title"
    >
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with decorative gradient */}
        <div className="relative bg-gradient-to-br from-indigo-950/60 via-purple-900/30 to-slate-900 p-6 border-b border-slate-800/80">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={cleanAvatarUrl(currentStudent.student_photo, currentStudent.name, null, false)}
                alt={currentStudent.name}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover ring-2 ring-indigo-500/30 bg-slate-800 shadow-md"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  isDetained ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`}
                title={isDetained ? 'Detained' : 'Active'}
              />
            </div>

            <div className="min-w-0 pr-6">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 inline-block mb-1">
                Student Profile
              </span>
              <h3 id="student-preview-title" className="text-base sm:text-lg font-black text-white leading-tight truncate">
                {currentStudent.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono text-slate-400">
                <span className="text-indigo-300 font-semibold">{currentStudent.uid}</span>
                {currentStudent.enrolment_number && (
                  <>
                    <span>•</span>
                    <span>{currentStudent.enrolment_number}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Attendance Overview Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="relative shrink-0">
              <svg width="86" height="86" className="-rotate-90">
                <circle cx="43" cy="43" r={radius} fill="none" stroke="#1e293b" strokeWidth="7" />
                <circle
                  cx="43" cy="43" r={radius}
                  fill="none"
                  stroke={isEligible ? '#10b981' : '#f59e0b'}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - strokeDash}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-base font-black ${isEligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {pct}%
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Overall</span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Attendance Summary</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isEligible
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}>
                  {isEligible ? '✓ Eligible' : '⚠ Below 75%'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>Theory Lectures:</span>
                  <span className="font-mono text-slate-200">
                    {currentStudent.lecture_present || 0} / {currentStudent.lecture_total || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Practical Labs:</span>
                  <span className="font-mono text-slate-200">
                    {currentStudent.lab_present || 0} / {currentStudent.lab_total || 0}
                  </span>
                </div>
                <div className="flex justify-between pt-0.5 border-t border-slate-700/50">
                  <span className="font-semibold text-slate-300">Total Attended:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {Math.min(currentStudent.total_classes_present || 0, currentStudent.total_classes_conducted || 0)} / {currentStudent.total_classes_conducted || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Email Address Section with Inline Editing */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Student Email Address</span>
              </div>

              {!isEditingEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingEmail(true);
                    setEmailInput(currentStudent.email || '');
                    setEmailError('');
                    setEmailSuccess('');
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Change Email</span>
                </button>
              )}
            </div>

            {isEditingEmail ? (
              <form onSubmit={handleSaveEmail} className="mt-2 space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter student email..."
                    className="w-full px-3 py-2 bg-slate-900 border border-indigo-500/50 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                    required
                  />
                </div>

                {emailError && (
                  <div className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{emailError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingEmail(false);
                      setEmailInput(currentStudent.email || '');
                      setEmailError('');
                    }}
                    disabled={savingEmail}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEmail}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {savingEmail ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="text-xs font-mono text-slate-200 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 break-all select-all">
                  {currentStudent.email || `${currentStudent.enrolment_number || currentStudent.uid}@attendancex.edu`}
                </div>
                {emailSuccess && (
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-in fade-in">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{emailSuccess}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Academic Metadata Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Department</span>
              <span className="text-xs font-semibold text-slate-200 mt-0.5 block truncate">
                {currentStudent.department || 'Computer Department'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Division & Semester</span>
              <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
                {currentStudent.division || 'Batch A'} · Sem {currentStudent.semester || 5}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Academic Standing</span>
              <span className={`text-xs font-bold mt-0.5 inline-flex items-center gap-1 ${
                isDetained ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDetained ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                {isDetained ? 'Detained' : 'Active'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Enrolment ID</span>
              <span className="text-xs font-mono font-semibold text-slate-200 mt-0.5 block truncate">
                {currentStudent.enrolment_number || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
