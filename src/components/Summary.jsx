import React, { useState, useEffect } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { Trophy, ShieldCheck, ArrowRight, RotateCcw, Flame, Star, Zap } from 'lucide-react';

export default function Summary({ onRestartWorkout, onGoHome }) {
  const {
    user, activeExercise, currentRepCount, currentFormScore,
    formScoreHistory, fatigueTriggers, sessionStartTime,
    framesProcessed, saveWorkoutToHistory, xp, streak
  } = useWorkoutStore();

  const [saved, setSaved] = useState(false);

  // Safe access — activeExercise always has defaults from store
  const exerciseName = activeExercise?.name || 'Workout';
  const exerciseId   = activeExercise?.id   || 'unknown';

  const durationSeconds = sessionStartTime
    ? Math.max(1, Math.round((Date.now() - sessionStartTime) / 1000))
    : 0;

  const avgFormScore = formScoreHistory.length > 0
    ? Math.round(formScoreHistory.reduce((a, b) => a + b, 0) / formScoreHistory.length)
    : Math.max(currentFormScore, 80);

  const earnedXpTotal = formScoreHistory.reduce(
    (sum, s) => sum + (s >= 80 ? 10 : 5), 0
  );

  useEffect(() => {
    if (saved) return; // prevent double-save on StrictMode double-render
    setSaved(true);

    const sessionLog = {
      id: `log-${Date.now()}`,
      exercise_type: exerciseId,
      exercise_name: exerciseName,
      reps: currentRepCount,
      form_score: avgFormScore,
      fatigue_triggers: fatigueTriggers?.length || 0,
      duration_seconds: durationSeconds,
      created_at: new Date().toLocaleDateString('en-IN', {
        month: 'short', day: 'numeric', year: 'numeric'
      }),
    };

    saveWorkoutToHistory(sessionLog);

    // Async log to backend (fire-and-forget, no crash if offline)
    fetch('/api/workouts/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user?.id || 'guest',
        exercise_type: exerciseId,
        reps: currentRepCount,
        form_score: avgFormScore,
        fatigue_triggers: fatigueTriggers?.length || 0,
        duration_seconds: durationSeconds,
        details: { frames_processed_client_side: framesProcessed, video_frames_transmitted: 0 },
      }),
    }).catch(() => {}); // silently ignore offline
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const grade =
    avgFormScore >= 95 ? { label: 'S Rank', color: '#F59E0B', emoji: '🥇' } :
    avgFormScore >= 85 ? { label: 'A Rank', color: '#10B981', emoji: '🥈' } :
    avgFormScore >= 70 ? { label: 'B Rank', color: '#3B82F6', emoji: '🥉' } :
                         { label: 'C Rank', color: '#94A3B8', emoji: '🏅' };

  const stats = [
    { value: currentRepCount,     label: 'Total Reps',    color: '#E50914' },
    { value: `${avgFormScore}%`,  label: 'Avg Form',      color: avgFormScore >= 80 ? '#10B981' : '#D97706' },
    { value: fatigueTriggers?.length || 0, label: 'Fatigue Events', color: '#F59E0B' },
    { value: `${durationSeconds}s`, label: 'Duration',     color: '#8B5CF6' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-12 animate-float-in">

      {/* ─── Completion Hero ─── */}
      <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2.5rem] p-8 text-center space-y-5 text-slate-900 shadow-xl">
        {/* Trophy + Grade */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-xl"
               style={{ background: 'linear-gradient(135deg, #E50914, #B8000A)' }}>
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <div className="px-4 py-1.5 rounded-full text-sm font-black"
               style={{ background: `${grade.color}22`, color: grade.color, border: `1.5px solid ${grade.color}55` }}>
            {grade.emoji} {grade.label}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-slate-950 font-heading italic">Workout Complete!</h1>
          <p className="text-sm mt-1 text-slate-600 font-semibold">
            {exerciseName} · {streak} Day Streak 🔥
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {stats.map((s, i) => (
            <div key={i} className="bg-[#FFF8EE] border-2 border-slate-200 p-4 rounded-2xl">
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] uppercase font-black text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* XP Earned Banner */}
        {earnedXpTotal > 0 && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-50 border-2 border-amber-200">
            <Zap className="w-5 h-5 text-amber-600" />
            <span className="text-lg font-black text-amber-800">+{earnedXpTotal} XP Earned!</span>
            <span className="text-xs text-amber-600 font-semibold">Total: {xp} XP</span>
          </div>
        )}
      </div>

      {/* ─── Privacy Card ─── */}
      <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-emerald-400 rounded-[2rem] p-5 flex items-center gap-4 text-slate-900">
        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-black text-emerald-800">100% On-Device Privacy</h4>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            {framesProcessed} frames analyzed via WASM. <strong>0 video frames transmitted.</strong>
          </p>
        </div>
      </div>

      {/* ─── Action Buttons ─── */}
      <div className="flex gap-3">
        <button
          onClick={onRestartWorkout}
          className="flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all border-3 border-slate-300 bg-[#FFF8EE] text-slate-800 hover:border-[#E50914] hover:scale-[1.02]"
        >
          <RotateCcw className="w-5 h-5" /> Another Set
        </button>
        <button
          onClick={onGoHome}
          className="flex-1 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg"
          style={{ background: 'linear-gradient(135deg, #E50914, #B8000A)' }}
        >
          Dashboard <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
