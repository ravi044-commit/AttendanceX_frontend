import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { AnimatedGrid } from './components/AnimatedGrid';
import { ModernFooter } from './components/ModernFooter';
import {
  Shield, GraduationCap, BookOpen, Crown, Sparkles,
  ArrowRight, CheckCircle2,
  LogIn, Calendar, Layers,
  Mail, Code2, ExternalLink, Send, Copy, Check
} from 'lucide-react';

// Code-split pages and modals so users only download their respective role bundles
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const FacultyDashboard = lazy(() => import('./components/FacultyDashboard').then(m => ({ default: m.FacultyDashboard })));
const StudentDashboard = lazy(() => import('./components/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const HodDashboard = lazy(() => import('./components/HodDashboard').then(m => ({ default: m.HodDashboard })));
const TimetableView = lazy(() => import('./components/TimetableView').then(m => ({ default: m.TimetableView })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const AccountSecurityModal = lazy(() => import('./components/AccountSecurityModal').then(m => ({ default: m.AccountSecurityModal })));
import { api } from './utils/api';

const DashboardLoadingFallback = () => (
  <div className="space-y-6 animate-pulse py-4" role="status" aria-label="Loading dashboard view">
    <div className="h-40 bg-slate-900/80 rounded-3xl border border-slate-800/80" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800/60" />
      ))}
    </div>
    <div className="h-80 bg-slate-900/60 rounded-2xl border border-slate-800/60" />
  </div>
);

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
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authRole, setAuthRole] = useState('student'); // 'admin', 'student', 'faculty', 'hod'
  const [activeRoleView, setActiveRoleView] = useState('admin'); // For Admin view switching
  const [showTimetable, setShowTimetable] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    try {
      navigator.clipboard.writeText('ravilaptop978@gmail.com');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2200);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  // Permanently enforce sleek dark theme and warm up backend if it is sleeping on a cloud host
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.removeItem('attendancex_theme');
      localStorage.removeItem('theme');
    } catch (e) {
      // ignore
    }

    // Silent background wake-up ping for sleeping SQLite/cloud server
    api.warmupBackend();
  }, []);

  const handleUserUpdated = (updatedUser, newToken) => {
    setUser(updatedUser);
    try {
      localStorage.setItem('attendancex_user', JSON.stringify(updatedUser));
      if (newToken) {
        setToken(newToken);
        localStorage.setItem('attendancex_token', newToken);
      }
    } catch (err) {
      console.error('Error updating user storage:', err);
    }
  };

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
      highlights: ['Student & Faculty Directory', 'Relational Database Control', 'Multi-View Auditor'],
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
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans relative selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Animated Grid Background - Landing Page Only */}
      {!user && <AnimatedGrid intensity={0.8} theme="dark" />}

      {/* Ambient Gradient Glow Spheres (contained to prevent document overflow) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="glow-orb w-[600px] h-[600px] bg-indigo-600/15 -top-40 left-1/2 -translate-x-1/2" />
        <div className="glow-orb w-[450px] h-[450px] bg-purple-600/10 top-[450px] -right-40" />
      </div>

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
        onOpenSecurity={() => setSecurityModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!user ? (
          /* Landing & Portal Selector when logged out */
          <div className="space-y-16 py-4">
            
            {/* HERO SECTION */}
            <div className="text-center max-w-4xl mx-auto space-y-6 pt-6 sm:pt-10">
              {/* Commanding Headline with Animated Gradient Text */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Smart Academic Attendance with{' '}
                <span className="animated-gradient-brand bg-clip-text text-transparent glow-text inline-block">
                  AttendanceX
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
                Seamless real-time roll call, practical lab & theory tracking, and instant semester percentage metrics for the <strong className="text-slate-900 dark:text-white font-semibold">Computer Department</strong>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                <button
                  onClick={() => openAuthWithMode('login')}
                  className="btn-primary-glow px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 flex items-center gap-2 group cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-indigo-200" />
                  <span>Sign In</span>
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
            </div>

            {/* 4 PORTAL CARDS (ADMIN, STUDENT, FACULTY, HOD) */}
            <div id="portals" className="space-y-6 pt-4">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Multi-Role Access Control</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Select Your Portal Role
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
                          <div className={`p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 ${rc.textColor} group-hover:scale-110 transition-transform shadow-md`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${rc.badgeColor}`}>
                            {rc.role}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">
                          {rc.name}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
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
                <Suspense fallback={<DashboardLoadingFallback />}>
                  <TimetableView />
                </Suspense>
              </div>
            )}

            {/* ABOUT US SECTION */}
            <section id="about" className="space-y-8 pt-8 scroll-mt-24" aria-label="About AttendanceX">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>About AttendanceX</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Smart Campus Management Platform
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  AttendanceX is a smart campus management platform that helps students, faculty, HODs, and administrators manage attendance and campus activities easily with real-time academic precision and automated compliance.
                </p>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    role: 'Students',
                    desc: 'Track live semester percentages, review lecture and lab batch sessions, and stay compliant with university exam eligibility rules.',
                    icon: GraduationCap,
                    accent: 'from-emerald-500/15 to-transparent',
                    border: 'border-emerald-500/30',
                    text: 'text-emerald-400'
                  },
                  {
                    role: 'Faculty',
                    desc: 'Perform instant roll calls for lectures and practical lab batches with real-time tally counts and zero paper friction.',
                    icon: BookOpen,
                    accent: 'from-blue-500/15 to-transparent',
                    border: 'border-blue-500/30',
                    text: 'text-blue-400'
                  },
                  {
                    role: 'HODs',
                    desc: 'Audit departmental performance, receive automated low-attendance defaulter warnings, and verify lecture rosters.',
                    icon: Crown,
                    accent: 'from-purple-500/15 to-transparent',
                    border: 'border-purple-500/30',
                    text: 'text-purple-400'
                  },
                  {
                    role: 'Administrators',
                    desc: 'Centralize user credentials, enforce strict role-based access control, and manage persistent database directories.',
                    icon: Shield,
                    accent: 'from-amber-500/15 to-transparent',
                    border: 'border-amber-500/30',
                    text: 'text-amber-400'
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className={`glass-card p-6 rounded-3xl border ${item.border} bg-gradient-to-b ${item.accent} flex flex-col justify-between hover:shadow-xl transition-all duration-300`}
                    >
                      <div>
                        <div className={`w-11 h-11 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-center ${item.text} mb-4 shadow-sm`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">
                          For {item.role}
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* CONTACT US SECTION */}
            <section id="contact" className="space-y-6 pt-6 pb-4 scroll-mt-24" aria-label="Contact AttendanceX">
              <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-[#0B0D22]/95 via-[#111432]/75 to-[#070A18]/95 shadow-2xl relative overflow-hidden">
                {/* Ambient glow accent */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Get in Touch</span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      Contact Us
                    </h2>
                    <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                      Have questions regarding the platform, architecture, technical support, or academic integration? Reach out directly via your favorite email service.
                    </p>
                  </div>

                  {/* Developer Profile Header Card */}
                  <div className="pt-2">
                    <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-5 rounded-2xl bg-[#070A18]/90 border border-indigo-500/30 shadow-lg hover:border-indigo-500/60 transition-all w-full max-w-2xl mx-auto justify-between">
                      <div className="flex items-center gap-3.5 text-center sm:text-left flex-col sm:flex-row">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
                          <Code2 className="w-6 h-6" />
                        </div>

                        <div>
                          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">
                              Direct Developer Channel
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              AttendanceX Developer
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
                            <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                            <a
                              href="mailto:ravilaptop978@gmail.com"
                              className="text-sm font-semibold text-indigo-300 hover:text-white underline underline-offset-4 decoration-indigo-400/50 hover:decoration-white transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Send email to AttendanceX Developer"
                            >
                              <span>ravilaptop978@gmail.com</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Copy Address Shortcut */}
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                          copiedEmail
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-indigo-500/40'
                        }`}
                        title="Copy email address to clipboard"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Copy Address</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CHOOSE EMAIL SOFTWARE / WEBMAIL CLIENT */}
                  <div className="pt-4 space-y-3 max-w-2xl mx-auto">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-2">
                      <span className="h-px w-8 bg-slate-800" />
                      <span>Choose Your Preferred Mail Software</span>
                      <span className="h-px w-8 bg-slate-800" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-left">
                      {/* 1. Gmail Web */}
                      <a
                        href="https://mail.google.com/mail/?view=cm&fs=1&to=ravilaptop978@gmail.com&su=AttendanceX%20Platform%20Inquiry"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#070A18]/80 hover:bg-[#111432] border border-slate-800 hover:border-indigo-500/40 transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.268H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.5l8.073-6.007C21.69 2.28 24 3.434 24 5.457z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                              Gmail Web
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Open directly in Google Chrome / Browser
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </a>

                      {/* 2. Outlook / Hotmail Web */}
                      <a
                        href="https://outlook.live.com/mail/0/deeplink/compose?to=ravilaptop978@gmail.com&subject=AttendanceX%20Platform%20Inquiry"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#070A18]/80 hover:bg-[#111432] border border-slate-800 hover:border-indigo-500/40 transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 11.25V5.5a1.5 1.5 0 0 0-1.5-1.5H10v7.25h14zm-14 1.5V20h12.5a1.5 1.5 0 0 0 1.5-1.5v-5.75H10zM8.5 4H1.5A1.5 1.5 0 0 0 0 5.5v13A1.5 1.5 0 0 0 1.5 20h7V4z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                              Outlook / Hotmail
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Open in Microsoft Webmail
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </a>

                      {/* 3. Yahoo Mail Web */}
                      <a
                        href="https://compose.mail.yahoo.com/?to=ravilaptop978@gmail.com&subj=AttendanceX%20Platform%20Inquiry"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#070A18]/80 hover:bg-[#111432] border border-slate-800 hover:border-indigo-500/40 transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm3.328 6.5h-2.433l-2.024 5.253-2.024-5.253H6.414l3.193 7.426v3.574h2.152v-3.574L15.328 6.5z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                              Yahoo Mail
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Compose via Yahoo Mail web client
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </a>

                      {/* 4. Default System Mail Client (Mailto) */}
                      <a
                        href="mailto:ravilaptop978@gmail.com?subject=AttendanceX%20Platform%20Inquiry"
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#070A18]/80 hover:bg-[#111432] border border-slate-800 hover:border-indigo-500/40 transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Send className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                              Default Email App
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Windows Mail, Apple Mail, Thunderbird
                            </div>
                          </div>
                        </div>
                        <Send className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </a>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 pt-2">
                    Direct developer correspondence for Computer Department system administration.
                  </p>
                </div>
              </div>
            </section>

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
            <Suspense fallback={<DashboardLoadingFallback />}>
              {showTimetable ? (
                <div className="glass-panel p-6 rounded-3xl border border-slate-800">
                  <TimetableView />
                </div>
              ) : (
                <>
                  {/* Render selected dashboard */}
                  {activeRoleView === 'admin' && <AdminDashboard />}
                  {activeRoleView === 'faculty' && <FacultyDashboard user={user} />}
                  {activeRoleView === 'student' && (
                    <StudentDashboard
                      user={user}
                      onUserUpdated={handleUserUpdated}
                      onOpenSecurity={() => setSecurityModalOpen(true)}
                    />
                  )}
                  {activeRoleView === 'hod' && <HodDashboard user={user} />}
                </>
              )}
            </Suspense>
          </div>
        )}
      </main>

      {/* Modern SaaS Footer */}
      <ModernFooter />

      {/* Authentication Modal */}
      {authModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            initialMode={authMode}
            initialRole={authRole}
            onSuccess={handleLoginSuccess}
          />
        </Suspense>
      )}

      {/* Account Security & Email Verification Modal */}
      {securityModalOpen && (
        <Suspense fallback={null}>
          <AccountSecurityModal
            isOpen={securityModalOpen}
            onClose={() => setSecurityModalOpen(false)}
            user={user}
            onUserUpdated={handleUserUpdated}
          />
        </Suspense>
      )}
    </div>
  );
}
