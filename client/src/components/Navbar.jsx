import React from 'react';
import { Shield, GraduationCap, BookOpen, Users, LogOut, Sparkles, UserCheck } from 'lucide-react';
import { cleanAvatarUrl } from '../utils/avatarUtils';

export const Navbar = ({
  user,
  authMode,
  setAuthMode,
  onOpenAuth,
  onLogout,
  activeRoleView,
  setActiveRoleView
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* TOP LEFT: Log In Button */}
        <div className="flex items-center gap-3">
          {!user ? (
            <button
              onClick={() => {
                setAuthMode('login');
                onOpenAuth('login');
              }}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 border bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 border-indigo-400/40 hover:scale-[1.02]"
              title="Log into existing account"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-200" />
              <span>Log In</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-400">
                  <span className="hidden xs:inline">Role: </span>
                  <span className="text-indigo-400 font-bold">{user.role}</span>
                </span>
              </div>

              {/* Quick switch role view if admin */}
              {user.role === 'admin' && (
                <>
                  {/* Desktop role buttons */}
                  <div className="hidden md:flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
                    {['admin', 'faculty', 'student', 'hod'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setActiveRoleView(r)}
                        className={`px-2.5 py-1 rounded capitalize font-medium transition-colors cursor-pointer ${
                          activeRoleView === r
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {r} View
                      </button>
                    ))}
                  </div>

                  {/* Mobile role select dropdown */}
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
            </div>
          )}
        </div>

        {/* TOP RIGHT: WEBSITE NAME "AttendanceX" */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3 mr-2">
              <img
                src={cleanAvatarUrl(user.avatar, user.name, null, user.role === 'faculty' || user.role === 'hod')}
                alt={user.name}
                className="w-9 h-9 rounded-full ring-2 ring-indigo-500/40 object-cover bg-slate-800"
              />
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-slate-100 leading-tight">{user.name}</div>
                <div className="text-xs text-indigo-400">{user.department || 'Computer Department'}</div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-colors ml-1"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Website Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent glow-text">
                  AttendanceX
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] tracking-wider uppercase font-medium text-slate-400 hidden sm:block">
                Smart Attendance System
              </p>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
