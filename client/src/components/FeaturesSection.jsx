import React from 'react';
import {
  Layers,
  ShieldCheck,
  Cpu,
  Database,
  Calendar,
  Sparkles,
  CheckCircle2,
  BarChart3,
  UserCheck,
  Zap,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Layers,
    title: 'Dual Theory & Lab Engine',
    desc: 'Distinct roll call workflows for classroom lectures and practical lab batches (A/B) with live tally badges.',
    accent: 'from-blue-500 to-indigo-500',
    tag: 'Core Telemetry',
  },
  {
    icon: BarChart3,
    title: 'Automated 75% Compliance Engine',
    desc: 'Real-time percentage calculations with instant warning indicators to guarantee university exam hall-pass criteria.',
    accent: 'from-emerald-500 to-teal-500',
    tag: 'Compliance',
  },
  {
    icon: Database,
    title: 'Persistent SQLite3 Architecture',
    desc: 'Relational data integrity for enrolled students, credentials, attendance sessions, and multi-year logs.',
    accent: 'from-purple-500 to-pink-500',
    tag: 'Storage',
  },
  {
    icon: UserCheck,
    title: 'Multi-Role Hierarchy',
    desc: 'Tailored portals with strict authentication guards for Admins, Faculty, Students, and Heads of Department.',
    accent: 'from-amber-500 to-orange-500',
    tag: 'Security',
  },
  {
    icon: Calendar,
    title: 'Dynamic Timetable & Lab Mapping',
    desc: 'Full semester schedule mapped to Hall 209, Lab 114, and Lab 203 with slot-level subject coordination.',
    accent: 'from-indigo-500 to-violet-500',
    tag: 'Scheduling',
  },
  {
    icon: Zap,
    title: 'Live Multi-Role View Switcher',
    desc: 'Administrative sandbox to preview and audit Student, Faculty, and HOD dashboards in a single click.',
    accent: 'from-cyan-500 to-blue-500',
    tag: 'Admin Tools',
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="relative z-10 py-16" aria-label="Key Features">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Engineered for Academic Precision</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Everything You Need to Run{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
            Campus Attendance at Scale
          </span>
        </h2>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Say goodbye to handwritten roll call sheets and disputed percentages. AttendanceX delivers transparent, tamper-proof academic telemetry.
        </p>
      </div>

      {/* 6 Feature Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div
              key={i}
              className="group relative glass-card p-7 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-500/40 hover:bg-slate-900/80"
              style={{
                boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.03), 0 15px 30px -10px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Subtle hover gradient glow inside card */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div className="flex items-center justify-between mb-5">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feature.accent} p-0.5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60">
                  {feature.tag}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                {feature.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed">
                {feature.desc}
              </p>

              <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center gap-1.5 text-xs font-semibold text-indigo-400/90 group-hover:text-indigo-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero configuration required</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
