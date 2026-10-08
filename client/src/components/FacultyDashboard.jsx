import React, { useState, useEffect } from 'react';
import {
  BookOpen, Users, CheckCircle, XCircle, Calendar, Clock,
  Sparkles, CheckSquare, Send, Award, RefreshCw, Filter, Layers,
  Search, Eye, FileText, CheckCircle2, ChevronRight, Lock, Unlock,
  ShieldAlert, AlertCircle
} from 'lucide-react';
import { api } from '../utils/api';
import { getStudentClass, matchesClassFilter } from '../utils/classUtils';
import { cleanAvatarUrl } from '../utils/avatarUtils';
import {
  Skeleton,
  SkeletonMetricCard,
  SkeletonRosterItem,
  DatabaseWakeupNotice,
  ErrorState,
  EmptyState
} from './Skeleton';

export const FacultyDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('take'); // 'take' or 'history'
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSlowWakeup, setIsSlowWakeup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Take Attendance Session state
  const [selectedClass, setSelectedClass] = useState(null);
  const [sessionType, setSessionType] = useState('Lecture'); // 'Lecture' or 'Lab'
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [searchRoster, setSearchRoster] = useState('');

  // Lock and freeze status state
  const [isDateFrozen, setIsDateFrozen] = useState(false);
  const [lockInfo, setLockInfo] = useState(null);

  // Saved Attendance History state
  const [sessionsList, setSessionsList] = useState([]);
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState('All'); // 'All', 'Present', 'Absent'

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const notify = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const checkDateLock = async (date) => {
    try {
      const lock = await api.getAttendanceLockStatus(date, 'Computer Department');
      setLockInfo(lock);
      setIsDateFrozen(lock?.is_frozen === true);
    } catch (err) {
      console.warn('Failed to check date lock:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const wakeupTimer = setTimeout(() => setIsSlowWakeup(true), 2000);

    let loadedStudents = [];
    let loadedClasses = [];
    let loadedSessions = [];

    try {
      try {
        loadedStudents = await api.getStudents({ department: 'Computer Department' });
      } catch (err) {
        console.warn('Failed to load students with department filter, trying all:', err);
        try {
          loadedStudents = await api.getStudents({});
        } catch (e) {
          console.error('Failed to load students:', e);
        }
      }

      try {
        loadedClasses = await api.getClasses({ department: 'Computer Department' });
      } catch (err) {
        console.warn('Failed to load classes with dept filter, trying all:', err);
        try {
          loadedClasses = await api.getClasses({});
        } catch (e) {
          console.error('Failed to load classes:', e);
        }
      }

      try {
        loadedSessions = await api.getAttendanceSessions('Computer Department');
      } catch (err) {
        console.warn('Sessions list endpoint not ready:', err);
      }

      if (loadedStudents && loadedStudents.length > 0) {
        setStudents(loadedStudents);
        const initialMap = {};
        loadedStudents.forEach((s) => {
          if (s.status === 'Detained') {
            initialMap[s.uid] = 'Detained';
          } else {
            initialMap[s.uid] = s.status === 'Active' ? 'Present' : 'Absent';
          }
        });
        setAttendanceMap(initialMap);
      } else {
        setStudents([]);
      }

      if (loadedClasses && loadedClasses.length > 0) {
        setClasses(loadedClasses);
        setSelectedClass((prev) => prev || loadedClasses[0]);
        setSessionType((prev) => prev || loadedClasses[0].type || 'Lecture');
      }

      if (loadedSessions && loadedSessions.length > 0) {
        setSessionsList(loadedSessions);
        if (!selectedHistorySession) {
          viewSavedSession(loadedSessions[0]);
        }
      } else {
        setSessionsList([]);
      }

      clearTimeout(wakeupTimer);
      setIsSlowWakeup(false);
    } catch (err) {
      console.error('General error loading faculty data:', err);
      clearTimeout(wakeupTimer);
      setIsSlowWakeup(false);
      setError('Failed to establish database telemetry. SQLite3 service may be initializing.');
    } finally {
      await checkDateLock(sessionDate);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    checkDateLock(sessionDate);
  }, [sessionDate]);

  const handleClassChange = (classId) => {
    const cls = classes.find((c) => c.id === parseInt(classId));
    if (cls) {
      setSelectedClass(cls);
      setSessionType(cls.type || 'Lecture');
    }
  };

  const setAllStatus = (status) => {
    if (isDateFrozen) {
      notify('This date is frozen by HOD. No changes are permitted.', 'error');
      return;
    }
    const newMap = {};
    students.forEach((s) => {
      if (s.status === 'Detained') {
        newMap[s.uid] = 'Detained';
      } else {
        newMap[s.uid] = status;
      }
    });
    setAttendanceMap(newMap);
  };

  const handleSubmitAttendance = async () => {
    if (isDateFrozen) {
      notify(`Attendance for ${sessionDate} has been finalized and frozen by HOD. Edits are locked.`, 'error');
      return;
    }

    if (!selectedClass) {
      notify('Please select a subject class', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const records = students.map((s) => ({
        student_uid: s.uid,
        student_name: s.name,
        enrolment_number: s.enrolment_number,
        status: s.status === 'Detained' ? 'Absent' : (attendanceMap[s.uid] || 'Present')
      }));

      const payload = {
        class_id: selectedClass.id,
        subject_name: selectedClass.subject_name,
        session_type: sessionType,
        date: sessionDate,
        marked_by: user ? user.name : 'Faculty Member',
        department: 'Computer Department',
        records
      };

      const result = await api.markAttendance(payload);
      notify(result.message || 'Attendance saved to SQLite database successfully!');
      
      // Refresh list and switch to history view
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to submit attendance', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const viewSavedSession = async (session) => {
    setSelectedHistorySession(session);
    setLoadingRecords(true);
    try {
      const records = await api.getAttendanceRecords({
        date: session.date,
        subject_name: session.subject_name,
        session_type: session.session_type,
        department: 'Computer Department'
      });
      setSessionRecords(records);
    } catch (err) {
      console.error('Failed to load session records:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const [batchFilter, setBatchFilter] = useState('All'); // 'All', 'Batch A', 'Batch B'
  const [historyBatchFilter, setHistoryBatchFilter] = useState('All'); // 'All', 'Batch A', 'Batch B'

  const handleToggleHistoryRecordStatus = async (rec) => {
    if (isDateFrozen) {
      notify(`Attendance for date ${selectedHistorySession.date} is finalized & frozen by HOD. Edits are locked.`, 'error');
      return;
    }

    const newStatus = rec.status === 'Present' ? 'Absent' : 'Present';
    const targetStudent = students.find((s) => s.uid === rec.student_uid);
    if (targetStudent && targetStudent.status === 'Detained' && newStatus === 'Present') {
      notify(`Cannot mark ${rec.student_name} as Present. Student is currently DETAINED from academic sessions and examinations.`, 'error');
      return;
    }
    try {
      const res = await api.updateSingleAttendanceRecord({
        record_id: rec.id,
        student_uid: rec.student_uid,
        date: rec.date || selectedHistorySession?.date,
        subject_name: rec.subject_name || selectedHistorySession?.subject_name,
        session_type: rec.session_type || selectedHistorySession?.session_type,
        status: newStatus,
        marked_by: user?.name || 'Faculty Member'
      });

      notify(res.message || `Updated ${rec.student_name}'s status to ${newStatus}`);

      // Update local state
      setSessionRecords(prev => prev.map(r => r.id === rec.id ? { ...r, status: newStatus, marked_by: user?.name || r.marked_by } : r));

      // Reload sessions list
      const updatedSessions = await api.getAttendanceSessions('Computer Department');
      setSessionsList(updatedSessions || []);
    } catch (err) {
      notify(err.message || 'Failed to update student status', 'error');
    }
  };

  // Filtered lists
  const filteredRoster = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchRoster.toLowerCase()) ||
      s.enrolment_number.toLowerCase().includes(searchRoster.toLowerCase()) ||
      s.uid.toLowerCase().includes(searchRoster.toLowerCase());

    const sClass = getStudentClass(s.enrolment_number, s.uid);
    const matchesBatch = matchesClassFilter(sClass, batchFilter);

    return matchesSearch && matchesBatch;
  });

  const filteredSessionRecords = sessionRecords.filter(r => {
    const matchesSearch = r.student_name.toLowerCase().includes(historySearch.toLowerCase()) ||
      r.enrolment_number.toLowerCase().includes(historySearch.toLowerCase());
    const matchesStatus = historyFilterStatus === 'All' || r.status === historyFilterStatus;

    const rClass = getStudentClass(r.enrolment_number, r.student_uid);
    const matchesBatch = matchesClassFilter(rClass, historyBatchFilter);

    return matchesSearch && matchesStatus && matchesBatch;
  });

  const totalStudents = students.length;
  const presentCount = Object.values(attendanceMap).filter((status) => status === 'Present').length;
  const absentCount = totalStudents - presentCount;
  const presentPercentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Alert */}
      {notification.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950 border-rose-800 text-rose-200'
              : 'bg-emerald-950 border-emerald-800 text-emerald-200'
          }`}
        >
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Faculty Attendance Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Lecture & Laboratory Roll Call
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl">
              Take live attendance for 99 Computer Department students or inspect all saved roll sheets directly from SQLite.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DatabaseWakeupNotice visible={isSlowWakeup} message="Connecting to database roster..." />
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Global Error Banner if initial fetch failed */}
      {error && students.length === 0 && !loading && (
        <ErrorState
          title="Roster Data Offline"
          message={error}
          onRetry={loadData}
        />
      )}

      {/* TOP NAVIGATION TABS: Take Attendance vs View Saved Attendance */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('take')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'take'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Take Roll Call ({loading ? '...' : totalStudents} Students)</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>View Saved Attendance Sheets ({loading ? '...' : sessionsList.length} Sessions)</span>
        </button>
      </div>

      {/* TAB 1: TAKE ATTENDANCE */}
      {activeTab === 'take' && (
        <div className="space-y-6">
          {/* Live present counters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonMetricCard />
                <SkeletonMetricCard />
                <SkeletonMetricCard />
                <SkeletonMetricCard />
              </>
            ) : (
              <>
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 fade-in-content">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
                    <span>Total Enrolled</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-black text-white mt-3">{totalStudents}</div>
                  <div className="text-xs text-slate-400 mt-1">Computer Dept - Sem 6</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 fade-in-content">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase text-emerald-300">
                    <span>Present in {sessionType}</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400 mt-3">{presentCount}</div>
                  <div className="text-xs text-emerald-400/80 mt-1">
                    {presentPercentage}% of batch attendance
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10 fade-in-content">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase text-rose-300">
                    <span>Absent in {sessionType}</span>
                    <XCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-3xl font-black text-rose-400 mt-3">{absentCount}</div>
                  <div className="text-xs text-rose-400/80 mt-1">Marked absent for session</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 fade-in-content">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
                    <span>Active Session</span>
                    <Layers className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl font-bold text-white mt-3 truncate">
                    {selectedClass ? selectedClass.subject_name : 'DBMS'}
                  </div>
                  <div className="text-xs text-indigo-300 mt-1 font-semibold">
                    {sessionType} Mode • {selectedClass ? selectedClass.room : 'LH-301'}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Session configuration form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            {/* Freeze Warning Banner if selected date is locked */}
            {isDateFrozen && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-purple-950/60 border-2 border-purple-500/50 text-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 shrink-0">
                    <Lock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-black text-white text-sm flex items-center gap-2">
                      <span>ATTENDANCE IS FROZEN FOR {sessionDate}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/30 text-purple-300 font-mono">
                        FINALIZED BY HOD
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px] mt-0.5">
                      Head of Department ({lockInfo?.finalized_by || 'C.G.Ajudiya'}) has locked this date. Neither faculty nor administrators can change attendance or conduct new sessions for {sessionDate}.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Session Setup & Timing
              </div>

              {isDateFrozen ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
                  <Lock className="w-3 h-3 text-purple-400" />
                  <span>Locked by HOD</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                  <Unlock className="w-3 h-3 text-emerald-400" />
                  <span>Open for Roll Call</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Subject & Class</label>
                <select
                  value={selectedClass ? selectedClass.id : ''}
                  onChange={(e) => handleClassChange(e.target.value)}
                  disabled={isDateFrozen}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.subject_code} - {cls.subject_name} ({cls.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Session Format</label>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSessionType('Lecture')}
                    disabled={isDateFrozen}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      sessionType === 'Lecture'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    } disabled:opacity-60`}
                  >
                    Lecture (Theory)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionType('Lab')}
                    disabled={isDateFrozen}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      sessionType === 'Lab'
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    } disabled:opacity-60`}
                  >
                    Practical Lab
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Attendance Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Student roll list */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Student Roll Call List ({filteredRoster.length})</h3>
                <p className="text-xs text-slate-400">
                  Toggle individual student status or use bulk actions
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Class Filter Tabs (Enrollment 1-63 = Class A, 64+ = Class B) */}
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  {[
                    { id: 'All', label: 'All Students' },
                    { id: 'Class A', label: 'Class A (1-63)' },
                    { id: 'Class B', label: 'Class B (64+)' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBatchFilter(b.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        batchFilter === b.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-40 sm:w-56">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchRoster}
                    onChange={(e) => setSearchRoster(e.target.value)}
                    placeholder="Search student..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={() => setAllStatus('Present')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  All Present
                </button>
                <button
                  onClick={() => setAllStatus('Absent')}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  All Absent
                </button>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/80">
              {loading ? (
                <>
                  <SkeletonRosterItem />
                  <SkeletonRosterItem />
                  <SkeletonRosterItem />
                  <SkeletonRosterItem />
                  <SkeletonRosterItem />
                  <SkeletonRosterItem />
                </>
              ) : filteredRoster.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No students found in this batch"
                  description={
                    searchRoster
                      ? `No students match "${searchRoster}" under filter "${batchFilter}".`
                      : `No enrolled students registered for ${batchFilter}.`
                  }
                  actionLabel={searchRoster ? "Clear Search" : undefined}
                  onAction={searchRoster ? () => setSearchRoster('') : undefined}
                />
              ) : (
                filteredRoster.map((student) => {
                  const isPresent = attendanceMap[student.uid] === 'Present';

                  return (
                    <div
                      key={student.uid}
                      className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors fade-in-content"
                    >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={cleanAvatarUrl(student.student_photo, student.name, null, false)}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover bg-slate-800 ring-1 ring-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm whitespace-nowrap">{student.name}</div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-indigo-400 whitespace-nowrap">{student.enrolment_number}</span>
                          <span>•</span>
                          <span className="whitespace-nowrap">UID: {student.uid}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold whitespace-nowrap">{student.percentage}% Overall Attendance</span>
                        </div>
                      </div>
                    </div>

                    {student.status === 'Detained' ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm self-end sm:self-center">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Detained (1-Yr Exam Bar)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setAttendanceMap((prev) => ({ ...prev, [student.uid]: 'Present' }))}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-105'
                              : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border border-slate-800'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Present</span>
                        </button>

                        <button
                          onClick={() => setAttendanceMap((prev) => ({ ...prev, [student.uid]: 'Absent' }))}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            !isPresent
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25 scale-105'
                              : 'bg-slate-900 text-slate-400 hover:text-rose-300 border border-slate-800'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>

            <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                {isDateFrozen ? (
                  <span className="text-purple-300 font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    Attendance for {sessionDate} is finalized and frozen by HOD. No changes can be submitted.
                  </span>
                ) : sessionsList.find((s) => s.date === sessionDate) ? (
                  <span className="text-amber-300 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Session already recorded for {sessionDate} ({sessionsList.find((s) => s.date === sessionDate)?.subject_name}). Submitting will overwrite it (1 session per date).
                  </span>
                ) : (
                  <span>
                    Saving will record official attendance for all <strong className="text-white">{students.length} students</strong> into SQLite (1 valid session per date).
                  </span>
                )}
              </div>

              {isDateFrozen ? (
                <div className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>Session Frozen by HOD (Editing Locked)</span>
                </div>
              ) : (
                <button
                  onClick={handleSubmitAttendance}
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Saving to SQLite...' : sessionsList.find((s) => s.date === sessionDate) ? 'Overwrite & Save Attendance' : 'Save & Submit Attendance'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAVED ATTENDANCE HISTORY SHEETS */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: List of Past Recorded Sessions */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Past Sessions ({sessionsList.length})
              </h3>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {loading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2.5">
                      <div className="flex justify-between">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-4 w-12 rounded" />
                      </div>
                      <Skeleton className="h-4 w-32" />
                      <div className="flex justify-between pt-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </>
              ) : sessionsList.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No past sessions recorded"
                  description="When you take roll call and submit attendance, saved sheets will be archived here."
                />
              ) : (
                sessionsList.map((ses, idx) => {
                  const isSelected = selectedHistorySession &&
                    selectedHistorySession.date === ses.date &&
                    selectedHistorySession.subject_name === ses.subject_name &&
                    selectedHistorySession.session_type === ses.session_type;

                  return (
                    <div
                      key={idx}
                      onClick={() => viewSavedSession(ses)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500/60 shadow-lg'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-indigo-300">
                          {ses.date}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ses.session_type === 'Lab' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {ses.session_type}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-white truncate">
                        {ses.subject_name}
                      </div>

                      <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                        <span className="text-emerald-400 font-semibold">{ses.present_count} Present</span>
                        <span className="text-rose-400">{ses.absent_count} Absent</span>
                        <span className="text-slate-500">Total: {ses.total_students}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Detailed Roll Sheet of Selected Session */}
          <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
            {selectedHistorySession ? (
              <>
                {/* Session Header Card */}
                <div className="p-6 border-b border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {selectedHistorySession.date}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        selectedHistorySession.session_type === 'Lab' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {selectedHistorySession.session_type}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{selectedHistorySession.subject_name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Marked by <span className="text-slate-300">{selectedHistorySession.marked_by}</span> • {selectedHistorySession.total_students} Students on Record
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-400">
                        {selectedHistorySession.present_count}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Present Students</div>
                    </div>
                    <div className="text-right pl-3 border-l border-slate-800">
                      <div className="text-2xl font-black text-rose-400">
                        {selectedHistorySession.absent_count}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Absent Students</div>
                    </div>
                  </div>
                </div>

                {/* Search & Filter Roster within this Session */}
                <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search student or enroll..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    {/* Status Filter */}
                    <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      {['All', 'Present', 'Absent'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setHistoryFilterStatus(st)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                            historyFilterStatus === st
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    {/* Batch Filter Tabs (Batch A: 1-63, Batch B: 64+) */}
                    <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      {[
                        { id: 'All', label: 'All Classes' },
                        { id: 'Class A', label: 'Class A (1-63)' },
                        { id: 'Class B', label: 'Class B (64+)' }
                      ].map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setHistoryBatchFilter(b.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                            historyBatchFilter === b.id
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Student Records Table */}
                <div className="max-h-[500px] overflow-y-auto">
                  {loadingRecords ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-slate-400 mt-2">Loading saved attendance sheet...</p>
                    </div>
                  ) : (
                    <table className="w-full min-w-[700px] text-left text-sm text-slate-300">
                      <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 min-w-[180px]">Student Name</th>
                          <th className="px-6 py-3 whitespace-nowrap">Class & Division</th>
                          <th className="px-6 py-3 whitespace-nowrap">Enrollment Number</th>
                          <th className="px-6 py-3 whitespace-nowrap">UID</th>
                          <th className="px-6 py-3 text-right whitespace-nowrap">Session Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredSessionRecords.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-xs">
                              No student records matching your filter.
                            </td>
                          </tr>
                        ) : (
                          filteredSessionRecords.map((rec) => {
                            const isPresent = rec.status === 'Present';
                            const recClass = getStudentClass(rec.enrolment_number, rec.student_uid);

                            return (
                              <tr key={rec.id} className="hover:bg-slate-900/40 transition-colors">
                                <td className="px-6 py-3.5 font-bold text-white text-xs sm:text-sm whitespace-nowrap">
                                  {rec.student_name}
                                </td>
                                <td className="px-6 py-3.5">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                    recClass === 'Class A' || recClass === 'Batch A'
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  }`}>
                                    {recClass}
                                  </span>
                                </td>
                                <td className="px-6 py-3.5 font-mono text-xs text-slate-400">
                                  {rec.enrolment_number}
                                </td>
                                <td className="px-6 py-3.5 font-mono text-xs text-indigo-300">
                                  {rec.student_uid}
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                  <button
                                    onClick={() => handleToggleHistoryRecordStatus(rec)}
                                    disabled={isDateFrozen}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                      isPresent
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40'
                                    }`}
                                    title={isDateFrozen ? 'Date frozen by HOD' : `Click to toggle status to ${isPresent ? 'Absent' : 'Present'}`}
                                  >
                                    {isPresent ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                    )}
                                    <span>{rec.status}</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">
                Select a past session from the left to view its attendance sheet.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
