import React from 'react';
import { Users, Shield, GraduationCap, BookOpen, Crown, Calendar, Sparkles, Heart } from 'lucide-react';

export const ModernFooter = ({ onOpenPortal, onToggleTimetable }) => {
  return (
    <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl mt-20 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand & Description (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white glow-text">
                  Attendance<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">X</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  v2.0 SaaS
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              Enterprise-grade semester attendance suite engineered for academic rigor. Built with relational SQLite3 persistence, roll call telemetry, and real-time eligibility tracking.
            </p>

            {/* System Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Systems Operational • Session 2026</span>
            </div>
          </div>

          {/* Quick Portals Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenPortal && onOpenPortal('admin')}
                  className="hover:text-indigo-300 transition-colors flex items-center gap-1.5 text-left"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Portal</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPortal && onOpenPortal('faculty')}
                  className="hover:text-indigo-300 transition-colors flex items-center gap-1.5 text-left"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Faculty Portal</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPortal && onOpenPortal('student')}
                  className="hover:text-indigo-300 transition-colors flex items-center gap-1.5 text-left"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Student Portal</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPortal && onOpenPortal('hod')}
                  className="hover:text-indigo-300 transition-colors flex items-center gap-1.5 text-left"
                >
                  <Crown className="w-3.5 h-3.5 text-purple-400" />
                  <span>HOD Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onToggleTimetable}
                  className="hover:text-indigo-300 transition-colors flex items-center gap-1.5 text-left"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Interactive Timetable</span>
                </button>
              </li>
              <li>
                <a href="#features" className="hover:text-indigo-300 transition-colors block">
                  Features & Specifications
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-indigo-300 transition-colors block">
                  How AttendanceX Works
                </a>
              </li>
              <li>
                <span className="text-slate-500">75% Policy Rulebook</span>
              </li>
            </ul>
          </div>

          {/* Campus Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Campus Environment
            </h4>
            <div className="text-xs space-y-1.5 text-slate-400">
              <div className="font-semibold text-slate-200">Computer Department</div>
              <div>Lecture Hall: <span className="text-slate-300 font-mono">Room 209</span></div>
              <div>Practical Labs: <span className="text-slate-300 font-mono">114 & 203</span></div>
              <div>Database: <span className="text-slate-300 font-mono">attendance.db</span></div>
              <div className="pt-2 text-[11px] text-slate-500">
                Synchronized for Odd Semester 2026
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Credits & Legal */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© 2026 AttendanceX. All rights reserved.</span>
            <span>•</span>
            <span>Computer Department Smart Academic Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              React • Vite • Node.js • SQLite3
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
