import React, { useState, useRef, useEffect } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import {
 Flame, Activity, Dumbbell, Calendar, Zap, ShieldAlert,
 Droplets, Utensils, TrendingUp, Award, BarChart3, LayoutDashboard,
 ChevronLeft, ChevronRight, Target, HeartPulse
} from 'lucide-react';

// ─── Color Palette ───────────────────────────────────────────────────────────
const C = {
 diet: { start: '#F59E0B', end: '#D97706', glow: 'rgba(245,158,11,0.35)', text: '#D97706', bg: 'rgba(245,158,11,0.1)' },
 exercise:{ start: '#E50914', end: '#B8000A', glow: 'rgba(229,9,20,0.35)', text: '#E50914', bg: 'rgba(229,9,20,0.1)' },
 water: { start: '#38BDF8', end: '#0284C7', glow: 'rgba(56,189,248,0.35)', text: '#0284C7', bg: 'rgba(56,189,248,0.1)' },
 form: { start: '#10B981', end: '#059669', glow: 'rgba(16,185,129,0.35)', text: '#059669', bg: 'rgba(16,185,129,0.1)' },
 overview:{ start: '#8B5CF6', end: '#6D28D9', glow: 'rgba(139,92,246,0.35)', text: '#7C3AED', bg: 'rgba(139,92,246,0.1)' },
 streak: { start: '#FB923C', end: '#EA580C', glow: 'rgba(251,146,60,0.35)', text: '#EA580C', bg: 'rgba(251,146,60,0.1)' },
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const WEEK = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const weeklyDiet = [
 { day:'Mon', cal:2150, protein:142, carbs:268, fat:68 },
 { day:'Tue', cal:1980, protein:128, carbs:240, fat:62 },
 { day:'Wed', cal:2340, protein:158, carbs:295, fat:76 },
 { day:'Thu', cal:2080, protein:135, carbs:258, fat:65 },
 { day:'Fri', cal:2260, protein:149, carbs:282, fat:72 },
 { day:'Sat', cal:2450, protein:161, carbs:310, fat:80 },
 { day:'Sun', cal:1870, protein:122, carbs:230, fat:58 },
];
const weeklyExercise = [
 { day:'Mon', reps:48, sets:9, duration:42, formScore:91 },
 { day:'Tue', reps:0, sets:0, duration:0, formScore:0 },
 { day:'Wed', reps:52, sets:12,duration:55, formScore:94 },
 { day:'Thu', reps:36, sets:9, duration:38, formScore:88 },
 { day:'Fri', reps:60, sets:15,duration:68, formScore:96 },
 { day:'Sat', reps:44, sets:9, duration:47, formScore:92 },
 { day:'Sun', reps:0, sets:0, duration:0, formScore:0 },
];
const weeklyWater = [
 { day:'Mon', ml:2800 }, { day:'Tue', ml:3200 }, { day:'Wed', ml:2500 },
 { day:'Thu', ml:3100 }, { day:'Fri', ml:2900 }, { day:'Sat', ml:3400 }, { day:'Sun', ml:2200 },
];
const weeklyForm = [
 { day:'Mon', score:91, xp:45 }, { day:'Tue', score:0, xp:0 },
 { day:'Wed', score:94, xp:52 }, { day:'Thu', score:88, xp:38 },
 { day:'Fri', score:96, xp:60 }, { day:'Sat', score:92, xp:47 },
 { day:'Sun', score:0, xp:0 },
];
const monthlyData = MONTHS.map((m, i) => ({
 month: m,
 cal: 1900 + Math.round(Math.sin(i * 0.6) * 200 + Math.random() * 150),
 reps: 200 + Math.round(Math.cos(i * 0.5) * 60 + Math.random() * 80),
 water: 2600 + Math.round(Math.sin(i * 0.8) * 250 + Math.random() * 100),
 formScore: 85 + Math.round(Math.sin(i * 0.4) * 8 + Math.random() * 5),
 workoutDays: 15 + Math.round(Math.random() * 12),
}));
const yearlyData = [2023, 2024, 2025, 2026].map((y, i) => ({
 year: y,
 totalWorkouts: 120 + i * 35,
 avgFormScore: 78 + i * 4.5,
 totalReps: 4800 + i * 1200,
 totalKcal: 760000 + i * 80000,
 streak: 12 + i * 8,
}));
// 42-day streak heatmap (last 6 weeks)
const streakHeatmap = Array.from({ length: 42 }, (_, i) => {
 const d = new Date(); d.setDate(d.getDate() - (41 - i));
 const active = Math.random() > 0.35;
 return { date: d, active, score: active ? 70 + Math.round(Math.random() * 30) : 0 };
});
const currentStreak = streakHeatmap.slice().reverse().findIndex(d => !d.active);

// ─── Utility: SVG polyline from values ───────────────────────────────────────
function buildLinePath(values, W, H, maxVal) {
 if (!values || values.length === 0) return { line: `M 0 ${H}`, area: `M 0 ${H} Z`, pts: [] };
 if (values.length === 1) {
 const y = H - (Math.max(values[0], 0) / Math.max(maxVal || values[0], 1)) * H;
 return { line: `M 0 ${y} L ${W} ${y}`, area: `M 0 ${y} L ${W} ${y} L ${W} ${H} L 0 ${H} Z`, pts: [{ x: 0, y }, { x: W, y }] };
 }
 const max = maxVal || Math.max(...values, 1);
 const pts = values.map((v, i) => ({
 x: (i / Math.max(values.length - 1, 1)) * W,
 y: H - (Math.max(v, 0) / max) * H,
 }));
 const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
 const area = `${line} L ${pts[pts.length-1].x.toFixed(1)} ${H} L 0 ${H} Z`;
 return { line, area, pts };
}

// ─── Animated Bar Chart ───────────────────────────────────────────────────────
function BarChart({ data, valueKey, labels, maxVal, color, suffix='', targetLine }) {
 const [hov, setHov] = useState(null);
 const max = maxVal || Math.max(...data.map(d => d[valueKey] || 0), 1);
 return (
 <div className="w-full">
 <div className="flex items-end justify-between gap-1.5 h-36 px-1">
 {data.map((d, i) => {
 const v = d[valueKey] || 0;
 const pct = Math.max(0, (v / max) * 100);
 const tPct = targetLine ? (targetLine / max) * 100 : null;
 const isHov = hov === i;
 return (
 <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end cursor-pointer group"
 onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
 {/* Tooltip */}
 <span className={`text-[9px] font-semibold transition-all duration-150 ${isHov ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}
 style={{ color: color.text }}>{v}{suffix}</span>
 {/* Bar container */}
 <div className="w-full flex-1 flex items-end relative rounded-t-lg overflow-visible">
 {tPct && (
 <div className="absolute w-full" style={{ bottom: `${tPct}%`, borderTop: `1.5px dashed ${color.text}`, opacity: 0.4 }} />
 )}
 <div className="w-full rounded-t-lg transition-all duration-500 relative overflow-hidden"
 style={{
 height: `${Math.max(v > 0 ? 5 : 0, pct)}%`,
 background: `linear-gradient(to top, ${color.end}, ${color.start})`,
 opacity: v === 0 ? 0.18 : isHov ? 1 : 0.78,
 boxShadow: isHov ? `0 0 18px 3px ${color.glow}` : 'none',
 }}>
 {/* Shimmer */}
 {isHov && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-t-lg" />}
 </div>
 </div>
 <span className="text-[9px] font-bold text-slate-500">{labels ? labels[i] : d.day || i}</span>
 </div>
 );
 })}
 </div>
 </div>
 );
}

// ─── SVG Area Line Chart ──────────────────────────────────────────────────────
function AreaChart({ data, valueKey, color, suffix='', maxVal, showDots=true }) {
 const [hov, setHov] = useState(null);
 const W = 240, H = 80;
 const values = data.map(d => d[valueKey] || 0);
 const { line, area, pts } = buildLinePath(values, W, H, maxVal);
 const gradId = `ag-${valueKey}-${color.start.replace('#','')}`;

 return (
 <div className="w-full relative">
 <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 90 }} preserveAspectRatio="none">
 <defs>
 <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={color.start} stopOpacity="0.38" />
 <stop offset="100%" stopColor={color.start} stopOpacity="0.01" />
 </linearGradient>
 </defs>
 <path d={area} fill={`url(#${gradId})`} />
 <path d={line} fill="none" stroke={color.start} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
 {showDots && pts.map((p, i) => (
 <g key={i} style={{ cursor: 'pointer' }}
 onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
 <circle cx={p.x} cy={p.y} r={hov === i ? 4.5 : 2.5}
 fill={values[i] > 0 ? color.start : '#64748B'}
 stroke="white" strokeWidth="1.5"
 style={{ transition: 'r 0.2s, fill 0.2s' }} />
 </g>
 ))}
 </svg>
 <div className="flex justify-between mt-1 px-0.5">
 {data.map((d, i) => (
 <span key={i} className={`text-[8px] font-bold flex-1 text-center transition-colors ${hov === i ? 'text-slate-700' : 'text-slate-400'}`}>
 {d.day || d.month || d.year || i}
 </span>
 ))}
 </div>
 {hov !== null && (
 <div className="text-center text-[11px] font-semibold mt-0.5" style={{ color: color.text }}>
 {data[hov].day || data[hov].month || data[hov].year}: {data[hov][valueKey] || 0}{suffix}
 </div>
 )}
 </div>
 );
}

// ─── Donut Ring ───────────────────────────────────────────────────────────────
function DonutRing({ value, max, color, label, sub, size=72 }) {
 const pct = Math.min(100, Math.max(0, Math.round((value / Math.max(max,1)) * 100)));
 const r = 26, circ = 2 * Math.PI * r;
 const dash = (pct / 100) * circ;
 return (
 <div className="flex flex-col items-center gap-1.5">
 <svg width={size} height={size} viewBox="0 0 66 66">
 <circle cx="33" cy="33" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="7" />
 <circle cx="33" cy="33" r={r} fill="none"
 stroke={color.start} strokeWidth="7"
 strokeDasharray={`${dash} ${circ - dash}`}
 strokeLinecap="round" transform="rotate(-90 33 33)"
 style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 4px ${color.glow})` }} />
 <text x="33" y="36" textAnchor="middle" fontSize="10.5" fontWeight="900"
 fill={color.text} fontFamily="'Outfit', monospace">{pct}%</text>
 </svg>
 <div className="text-center">
 <p className="text-[9px] font-semibold text-slate-700 tracking-wide leading-tight">{label}</p>
 {sub && <p className="text-[9px] font-bold text-slate-400 leading-tight">{sub}</p>}
 </div>
 </div>
 );
}

// ─── Radar / Spider Chart ─────────────────────────────────────────────────────
function RadarChart({ metrics }) {
 // metrics: [{label, value, max, color}]
 const cx = 90, cy = 85, r = 65;
 const n = metrics.length;
 const angles = metrics.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);
 const pts = metrics.map((m, i) => {
 const ratio = Math.min(1, (m.value / m.max));
 return {
 x: cx + r * ratio * Math.cos(angles[i]),
 y: cy + r * ratio * Math.sin(angles[i]),
 lx: cx + (r + 18) * Math.cos(angles[i]),
 ly: cy + (r + 18) * Math.sin(angles[i]),
 };
 });
 const polyPts = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
 // Grid rings
 const rings = [0.25, 0.5, 0.75, 1.0];
 return (
 <svg viewBox={`0 0 ${cx*2} ${cy*2}`} className="w-full" style={{ maxHeight: 180 }}>
 {/* Rings */}
 {rings.map(rk => (
 <polygon key={rk} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1"
 points={angles.map(a => `${(cx + r * rk * Math.cos(a)).toFixed(1)},${(cy + r * rk * Math.sin(a)).toFixed(1)}`).join(' ')} />
 ))}
 {/* Spokes */}
 {angles.map((a, i) => (
 <line key={i} x1={cx} y1={cy}
 x2={(cx + r * Math.cos(a)).toFixed(1)} y2={(cy + r * Math.sin(a)).toFixed(1)}
 stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
 ))}
 {/* Data polygon */}
 <polygon points={polyPts}
 fill="rgba(139,92,246,0.12)" stroke="#8B5CF6" strokeWidth="2"
 strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.3))' }} />
 {/* Data dots + labels */}
 {pts.map((p, i) => (
 <g key={i}>
 <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5"
 fill={metrics[i].color} stroke="white" strokeWidth="1.5" />
 <text x={p.lx.toFixed(1)} y={p.ly.toFixed(1)}
 textAnchor="middle" fontSize="7.5" fontWeight="800"
 fill="#475569" fontFamily="'Outfit', sans-serif">
 {metrics[i].label}
 </text>
 </g>
 ))}
 </svg>
 );
}

// ─── Streak Heatmap ───────────────────────────────────────────────────────────
function StreakHeatmap({ data }) {
 const [hov, setHov] = useState(null);
 const weeks = [];
 for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));

 return (
 <div className="space-y-1.5">
 {/* Day labels */}
 <div className="flex gap-1 ml-0">
 {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => (
 <div key={i} className="w-7 text-[9px] font-bold text-slate-500 text-center">{d[0]}</div>
 ))}
 </div>
 {weeks.map((week, wi) => (
 <div key={wi} className="flex gap-1">
 {week.map((cell, di) => {
 const idx = wi * 7 + di;
 const isHov = hov === idx;
 const intensity = cell.active ? Math.round((cell.score - 70) / 30 * 3) + 1 : 0;
 const bg = cell.active
 ? intensity >= 4 ? '#059669' : intensity === 3 ? '#10B981' : intensity === 2 ? '#34D399' : '#6EE7B7'
 : 'rgba(0,0,0,0.06)';
 return (
 <div key={di}
 className="w-7 h-7 rounded-md transition-all duration-150 cursor-pointer"
 style={{
 background: bg,
 boxShadow: isHov && cell.active ? `0 0 10px ${C.form.glow}` : 'none',
 transform: isHov ? 'scale(1.2)' : 'scale(1)',
 }}
 title={cell.active ? `${cell.date.toDateString()} — Score: ${cell.score}%` : cell.date.toDateString()}
 onMouseEnter={() => setHov(idx)}
 onMouseLeave={() => setHov(null)}
 />
 );
 })}
 </div>
 ))}
 {/* Legend */}
 <div className="flex items-center gap-1.5 pt-1">
 <span className="text-[9px] text-slate-400 font-bold">Less</span>
 {['rgba(0,0,0,0.06)','#6EE7B7','#34D399','#10B981','#059669'].map((c,i) => (
 <div key={i} className="w-4 h-4 rounded-sm" style={{ background: c }} />
 ))}
 <span className="text-[9px] text-slate-400 font-bold">More</span>
 </div>
 </div>
 );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, color, badge }) {
 return (
 <div className="flex items-start justify-between gap-3 mb-4">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-2xl shrink-0" style={{ background: color.bg }}>
 <Icon className="w-5 h-5" style={{ color: color.text }} />
 </div>
 <div>
 <h2 className="text-base font-semibold text-slate-900 leading-tight" style={{ fontFamily:"'Syne',sans-serif" }}>{title}</h2>
 {subtitle && <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{subtitle}</p>}
 </div>
 </div>
 {badge && (
 <span className="px-2.5 py-1 rounded-full text-[9px] font-semibold shrink-0"
 style={{ background: color.bg, color: color.text, border: `1.5px solid ${color.glow}` }}>
 {badge}
 </span>
 )}
 </div>
 );
}

// ─── Graph Card ────────────────────────────────────────────────────────────────
function GraphCard({ children, className = '' }) {
 return (
 <div className={`chart-card space-y-4 ${className}`}>
 {children}
 </div>
 );
}

// ─── Tab Pill ─────────────────────────────────────────────────────────────────
function TabPill({ tabs, active, onChange }) {
 return (
 <div className="flex gap-1 p-1 rounded-2xl bg-[#FFF8EE] border-2 border-slate-200">
 {tabs.map(t => (
 <button key={t.id} onClick={() => onChange(t.id)}
 className="flex-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold tracking-wide transition-all duration-200"
 style={active === t.id
 ? { background: '#E50914', color: '#fff', boxShadow: '0 2px 10px rgba(229,9,20,0.35)' }
 : { color: '#64748B', background: 'transparent' }}>
 {t.label}
 </button>
 ))}
 </div>
 );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function History() {
 const { completedWorkoutLogs, xp, streak, isGhostModeActive, toggleGhostMode } = useWorkoutStore();
 const userLevel = Math.floor(xp / 100) + 1;
 const [monthTab, setMonthTab] = useState('cal');
 const [yearTab, setYearTab] = useState('workouts');
 const [overviewTab, setOverviewTab] = useState('radar');

 const defaultLogs = [
 { id:'l1', exercise_name:'Bodyweight Squats', reps:15, form_score:94, fatigue_triggers:0, duration_seconds:42, created_at:'Yesterday' },
 { id:'l2', exercise_name:'Standard Push-ups', reps:12, form_score:88, fatigue_triggers:1, duration_seconds:38, created_at:'2 days ago' },
 { id:'l3', exercise_name:'Dumbbell Bicep Curls', reps:15, form_score:91, fatigue_triggers:0, duration_seconds:50, created_at:'3 days ago' },
 ];
 const logs = completedWorkoutLogs?.length > 0 ? completedWorkoutLogs : defaultLogs;
 const avgForm = Math.round(logs.reduce((a, l) => a + (l.form_score || 90), 0) / logs.length);
 const totalReps = logs.reduce((a, l) => a + (l.reps || 0), 0);
 const avgCal = Math.round(weeklyDiet.reduce((s,d)=>s+d.cal,0)/7);
 const avgWater= Math.round(weeklyWater.reduce((s,d)=>s+d.ml,0)/7);
 const activeDays = weeklyExercise.filter(d=>d.reps>0).length;

 const radarMetrics = [
 { label:'Diet', value: avgCal, max: 2500, color: C.diet.start },
 { label:'Hydration',value: avgWater, max: 3500, color: C.water.start },
 { label:'Reps', value: totalReps, max: 250, color: C.exercise.start },
 { label:'Form', value: avgForm, max: 100, color: C.form.start },
 { label:'Streak', value: streak||5, max: 30, color: C.streak.start },
 { label:'XP', value: xp||280, max: 500, color: C.overview.start },
 ];

 // Month chart data
 const monthKeys = {
 cal: { key:'cal', label:'Calories', suffix:' kcal', color: C.diet },
 reps: { key:'reps', label:'Reps', suffix:'', color: C.exercise },
 water: { key:'water', label:'Water (ml)', suffix:'ml', color: C.water },
 formScore:{ key:'formScore', label:'Form Score (%)',suffix:'%', color: C.form },
 };
 const yearKeys = {
 workouts: { key:'totalWorkouts', label:'Total Workouts', suffix:'', color: C.exercise },
 formScore: { key:'avgFormScore', label:'Avg Form Score', suffix:'%', color: C.form },
 reps: { key:'totalReps', label:'Total Reps', suffix:'', color: C.diet },
 streak: { key:'streak', label:'Best Streak', suffix:'d', color: C.streak },
 };

 return (
 <div className="w-full max-w-4xl mx-auto space-y-4 pb-16 animate-float-in">

 {/* ═══════════════════════════════════════════════════════
 HERO HEADER
 ═══════════════════════════════════════════════════════ */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2.5rem] p-6 shadow-xl space-y-5 text-slate-900">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
 <div>
 <div className="badge badge-crimson mb-2">
 <BarChart3 className="w-3 h-3" /> Performance Analytics
 </div>
 <h1 className="text-2xl font-semibold text-slate-950 font-heading">
 Your Progress Dashboard
 </h1>
 <p className="text-xs text-slate-600 font-semibold mt-0.5">Diet · Exercise · Hydration · Form · Streaks · Yearly</p>
 </div>
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#FFF8EE] border-2 border-slate-300">
 <div className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-white text-sm shadow"
 style={{ background:'linear-gradient(135deg,#E50914,#B8000A)' }}>
 L{userLevel}
 </div>
 <div>
 <p className="text-[9px] font-semibold text-slate-500 tracking-wide">Level</p>
 <p className="text-sm font-semibold text-slate-800">{xp} XP</p>
 </div>
 </div>
 </div>
 </div>

 {/* KPI Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {[
 { val: logs.length, lbl:'Sessions', Icon:Dumbbell, c: C.exercise },
 { val: totalReps, lbl:'Total Reps', Icon:Activity, c: C.diet },
 { val: `${avgForm}%`, lbl:'Avg Form', Icon:Target, c: C.form },
 { val: `${streak||5}d`,lbl:'Streak', Icon:Flame, c: C.streak },
 ].map((s,i) => (
 <div key={i} className="bg-[#FFF8EE] border-2 border-slate-200 p-4 rounded-2xl flex items-center gap-3 motion-card">
 <div className="p-2.5 rounded-xl shrink-0" style={{ background: s.c.bg }}>
 <s.Icon className="w-4 h-4" style={{ color: s.c.text }} />
 </div>
 <div>
 <p className="text-xl font-semibold text-slate-900">{s.val}</p>
 <p className="text-[9px] font-bold text-slate-500">{s.lbl}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Summary Donuts */}
 <div className="flex flex-wrap justify-around gap-3 pt-3 border-t border-slate-200">
 <DonutRing value={avgCal} max={2200} color={C.diet} label="Avg Calories" sub="kcal/day" />
 <DonutRing value={avgWater} max={3000} color={C.water} label="Avg Hydration" sub="ml/day" />
 <DonutRing value={activeDays}max={7} color={C.form} label="Active Days" sub="this week"/>
 <DonutRing value={avgForm} max={100} color={C.exercise} label="Form Score" sub="average" />
 <DonutRing value={streak||5} max={30} color={C.streak} label="Day Streak" sub="current" />
 </div>
 </div>

 {/* ═══════════════════════════════════════════════════════
 GRAPH 1 — DIET: Grouped Bar + Macro Area
 Style: Grouped bars with amber gradients
 ═══════════════════════════════════════════════════════ */}
 <GraphCard>
 <SectionHeader
 icon={Utensils} color={C.diet}
 title="Diet & Nutrition" subtitle="Weekly calorie and macro breakdown"
 badge={`Avg ${avgCal} kcal`}
 />
 {/* Calorie bars */}
 <div>
 <p className="text-[10px] font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
 <span className="w-3 h-3 rounded-sm inline-block" style={{ background:`linear-gradient(to top,${C.diet.end},${C.diet.start})` }} />
 Daily Calorie Intake — Target 2,200 kcal
 </p>
 <BarChart data={weeklyDiet} valueKey="cal" maxVal={2700}
 color={C.diet} suffix=" kcal" targetLine={2200} />
 </div>
 {/* Macro area lines */}
 <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
 {[
 { key:'protein', label:'Protein (g)', color:C.exercise },
 { key:'carbs', label:'Carbs (g)', color:C.diet },
 { key:'fat', label:'Fat (g)', color:C.overview },
 ].map(m => (
 <div key={m.key} className="rounded-2xl p-3" style={{ background: m.color.bg }}>
 <p className="text-[9px] font-semibold mb-1" style={{ color: m.color.text }}>{m.label}</p>
 <AreaChart data={weeklyDiet} valueKey={m.key} color={m.color} showDots={false} />
 </div>
 ))}
 </div>
 </GraphCard>

 {/* ═══════════════════════════════════════════════════════
 GRAPH 2 — EXERCISE: Horizontal scrolling bars + duration line
 Style: Crimson bars with set/rep stacked detail
 ═══════════════════════════════════════════════════════ */}
 <GraphCard>
 <SectionHeader
 icon={Dumbbell} color={C.exercise}
 title="Exercise Performance" subtitle="Weekly reps, sets & session duration"
 badge={`${activeDays}/7 Active`}
 />
 {/* Rep bars */}
 <div>
 <p className="text-[10px] font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
 <span className="w-3 h-3 rounded-sm inline-block" style={{ background:`linear-gradient(to top,${C.exercise.end},${C.exercise.start})` }} />
 Reps Per Day — Rest days shown empty
 </p>
 <BarChart data={weeklyExercise} valueKey="reps" maxVal={80} color={C.exercise} suffix=" reps" />
 </div>
 {/* Duration area */}
 <div className="pt-2 border-t border-slate-100">
 <p className="text-[10px] font-semibold text-slate-500 mb-2">Session Duration (min)</p>
 <AreaChart data={weeklyExercise} valueKey="duration" color={C.exercise} maxVal={90} suffix="m" />
 </div>
 {/* Per-exercise horizontal bars */}
 <div className="space-y-2.5 pt-2 border-t border-slate-100">
 <p className="text-[10px] font-semibold text-slate-500">Form Score by Session</p>
 {logs.slice(0,4).map((log, i) => (
 <div key={i} className="flex items-center gap-3">
 <span className="text-[9px] font-bold text-slate-500 w-24 shrink-0 truncate">{log.exercise_name?.split(' ').slice(0,2).join(' ')}</span>
 <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full rounded-full transition-all duration-700"
 style={{
 width: `${log.form_score || 90}%`,
 background: log.form_score >= 90
 ? `linear-gradient(90deg, ${C.form.end}, ${C.form.start})`
 : log.form_score >= 80
 ? `linear-gradient(90deg, ${C.diet.end}, ${C.diet.start})`
 : `linear-gradient(90deg, ${C.exercise.end}, ${C.exercise.start})`,
 }} />
 </div>
 <span className="text-[10px] font-semibold w-8 text-right" style={{ color: C.form.text }}>{log.form_score}%</span>
 </div>
 ))}
 </div>
 </GraphCard>

 {/* ═══════════════════════════════════════════════════════
 GRAPH 3 — WATER INTAKE: Wave-style area + daily donuts
 Style: Sky-blue wave area chart, circular progress rings
 ═══════════════════════════════════════════════════════ */}
 <GraphCard>
 <SectionHeader
 icon={Droplets} color={C.water}
 title="Hydration Tracker" subtitle="Daily water intake vs. 3,000ml target"
 badge={`${Math.round(avgWater/100)/10}L avg`}
 />
 {/* Wave area */}
 <div className="rounded-2xl p-3" style={{ background: C.water.bg }}>
 <AreaChart data={weeklyWater} valueKey="ml" color={C.water} maxVal={3800} suffix="ml" showDots />
 </div>
 {/* Target line visual */}
 <div className="flex items-center gap-2 text-[10px] text-slate-500">
 <div className="h-px flex-1 border-t-2 border-dashed" style={{ borderColor: C.water.text, opacity: 0.4 }} />
 <span className="font-bold" style={{ color: C.water.text }}>3,000ml Target</span>
 <div className="h-px flex-1 border-t-2 border-dashed" style={{ borderColor: C.water.text, opacity: 0.4 }} />
 </div>
 {/* Daily donut rings */}
 <div className="flex flex-wrap justify-around gap-2 pt-1">
 {weeklyWater.map((d, i) => (
 <DonutRing key={i} value={d.ml} max={3000} color={C.water} label={d.day} sub={`${Math.round(d.ml/100)/10}L`} size={60} />
 ))}
 </div>
 </GraphCard>

 {/* ═══════════════════════════════════════════════════════
 GRAPH 4 — FORM SCORE: Smooth line + XP earned
 Style: Emerald green line chart with XP area fill
 ═══════════════════════════════════════════════════════ */}
 <GraphCard>
 <SectionHeader
 icon={HeartPulse} color={C.form}
 title="Form Score & XP" subtitle="Biomechanical accuracy and experience points"
 badge="+6% this week"
 />
 {/* Form line */}
 <div className="rounded-2xl p-3" style={{ background: C.form.bg }}>
 <p className="text-[10px] font-semibold mb-2" style={{ color: C.form.text }}>
 Form Accuracy Score (%)
 </p>
 <AreaChart data={weeklyForm} valueKey="score" color={C.form} maxVal={100} suffix="%" showDots />
 </div>
 {/* XP earned bars */}
 <div className="pt-2 border-t border-slate-100">
 <p className="text-[10px] font-semibold text-slate-500 mb-3">XP Earned per Session</p>
 <BarChart data={weeklyForm} valueKey="xp" maxVal={80} color={C.form} suffix=" XP" />
 </div>
 </GraphCard>

 {/* ═══════════════════════════════════════════════════════
 GRAPH 5 — OVERVIEW: Radar + combined metrics
 Style: Radar spider chart with purple glow
 ═══════════════════════════════════════════════════════ */}
 <GraphCard>
 <SectionHeader
 icon={LayoutDashboard} color={C.overview}
 title="Overall Performance" subtitle="Multi-metric radar overview for this week"
 badge="All Stats"
 />
 <TabPill
 tabs={[{id:'radar',label:'Radar'},{id:'bars',label:'Compare'},{id:'stack',label:'Stack'}]}
 active={overviewTab} onChange={setOverviewTab}
 />
 {overviewTab === 'radar' && (
 <div className="flex flex-col items-center gap-2">
 <RadarChart metrics={radarMetrics} />
 <div className="grid grid-cols-3 gap-2 w-full">
 {radarMetrics.map((m, i) => (
 <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
 <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
 <div>
 <p className="text-[9px] font-semibold text-slate-500">{m.label}</p>
 <p className="text-[11px] font-semibold text-slate-800">{m.value}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 {overviewTab === 'bars' && (
 <div className="space-y-3">
 {[
 { label:'Calorie Adherence', val: Math.round((avgCal/2200)*100), color: C.diet, unit:'%' },
 { label:'Hydration Goal', val: Math.round((avgWater/3000)*100), color: C.water, unit:'%' },
 { label:'Form Score', val: avgForm, color: C.form, unit:'%' },
 { label:'Active Days', val: Math.round((activeDays/7)*100), color: C.exercise,unit:'%' },
 { label:'XP Progress', val: Math.min(99, xp % 100 || 65), color: C.overview,unit:'%' },
 ].map((m,i) => (
 <div key={i} className="flex items-center gap-3">
 <span className="text-[10px] font-semibold text-slate-600 w-32 shrink-0">{m.label}</span>
 <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
 style={{ width:`${m.val}%`, background:`linear-gradient(90deg,${m.color.end},${m.color.start})` }}>
 <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ animationDuration:'2s' }} />
 </div>
 </div>
 <span className="text-[11px] font-semibold w-10 text-right" style={{ color: m.color.text }}>{m.val}%</span>
 </div>
 ))}
 </div>
 )}
 {overviewTab === 'stack' && (
 <div className="space-y-2">
 <p className="text-[10px] text-slate-400 font-bold">Weekly contribution by category</p>
 {weeklyDiet.map((_, di) => {
 const dietPct = Math.round((weeklyDiet[di].cal / 2500) * 25);
 const exPct = Math.round((weeklyExercise[di].reps / 80) * 25);
 const wPct = Math.round((weeklyWater[di].ml / 3500) * 25);
 const fPct = weeklyForm[di].score > 0 ? Math.round((weeklyForm[di].score / 100) * 25) : 0;
 return (
 <div key={di} className="flex items-center gap-2">
 <span className="text-[9px] font-bold text-slate-400 w-6 shrink-0">{WEEK[di]}</span>
 <div className="flex-1 flex h-5 rounded-full overflow-hidden gap-px">
 {[{p:dietPct,c:C.diet},{p:exPct,c:C.exercise},{p:wPct,c:C.water},{p:fPct,c:C.form}].map((seg,si) => (
 <div key={si} className="h-full transition-all duration-500"
 style={{ width:`${seg.p}%`, background: seg.c.start }} />
 ))}
 <div className="h-full flex-1 bg-slate-100" />
 </div>
 </div>
 );
 })}
 <div className="flex gap-3 pt-1 flex-wrap">
 {[['Diet',C.diet],['Exercise',C.exercise],['Water',C.water],['Form',C.form]].map(([l,c])=>(
 <span key={l} className="flex items-center gap-1 text-[9px] font-semibold text-slate-500">
 <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.start }} />{l}
 </span>
 ))}
 </div>
 </div>
 )}
 </GraphCard>

 {/* ═══════════════════════════════════════════════════════
 GRAPH 6 — MONTHLY PROGRESS: Switchable metric bars
 Style: Monthly bar chart with tab switcher
 ═══════════════════════════════════════════════════════ */}
 <GraphCard>
 <SectionHeader
 icon={Calendar} color={C.diet}
 title="Monthly Progress" subtitle="All 12 months — tap a metric to explore"
 badge="12 Months"
 />
 <TabPill
 tabs={[
 {id:'cal',label:'Calories'},{id:'reps',label:'Reps'},
 {id:'water',label:'Water'},{id:'formScore',label:'Form'}
 ]}
 active={monthTab} onChange={setMonthTab}
 />
 {(() => {
 const mk = monthKeys[monthTab];
 return (
 <>
 <BarChart
 data={monthlyData} valueKey={mk.key} maxVal={undefined}
 color={mk.color} suffix={mk.suffix}
 labels={MONTHS}
 />
 <AreaChart data={monthlyData} valueKey={mk.key} color={mk.color} suffix={mk.suffix} maxVal={undefined} showDots />
 {/* Monthly stats summary */}
 <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
 {[
 { l:'Best Month', v: MONTHS[monthlyData.reduce((bi,d,i,a)=>d[mk.key]>a[bi][mk.key]?i:bi, 0)] },
 { l:'Avg / Month', v: `${Math.round(monthlyData.reduce((s,d)=>s+d[mk.key],0)/12)}${mk.suffix}` },
 { l:'Active Days', v: `${Math.round(monthlyData.reduce((s,d)=>s+d.workoutDays,0)/12)}d avg` },
 ].map((s,i) => (
 <div key={i} className="text-center p-2.5 rounded-xl" style={{ background: mk.color.bg }}>
 <p className="text-[9px] font-semibold tracking-wide text-slate-500">{s.l}</p>
 <p className="text-sm font-semibold mt-0.5" style={{ color: mk.color.text }}>{s.v}</p>
 </div>
 ))}
 </div>
 </>
 );
 })()}
 </GraphCard>

 {/* ═══════════════════════════════════════════════════════
 GRAPH 7 — YEARLY PROGRESS: Multi-year comparison
 Style: Year-over-year grouped bars with trendline
 ═══════════════════════════════════════════════════════ */}
 <GraphCard>
 <SectionHeader
 icon={TrendingUp} color={C.overview}
 title="Yearly Progress" subtitle="Year-over-year growth across all metrics"
 badge="2023 – 2026"
 />
 <TabPill
 tabs={[
 {id:'workouts',label:'Sessions'},{id:'formScore',label:'Form'},
 {id:'reps',label:'Reps'},{id:'streak',label:'Streak'},
 ]}
 active={yearTab} onChange={setYearTab}
 />
 {(() => {
 const yk = yearKeys[yearTab];
 return (
 <>
 <BarChart
 data={yearlyData} valueKey={yk.key} maxVal={undefined}
 color={yk.color} suffix={yk.suffix}
 labels={yearlyData.map(d=>String(d.year))}
 />
 {/* Year-over-year growth badges */}
 <div className="flex gap-2 flex-wrap justify-center pt-2">
 {yearlyData.slice(1).map((y,i) => {
 const prev = yearlyData[i][yk.key];
 const curr = y[yk.key];
 const pctChange = Math.round(((curr - prev) / Math.max(prev,1)) * 100);
 return (
 <div key={i} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl border"
 style={{ borderColor: yk.color.glow, background: yk.color.bg }}>
 <span className="text-[9px] font-semibold text-slate-400">{y.year}</span>
 <span className="text-base font-semibold" style={{ color: yk.color.text }}>{y[yk.key]}{yk.suffix}</span>
 <span className="text-[9px] font-semibold" style={{ color: pctChange >= 0 ? C.form.text : C.exercise.text }}>
 {pctChange >= 0 ? '↑' : '↓'} {Math.abs(pctChange)}%
 </span>
 </div>
 );
 })}
 </div>
 </>
 );
 })()}
 </GraphCard>

 {/* ═══════════════════════════════════════════════════════
 GRAPH 8 — DAILY STREAK HEATMAP
 Style: GitHub-style contribution heatmap
 ═══════════════════════════════════════════════════════ */}
 <GraphCard>
 <SectionHeader
 icon={Flame} color={C.streak}
 title="Daily Streak Calendar" subtitle="Last 6 weeks — hover to see your score"
 badge={`🔥 ${currentStreak > 0 ? currentStreak : streak || 5} day streak`}
 />
 {/* Streak stats */}
 <div className="grid grid-cols-3 gap-3 text-center">
 {[
 { v: streak || 5, l:'Current Streak', c: C.streak },
 { v: 18, l:'Longest Streak', c: C.form },
 { v: `${Math.round(streakHeatmap.filter(d=>d.active).length/42*100)}%`,
 l:'Consistency', c: C.overview},
 ].map((s,i) => (
 <div key={i} className="p-3 rounded-2xl" style={{ background: s.c.bg }}>
 <p className="text-lg font-semibold" style={{ color: s.c.text }}>{s.v}</p>
 <p className="text-[9px] font-semibold text-slate-500">{s.l}</p>
 </div>
 ))}
 </div>
 {/* Heatmap */}
 <div className="overflow-x-auto pb-1">
 <StreakHeatmap data={streakHeatmap} />
 </div>
 {/* Recent activity bars */}
 <div className="pt-2 border-t border-slate-100">
 <p className="text-[10px] font-semibold text-slate-500 mb-3">Activity Score – Last 7 Days</p>
 <BarChart data={weeklyForm} valueKey="score" maxVal={100} color={C.streak} suffix="%" />
 </div>
 </GraphCard>

 {/* ═══════════════════════════════════════════════════════
 GHOST MODE + SESSION LOGS
 ═══════════════════════════════════════════════════════ */}
 <div className="bg-[#FAF5E8]/95 border-3 border-purple-400 rounded-[2rem] p-5 flex items-center justify-between text-slate-900">
 <div className="flex items-center gap-3">
 <div className="p-3 rounded-2xl bg-purple-100 text-purple-700 shrink-0">
 <Zap className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-purple-900">Ghost Mode Benchmark</h4>
 <p className="text-xs text-slate-600 font-semibold">Compare reps vs. your personal best (2.1s/rep, 94% form).</p>
 </div>
 </div>
 <button onClick={toggleGhostMode}
 className="px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow"
 style={isGhostModeActive
 ? { background:'linear-gradient(135deg,#8B5CF6,#6D28D9)', color:'#fff', boxShadow:'0 4px 16px rgba(139,92,246,0.4)' }
 : { background:'rgba(139,92,246,0.08)', color:'#6D28D9', border:'1.5px solid rgba(139,92,246,0.25)' }}>
 {isGhostModeActive ? '✦ Active' : 'Enable'}
 </button>
 </div>

 <div className="space-y-2.5">
 <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 font-heading">
 <Calendar className="w-5 h-5" style={{ color: C.exercise.text }} /> Recent Sessions
 </h2>
 {logs.map((log, idx) => (
 <div key={log.id || idx}
 className="bg-[#FAF5E8]/95 backdrop-blur-xl border-2 border-slate-200 hover:border-[#E50914] rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-md motion-card text-slate-900">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-xl" style={{ background: C.exercise.bg }}>
 <Dumbbell className="w-4 h-4" style={{ color: C.exercise.text }} />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-slate-900">{log.exercise_name}</h4>
 <p className="text-[10px] text-slate-500 font-semibold">{log.created_at} · {log.duration_seconds || 45}s</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="text-right">
 <p className="text-base font-semibold text-slate-800">{log.reps} Reps</p>
 <p className="text-[10px] font-semibold" style={{ color: C.form.text }}>{log.form_score}% Form</p>
 </div>
 {log.fatigue_triggers > 0 && (
 <span className="badge" style={{ background: C.exercise.bg, color: C.exercise.text, border:`1px solid ${C.exercise.glow}` }}>
 <ShieldAlert className="w-3 h-3" /> Flag
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
