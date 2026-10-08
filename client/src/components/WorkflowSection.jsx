import React from 'react';
import { KeyRound, ClipboardCheck, Cpu, LineChart, ArrowRight, Sparkles } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Authenticate by Role',
    desc: 'Admins, Faculty, Students, and HOD sign into dedicated portals with JWT-secured access.',
    icon: KeyRound,
    color: 'from-amber-500 to-orange-500',
    badge: 'Step 01',
  },
  {
    step: '02',
    title: 'One-Tap Roll Call',
    desc: 'Instructors select date & slot, toggle Theory or Lab Batch, and register present counts in seconds.',
    icon: ClipboardCheck,
    color: 'from-blue-500 to-indigo-500',
    badge: 'Step 02',
  },
  {
    step: '03',
    title: 'Algorithmic Sync',
    desc: 'Persistent SQLite3 database processes weights and calculates exact semester metrics automatically.',
    icon: Cpu,
    color: 'from-purple-500 to-pink-500',
    badge: 'Step 03',
  },
  {
    step: '04',
    title: 'Audit & Eligibility',
    desc: 'Students verify 75% exam compliance while department heads review real-time aggregate performance.',
    icon: LineChart,
    color: 'from-emerald-500 to-teal-500',
    badge: 'Step 04',
  },
];

export const WorkflowSection = () => {
  return (
    <section id="workflow" className="relative z-10 py-16" aria-label="How AttendanceX Works">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Streamlined Academic Pipeline</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          How AttendanceX Works in 4 Simple Steps
        </h2>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Engineered for minimal friction in lecture halls and practical labs, backed by deterministic database verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="relative group glass-card p-6 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-700 hover:shadow-2xl flex flex-col justify-between"
            >
              {/* Connector line for large screens */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-3 w-6 h-[1.5px] bg-gradient-to-r from-slate-700 to-transparent z-20 pointer-events-none" />
              )}

              <div>
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${s.color} p-0.5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}
                  >
                    <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                    {s.step}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {s.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800/60 flex items-center text-[11px] font-semibold text-slate-400 group-hover:text-indigo-300">
                <span>Phase {s.step} verification</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
