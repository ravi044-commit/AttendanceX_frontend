import React from 'react';
import { Users, LogOut, Sparkles, UserCheck, Calendar, Shield, BookOpen, GraduationCap, Crown, ShieldCheck } from 'lucide-react';
import { cleanAvatarUrl } from '../utils/avatarUtils';

export const Navbar = ({
  user,
  authMode,
  setAuthMode,
  onOpenAuth,
  onLogout,
  activeRoleView,
  setActiveRoleView,
  onToggleTimetable,
  showTimetable,
  onOpenSecurity
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* BRAND LOGO & TITLE */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
            title="AttendanceX Smart Campus Platform"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-white" />
            </div>
            
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight animated-gradient-brand glow-text">
                  AttendanceX
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 hidden sm:block">
                Smart Semester System
              </p>
            </div>
          </a>
        </div>

        {/* CENTER NAVIGATION (DESKTOP) - Logged Out */}
        {!user && (
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <a href="#portals" className="hover:text-indigo-300 transition-colors">
              Portals
            </a>
            <a href="#features" className="hover:text-indigo-300 transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-indigo-300 transition-colors">
              How It Works
            </a>
            {onToggleTimetable && (
              <button
                onClick={onToggleTimetable}
                className="hover:text-indigo-300 transition-colors flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{showTimetable ? 'Hide Timetable' : 'Timetable'}</span>
              </button>
            )}
          </nav>
        )}

        {/* RIGHT ACTION CONTROLS */}
        <div className="flex items-center gap-3">
          {!user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {onToggleTimetable && (
                <button
                  onClick={onToggleTimetable}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{showTimetable ? 'Hide Timetable' : 'Timetable'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setAuthMode('login');
                  onOpenAuth('login');
                }}
                className="btn-primary-glow px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 border bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 border-indigo-400/30"
                title="Log into existing account"
              >
                <UserCheck className="w-4 h-4 text-indigo-200" />
                <span>Log In</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Role badge */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-400">
                  <span className="hidden xs:inline">Role: </span>
                  <span className="text-indigo-400 font-bold">{user.role}</span>
                </span>
              </div>

              {/* Admin Multi-Role Switcher */}
              {user.role === 'admin' && (
                <>
                  <div className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
                    {[
                      { id: 'admin', label: 'Admin', icon: Shield },
                      { id: 'faculty', label: 'Faculty', icon: BookOpen },
                      { id: 'student', label: 'Student', icon: GraduationCap },
                      { id: 'hod', label: 'HOD', icon: Crown },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveRoleView(tab.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                            activeRoleView === tab.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="md:hidden">
                    <select
                      value={activeRoleView}
                      onChange={(e) => setActiveRoleView(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="admin">Admin View</option>
                      <option value="faculty">Faculty View</option>
                      <option value="student">Student View</option>
                      <option value="hod">HOD View</option>
                    </select>
                  </div>
                </>
              )}

              {/* User Profile & Sign Out */}
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-800">
                <button
                  type="button"
                  onClick={onOpenSecurity}
                  className="flex items-center gap-2.5 text-left p-1 rounded-xl hover:bg-slate-900 transition-colors group cursor-pointer"
                  title="Account Security & Verified Email Settings"
                >
                  <img
                    src={cleanAvatarUrl(user.avatar, user.name, null, user.role === 'faculty' || user.role === 'hod')}
                    alt={user.name}
                    className="w-9 h-9 rounded-full ring-2 ring-indigo-500/40 object-cover bg-slate-800 group-hover:ring-indigo-400 transition-all"
                  />
                  <div className="hidden sm:block text-right">
                    <div className="text-xs sm:text-sm font-bold text-slate-100 leading-tight group-hover:text-indigo-300 transition-colors">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-indigo-400 font-medium flex items-center justify-end gap-1">
                      <span>{user.department || 'Computer Department'}</span>
                      <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                    </div>
                  </div>
                </button>

                {onOpenSecurity && (
                  <button
                    onClick={onOpenSecurity}
                    className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl border border-transparent hover:border-indigo-500/20 transition-all cursor-pointer"
                    title="Account Security & Verified Email Settings"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
