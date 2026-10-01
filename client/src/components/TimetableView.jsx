import React, { useState } from 'react';
import {
  Calendar, Clock, BookOpen, FlaskConical, MapPin,
  ChevronLeft, ChevronRight, Cpu, TestTube2, Shield,
  Wrench, Zap, Users
} from 'lucide-react';

// ─── Timetable Data (5th Semester, wef 05.08.26) ───────────────────────────
const SUBJECTS = {
  IOT:  { label: 'Internet of Things', short: 'IOT',  color: 'blue',   icon: Cpu },
  ST:   { label: 'Software Testing',   short: 'ST',   color: 'emerald', icon: TestTube2 },
  IS:   { label: 'Information Security', short: 'IS', color: 'purple', icon: Shield },
  CHSM: { label: 'Computer Hardware & Server Maint.', short: 'CHSM', color: 'amber', icon: Wrench },
  VIBE: { label: 'Vibe Lab',           short: 'Vibe', color: 'pink',   icon: Zap },
};

// Each cell: { subject, type: 'Lecture'|'Lab', room, batch: 'A'|'B'|'Both' }
// Days: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4
// Slots: index maps to TIME_SLOTS below
const TIME_SLOTS = [
  { label: '10:30 – 11:30', short: '10:30' },
  { label: '11:30 – 12:30', short: '11:30' },
  { label: '12:30 – 1:30',  short: '12:30' },
  { label: '2:00 – 3:00',   short: '2:00'  },
  { label: '3:00 – 4:00',   short: '3:00'  },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// [day][slot] = array of sessions  (may have 2 entries for A/B split)
// slot 0=10:30, 1=11:30, 2=12:30, 3=2:00, 4=3:00
const TIMETABLE = {
  // MONDAY
  0: {
    1: [{ subject: 'ST',   type: 'Lecture', room: '209',    batch: 'Both' }],
    2: [{ subject: 'IOT',  type: 'Lecture', room: '209',    batch: 'Both' }],
    3: [
      { subject: 'CHSM', type: 'Lab',     room: 'Lab-114', batch: 'A' },
      { subject: 'IOT',  type: 'Lab',     room: 'Lab-203', batch: 'B' },
    ],
    4: [
      { subject: 'CHSM', type: 'Lab',     room: 'Lab-114', batch: 'A' },
      { subject: 'IOT',  type: 'Lab',     room: 'Lab-203', batch: 'B' },
    ],
  },
  // TUESDAY
  1: {
    1: [
      { subject: 'ST',  type: 'Lab',     room: 'Lab-203', batch: 'A' },
      { subject: 'IS',  type: 'Lab',     room: 'Lab-115', batch: 'B' },
    ],
    2: [
      { subject: 'ST',  type: 'Lab',     room: 'Lab-203', batch: 'A' },   // continues
      { subject: 'IS',  type: 'Lab',     room: 'Lab-115', batch: 'B' },   // continues
    ],
    3: [{ subject: 'CHSM', type: 'Lecture', room: '209',    batch: 'Both' }],
    4: [{ subject: 'IS',   type: 'Lecture', room: '209',    batch: 'Both' }],
  },
  // WEDNESDAY
  2: {
    1: [
      { subject: 'IOT', type: 'Lab',     room: 'Lab-201B', batch: 'A' },
      { subject: 'ST',  type: 'Lab',     room: 'Lab-203',  batch: 'B' },
    ],
    2: [
      { subject: 'IOT', type: 'Lab',     room: 'Lab-201B', batch: 'A' },  // continues
      { subject: 'ST',  type: 'Lab',     room: 'Lab-203',  batch: 'B' },  // continues
    ],
    3: [{ subject: 'IS',   type: 'Lecture', room: '209',    batch: 'Both' }],
    4: [{ subject: 'ST',   type: 'Lecture', room: '209',    batch: 'Both' }],
  },
  // THURSDAY
  3: {
    0: [{ subject: 'IOT',  type: 'Lecture', room: '209',    batch: 'Both' }],
    1: [{ subject: 'CHSM', type: 'Lecture', room: '209',    batch: 'Both' }],
    2: [{ subject: 'IS',   type: 'Lecture', room: '209',    batch: 'Both' }],
    3: [
      { subject: 'IS',   type: 'Lab',     room: 'Lab-115', batch: 'A' },
      { subject: 'CHSM', type: 'Lab',     room: 'Lab-114', batch: 'B' },
    ],
    4: [
      { subject: 'IS',   type: 'Lab',     room: 'Lab-115', batch: 'A' },
      { subject: 'CHSM', type: 'Lab',     room: 'Lab-114', batch: 'B' },
    ],
  },
  // FRIDAY
  4: {
    1: [{ subject: 'CHSM', type: 'Lecture', room: '209',    batch: 'Both' }],
    2: [{ subject: 'ST',   type: 'Lecture', room: '209',    batch: 'Both' }],
    3: [{ subject: 'VIBE', type: 'Lab',     room: 'Lab',     batch: 'Both' }],
    4: [{ subject: 'VIBE', type: 'Lab',     room: 'Lab',     batch: 'Both' }],
  },
};

// ─── Color helpers ────────────────────────────────────────────────────────────
const COLOR_MAP = {
  blue:    { bg: 'bg-blue-900/40',    border: 'border-blue-500/40',   text: 'text-blue-300',   badge: 'bg-blue-500/20 text-blue-200',   dot: 'bg-blue-400'    },
  emerald: { bg: 'bg-emerald-900/40', border: 'border-emerald-500/40',text: 'text-emerald-300',badge: 'bg-emerald-500/20 text-emerald-200', dot: 'bg-emerald-400' },
  purple:  { bg: 'bg-purple-900/40',  border: 'border-purple-500/40', text: 'text-purple-300', badge: 'bg-purple-500/20 text-purple-200', dot: 'bg-purple-400'  },
  amber:   { bg: 'bg-amber-900/40',   border: 'border-amber-500/40',  text: 'text-amber-300',  badge: 'bg-amber-500/20 text-amber-200',  dot: 'bg-amber-400'   },
  pink:    { bg: 'bg-pink-900/40',    border: 'border-pink-500/40',   text: 'text-pink-300',   badge: 'bg-pink-500/20 text-pink-200',   dot: 'bg-pink-400'    },
};

function SessionCard({ session, compact = false }) {
  const sub = SUBJECTS[session.subject];
  const c   = COLOR_MAP[sub.color];
  const Icon = sub.icon;
  const isLab = session.type === 'Lab';

  return (
    <div className={`rounded-xl border ${c.bg} ${c.border} p-2 flex flex-col gap-0.5 h-full`}>
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3 h-3 shrink-0 ${c.text}`} />
        <span className={`font-bold text-xs ${c.text} truncate`}>{sub.short}</span>
        <span className={`ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${c.badge}`}>
          {isLab ? 'Lab' : 'Lec'}
        </span>
      </div>
      {!compact && (
        <>
          <p className="text-[10px] text-slate-400 truncate leading-tight">{sub.label}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
            <span className="text-[10px] text-slate-400">{session.room}</span>
            {session.batch !== 'Both' && (
              <span className={`ml-auto text-[9px] font-bold px-1 rounded ${c.badge}`}>
                Batch {session.batch}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Today's schedule view
function TodayView({ dayIndex }) {
  const slots = TIMETABLE[dayIndex] || {};
  const hasSessions = Object.keys(slots).length > 0;

  return (
    <div className="space-y-3">
      {!hasSessions && (
        <div className="text-center py-12 text-slate-500 text-sm">No classes today 🎉</div>
      )}
      {TIME_SLOTS.map((slot, si) => {
        const sessions = slots[si];
        if (!sessions) return null;
        return (
          <div key={si} className="flex gap-3 items-stretch">
            {/* Time label */}
            <div className="w-24 shrink-0 flex flex-col justify-center items-end">
              <span className="text-xs font-semibold text-slate-300">{slot.label.split('–')[0].trim()}</span>
              <span className="text-[10px] text-slate-500">– {slot.label.split('–')[1].trim()}</span>
            </div>
            {/* Divider line */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
              <div className="w-px flex-1 bg-slate-800" />
            </div>
            {/* Session cards */}
            <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${sessions.length}, 1fr)` }}>
              {sessions.map((sess, i) => (
                <SessionCard key={i} session={sess} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Full weekly grid
function WeekView() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-24 py-3 px-2 text-left text-slate-400 font-semibold border-b border-slate-800">Time</th>
            {DAYS.map((d, i) => (
              <th key={i} className="py-3 px-2 text-center text-slate-300 font-bold border-b border-slate-800">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot, si) => (
            <tr key={si} className="border-b border-slate-800/50">
              {/* Time column */}
              <td className="py-2 px-2 align-top">
                <div className="text-slate-400 font-medium whitespace-nowrap">{slot.label}</div>
              </td>
              {/* Day columns */}
              {DAYS.map((_, di) => {
                const sessions = (TIMETABLE[di] || {})[si];
                return (
                  <td key={di} className="py-1.5 px-1.5 align-top min-w-[120px]">
                    {sessions ? (
                      <div className="flex flex-col gap-1">
                        {sessions.map((sess, i) => (
                          <SessionCard key={i} session={sess} compact />
                        ))}
                      </div>
                    ) : (
                      <div className="h-8 flex items-center justify-center">
                        <span className="text-slate-800 text-lg">—</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function TimetableView() {
  const today = new Date();
  // getDay(): 0=Sun,1=Mon,...,5=Fri,6=Sat → map to 0–4 (Mon–Fri)
  const jsDay = today.getDay();
  const todayIndex = jsDay >= 1 && jsDay <= 5 ? jsDay - 1 : 0; // default Mon if weekend

  const [view, setView]       = useState('week');   // 'week' | 'today' | 'day'
  const [selectedDay, setSelectedDay] = useState(todayIndex);

  const isWeekend = today.getDay() === 0 || today.getDay() === 6;

  const weekDates = Array.from({ length: 5 }, (_, i) => {
    // Find Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + i);
    return monday;
  });

  const formatDate = (d) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-b from-indigo-950/30 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white">Class Timetable</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                5th Sem • wef 05.08.26
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isWeekend
                ? '🎉 Weekend! Next classes on Monday.'
                : `Today is ${DAYS[todayIndex]}, ${formatDate(today)}`}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'today', label: "Today's Classes" },
              { id: 'week',  label: 'Full Week' },
              { id: 'day',   label: 'Pick a Day' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === v.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Day Selector (for 'day' view) ── */}
      {view === 'day' && (
        <div className="flex gap-2 flex-wrap">
          {DAYS.map((d, i) => {
            const date = weekDates[i];
            const isToday = i === todayIndex && !isWeekend;
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`flex-1 min-w-[80px] py-3 px-2 rounded-2xl border text-center transition-all ${
                  selectedDay === i
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-sm">{DAY_SHORT[i]}</div>
                <div className="text-[10px] opacity-70">{formatDate(date)}</div>
                {isToday && <div className="text-[9px] font-bold text-indigo-300 mt-0.5">Today</div>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main Content Panel ── */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        {/* Panel header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-sm text-slate-200">
              {view === 'week'  && 'Weekly Schedule — Computer Department'}
              {view === 'today' && `Today's Schedule — ${DAYS[todayIndex]}`}
              {view === 'day'   && `${DAYS[selectedDay]}'s Schedule`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <BookOpen className="w-3 h-3" /> Lecture
            <FlaskConical className="w-3 h-3 ml-2" /> Lab
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {view === 'week'  && <WeekView />}
          {view === 'today' && <TodayView dayIndex={isWeekend ? 0 : todayIndex} />}
          {view === 'day'   && <TodayView dayIndex={selectedDay} />}
        </div>
      </div>

      {/* ── Subject Legend ── */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-300">Subject Legend</span>
          <span className="text-[10px] text-slate-500 ml-2">5th Semester • Batch A &amp; B</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(SUBJECTS).map(([key, sub]) => {
            const c = COLOR_MAP[sub.color];
            const Icon = sub.icon;
            return (
              <div key={key} className={`flex items-center gap-2 p-3 rounded-xl border ${c.bg} ${c.border}`}>
                <Icon className={`w-4 h-4 shrink-0 ${c.text}`} />
                <div>
                  <div className={`text-xs font-bold ${c.text}`}>{sub.short}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{sub.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
