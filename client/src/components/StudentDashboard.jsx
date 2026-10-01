import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Calendar, CheckCircle2, XCircle, Award,
  Clock, BookOpen, AlertCircle, Sparkles, Filter, Search, RefreshCw, BarChart2,
  ChevronDown, ShieldCheck, Info, Layers, TrendingUp, ArrowRight
} from 'lucide-react';
import { api } from '../utils/api';

export const StudentDashboard = ({ user }) => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [subjectAttendance, setSubjectAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All'); // 'All', 'Lecture', 'Lab'
  const [searchSubject, setSearchSubject] = useState('');
  const [activeInfoCard, setActiveInfoCard] = useState(null); // 'overall' | 'theory' | 'lab' | null

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // Default to student user UID or first student
      const targetUid = user?.studentData?.uid || user?.uid || 'STU-COMP-2024-001';
      const data = await api.getStudentByUid(targetUid);
      setStudentInfo(data);
      setHistory(data.attendance_history || []);
      setSubjectAttendance(data.subject_attendance || []);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [user]);

  if (loading && !studentInfo) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const s = studentInfo || {
    name: user?.name || 'Student Member',
    uid: user?.uid || 'STU-COMP-2024-001',
    enrolment_number: '2024COMP0101',
    student_photo: user?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    department: 'Computer Department',
    semester: 6,
    division: 'A',
    status: 'Active',
    percentage: 92.0,
    weighted_percentage: 50.37,
    lecture_present: 28,
    lecture_total: 30,
    lab_present: 18,
    lab_total: 20,
    total_classes_present: 46,
    total_classes_conducted: 50
  };

  const filteredHistory = history.filter((item) => {
    const matchesType = filterType === 'All' || item.session_type === filterType;
    const matchesSearch = item.subject_name.toLowerCase().includes(searchSubject.toLowerCase());
    return matchesType && matchesSearch;
  });

  const isLowAttendance = s.percentage < 75;

  const totalPres = s.total_classes_present || (s.lecture_present + s.lab_present);
  const totalCond = s.total_classes_conducted || (s.lecture_total + s.lab_total);
  const totalMissed = Math.max(0, totalCond - totalPres);
  const lecRate = s.lecture_total > 0 ? Number(((s.lecture_present / s.lecture_total) * 100).toFixed(1)) : 0;
  const lecMissed = Math.max(0, s.lecture_total - s.lecture_present);
  const labRate = s.lab_total > 0 ? Number(((s.lab_present / s.lab_total) * 100).toFixed(1)) : 0;
  const labMissed = Math.max(0, s.lab_total - s.lab_present);
  const isEligible = s.percentage >= 75;

  const defaultSubjectAttendance = [
    {
      code: 'DI05000151',
      name: 'Internet of Things',
      short_name: 'IOT',
      faculty: 'C.G.Ajudiya',
      has_lecture: true,
      has_lab: true,
      lecture: { present: 7, total: 7, percentage: 100, missed: 0 },
      lab: { present: 2, total: 2, percentage: 100, missed: 0 },
      total_present: 9,
      total_conducted: 9,
      percentage: 100.0,
      missed: 0,
      status: 'Excellent',
      statusTheme: 'emerald'
    },
    {
      code: 'DI05007021',
      name: 'Information Security',
      short_name: 'IS',
      faculty: 'P.V.Patel',
      has_lecture: true,
      has_lab: true,
      lecture: { present: 4, total: 7, percentage: 57.1, missed: 3 },
      lab: { present: 3, total: 5, percentage: 60.0, missed: 2 },
      total_present: 7,
      total_conducted: 12,
      percentage: 58.3,
      missed: 5,
      status: 'Low Attendance',
      statusTheme: 'amber'
    },
    {
      code: 'DI05000111',
      name: 'Software Testing',
      short_name: 'ST',
      faculty: 'J.D.Vadalia',
      has_lecture: true,
      has_lab: true,
      lecture: { present: 10, total: 10, percentage: 100, missed: 0 },
      lab: { present: 2, total: 2, percentage: 100, missed: 0 },
      total_present: 12,
      total_conducted: 12,
      percentage: 100.0,
      missed: 0,
      status: 'Excellent',
      statusTheme: 'emerald'
    },
    {
      code: 'DI05000181',
      name: 'Computer Hardware & Maintenance',
      short_name: 'CHSM',
      faculty: 'J.V.Shparia',
      has_lecture: true,
      has_lab: true,
      lecture: { present: 5, total: 5, percentage: 100, missed: 0 },
      lab: { present: 1, total: 1, percentage: 100, missed: 0 },
      total_present: 6,
      total_conducted: 6,
      percentage: 100.0,
      missed: 0,
      status: 'Excellent',
      statusTheme: 'emerald'
    },
    {
      code: 'DI05000121',
      name: 'Project & Practical Innovation Lab',
      short_name: 'Vibe Lab',
      faculty: 'Shubham',
      has_lecture: false,
      has_lab: true,
      lecture: { present: 0, total: 0, percentage: 0, missed: 0 },
      lab: { present: 1, total: 1, percentage: 100, missed: 0 },
      total_present: 1,
      total_conducted: 1,
      percentage: 100.0,
      missed: 0,
      status: 'Excellent',
      statusTheme: 'emerald'
    }
  ];

  const subjects = (subjectAttendance && subjectAttendance.length > 0)
    ? subjectAttendance
    : (s.subject_attendance && s.subject_attendance.length > 0)
      ? s.subject_attendance
      : defaultSubjectAttendance;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Student Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={s.student_photo || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`}
                alt={s.name}
                className="w-20 h-20 rounded-2xl object-cover bg-slate-800 ring-2 ring-indigo-500/50 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full ring-4 ring-slate-900"></span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider mb-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Semester {s.semester || 6} • Div {s.division || 'A'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{s.name}</h1>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3 font-mono">
                <span className="text-indigo-400">UID: {s.uid}</span>
                <span>•</span>
                <span>ENROLL: {s.enrolment_number}</span>
                <span>•</span>
                <span className="text-slate-300">{s.department}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadStudentData}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Refresh Attendance"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ATTENDANCE GAUGES & SUMMARY METRICS (In-Flow Expandable 3-Card Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Metric 1: Overall Percentage Gauge with In-Flow Dynamic Expansion */}
        <div
          className="group glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          onMouseEnter={() => setActiveInfoCard('overall')}
          onMouseLeave={() => setActiveInfoCard(null)}
          onClick={() => setActiveInfoCard(activeInfoCard === 'overall' ? null : 'overall')}
        >
          {/* Card Summary Header */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Overall Attendance
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                    isEligible ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isEligible ? 'Eligible' : 'Warning'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-flex items-center gap-0.5 group-hover:text-emerald-400 transition-colors">
                  Details <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeInfoCard === 'overall' ? 'rotate-180 text-emerald-400' : 'group-hover:rotate-180'}`} />
                </span>
              </div>
            </div>

            <div className="my-4 flex items-baseline gap-2">
              <span className={`text-4xl font-black tracking-tight ${isEligible ? 'text-emerald-400' : 'text-rose-400'}`}>
                {s.percentage}%
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({totalPres} / {totalCond} classes)
              </span>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isEligible ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                }`}
                style={{ width: `${Math.min(s.percentage, 100)}%` }}
              ></div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Minimum Requirement: 75%</span>
              <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                {activeInfoCard === 'overall' ? 'Close Details ↑' : 'Hover for Details ↓'}
              </span>
            </div>
          </div>

          {/* In-Flow Collapsible Details: Dynamically pushes down the history section */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden text-left ${
              activeInfoCard === 'overall'
                ? 'max-h-[600px] opacity-100 mt-4 pt-4 border-t border-slate-800/80'
                : 'max-h-0 opacity-0 group-hover:max-h-[600px] group-hover:opacity-100 group-hover:mt-4 group-hover:pt-4 group-hover:border-t group-hover:border-slate-800/80'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">What is Overall Attendance?</h4>
                    <p className="text-[10px] text-slate-400">Semester 5 Cumulative Attendance</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${isEligible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {isEligible ? 'Exam Eligible' : 'Below 75%'}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Overall Attendance is your combined attendance metric across all Computer Department courses, consolidating both classroom <strong className="text-white">Theory Lectures</strong> and hands-on <strong className="text-white">Practical Labs</strong>.
              </p>

              {/* Formula & Calculation Box */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="text-indigo-300 flex items-center justify-between">
                  <span>Formula: (Attended / Total) × 100</span>
                  <span className="font-bold text-emerald-400">{s.percentage}%</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Calculation: ({totalPres} / {totalCond}) × 100 = <strong className="text-white">{s.percentage}%</strong>
                </div>
              </div>

              {/* Combined Components Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20">
                  <span className="text-[10px] uppercase font-semibold text-blue-400 block">Theory Lectures</span>
                  <span className="text-xs font-bold text-white">{s.lecture_present} / {s.lecture_total}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{lecRate}% Lecture Rate</span>
                </div>
                <div className="p-2.5 rounded-xl bg-violet-950/30 border border-violet-500/20">
                  <span className="text-[10px] uppercase font-semibold text-violet-400 block">Practical Labs</span>
                  <span className="text-xs font-bold text-white">{s.lab_present} / {s.lab_total}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{labRate}% Practical Rate</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
                <span>Attended: <strong className="text-emerald-400">{totalPres}</strong></span>
                <span>Missed: <strong className="text-rose-400">{totalMissed}</strong></span>
                <span>Exam Requirement: <strong className="text-slate-200">≥ 75%</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Theory Lectures Breakdown with In-Flow Dynamic Expansion */}
        <div
          className="group glass-panel p-6 rounded-2xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          onMouseEnter={() => setActiveInfoCard('theory')}
          onMouseLeave={() => setActiveInfoCard(null)}
          onClick={() => setActiveInfoCard(activeInfoCard === 'theory' ? null : 'theory')}
        >
          {/* Card Summary Header */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Theory Lectures</span>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-flex items-center gap-0.5 group-hover:text-blue-400 transition-colors">
                  Details <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeInfoCard === 'theory' ? 'rotate-180 text-blue-400' : 'group-hover:rotate-180'}`} />
                </span>
              </div>
            </div>

            <div className="my-4">
              <div className="text-3xl font-bold text-white">
                {s.lecture_present} <span className="text-sm font-normal text-slate-400">/ {s.lecture_total} Attended</span>
              </div>
              <div className="text-xs text-blue-400 mt-1 font-semibold flex items-center justify-between">
                <span>{lecRate}% Lecture Rate</span>
                <span className="text-[11px] text-slate-400 font-normal">{lecMissed} missed</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${s.lecture_total > 0 ? (s.lecture_present / s.lecture_total) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Room 209 Classroom Sessions</span>
              <span className="text-blue-400 font-semibold group-hover:underline flex items-center gap-1">
                {activeInfoCard === 'theory' ? 'Close Details ↑' : 'Hover for Meaning ↓'}
              </span>
            </div>
          </div>

          {/* In-Flow Collapsible Details: Dynamically pushes down the history section */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden text-left ${
              activeInfoCard === 'theory'
                ? 'max-h-[600px] opacity-100 mt-4 pt-4 border-t border-slate-800/80'
                : 'max-h-0 opacity-0 group-hover:max-h-[600px] group-hover:opacity-100 group-hover:mt-4 group-hover:pt-4 group-hover:border-t group-hover:border-slate-800/80'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">What are Theory Lectures?</h4>
                    <p className="text-[10px] text-slate-400">Classroom Syllabus & Foundations</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-blue-500/20 text-blue-300">
                  {lecRate}% Rate
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Faculty-led classroom instructional sessions focusing on syllabus architecture, algorithms, and theoretical principles for courses such as <strong className="text-white">Internet of Things</strong>, <strong className="text-white">Software Testing</strong>, <strong className="text-white">Information Security</strong>, and <strong className="text-white">Computer Hardware (CHSM)</strong>.
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Attended</span>
                  <span className="text-sm font-bold text-emerald-400">{s.lecture_present}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Conducted</span>
                  <span className="text-sm font-bold text-white">{s.lecture_total}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Missed</span>
                  <span className="text-sm font-bold text-rose-400">{lecMissed}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-200 leading-relaxed">
                💡 <strong>Academic Importance:</strong> Regular theory attendance ensures deep understanding of core principles required to pass mid-semester evaluations and university written examinations.
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Laboratory Practical Breakdown with In-Flow Dynamic Expansion */}
        <div
          className="group glass-panel p-6 rounded-2xl border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900/80 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          onMouseEnter={() => setActiveInfoCard('lab')}
          onMouseLeave={() => setActiveInfoCard(null)}
          onClick={() => setActiveInfoCard(activeInfoCard === 'lab' ? null : 'lab')}
        >
          {/* Card Summary Header */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Practical Labs</span>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-flex items-center gap-0.5 group-hover:text-violet-400 transition-colors">
                  Details <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeInfoCard === 'lab' ? 'rotate-180 text-violet-400' : 'group-hover:rotate-180'}`} />
                </span>
              </div>
            </div>

            <div className="my-4">
              <div className="text-3xl font-bold text-white">
                {s.lab_present} <span className="text-sm font-normal text-slate-400">/ {s.lab_total} Attended</span>
              </div>
              <div className="text-xs text-violet-400 mt-1 font-semibold flex items-center justify-between">
                <span>{labRate}% Practical Rate</span>
                <span className="text-[11px] text-slate-400 font-normal">{labMissed} missed</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${s.lab_total > 0 ? (s.lab_present / s.lab_total) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Computer Center & Labs 114, 203</span>
              <span className="text-violet-400 font-semibold group-hover:underline flex items-center gap-1">
                {activeInfoCard === 'lab' ? 'Close Details ↑' : 'Hover for Meaning ↓'}
              </span>
            </div>
          </div>

          {/* In-Flow Collapsible Details: Dynamically pushes down the history section */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden text-left ${
              activeInfoCard === 'lab'
                ? 'max-h-[600px] opacity-100 mt-4 pt-4 border-t border-slate-800/80'
                : 'max-h-0 opacity-0 group-hover:max-h-[600px] group-hover:opacity-100 group-hover:mt-4 group-hover:pt-4 group-hover:border-t group-hover:border-slate-800/80'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">What are Practical Labs?</h4>
                    <p className="text-[10px] text-slate-400">Hands-on Coding & Experiments</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-violet-500/20 text-violet-300">
                  {labRate}% Rate
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Hands-on programming, hardware experiments, and software debugging sessions conducted in specialized labs (Lab-201B, Lab-203, Lab-115, Lab-114, and Computer Center) for IoT, ST, IS, and Vibe Lab.
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Attended</span>
                  <span className="text-sm font-bold text-emerald-400">{s.lab_present}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Conducted</span>
                  <span className="text-sm font-bold text-white">{s.lab_total}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Missed</span>
                  <span className="text-sm font-bold text-rose-400">{labMissed}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-200 leading-relaxed">
                💡 <strong>Lab Assessment:</strong> Practical attendance is required for term-work certification, weekly code check-ins, journal evaluations, and final university viva exams.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Low Attendance Warning Banner if <75% */}
      {isLowAttendance && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs sm:text-sm">
            <strong>Attendance Warning:</strong> Your current semester attendance ({s.percentage}%) is below the university minimum requirement of 75%. Please consult your faculty mentor or HOD.
          </div>
        </div>
      )}

      {/* =========================================================================
          SUBJECT-WISE ATTENDANCE BREAKDOWN (LECTURES, LABS & FULL PERCENTAGE)
          ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider mb-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Subject Matrix Performance</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Subject-Wise Attendance Breakdown</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Attendance tracked separately for Theory Lectures and Practical Labs, with overall combined percentage per subject.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>≥ 75% Eligible</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>&lt; 75% Warning</span>
            </span>
          </div>
        </div>

        {/* Subject Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {subjects.map((sub) => {
            const isSubEligible = sub.percentage >= 75;
            const isSubCritical = sub.percentage < 50;
            
            // Modern distinct gradient accent per subject
            const themeBadge = sub.short_name === 'IOT'
              ? 'from-purple-600 to-indigo-600 text-white'
              : sub.short_name === 'IS'
              ? 'from-sky-600 to-blue-600 text-white'
              : sub.short_name === 'ST'
              ? 'from-violet-600 to-fuchsia-600 text-white'
              : sub.short_name === 'CHSM'
              ? 'from-amber-600 to-orange-600 text-white'
              : 'from-emerald-600 to-teal-600 text-white';

            return (
              <div
                key={sub.code || sub.short_name}
                className={`glass-panel p-6 rounded-3xl border transition-all duration-300 hover:shadow-2xl flex flex-col justify-between ${
                  !isSubEligible
                    ? 'border-amber-500/40 bg-gradient-to-br from-slate-900 via-amber-950/15 to-slate-900'
                    : 'border-slate-800 hover:border-indigo-500/40 bg-slate-900/90'
                }`}
              >
                <div>
                  {/* Subject Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-2xl bg-gradient-to-br ${themeBadge} font-black text-sm tracking-wider shadow-lg`}>
                        {sub.short_name}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-400">{sub.code}</span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[11px] text-slate-400">Faculty: <strong className="text-slate-200">{sub.faculty}</strong></span>
                        </div>
                        <h3 className="text-base font-black text-white mt-0.5">{sub.name}</h3>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                      isSubCritical
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : !isSubEligible
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {sub.status || (isSubEligible ? 'Eligible' : 'Warning')}
                    </span>
                  </div>

                  {/* Combined Full Subject Attendance Hero Meter */}
                  <div className="my-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Full Subject Attendance (Lecture + Lab)
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
                            isSubEligible ? 'text-emerald-400' : isSubCritical ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {sub.percentage}%
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">
                            ({sub.total_present} / {sub.total_conducted} attended)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-medium text-slate-400 block">Required</span>
                        <span className="text-xs font-bold text-slate-300 font-mono">≥ 75.0%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSubEligible
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : isSubCritical
                            ? 'bg-gradient-to-r from-rose-600 to-red-500'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        }`}
                        style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        {sub.missed > 0 ? (
                          <span className="text-rose-400 font-semibold">{sub.missed} sessions missed</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">100% Perfect presence</span>
                        )}
                      </span>
                      <span className={`font-semibold ${isSubEligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isSubEligible ? 'Examination Eligible' : 'Attendance Shortage Alert'}
                      </span>
                    </div>
                  </div>

                  {/* Component Breakdown: Theory Lectures & Practical Labs */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* Theory Sub-Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-blue-500/20 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-blue-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-blue-400" />
                            <span>Theory Lectures</span>
                          </span>
                          <span className="font-bold text-white text-xs">
                            {sub.has_lecture ? `${sub.lecture.percentage}%` : 'N/A'}
                          </span>
                        </div>

                        <div className="mt-2 text-sm font-extrabold text-white">
                          {sub.has_lecture ? (
                            <span>{sub.lecture.present} <span className="text-xs font-normal text-slate-400">/ {sub.lecture.total}</span></span>
                          ) : (
                            <span className="text-xs text-slate-500 font-normal">Lab Only Course</span>
                          )}
                        </div>
                      </div>

                      {sub.has_lecture && (
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Rate</span>
                          <span className={sub.lecture.percentage >= 75 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                            {sub.lecture.percentage}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Practical Lab Sub-Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-violet-500/20 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-violet-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-violet-400" />
                            <span>Practical Labs</span>
                          </span>
                          <span className="font-bold text-white text-xs">
                            {sub.has_lab ? `${sub.lab.percentage}%` : 'N/A'}
                          </span>
                        </div>

                        <div className="mt-2 text-sm font-extrabold text-white">
                          {sub.has_lab ? (
                            <span>{sub.lab.present} <span className="text-xs font-normal text-slate-400">/ {sub.lab.total}</span></span>
                          ) : (
                            <span className="text-xs text-slate-500 font-normal">No Labs</span>
                          )}
                        </div>
                      </div>

                      {sub.has_lab && (
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Rate</span>
                          <span className={sub.lab.percentage >= 75 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                            {sub.lab.percentage}%
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Card Action Link: Click to view subject history in table */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {!isSubEligible ? '⚠️ Needs regular attendance' : '✅ Consistent Attendance'}
                  </span>
                  <button
                    onClick={() => setSearchSubject(sub.short_name)}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer group/btn"
                  >
                    <span>View {sub.short_name} Sessions</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ATTENDANCE HISTORY LOGS */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Attendance History & Roll Records
            </h3>
            <p className="text-xs text-slate-400">
              Detailed chronological record of your lectures and practical lab sessions
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Type */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              {['All', 'Lecture', 'Lab'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    filterType === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search subject */}
            <div className="relative">
              <input
                type="text"
                value={searchSubject}
                onChange={(e) => setSearchSubject(e.target.value)}
                placeholder="Search subject..."
                className="pl-3 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Faculty Marked By</th>
                <th className="px-6 py-3.5 text-right">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const isPresent = item.status === 'Present';
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-indigo-300">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {item.subject_name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.session_type === 'Lab'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {item.session_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {item.marked_by}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isPresent
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isPresent ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span>{item.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
