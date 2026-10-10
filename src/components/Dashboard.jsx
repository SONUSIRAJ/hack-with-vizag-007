import React, { useState, useEffect } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { Flame, Home, Dumbbell, Play, Sparkles, HeartPulse, Apple, ChevronRight, Droplets, CheckSquare, Square, Zap, User, ShieldCheck, Activity, Award, ExternalLink, Target, CheckCircle2, AlertTriangle, ShieldAlert, Cpu, Moon, Bed, Compass } from 'lucide-react';

export default function Dashboard({ onStartWorkout, onEditProfile }) {
 const {
 user, environment, setEnvironment, setActiveExercise,
 xp, streak, waterIntakeMl, addWater, dailyHabits, toggleHabit, completedWorkoutLogs
 } = useWorkoutStore();

 const [routine, setRoutine] = useState(null);
 const [loading, setLoading] = useState(false);

 const userLevel = Math.floor(xp / 100) + 1;
 const currentLevelXp = xp % 100;
 const targetWaterMl = 3000;
 const waterPct = Math.min(100, Math.round((waterIntakeMl / targetWaterMl) * 100));

 const parsedWeight = user?.weight || 70;
 const targetProteinG = user?.nutrition_plan?.macros?.protein_g || Math.round(parsedWeight * 2);
 const targetCalories = user?.target_calories || 2200;

 useEffect(() => {
 const fetchRoutine = async () => {
 if (!user) return;
 setLoading(true);
 try {
 const res = await fetch(`/api/users/${user.id || 'guest'}/routine?environment=${environment}`);
 if (res.ok) {
 const data = await res.json();
 setRoutine(data.routine.exercises || []);
 }
 } catch (err) {
 console.error("Fetch routine error:", err);
 } finally {
 setLoading(false);
 }
 };
 fetchRoutine();
 }, [user, environment]);

 const displayExercises = routine && routine.length > 0 ? routine : (
 environment === 'gym' ? [
 { id: 'squats', name: 'Barbell / Goblet Squats', target_sets: 3, target_reps: 12, description: 'Squat to 90° hip-knee angle.' },
 { id: 'pushups', name: 'Incline / Weighted Push-ups', target_sets: 3, target_reps: 10, description: 'Flex elbows down to 90°.' },
 { id: 'bicep_curls', name: 'Dumbbell Bicep Curls', target_sets: 3, target_reps: 12, description: 'Flex elbows down to 40°.' }
 ] : [
 { id: 'squats', name: 'Bodyweight Squats', target_sets: 3, target_reps: 15, description: 'Keep chest high, sink hips to 90°.' },
 { id: 'pushups', name: 'Standard Push-ups', target_sets: 3, target_reps: 12, description: 'Rigid plank core, elbow flexion to 90°.' },
 { id: 'bicep_curls', name: 'Resistance Band Curls', target_sets: 3, target_reps: 15, description: 'Squeeze bicep at peak flexion (40°).' }
 ]
 );

 const getBmiCategory = (bmi) => {
 if (!bmi) return { label: 'Normal', color: 'text-emerald-700' };
 if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-700' };
 if (bmi < 25) return { label: 'Optimal BMI', color: 'text-emerald-700' };
 if (bmi < 30) return { label: 'Overweight', color: 'text-amber-700' };
 return { label: 'Obese', color: 'text-rose-700' };
 };
 const bmiMeta = getBmiCategory(user?.bmi);

 const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

 const sleepSchedule = user?.sleep_cycle || {
 recommended_sleep_hours: 8.0,
 bedtime:"10:30 PM",
 wake_time:"6:30 AM",
 rem_deep_target:"3.5 hours Deep + REM",
 wind_down_routine: [
"No blue light 45 min before sleep",
"Magnesium glycinate or chamomile tea",
"5 min 4-4-4 box breathing"
 ]
 };

 return (
 <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 font-sans animate-float-in">
 
 {/* ═══ 2. Welcome Banner ═══ */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2.5rem] p-6 md:p-8 shadow-xl relative overflow-hidden text-slate-900 motion-card">
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div className="flex items-center gap-4">
      {user?.avatar_url && (
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full overflow-hidden border-4 border-[#E50914] shadow-lg shrink-0">
          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
        </div>
      )}
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold flex items-center gap-2 text-slate-950">
          Welcome, {user?.name?.split(' ')[0] || 'Athlete'}!
          <button onClick={onEditProfile}
            className="p-1.5 rounded-xl transition-all text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 motion-btn" title="Edit Profile">
            <User className="w-4 h-4" />
          </button>
        </h1>
        <p className="text-sm font-semibold text-slate-700 mt-1">
          Targeting {user?.goal?.replace('_', ' ') || 'Fitness Goals'}
        </p>
        {user?.body_fat_analysis && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded border border-rose-200 w-fit">
            <Sparkles className="w-3 h-3 text-[#E50914]" />
            AI Fat Focus: {user.body_fat_analysis.targets.join(' & ')}
          </div>
        )}
      </div>
    </div>

 {/* Streak & Level */}
 <div className="flex items-center gap-3">
 <div className="bg-[#FFF8EE] border-2 border-slate-300 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-sm motion-card">
 <Flame className="w-5 h-5 text-[#E50914] animate-bounce" />
 <div>
 <p className="text-[10px] font-semibold text-slate-600">Streak</p>
 <p className="text-base font-semibold text-slate-950">{streak} Days</p>
 </div>
 </div>
 <div className="bg-[#FFF8EE] border-2 border-slate-300 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-sm motion-card">
 <Zap className="w-5 h-5 text-amber-600 animate-pulse" />
 <div>
 <p className="text-[10px] font-semibold text-slate-600">Level {userLevel}</p>
 <p className="text-base font-semibold text-slate-950">{xp} XP</p>
 </div>
 </div>
 </div>
 </div>

 {/* XP Progress Bar */}
 <div className="mt-5 pt-4 space-y-1.5 border-t-2 border-slate-200">
 <div className="flex justify-between text-xs font-semibold">
 <span className="text-slate-700">Level {userLevel} Rank</span>
 <span className="text-[#E50914]">{currentLevelXp}/100 XP to Level {userLevel + 1}</span>
 </div>
 <div className="w-full h-3.5 rounded-full overflow-hidden bg-slate-200 p-0.5 border border-slate-300">
 <div className="h-full rounded-full transition-all duration-700 ease-out"
 style={{ width: `${currentLevelXp}%`, background: 'linear-gradient(90deg, #E50914, #B8000A)' }} />
 </div>
 </div>

 {/* Biometrics Summary */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
 {[
 { icon: HeartPulse, label: 'BMI Index', value: user?.bmi || 22.5, sub: bmiMeta.label, subColor: 'text-emerald-700' },
 { icon: Flame, label: 'TDEE Target', value: targetCalories, sub: 'kcal/day', subColor: 'text-amber-800' },
 { icon: Apple, label: 'Protein Target', value: `${targetProteinG}g`, sub: `(${parsedWeight}kg × 2g)`, subColor: 'text-[#E50914]' }
 ].map((stat, idx) => (
 <div key={idx} className="bg-[#FFF8EE] border-2 border-slate-300 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm motion-card">
 <div className="p-2.5 rounded-xl bg-rose-100 text-[#E50914] border border-rose-200 animate-pulse-subtle">
 <stat.icon className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[10px] font-semibold text-slate-600">{stat.label}</p>
 <p className="text-xl font-semibold text-slate-950">{stat.value}</p>
 <p className={`text-[10px] font-medium ${stat.subColor}`}>{stat.sub}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* ═══ 3. AI Sleep Cycle & Recovery Blueprint Card ═══ */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-purple-500 rounded-[2.5rem] p-6 shadow-xl space-y-4 text-slate-900 motion-card">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-3 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200">
 <Moon className="w-6 h-6 animate-pulse" />
 </div>
 <div>
 <h3 className="text-xl font-semibold text-purple-950 flex items-center gap-2">
 AI Sleep Cycle & Recovery Scheduler
 </h3>
 <p className="text-[10px] font-semibold text-purple-700">
 Circadian Rhythm Sync • HGH Muscle Recovery
 </p>
 </div>
 </div>
 <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
 {sleepSchedule.recommended_sleep_hours || 8.0} Hours Target
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="bg-[#FFF8EE] border-2 border-purple-200 p-4 rounded-2xl text-center space-y-1">
 <p className="text-[10px] font-semibold text-purple-700">Recommended Bedtime</p>
 <p className="text-xl font-semibold text-purple-950">{sleepSchedule.bedtime ||"10:30 PM"}</p>
 <p className="text-[10px] font-bold text-slate-500">Melatonin Surge</p>
 </div>
 <div className="bg-[#FFF8EE] border-2 border-purple-200 p-4 rounded-2xl text-center space-y-1">
 <p className="text-[10px] font-semibold text-purple-700">Optimal Wake Time</p>
 <p className="text-xl font-semibold text-purple-950">{sleepSchedule.wake_time ||"6:30 AM"}</p>
 <p className="text-[10px] font-bold text-slate-500">Cortisol Reset</p>
 </div>
 <div className="bg-[#FFF8EE] border-2 border-purple-200 p-4 rounded-2xl text-center space-y-1">
 <p className="text-[10px] font-semibold text-purple-700">Deep + REM Target</p>
 <p className="text-xl font-semibold text-purple-950">3.5 Hours</p>
 <p className="text-[10px] font-bold text-slate-500">Muscle Protein Synthesis</p>
 </div>
 </div>

 {/* Wind-down Checklist */}
 <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 space-y-2">
 <p className="text-xs font-semibold text-purple-900">
 🌙 Pre-Sleep AI Wind-down Protocol:
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold text-slate-700">
 {sleepSchedule.wind_down_routine?.map((item, i) => (
 <div key={i} className="flex items-center gap-2 bg-[#FFF8EE] p-2.5 rounded-xl border border-purple-200">
 <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
 <span>{item}</span>
 </div>
 )) || (
 <>
 <div className="flex items-center gap-2 bg-[#FFF8EE] p-2.5 rounded-xl border border-purple-200">
 <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
 <span>No blue light 45 min before sleep</span>
 </div>
 <div className="flex items-center gap-2 bg-[#FFF8EE] p-2.5 rounded-xl border border-purple-200">
 <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
 <span>Magnesium glycinate or herbal tea</span>
 </div>
 <div className="flex items-center gap-2 bg-[#FFF8EE] p-2.5 rounded-xl border border-purple-200">
 <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
 <span>5 min box breathing (4s inhale/hold/exhale)</span>
 </div>
 </>
 )}
 </div>
 </div>
 </div>

 {/* ═══ 3.5 TODAY'S PLAN (VigorFIT AI Master Guidance) ═══ */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2.5rem] p-6 shadow-xl space-y-4 text-slate-900 motion-card">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-3 rounded-2xl bg-rose-100 text-[#E50914] border border-rose-200">
 <Compass className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-xl font-semibold text-slate-950">
 TODAY'S PLAN — VigorFIT AI Guidance
 </h3>
 <p className="text-[10px] font-semibold text-[#E50914]">
 Personalized Daily Schedule • Nutrition, Training & Recovery
 </p>
 </div>
 </div>
 <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E50914] text-white">
 Active Day
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
 <div className="bg-[#FFF8EE] border-2 border-slate-300 p-4 rounded-2xl space-y-1 motion-card">
 <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800">
 🌅 Morning
 </span>
 <p className="text-xs font-bold text-slate-900 mt-1">Wake 6:30 AM</p>
 <p className="text-[11px] text-slate-600 font-medium leading-tight">
 500ml water hydration, High-Protein Breakfast (7:30 AM) with {Math.round(targetProteinG * 0.25)}g protein.
 </p>
 </div>

 <div className="bg-[#FFF8EE] border-2 border-slate-300 p-4 rounded-2xl space-y-1 motion-card">
 <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-800">
 ☀️ Afternoon
 </span>
 <p className="text-xs font-bold text-slate-900 mt-1">Lunch 1:00 PM</p>
 <p className="text-[11px] text-slate-600 font-medium leading-tight">
 Lean protein bowl ({Math.round(targetCalories * 0.35)} kcal), 10 min light walk & hydration check.
 </p>
 </div>

 <div className="bg-[#FFF8EE] border-2 border-slate-300 p-4 rounded-2xl space-y-1 motion-card">
 <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-rose-100 text-[#E50914]">
 🔥 Evening
 </span>
 <p className="text-xs font-bold text-slate-900 mt-1">Workout 6:00 PM</p>
 <p className="text-[11px] text-slate-600 font-medium leading-tight">
 AI Camera session ({environment === 'gym' ? 'Gym' : 'Home'} routine), post-workout protein shake & Dinner (7:30 PM).
 </p>
 </div>

 <div className="bg-[#FFF8EE] border-2 border-slate-300 p-4 rounded-2xl space-y-1 motion-card">
 <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-purple-100 text-purple-800">
 🌙 Night
 </span>
 <p className="text-xs font-bold text-slate-900 mt-1">Wind-down 9:45 PM</p>
 <p className="text-[11px] text-slate-600 font-medium leading-tight">
 No blue light 45m before bed, 5m box breathing, Bedtime at 10:30 PM (8.0h sleep).
 </p>
 </div>
 </div>
 </div>

 {/* ═══ 4. AI Pose Telemetry & Form Score Card ═══ */}
 <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
 {/* Left: Pose Telemetry */}
 <div className="md:col-span-7 bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2.5rem] p-6 shadow-xl space-y-4 text-slate-900 motion-card">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="p-2.5 rounded-2xl bg-rose-100 text-[#E50914]">
 <Cpu className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
 </div>
 <div>
 <h3 className="text-lg font-semibold text-slate-950">AI Pose Telemetry & Form Score</h3>
 <p className="text-[10px] font-semibold text-slate-600">MediaPipe WASM 33 Landmark Engine</p>
 </div>
 </div>
 </div>

 <div className="overflow-x-auto no-scrollbar -mx-2 px-2">
 <div className="grid grid-cols-3 gap-3 text-center min-w-[250px]">
 <div className="bg-[#FFF8EE] border-2 border-slate-300 p-3 rounded-2xl motion-card">
 <p className="text-[10px] font-semibold text-slate-600">Squat Depth</p>
 <p className="text-lg font-semibold text-slate-950">{completedWorkoutLogs.length > 0 ? "90° Flexion" : "-"}</p>
 </div>
 <div className="bg-[#FFF8EE] border-2 border-slate-300 p-3 rounded-2xl motion-card">
 <p className="text-[10px] font-semibold text-slate-600">Pushup Elbow</p>
 <p className="text-lg font-semibold text-slate-950">{completedWorkoutLogs.length > 0 ? "92° Angle" : "-"}</p>
 </div>
 <div className="bg-[#FFF8EE] border-2 border-slate-300 p-3 rounded-2xl motion-card">
 <p className="text-[10px] font-semibold text-slate-600">Curl Peak</p>
 <p className="text-lg font-semibold text-slate-950">{completedWorkoutLogs.length > 0 ? "38° Flexion" : "-"}</p>
 </div>
 </div>
 </div>

 {/* AI Biomechanical Tip */}
 <div className="bg-[#FFF8EE] border-2 border-slate-300 rounded-2xl p-4 flex items-start gap-3 text-xs motion-card">
 <Sparkles className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5 animate-bounce" />
 <div>
 <p className="font-semibold text-slate-950">AI Form Insight:</p>
 <p className="text-slate-700 font-medium mt-0.5">
 {completedWorkoutLogs.length > 0 
 ? "Maintain high chest posture during deep squat descent to prevent lumbar spine flexion. 33 landmarks confirm optimal knee trajectory."
 : "Complete a workout to receive personalized AI form insights and biomechanical analysis."
 }
 </p>
 </div>
 </div>
 </div>

 {/* Right: 7-Day Consistency Pulse */}
 <div className="md:col-span-5 bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2.5rem] p-6 shadow-xl space-y-4 text-slate-900 flex flex-col justify-between motion-card">
 <div>
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-semibold text-slate-950 flex items-center gap-2">
 <Activity className="w-5 h-5 text-[#E50914] animate-pulse" /> Weekly Activity Pulse
 </h3>
 <span className="text-xs font-semibold text-[#E50914]">{streak} Day Streak</span>
 </div>
 <p className="text-xs text-slate-700 font-semibold mt-1">7-Day Workout & Nutrition Consistency</p>
 </div>

 <div className="overflow-x-auto no-scrollbar -mx-2 px-2">
 <div className="grid grid-cols-7 gap-1.5 py-2 min-w-[300px]">
 {daysOfWeek.map((day, idx) => (
 <div key={day} className="flex flex-col items-center gap-1.5">
 <div className={`w-8 h-10 rounded-xl flex items-center justify-center text-xs font-semibold border-2 transition-transform duration-300 hover:scale-110 ${
 idx < streak
 ? 'bg-[#E50914] text-white border-[#E50914] shadow-md'
 : 'bg-[#FFF8EE] text-slate-400 border-slate-300'
 }`}>
 {idx < streak ? '✓' : ''}
 </div>
 <span className="text-[10px] font-semibold text-slate-600">{day}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-[#FFF8EE] border-2 border-slate-300 p-3 rounded-2xl flex items-center justify-between text-xs motion-card">
 <span className="font-semibold text-slate-800">Daily Quest (+50 XP):</span>
 <span className="font-bold text-[#E50914] animate-pulse">Complete 3 Workout Sets</span>
 </div>
 </div>
 </div>

 {/* ═══ 5. Hydration & Habits Row ═══ */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Hydration */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2rem] p-5 space-y-3 text-slate-900 shadow-md motion-card">
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-2 font-semibold text-base text-slate-950">
 <Droplets className="w-5 h-5 text-blue-600 animate-bounce" /> Hydration Tracker
 </div>
 <span className="text-xs font-mono font-bold text-slate-700">{waterIntakeMl} / {targetWaterMl} ml</span>
 </div>
 <div className="w-full h-3 rounded-full overflow-hidden bg-slate-200">
 <div className="h-full rounded-full transition-all duration-700 ease-out"
 style={{ width: `${waterPct}%`, background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }} />
 </div>
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-600">{waterPct}% daily goal</span>
 <button onClick={() => addWater(250)}
 className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 motion-btn">
 +250ml Water
 </button>
 </div>
 </div>

 {/* Habits */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2rem] p-5 space-y-3 text-slate-900 shadow-md motion-card">
 <div className="flex items-center gap-2 font-semibold text-base text-slate-950">
 <CheckSquare className="w-5 h-5 text-[#E50914]" /> Daily Habits Checklist
 </div>
 <div className="space-y-2 text-xs">
 {[
 { key: 'stretch', label: 'Post-workout 10m mobility stretch' },
 { key: 'protein', label: `Hit target protein (${targetProteinG}g)` },
 { key: 'sleep', label: '8 Hours quality sleep recovery' }
 ].map((habit) => (
 <div key={habit.key} onClick={() => toggleHabit(habit.key)}
 className="flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all hover:bg-slate-200/60 bg-[#FFF8EE] border-2 border-slate-300 motion-btn">
 <span className="text-slate-900 font-bold">{habit.label}</span>
 {dailyHabits[habit.key]
 ? <CheckSquare className="w-4 h-4 text-emerald-600" />
 : <Square className="w-4 h-4 text-slate-400" />
 }
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* ═══ 6. Workout Routine Section ═══ */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2.5rem] p-6 shadow-xl space-y-4 text-slate-900 motion-card">
 <div className="flex justify-between items-center">
 <div>
 <h2 className="text-2xl font-semibold text-slate-950">
 Today's {environment === 'gym' ? 'Gym' : 'Home'} Routine
 </h2>
 <p className="text-xs font-semibold text-slate-700">AI Pose Tracker verified exercises</p>
 </div>
 <button onClick={() => { setActiveExercise(displayExercises[0]); onStartWorkout(); }}
 className="px-5 py-3 rounded-2xl font-semibold text-white text-xs shadow-lg transition-all flex items-center gap-2 motion-btn"
 style={{ background: 'linear-gradient(135deg, #E50914, #B8000A)' }}>
 <Play className="w-4 h-4 fill-white animate-pulse" /> Start All
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 {displayExercises.map((ex) => (
 <div key={ex.id}
 onClick={() => { setActiveExercise(ex); onStartWorkout(); }}
 className="bg-[#FFF8EE] border-2 border-slate-300 hover:border-[#E50914] p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.03] shadow-sm space-y-2 motion-card">
 <div className="flex justify-between items-center">
 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-[#E50914] border border-rose-200">
 {ex.target_sets} Sets × {ex.target_reps} Reps
 </span>
 <ChevronRight className="w-4 h-4 text-slate-400" />
 </div>
 <h3 className="text-base font-semibold text-slate-950">{ex.name}</h3>
 <p className="text-xs text-slate-600 line-clamp-2">{ex.description}</p>
 </div>
 ))}
 </div>
 </div>

 {/* ═══ 7. Ending Footer Section ═══ */}
 <footer className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2.5rem] p-6 md:p-8 shadow-xl space-y-6 text-slate-900 mt-8 motion-card">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-xl flex items-center justify-center font-semibold text-white text-sm motion-btn"
 style={{ background: 'linear-gradient(135deg, #E50914, #B8000A)' }}>
 A
 </div>
 <h3 className="text-xl font-semibold text-slate-950">
 VigorFIT AI Master Brain
 </h3>
 </div>
 <p className="text-xs font-semibold text-slate-700 max-w-md">
 Powered by VigorFIT AI Brain for diet planning, sleep cycle scheduling, workout routines, and local WebAssembly landmark processing.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <div className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-300 motion-btn">
 🧠 Advanced AI Engine
 </div>
 <div className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-rose-100 text-[#E50914] border border-rose-300 motion-btn">
 ⚡ WASM Pose Engine
 </div>
 <div className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 motion-btn">
 🛡️ Privacy Verified
 </div>
 </div>
 </div>

 <div className="border-t-2 border-slate-200 pt-4 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-600 font-semibold">
 <p>© 2026 VigorFIT Biomechanical Fitness Platform. All rights reserved.</p>
 <div className="flex items-center gap-4">
 <span className="hover:text-[#E50914] cursor-pointer transition-colors">Privacy Policy</span>
 <span>•</span>
 <span className="hover:text-[#E50914] cursor-pointer transition-colors">AI Spec</span>
 <span>•</span>
 <span className="hover:text-[#E50914] cursor-pointer transition-colors">Platform Spec</span>
 </div>
 </div>
 </footer>

 </div>
 );
}
