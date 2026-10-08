import React, { useState, useEffect, useRef } from 'react';
import { Users, GraduationCap, CheckCircle2, CalendarCheck, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';

const STATS_DATA = [
  {
    id: 'students',
    label: 'Enrolled Students',
    target: 1280,
    suffix: '+',
    format: (v) => v.toLocaleString(),
    icon: GraduationCap,
    trend: '+12% this semester',
    color: 'from-indigo-500 to-blue-500',
    borderColor: 'group-hover:border-indigo-500/50',
    glowColor: 'rgba(99, 102, 241, 0.25)',
    description: 'Enrolled across all semester divisions & batches',
  },
  {
    id: 'faculty',
    label: 'Verified Faculty',
    target: 48,
    suffix: '+',
    format: (v) => v.toString(),
    icon: Users,
    trend: 'Computer Dept',
    color: 'from-violet-500 to-purple-500',
    borderColor: 'group-hover:border-violet-500/50',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    description: 'Theory lecturers & practical laboratory leads',
  },
  {
    id: 'attendance',
    label: 'Verification Accuracy',
    target: 98.6,
    decimals: 1,
    suffix: '%',
    format: (v) => v.toFixed(1),
    icon: ShieldCheck,
    trend: 'Real-time telemetry',
    color: 'from-emerald-500 to-teal-500',
    borderColor: 'group-hover:border-emerald-500/50',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    description: '75% threshold tracking & zero duplicate rolls',
  },
  {
    id: 'classes',
    label: 'Weekly Sessions',
    target: 164,
    suffix: '+',
    format: (v) => v.toString(),
    icon: CalendarCheck,
    trend: 'Rooms 209, Lab 114/203',
    color: 'from-amber-500 to-orange-500',
    borderColor: 'group-hover:border-amber-500/50',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    description: 'Scheduled theory classes & split batch labs',
  },
];

export const AnimatedStats = () => {
  const containerRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState(() => STATS_DATA.map(() => 0));

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setCounts(STATS_DATA.map((s) => s.target));
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1800; // 1.8 seconds
          const startTime = performance.now();

          const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setCounts(
              STATS_DATA.map((s) => {
                const val = s.target * easeOut;
                return s.decimals ? parseFloat(val.toFixed(s.decimals)) : Math.floor(val);
              })
            );

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              setCounts(STATS_DATA.map((s) => s.target));
            }
          };

          requestAnimationFrame(updateCounter);
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section ref={containerRef} className="relative z-10 py-10" aria-label="Platform Statistics">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Department Performance Benchmarks</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Trusted by Academic Leads for High-Accuracy Telemetry
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS_DATA.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className={`group relative glass-card p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${stat.borderColor}`}
              style={{
                boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.03), 0 20px 40px -15px rgba(0, 0, 0, 0.7)`,
              }}
            >
              {/* Subtle top specular border highlight */}
              <div
                className="absolute inset-x-0 top-0 h-[1.5px] rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `linear-gradient(90deg, transparent, ${stat.glowColor}, transparent)`,
                }}
              />

              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${stat.color} p-0.5 flex items-center justify-center shadow-lg shadow-black/40 group-hover:scale-105 transition-transform`}
                >
                  <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-100" />
                  </div>
                </div>

                <span className="text-[11px] font-semibold tracking-tight px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  {stat.trend}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline">
                  <span>{stat.format(counts[idx])}</span>
                  <span className="text-indigo-400 text-2xl font-bold ml-0.5">{stat.suffix}</span>
                </div>

                <div className="text-sm font-semibold text-slate-200">
                  {stat.label}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
