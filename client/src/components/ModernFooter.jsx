import React from 'react';
import { Users } from 'lucide-react';

export const ModernFooter = () => {
  return (
    <footer className="relative z-10 w-full mt-auto border-t border-slate-800/80 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xl text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Main Navigation & Info Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Attendance<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300">X</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  v2.0 SaaS
                </span>
              </div>
              <p className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">
                Smart Attendance System
              </p>
            </div>
          </div>

          {/* Operational Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 shadow-sm shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>All Systems Operational • Session 2026</span>
          </div>

          {/* Author / Creator Credit */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 font-mono text-[11px] shadow-sm">
              Created by Ravinakum
            </span>
          </div>
        </div>

        {/* Bottom Divider & Legal */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
          <p className="max-w-xl text-slate-400 text-xs leading-relaxed">
            Enterprise-grade semester attendance suite engineered for academic rigor with roll call telemetry and real-time eligibility tracking.
          </p>
          <p className="text-slate-400 text-xs shrink-0">
            © 2026 AttendanceX. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};
