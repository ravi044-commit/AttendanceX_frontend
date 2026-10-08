import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { HodDashboard } from './components/HodDashboard';
import { TimetableView } from './components/TimetableView';
import { PerspectiveTunnelGrid } from './components/PerspectiveTunnelGrid';
import { AnimatedStats } from './components/AnimatedStats';
import { FeaturesSection } from './components/FeaturesSection';
import { WorkflowSection } from './components/WorkflowSection';
import { ModernFooter } from './components/ModernFooter';
import {
  Shield, GraduationCap, BookOpen, Crown, Sparkles,
  Database, ArrowRight, CheckCircle2,
  Cpu, BarChart3, LogIn, Calendar, Layers
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('attendancex_user') || localStorage.getItem('Attendx_user') || localStorage.getItem('attendx_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Error parsing stored user:', err);
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    try {
      const t = localStorage.getItem('attendancex_token') || localStorage.getItem('attendx_token');
      return (t && t !== 'undefined') ? t : null;
    } catch (err) {
      return null;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authRole, setAuthRole] = useState('student'); // 'admin', 'student', 'faculty', 'hod'
  const [activeRoleView, setActiveRoleView] = useState('admin'); // For Admin view switching
  const [showTimetable, setShowTimetable] = useState(false);

  useEffect(() => {
    if (user && user.role) {
      setActiveRoleView(user.role);
    }
  }, [user]);

  const handleLoginSuccess = (userData, userToken) => {
    try {
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('attendancex_user', JSON.stringify(userData));
      if (userToken) localStorage.setItem('attendancex_token', userToken);
    } catch (err) {
      console.error('Error saving user to storage:', err);
    }
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('attendancex_user');
      localStorage.removeItem('attendancex_token');
      localStorage.removeItem('attendx_user');
      localStorage.removeItem('attendx_token');
    } catch (err) {
      console.error('Error removing storage:', err);
    }
  };

  const openAuthWithMode = (mode = 'login', role = 'student') => {
    setAuthRole(role);
    setAuthMode(role === 'admin' ? mode : 'login');
    setAuthModalOpen(true);
  };

  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const roleCards = [
    {
      id: 'admin',
      name: 'Admin Portal',
      role: 'admin',
      desc: 'Complete Computer Department governance, student directory control, and system audit tools.',
      icon: Shield,
      gradient: 'from-amber-500/15 via-orange-500/5 to-transparent',
      borderColor: 'border-amber-500/30 hover:border-amber-500/60',
      textColor: 'text-amber-400',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      buttonBg: 'hover:bg-amber-500 hover:text-slate-950',
      glowRgba: 'rgba(245, 158, 11, 0.15)',
      highlights: ['Student & Faculty Directory', 'Relational SQLite3 Control', 'Multi-View Auditor'],
    },
    {
      id: 'faculty',
      name: 'Faculty Portal',
      role: 'faculty',
      desc: 'Mark daily roll call for Theory Lectures and Practical Labs with instant real-time present counts.',
      icon: BookOpen,
      gradient: 'from-blue-500/15 via-indigo-500/5 to-transparent',
      borderColor: 'border-blue-500/30 hover:border-blue-500/60',
      textColor: 'text-blue-400',
      badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      buttonBg: 'hover:bg-blue-500 hover:text-white',
      glowRgba: 'rgba(59, 130, 246, 0.15)',
      highlights: ['Lecture & Lab Batch Split', 'Live Present/Absent Count', 'One-Click Submission'],
    },
    {
      id: 'student',
      name: 'Student Portal',
      role: 'student',
      desc: 'Check personal attendance percentage, interactive theory & lab breakdowns, and exam eligibility.',
      icon: GraduationCap,
      gradient: 'from-emerald-500/15 via-teal-500/5 to-transparent',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
      textColor: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      buttonBg: 'hover:bg-emerald-500 hover:text-slate-950',
      glowRgba: 'rgba(16, 185, 129, 0.15)',
      highlights: ['75% Exam Hall Compliance', 'Theory vs Practical Split', 'Detailed Session History'],
    },
    {
      id: 'hod',
      name: 'HOD Portal',
      role: 'hod',
      desc: 'Department-level performance analytics, low attendance threshold alerts, and faculty session audits.',
      icon: Crown,
      gradient: 'from-purple-500/15 via-pink-500/5 to-transparent',
      borderColor: 'border-purple-500/30 hover:border-purple-500/60',
      textColor: 'text-purple-400',
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      buttonBg: 'hover:bg-purple-500 hover:text-white',
      glowRgba: 'rgba(168, 85, 247, 0.15)',
      highlights: ['Department Overview', 'Defaulter Alert Notifications', 'Faculty Roll Verification'],
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans relative selection:bg-indigo-500 selection:text-white">
      {/* 3D Perspective Grid Tunnel Background & Mouse Parallax */}
      <PerspectiveTunnelGrid />

      {/* Ambient Gradient Glow Spheres */}
      <div className="glow-orb w-[600px] h-[600px] bg-indigo-600/15 -top-40 left-1/2 -translate-x-1/2" />
      <div className="glow-orb w-[450px] h-[450px] bg-purple-600/10 top-[600px] -right-40" />
      <div className="glow-orb w-[450px] h-[450px] bg-blue-600/10 top-[1200px] -left-40" />

      {/* Top Glassmorphic Navbar */}
      <Navbar
        user={user}
        authMode={authMode}
        setAuthMode={setAuthMode}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        activeRoleView={activeRoleView}
        setActiveRoleView={setActiveRoleView}
        onToggleTimetable={() => setShowTimetable(t => !t)}
        showTimetable={showTimetable}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!user ? (
          /* Landing & Portal Selector when logged out */
          <div className="space-y-16 py-4">
            
            {/* HERO SECTION */}
            <div className="text-center max-w-4xl mx-auto space-y-6 pt-6 sm:pt-10">
              
              {/* Modern Feature Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase shadow-lg shadow-indigo-500/10">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span>Next-Gen Semester Attendance SaaS • Computer Department</span>
              </div>

              {/* Commanding Headline with Animated Gradient Text */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.12]">
                Smart Academic Attendance with{' '}
                <span className="animated-gradient-brand glow-text inline-block">
                  AttendanceX
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
                Seamless real-time roll call, practical lab & theory tracking, relational SQLite3 persistence, and instant semester percentage metrics for the <strong className="text-white font-semibold">Computer Department</strong>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                <button
                  onClick={() => openAuthWithMode('login')}
                  className="btn-primary-glow px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 flex items-center gap-2 group cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-indigo-200" />
                  <span>Access Portal</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setShowTimetable(t => !t)}
                  className="btn-secondary-glow px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-indigo-700/50 font-bold text-sm flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>{showTimetable ? 'Hide Timetable' : 'View Timetable'}</span>
                </button>
              </div>

              {/* Live Technical Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  SQLite3 Database Connected
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  Computer Department Ready
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                  <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                  Interactive Theory & Lab Split
                </span>
              </div>
            </div>

            {/* ANIMATED STATISTICS SECTION */}
            <AnimatedStats />

            {/* 4 PORTAL CARDS (ADMIN, STUDENT, FACULTY, HOD) */}
            <div id="portals" className="space-y-6 pt-4">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Multi-Role Access Control</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Select Your Portal Role
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Choose your department role to sign into your tailored telemetry dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {roleCards.map((rc) => {
                  const Icon = rc.icon;
                  return (
                    <div
                      key={rc.id}
                      onClick={() => openAuthWithMode('login', rc.role)}
                      onMouseMove={handleCardMouseMove}
                      className={`portal-card-base glass-card p-6 rounded-3xl border ${rc.borderColor} bg-gradient-to-b ${rc.gradient} cursor-pointer group flex flex-col justify-between hover:shadow-2xl`}
                    >
                      {/* Dynamic cursor spotlight glow inside card */}
                      <div
                        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{
                          background: `radial-gradient(320px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${rc.glowRgba}, transparent 60%)`,
                        }}
                      />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-slate-900/90 border border-slate-700/60 ${rc.textColor} group-hover:scale-110 transition-transform shadow-md`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${rc.badgeColor}`}>
                            {rc.role}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {rc.name}
                        </h3>

                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {rc.desc}
                        </p>

                        {/* Capability bullet tags */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                          {rc.highlights.map((h, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1 group-hover:text-indigo-300">
                          Access Portal
                        </span>
                        <div className={`p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1`}>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TIMETABLE SECTION (TOGGLED) */}
            {showTimetable && (
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-white font-bold text-lg sm:text-xl">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <span>5th Semester Computer Department Timetable</span>
                  </div>
                  <button
                    onClick={() => setShowTimetable(false)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  >
                    Close View
                  </button>
                </div>
                <TimetableView />
              </div>
            )}

            {/* PROFESSIONAL FEATURES SECTION */}
            <FeaturesSection />

            {/* HOW ATTENDANCEX WORKS SECTION */}
            <WorkflowSection />

          </div>
        ) : (
          /* ACTIVE LOGGED-IN DASHBOARD VIEW */
          <div className="space-y-6">
            {/* View Selector for Admin to test all 4 views */}
            {user.role === 'admin' && (
              <div className="glass-panel p-3.5 rounded-2xl border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 mb-6 bg-indigo-950/20">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Admin Multi-Role Switcher:</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'admin', label: 'Admin View', icon: Shield },
                    { id: 'faculty', label: 'Faculty View', icon: BookOpen },
                    { id: 'student', label: 'Student View', icon: GraduationCap },
                    { id: 'hod', label: 'HOD View', icon: Crown }
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveRoleView(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          activeRoleView === tab.id
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timetable Tab — visible for all roles */}
            <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-2 bg-slate-900/40">
              <button
                onClick={() => setShowTimetable(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  !showTimetable
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setShowTimetable(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showTimetable
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>📅 Timetable</span>
              </button>
            </div>

            {/* Show Timetable OR the dashboards */}
            {showTimetable ? (
              <div className="glass-panel p-6 rounded-3xl border border-slate-800">
                <TimetableView />
              </div>
            ) : (
              <>
                {/* Render selected dashboard */}
                {activeRoleView === 'admin' && <AdminDashboard />}
                {activeRoleView === 'faculty' && <FacultyDashboard user={user} />}
                {activeRoleView === 'student' && <StudentDashboard user={user} />}
                {activeRoleView === 'hod' && <HodDashboard user={user} />}
              </>
            )}
          </div>
        )}
      </main>

      {/* Modern SaaS Footer */}
      <ModernFooter
        onOpenPortal={(role) => openAuthWithMode('login', role)}
        onToggleTimetable={() => setShowTimetable(t => !t)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        initialRole={authRole}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
