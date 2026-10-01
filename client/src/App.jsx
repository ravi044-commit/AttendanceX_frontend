import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { HodDashboard } from './components/HodDashboard';
import { TimetableView } from './components/TimetableView';
import {
  Shield, GraduationCap, BookOpen, Crown, Sparkles,
  Database, ArrowRight,
  Cpu, BarChart3, LogIn, Calendar
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

  const roleCards = [
    {
      id: 'admin',
      name: 'Admin Portal',
      role: 'admin',
      desc: 'Complete Computer Department oversight, user management, student addition & removal.',
      icon: Shield,
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'border-amber-500/30 hover:border-amber-500/60',
      textColor: 'text-amber-400',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    },
    {
      id: 'faculty',
      name: 'Faculty Portal',
      role: 'faculty',
      desc: 'Mark daily roll call for Theory Lectures and Practical Labs with real-time present count.',
      icon: BookOpen,
      gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'border-blue-500/30 hover:border-blue-500/60',
      textColor: 'text-blue-400',
      badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    },
    {
      id: 'student',
      name: 'Student Portal',
      role: 'student',
      desc: 'Check personal attendance percentage, interactive theory & lab breakdowns, and detailed session history.',
      icon: GraduationCap,
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
      textColor: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'hod',
      name: 'HOD Portal',
      role: 'hod',
      desc: 'Department-level performance statistics, low attendance alerts, and faculty session logs.',
      icon: Crown,
      gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
      borderColor: 'border-purple-500/30 hover:border-purple-500/60',
      textColor: 'text-purple-400',
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          /* Landing & Portal Selector when logged out */
          <div className="space-y-12 py-4">
            
            {/* Hero Section */}
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider shadow-inner">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Next-Gen Semester Attendance Management</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                Smart Attendance Tracking with{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-teal-300 bg-clip-text text-transparent glow-text">
                  AttendanceX
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Seamless real-time roll call, lecture & lab tracking, SQLite3 persistence, and semester percentage metrics for the <strong className="text-slate-200">Computer Department</strong>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => openAuthWithMode('login')}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Access Portal</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={() => setShowTimetable(t => !t)}
                  className="px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-indigo-700/50 font-bold text-sm flex items-center gap-2 transition-all"
                >
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>{showTimetable ? 'Hide Timetable' : 'View Timetable'}</span>
                </button>
              </div>

              {/* Quick Tech Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  SQLite3 Database Connected
                </span>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  Computer Department Ready
                </span>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                  Interactive Theory & Lab Dropdowns
                </span>
              </div>
            </div>

            {/* 4 ROLE CARDS (ADMIN, STUDENT, FACULTY, HOD) */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Select Your Portal Role
                </h2>
                
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {roleCards.map((rc) => {
                  const Icon = rc.icon;
                  return (
                    <div
                      key={rc.id}
                      onClick={() => openAuthWithMode('login', rc.role)}
                      className={`glass-panel p-6 rounded-3xl border ${rc.borderColor} bg-gradient-to-b ${rc.gradient} cursor-pointer group transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 ${rc.textColor} group-hover:scale-110 transition-transform`}>
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
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1 group-hover:text-indigo-300">
                          {rc.demoEmail || 'Access Portal'}
                        </span>
                        <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
                  <Database className="w-5 h-5" />
                  <h4>SQLite3 Embedded Database</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Persistent database tables storing student information, UID, enrolment numbers, photos, lecture/lab attendance histories, and roles.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                  <BarChart3 className="w-5 h-5" />
                  <h4>Lecture & Lab Split Metrics</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Faculty can take attendance separately for theory lectures and practical labs, with instant present/absent live counts.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
                  <BarChart3 className="w-5 h-5" />
                  <h4>Interactive Breakdown Dropdowns</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hover over Overall Attendance, Theory, or Practical cards to reveal session meanings, formulas, rates, and exam eligibility criteria.
                </p>
              </div>
            </div>

            {/* Timetable Section (toggled) */}
            {showTimetable && (
              <div className="animate-fade-in">
                <TimetableView />
              </div>
            )}

          </div>
        ) : (
          /* Active Logged-in Dashboard View */
          <div className="space-y-6">
            {/* View Selector for Admin to test all 4 views */}
            {user.role === 'admin' && (
              <div className="glass-panel p-3 rounded-2xl border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 mb-6 bg-indigo-950/20">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Shield className="w-4 h-4" />
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
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
            <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-2 bg-slate-900/30">
              <button
                onClick={() => setShowTimetable(false)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
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
                className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
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
              <TimetableView />
            ) : (
              <>
                {/* View Selector for Admin to test all 4 views */}
                {user.role === 'admin' && (
                  <div className="glass-panel p-3 rounded-2xl border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 mb-6 bg-indigo-950/20">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                      <Shield className="w-4 h-4" />
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
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">AttendanceX</span>
            <span>•</span>
            <span>Computer Department Smart Semester Attendance System</span>
          </div>
          <div>Powered by React, Node.js & SQLite3</div>
        </div>
      </footer>

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
