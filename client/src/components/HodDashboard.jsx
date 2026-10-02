import React, { useState, useEffect } from 'react';
import {
  Crown, Users, BookOpen, AlertTriangle, CheckCircle,
  TrendingUp, Download, RefreshCw, Sparkles, Building,
  PieChart, Search, ShieldCheck, Lock, Unlock, Calendar,
  ShieldAlert, CheckCircle2, ArrowRight, Clock,
  Eye, X, FileSpreadsheet, Printer, XCircle
} from 'lucide-react';
import { api } from '../utils/api';
import { getStudentClass, matchesClassFilter } from '../utils/classUtils';
import { cleanAvatarUrl } from '../utils/avatarUtils';

export const HodDashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'locks', 'students', 'faculties', 'defaulters'

  // Daily Freeze & Final Button State (Strictly System-Managed Date)
  const getTodayDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const [selectedDate] = useState(getTodayDate);
  const [lockStatus, setLockStatus] = useState(null);
  const [loadingLock, setLoadingLock] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [allLocks, setAllLocks] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // View Sealed/Active Session Attendance Roster Modal State
  const [viewingSession, setViewingSession] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [loadingSessionRecords, setLoadingSessionRecords] = useState(false);
  const [sessionFilterStatus, setSessionFilterStatus] = useState('All'); // 'All', 'Present', 'Absent'
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');

  const notify = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
  };

  const loadLockStatus = async (date) => {
    setLoadingLock(true);
    try {
      const res = await api.getAttendanceLockStatus(date, 'Computer Department');
      setLockStatus(res);
    } catch (err) {
      console.error('Failed to load lock status:', err);
    } finally {
      setLoadingLock(false);
    }
  };

  const loadAllLocks = async () => {
    try {
      const locks = await api.getAllAttendanceLocks('Computer Department');
      setAllLocks(locks || []);
    } catch (err) {
      console.error('Failed to load all locks:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const stats = await api.getDepartmentStats('Computer Department');
      setData(stats);
      await loadLockStatus(selectedDate);
      await loadAllLocks();
    } catch (err) {
      console.error('Failed to load HOD stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFreezeAttendance = async () => {
    setFreezing(true);
    try {
      const hodName = user?.name || 'HOD C.G.Ajudiya';
      const res = await api.freezeAttendance({
        date: selectedDate,
        department: 'Computer Department',
        finalized_by: hodName
      });
      notify(res.message || `Attendance for ${selectedDate} finalized and frozen successfully! Next morning session ready.`, 'success');
      setShowConfirmModal(false);
      await loadLockStatus(selectedDate);
      await loadAllLocks();
    } catch (err) {
      notify(err.message || 'Failed to finalize attendance', 'error');
    } finally {
      setFreezing(false);
    }
  };

  const [sessionBatchFilter, setSessionBatchFilter] = useState('All'); // 'All', 'Batch A', 'Batch B'

  const handleToggleStudentStatus = async (item) => {
    if (viewingSession?.is_frozen) {
      notify(`Attendance for ${viewingSession.date} is finalized & frozen by HOD. Edits are locked.`, 'error');
      return;
    }

    const newStatus = item.status === 'Present' ? 'Absent' : 'Present';
    try {
      const res = await api.updateSingleAttendanceRecord({
        record_id: item.id,
        student_uid: item.student_uid,
        date: item.date,
        subject_name: item.subject_name,
        session_type: item.session_type,
        status: newStatus,
        marked_by: user?.name || 'Faculty Member'
      });

      notify(res.message || `Updated ${item.student_name}'s status to ${newStatus}`);

      // Update local state
      setSessionRecords(prev => prev.map(r => r.id === item.id ? { ...r, status: newStatus, marked_by: user?.name || r.marked_by } : r));

      // Refresh background stats
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to update attendance status', 'error');
    }
  };

  const handleOpenSessionRoster = async (lock) => {
    setViewingSession(lock);
    setLoadingSessionRecords(true);
    setSessionFilterStatus('All');
    setSessionBatchFilter('All');
    setSessionSearchQuery('');
    try {
      const records = await api.getAttendanceRecords({ date: lock.date, department: 'Computer Department' });
      setSessionRecords(records || []);
    } catch (err) {
      console.error('Failed to load session attendance records:', err);
      notify('Failed to load session attendance records', 'error');
    } finally {
      setLoadingSessionRecords(false);
    }
  };

  const exportSessionCsv = () => {
    if (!sessionRecords || sessionRecords.length === 0) return;
    const headers = ['Enrolment Number', 'Student Name', 'UID', 'Class', 'Subject', 'Type', 'Status', 'Faculty In-Charge', 'Marked By Method', 'Date'];
    const rows = sessionRecords.map(r => {
      const batchStr = getStudentClass(r.enrolment_number, r.student_uid);

      return [
        `"${r.enrolment_number || ''}"`,
        `"${r.student_name || ''}"`,
        `"${r.student_uid || ''}"`,
        `"${batchStr}"`,
        `"${r.subject_name || ''}"`,
        `"${r.session_type || ''}"`,
        `"${r.status || ''}"`,
        `"${r.faculty_in_charge || 'C.G.Ajudiya'}"`,
        `"${r.marked_by || ''}"`,
        `"${r.date || ''}"`
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${viewingSession?.date || 'Session'}_Official.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { stats, faculties = [], classes = [], lowAttendanceStudents = [], allStudents = [] } = data || {
    stats: {
      totalStudents: 8,
      totalFaculty: 2,
      totalClasses: 5,
      avgAttendancePercentage: 86.4,
      lowAttendanceCount: 1,
      criticalAttendanceCount: 0
    },
    faculties: [],
    classes: [],
    lowAttendanceStudents: [],
    allStudents: []
  };

  const filteredStudents = allStudents.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.enrolment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <Crown className="w-3.5 h-3.5" />
              <span>HOD Executive Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Computer Department Analytics
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl">
              Welcome <strong className="text-purple-300">{user?.name || 'C.G.Ajudiya'}</strong> (Head of Department). Review academic attendance health, faculty sessions, and low-attendance alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Refresh Department Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* DEPARTMENT STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Dept Attendance Avg</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-300 mt-3">
            {stats.avgAttendancePercentage}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Computer Department Index</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Total Enrolled</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {stats.totalStudents}
          </div>
          <div className="text-xs text-slate-400 mt-1">Semester 5 Batch</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Active Faculty</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {stats.totalFaculty}
          </div>
          <div className="text-xs text-slate-400 mt-1">Lectures & Labs Assigned</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-amber-400">
            <span>Attendance Defaulters</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-3">
            {stats.lowAttendanceCount}
          </div>
          <div className="text-xs text-amber-400/80 mt-1">&lt; 75% attendance threshold</div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {notification.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* FREEZE CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full glass-panel p-6 sm:p-7 rounded-3xl border border-purple-500/40 bg-slate-900 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-purple-400">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Finalize & Freeze Attendance?</h3>
                <p className="text-xs text-purple-300 font-mono">Date: {selectedDate}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <ShieldAlert className="w-4 h-4" />
                <span>PERMANENT & IRREVERSIBLE ACTION</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-300">
                • Once finalized, attendance for <strong className="text-white font-mono">{selectedDate}</strong> is permanently locked in the database.
              </p>
              <p className="leading-relaxed text-[11px] text-slate-300">
                • <strong className="text-white">Neither Faculty nor Administrators</strong> can alter, delete, or create any new sessions for this date.
              </p>
              <p className="leading-relaxed text-[11px] text-slate-300">
                • Exactly <strong>1 valid session</strong> is preserved for this date.
              </p>
              <p className="leading-relaxed text-[11px] text-emerald-300">
                • The next session will be <strong>automatically initialized for tomorrow morning ({lockStatus?.next_session_date || 'Next Morning'})</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={freezing}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleFreezeAttendance}
                disabled={freezing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {freezing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Freezing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Yes, Finalize & Freeze</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL SESSION ATTENDANCE ROSTER MODAL (HOD VIEW FOR SEALED & ACTIVE DATES) */}
      {viewingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="max-w-5xl w-full max-h-[92vh] flex flex-col glass-panel rounded-3xl border border-purple-500/40 bg-slate-900 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-purple-500/20 bg-gradient-to-r from-slate-950 via-purple-950/30 to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`p-3 rounded-2xl border ${viewingSession.is_frozen ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'}`}>
                  {viewingSession.is_frozen ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Official Session Attendance Roster
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      viewingSession.is_frozen
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {viewingSession.is_frozen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{viewingSession.is_frozen ? 'Sealed & Immutable' : 'Open / Active Session'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span>Session Date: <strong className="text-purple-300 font-mono text-sm">{viewingSession.date}</strong></span>
                    <span>•</span>
                    <span>HOD Final Sign: <strong className="text-white">{viewingSession.finalized_by || 'HOD C.G.Ajudiya'}</strong></span>
                    {viewingSession.finalized_at && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-400">Finalized: {new Date(viewingSession.finalized_at).toLocaleString()}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportSessionCsv}
                  disabled={sessionRecords.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  title="Download Official CSV Attendance Sheet"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                  title="Print Official Attendance Roster"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewingSession(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
                  title="Close Roster"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar on this Session */}
            {(() => {
              const total = sessionRecords.length;
              const presentCount = sessionRecords.filter(r => r.status === 'Present').length;
              const absentCount = total - presentCount;
              const pct = total > 0 ? Number(((presentCount / total) * 100).toFixed(1)) : 0;
              const sessionType = sessionRecords[0]?.session_type || 'Lecture';
              const markedBy = sessionRecords[0]?.marked_by || 'RFID + Face System';
              const facultyInCharge = sessionRecords[0]?.faculty_in_charge || 'C.G.Ajudiya';

              return (
                <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Students</span>
                      <span className="text-xl font-black text-white">{total}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 block">Present</span>
                      <span className="text-xl font-black text-emerald-300">{presentCount} <span className="text-xs font-semibold text-emerald-400/80">({pct}%)</span></span>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30">
                      <span className="text-[10px] font-bold uppercase text-rose-400 block">Absent</span>
                      <span className="text-xl font-black text-rose-300">{absentCount} <span className="text-xs font-semibold text-rose-400/80">({(100 - pct).toFixed(1)}%)</span></span>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30">
                      <span className="text-[10px] font-bold uppercase text-purple-300 block">Session Mode & Faculty</span>
                      <span className="text-xs font-bold text-white truncate block mt-1">
                        {sessionType} • {markedBy}
                      </span>
                      <span className="text-[10px] text-purple-300 font-semibold block">
                        Faculty: {facultyInCharge}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter Tabs */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
                  {['All', 'Present', 'Absent'].map((st) => {
                    const count = st === 'All'
                      ? sessionRecords.length
                      : sessionRecords.filter(r => r.status === st).length;
                    return (
                      <button
                        key={st}
                        onClick={() => setSessionFilterStatus(st)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          sessionFilterStatus === st
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{st}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800/80 text-slate-300 font-mono">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Class Filter Tabs (Enrollment 1-63 = Class A, 64+ = Class B) */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
                  {[
                    { id: 'All', label: 'All Classes' },
                    { id: 'Class A', label: 'Class A (1-63)' },
                    { id: 'Class B', label: 'Class B (64+)' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSessionBatchFilter(b.id)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        sessionBatchFilter === b.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={sessionSearchQuery}
                  onChange={(e) => setSessionSearchQuery(e.target.value)}
                  placeholder="Search student by name, enroll, UID..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Students Attendance Table Body */}
            <div className="overflow-y-auto flex-1 p-2 sm:p-4">
              {loadingSessionRecords ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-7 h-7 text-purple-400 animate-spin" />
                  <span className="text-xs text-slate-400 font-semibold">Loading official student attendance sheet...</span>
                </div>
              ) : (() => {
                const filtered = sessionRecords.filter((r) => {
                  const matchesStatus = sessionFilterStatus === 'All' || r.status === sessionFilterStatus;
                  const rClass = getStudentClass(r.enrolment_number, r.student_uid);
                  const matchesBatch = matchesClassFilter(rClass, sessionBatchFilter);

                  const q = sessionSearchQuery.toLowerCase();
                  const matchesSearch =
                    (r.student_name || '').toLowerCase().includes(q) ||
                    (r.enrolment_number || '').toLowerCase().includes(q) ||
                    (r.student_uid || '').toLowerCase().includes(q);
                  return matchesStatus && matchesBatch && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 text-center text-slate-500 text-xs">
                      No student records found matching the current filters.
                    </div>
                  );
                }

                return (
                  <table className="w-full min-w-[750px] text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800 sticky top-0 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">#</th>
                        <th className="px-4 py-3 min-w-[200px]">Student Name</th>
                        <th className="px-4 py-3 whitespace-nowrap">Enrolment & UID</th>
                        <th className="px-4 py-3 whitespace-nowrap">Subject & Session</th>
                        <th className="px-4 py-3 whitespace-nowrap">Faculty In-Charge</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filtered.map((item, idx) => {
                        const isPresent = item.status === 'Present';
                        const avatar = cleanAvatarUrl(item.student_photo, item.student_name || 'Student', null, false);
                        const studentClass = getStudentClass(item.enrolment_number, item.student_uid);
                        const facultyName = item.faculty_in_charge || 'C.G.Ajudiya';

                        return (
                          <tr key={item.id || idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 text-center text-xs text-slate-500 font-mono">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <img
                                  src={avatar}
                                  alt={item.student_name}
                                  className="w-8 h-8 rounded-full object-cover bg-slate-800 ring-1 ring-purple-500/30 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-white text-xs leading-tight whitespace-nowrap">{item.student_name}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">Semester 5</span>
                                    <span className="text-slate-600">•</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded whitespace-nowrap ${
                                      studentClass === 'Class A' || studentClass === 'Batch A'
                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    }`}>
                                      {studentClass}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-indigo-300">
                              <div>{item.enrolment_number}</div>
                              <div className="text-[10px] text-slate-500">{item.student_uid}</div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-300">
                              <div className="font-semibold text-white truncate max-w-xs">{item.subject_name}</div>
                              <span className={`inline-block px-2 py-0.2 rounded text-[10px] font-bold uppercase mt-0.5 ${
                                item.session_type === 'Lab'
                                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {item.session_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <div className="font-bold text-purple-300">{facultyName}</div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <span className="text-slate-500">Mode:</span>
                                <span>{item.marked_by}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleToggleStudentStatus(item)}
                                disabled={viewingSession?.is_frozen}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                  isPresent
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40'
                                }`}
                                title={viewingSession?.is_frozen ? 'Session finalized and locked by HOD' : `Click to toggle status to ${isPresent ? 'Absent' : 'Present'}`}
                              >
                                {isPresent ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                )}
                                <span>{item.status}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  Official SQLite Attendance Ledger: Immutable session record signed by <strong className="text-purple-300">{viewingSession.finalized_by || 'HOD C.G.Ajudiya'}</strong>.
                </span>
              </div>
              <button
                onClick={() => setViewingSession(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-fit flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Department Overview
        </button>
        <button
          onClick={() => setActiveTab('locks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'locks' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-purple-400" />
          <span>Daily Locks & Next Sessions</span>
          <span className="px-1.5 py-0.2 bg-purple-950 border border-purple-500/40 rounded-full text-[10px]">
            {allLocks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'students' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Students ({allStudents.length})
        </button>
        <button
          onClick={() => setActiveTab('faculties')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'faculties' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Faculty & Courses ({faculties.length})
        </button>
        <button
          onClick={() => setActiveTab('defaulters')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'defaulters' ? 'bg-amber-600 text-white shadow-md' : 'text-amber-400 hover:text-amber-300'
          }`}
        >
          <span>Low Attendance Alerts</span>
          <span className="px-1.5 py-0.2 bg-amber-950 border border-amber-500/40 rounded-full text-[10px]">
            {lowAttendanceStudents.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW & FINAL BUTTON PANEL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* =========================================================================
              EXECUTIVE DAILY ATTENDANCE FINALIZATION & FREEZE PANEL (HOD EXCLUSIVE)
              ========================================================================= */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border-2 border-purple-500/40 p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-purple-500/20">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Executive Attendance Finalization Authority</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Daily Attendance Freeze & 1-Session Lockdown
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                  When you hit the <strong>Final</strong> button, attendance for the selected date is permanently frozen in SQLite. Neither faculty nor admin can modify records or create new sessions. The next session will automatically be scheduled for tomorrow morning.
                </p>
              </div>

              {/* Strict Active Date (Read-Only to prevent breaking attendance sequence) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Strict Active Session Date
                  </span>
                  <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-purple-500/30">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-white text-xs font-mono font-black tracking-wider">
                      {selectedDate}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      System Managed
                    </span>
                  </div>
                </div>

                <div className="sm:border-l sm:border-slate-800 sm:pl-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Lock State
                  </span>
                  {loadingLock ? (
                    <span className="text-xs text-slate-400 animate-pulse">Checking status...</span>
                  ) : lockStatus?.is_frozen ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black">
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span>FROZEN & FINALIZED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>OPEN / EDITABLE</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Session Stats on this Date & Action Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-6">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Records on Date</span>
                <div className="text-2xl font-black text-white mt-1">
                  {lockStatus?.summary?.total_records || 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Students logged</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase">Present</span>
                <div className="text-2xl font-black text-emerald-300 mt-1">
                  {lockStatus?.summary?.present_count || 0}
                </div>
                <div className="text-[10px] text-emerald-400/70 mt-0.5">Marked present</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] font-semibold text-rose-400 uppercase">Absent</span>
                <div className="text-2xl font-black text-rose-300 mt-1">
                  {lockStatus?.summary?.absent_count || 0}
                </div>
                <div className="text-[10px] text-rose-400/70 mt-0.5">Marked absent</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/30 bg-purple-950/20">
                <span className="text-[11px] font-semibold text-purple-300 uppercase">Next Morning Session</span>
                <div className="text-sm font-black text-purple-200 mt-1 font-mono">
                  {lockStatus?.next_session_date || 'Auto-Scheduled'}
                </div>
                <div className="text-[10px] text-purple-300/80 mt-0.5">09:00 AM Active Roster</div>
              </div>
            </div>

            {/* ACTION FOOTER: THE FINAL BUTTON OR FROZEN AUDIT BADGE */}
            <div className="pt-4 border-t border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                {lockStatus?.is_frozen ? (
                  <span>
                    Locked & Signed by <strong className="text-purple-300">{lockStatus.finalized_by || 'HOD C.G.Ajudiya'}</strong> at{' '}
                    <span className="font-mono text-slate-300">
                      {lockStatus.finalized_at ? new Date(lockStatus.finalized_at).toLocaleString() : 'Recent'}
                    </span>
                  </span>
                ) : (
                  <span>
                    Currently <strong>1 Session is active</strong> for this date. Click <strong className="text-purple-300">Final</strong> to lock it permanently.
                  </span>
                )}
              </div>

              {lockStatus?.is_frozen ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-5 py-3 rounded-2xl bg-purple-950/80 border-2 border-purple-500/50 text-purple-200 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-purple-950/50">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>🔒 Attendance Frozen & Finalized (Immutable)</span>
                  </div>
                  <button
                    onClick={() => handleOpenSessionRoster({ date: selectedDate, is_frozen: 1, finalized_by: lockStatus.finalized_by, finalized_at: lockStatus.finalized_at, next_session_date: lockStatus.next_session_date })}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Attendance ({lockStatus?.summary?.total_records || 'All Students'})</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {(lockStatus?.summary?.total_records || 0) > 0 && (
                    <button
                      onClick={() => handleOpenSessionRoster({ date: selectedDate, is_frozen: 0, finalized_by: null, finalized_at: null, next_session_date: lockStatus.next_session_date })}
                      className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 shadow-md transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span>View Current Session ({lockStatus?.summary?.total_records})</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/30 flex items-center gap-3 transform hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>FINAL / FREEZE ATTENDANCE FOR {selectedDate}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Defaulter Alert Box */}
          {lowAttendanceStudents.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-amber-950/20">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-amber-200">
                  Critical Attendance Attention Needed
                </h3>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                The following students in the Computer Department currently have an attendance score below the mandatory 75% threshold:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {lowAttendanceStudents.map((s) => (
                  <div
                    key={s.uid}
                    className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 flex items-center gap-3"
                  >
                    <img
                      src={cleanAvatarUrl(s.student_photo, s.name, null, false)}
                      alt={s.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-bold text-white text-xs">{s.name}</div>
                      <div className="text-[11px] text-amber-400 font-mono font-semibold">
                        {s.percentage}% Attendance
                      </div>
                      <div className="text-[10px] text-slate-400">EN: {s.enrolment_number}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department Curriculum & Classes */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              Active Department Courses & Labs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-400">{c.subject_code}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.type === 'Lab' ? 'bg-violet-500/20 text-violet-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {c.type}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1">{c.subject_name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Faculty: {c.faculty_name}</div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div className="font-semibold text-slate-300">{c.room}</div>
                    <div>{c.time_slot}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DAILY ATTENDANCE LOCKS LEDGER */}
      {activeTab === 'locks' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Daily Attendance Locks & Next Session Ledger</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Official SQLite audit ledger: Once frozen by HOD, attendance for that date is permanently immutable for all roles (Faculty & Admin).
              </p>
            </div>
            <button
              onClick={loadAllLocks}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all w-fit"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Ledger</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Session Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">HOD Signature</th>
                  <th className="px-6 py-3.5">Finalized Timestamp</th>
                  <th className="px-6 py-3.5">Auto-Created Next Session</th>
                  <th className="px-6 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allLocks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">
                      No locked sessions recorded yet. Use the "Final / Freeze" button on the Overview tab to freeze today's attendance.
                    </td>
                  </tr>
                ) : (
                  allLocks.map((lk) => (
                    <tr key={lk.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-purple-400" />
                          <span>{lk.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lk.is_frozen ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-bold">
                            <Lock className="w-3 h-3 text-purple-400" />
                            <span>FINALIZED & FROZEN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                            <Unlock className="w-3 h-3 text-emerald-400" />
                            <span>OPEN / ACTIVE</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-200">
                        {lk.finalized_by ? (
                          <span className="text-purple-300">{lk.finalized_by}</span>
                        ) : (
                          <span className="text-slate-500 italic">Pending HOD Final</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {lk.finalized_at ? new Date(lk.finalized_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-purple-300 font-semibold">
                        {lk.next_session_date ? (
                          <div className="flex items-center gap-1.5">
                            <span>{lk.next_session_date}</span>
                            <span className="text-[10px] text-slate-500">(09:00 AM)</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {lk.is_frozen ? (
                          <button
                            onClick={() => handleOpenSessionRoster(lk)}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md shadow-purple-950/40 cursor-pointer group"
                            title="Click to view all student attendance records for this sealed session"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-400 group-hover:text-white transition-colors" />
                            <span>View Attendance</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-purple-500/30 text-[10px] text-purple-300 font-mono flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Sealed</span>
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSessionRoster(lk)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md shadow-emerald-950/40 cursor-pointer group"
                            title="Click to view attendance records for this session"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white transition-colors" />
                            <span>View Attendance</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/30 text-[10px] text-emerald-300 font-mono flex items-center gap-0.5">
                              <Unlock className="w-2.5 h-2.5" />
                              <span>Active</span>
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: ALL STUDENTS TABLE */}
      {activeTab === 'students' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Student Enrollment & Attendance Table</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 min-w-[200px]">Student</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">UID & Enrolment</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Lectures</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Labs</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Overall %</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((s) => (
                  <tr key={s.uid} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <img
                          src={cleanAvatarUrl(s.student_photo, s.name, null, false)}
                          alt={s.name}
                          className="w-9 h-9 rounded-full object-cover bg-slate-800 shrink-0"
                        />
                        <span className="font-semibold text-white whitespace-nowrap">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-300">
                      <div>{s.uid}</div>
                      <div className="text-slate-400 text-[11px]">{s.enrolment_number}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {s.lecture_present} / {s.lecture_total}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {s.lab_present} / {s.lab_total}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${s.percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {s.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: FACULTIES */}
      {activeTab === 'faculties' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faculties.map((f) => (
            <div
              key={f.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-start gap-4"
            >
              <img
                src={cleanAvatarUrl(f.avatar, f.name, null, true)}
                alt={f.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500/40"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-base">{f.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Faculty Member
                  </span>
                </div>
                <div className="text-xs text-purple-400 font-mono mt-0.5">{f.email}</div>
                <div className="text-xs text-slate-400 mt-1">{f.phone || '+91 98765 00000'}</div>
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>Department: Computer Dept</span>
                  <span className="text-emerald-400 font-semibold">Active Session Access</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT 4: DEFAULTERS */}
      {activeTab === 'defaulters' && (
        <div className="glass-panel rounded-2xl border border-amber-500/30 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 bg-amber-950/20">
            <h3 className="text-lg font-bold text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Low Attendance Defaulters List (&lt; 75%)
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Students listed here are at risk of semester detention due to insufficient lecture/lab presence.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {lowAttendanceStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No students are currently below the 75% attendance threshold.
              </div>
            ) : (
              lowAttendanceStudents.map((s) => (
                <div key={s.uid} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={cleanAvatarUrl(s.student_photo, s.name, null, false)}
                      alt={s.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-bold text-white text-base">{s.name}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {s.uid} • EN: {s.enrolment_number}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-rose-400">{s.percentage}%</div>
                    <div className="text-xs text-slate-400">
                      {s.total_classes_present} of {s.total_classes_conducted} attended
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
