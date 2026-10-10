import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
};

const safeSet = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

// ─── Store ────────────────────────────────────────────────────────────────────
export const useWorkoutStore = create((set, get) => ({

  // ── User Profile ─────────────────────────────────────────────────────────
  // null = not onboarded yet (shows Onboarding screen)
  user: safeGet('ai_fitness_user', null),
  authToken: safeGet('ai_fitness_auth_token', null),

  setUser: (userData, token = null) => {
    safeSet('ai_fitness_user', userData);
    if (token) {
      safeSet('ai_fitness_auth_token', token);
    }
    set({ user: userData, ...(token ? { authToken: token } : {}) });
  },

  updateUser: (updates) => set((state) => {
    if (state.user) {
      const next = { ...state.user, ...updates };
      safeSet('ai_fitness_user', next);
      return { user: next };
    }
    return {};
  }),

  logout: () => {
    try {
      localStorage.removeItem('ai_fitness_user');
      localStorage.removeItem('ai_fitness_auth_token');
    } catch {}
    set({
      user: null,
      authToken: null,
      isWorkoutActive: false,
      rerouteData: null,
      isFatigued: false,
    });
  },

  // ── Gamification ──────────────────────────────────────────────────────────
  xp:     safeGet('ai_fitness_xp', 0),
  streak: safeGet('ai_fitness_streak', 0),

  addXp: (amount) => set((state) => {
    const newXp = state.xp + amount;
    safeSet('ai_fitness_xp', newXp);
    return { xp: newXp };
  }),

  incrementStreak: () => set((state) => {
    const newStreak = state.streak + 1;
    safeSet('ai_fitness_streak', newStreak);
    return { streak: newStreak };
  }),

  // ── Voice ─────────────────────────────────────────────────────────────────
  voiceEnabled: safeGet('ai_fitness_voice', true),

  toggleVoiceEnabled: () => {
    const next = !get().voiceEnabled;
    safeSet('ai_fitness_voice', next);
    set({ voiceEnabled: next });
  },

  // ── AI Chat Messages ───────────────────────────────────────────────────────
  chatMessages: safeGet('ai_fitness_chat_messages', []),

  setChatMessages: (messages) => set(() => {
    safeSet('ai_fitness_chat_messages', messages);
    return { chatMessages: messages };
  }),

  clearChatMessages: () => set(() => {
    safeSet('ai_fitness_chat_messages', []);
    return { chatMessages: [] };
  }),

  // ── Hydration ─────────────────────────────────────────────────────────────
  waterIntakeMl: safeGet('ai_fitness_water', 0),

  addWater: (amountMl = 250) => set((state) => {
    const next = Math.min(4000, state.waterIntakeMl + amountMl);
    safeSet('ai_fitness_water', next);
    return { waterIntakeMl: next };
  }),

  resetWater: () => {
    safeSet('ai_fitness_water', 0);
    set({ waterIntakeMl: 0 });
  },

  // ── Daily Habits ──────────────────────────────────────────────────────────
  dailyHabits: safeGet('ai_fitness_habits', { stretch: false, sleep: true, protein: true }),

  toggleHabit: (key) => set((state) => {
    const updated = { ...state.dailyHabits, [key]: !state.dailyHabits[key] };
    safeSet('ai_fitness_habits', updated);
    return { dailyHabits: updated };
  }),

  // ── Workout History ───────────────────────────────────────────────────────
  completedWorkoutLogs: [], // Loaded asynchronously

  loadWorkoutLogs: async () => {
    try {
      const logs = await idbGet('ai_fitness_logs');
      if (logs) set({ completedWorkoutLogs: logs });
    } catch (e) {
      console.error('Failed to load logs from IDB', e);
    }
  },

  saveWorkoutToHistory: (sessionLog) => set((state) => {
    const nextLogs = [sessionLog, ...state.completedWorkoutLogs].slice(0, 50); // cap at 50
    
    // Save to IndexedDB asynchronously
    idbSet('ai_fitness_logs', nextLogs).catch(e => console.error('Failed to save logs to IDB', e));

    // Also increment streak on workout save
    const newStreak = state.streak + 1;
    safeSet('ai_fitness_streak', newStreak);
    return { completedWorkoutLogs: nextLogs, streak: newStreak };
  }),

  clearHistory: () => {
    idbSet('ai_fitness_logs', []).catch(e => console.error('Failed to clear logs from IDB', e));
    set({ completedWorkoutLogs: [] });
  },

  // ── Ghost Mode ────────────────────────────────────────────────────────────
  isGhostModeActive: safeGet('ai_fitness_ghost', true),

  toggleGhostMode: () => set((state) => {
    const next = !state.isGhostModeActive;
    safeSet('ai_fitness_ghost', next);
    return { isGhostModeActive: next };
  }),

  ghostSession: {
    exerciseName: 'Bodyweight Squats',
    bestRepSpeedSec: 2.1,
    bestFormScore: 94,
  },

  // ── Exercise Environment ──────────────────────────────────────────────────
  environment: safeGet('ai_fitness_env', 'gym'),

  setEnvironment: (env) => {
    safeSet('ai_fitness_env', env);
    set({ environment: env });
  },

  // ── Active Exercise ───────────────────────────────────────────────────────
  activeExercise: {
    id: 'squats',
    name: 'Bodyweight Squats',
    targetReps: 15,
    target_sets: 3,
    target_reps: 15,
    angleKey: 'hip_knee_ankle',
    description: 'Keep chest high, sink hips to 90°.',
  },

  setActiveExercise: (exercise) => set({
    activeExercise: {
      ...exercise,
      targetReps: exercise.targetReps || exercise.target_reps || 12,
    },
  }),

  // ── Session Control ───────────────────────────────────────────────────────
  isWorkoutActive: false,
  sessionStartTime: null,

  startSession: () => set({
    isWorkoutActive: true,
    sessionStartTime: Date.now(),
    currentRepCount: 0,
    currentFormScore: 100,
    formScoreHistory: [],
    fatigueTriggers: [],
    repVelocities: [],
    lastRepTimestamp: Date.now(),
    rerouteData: null,
    restTimerSeconds: 0,
    isFatigued: false,
    framesProcessed: 0,
  }),

  stopSession: () => set({ isWorkoutActive: false }),

  // ── Rest Timer ────────────────────────────────────────────────────────────
  restTimerSeconds: 0,
  startRestTimer: (seconds = 45) => set({ restTimerSeconds: seconds }),
  decrementRestTimer: () => set((state) => ({
    restTimerSeconds: Math.max(0, state.restTimerSeconds - 1),
  })),

  // ── Real-time Pose Metrics ────────────────────────────────────────────────
  currentRepCount: 0,
  currentJointAngles: { primary: 180, left: 180, right: 180 },
  currentFormScore: 100,
  formScoreHistory: [],

  // ── Rep Velocity & Fatigue ────────────────────────────────────────────────
  lastRepTimestamp: null,
  repVelocities: [],
  fatigueTriggers: [],
  isFatigued: false,
  rerouteData: null,

  setRerouteData: (data) => set({ rerouteData: data, isFatigued: true }),

  // Award XP and detect fatigue on each completed rep
  registerCompletedRep: (formScore) => {
    const now = Date.now();
    const state = get();
    const lastTime = state.lastRepTimestamp || now;
    const repDuration = Math.max(0.1, (now - lastTime) / 1000.0);

    const newHistory = [...state.formScoreHistory, formScore];
    const newVelocities = [...state.repVelocities, repDuration];

    let velocityDropPct = 0;
    let fatigueDetected = false;

    if (newVelocities.length >= 5) {
      const baselineAvg = newVelocities.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const recentAvg = newVelocities.slice(-3).reduce((a, b) => a + b, 0) / 3;
      if (baselineAvg > 0) {
        velocityDropPct = ((recentAvg - baselineAvg) / baselineAvg) * 100;
        if (velocityDropPct >= 35.0 && !state.isFatigued) {
          fatigueDetected = true;
        }
      }
    }

    const newFatigueTriggers = fatigueDetected
      ? [...state.fatigueTriggers, now]
      : state.fatigueTriggers;

    const earnedXp = formScore >= 80 ? 10 : 5;
    const newXp = state.xp + earnedXp;
    safeSet('ai_fitness_xp', newXp);

    set({
      currentRepCount: state.currentRepCount + 1,
      currentFormScore: formScore,
      formScoreHistory: newHistory,
      repVelocities: newVelocities,
      lastRepTimestamp: now,
      fatigueTriggers: newFatigueTriggers,
      isFatigued: fatigueDetected ? true : state.isFatigued,
      xp: newXp,
    });

    return {
      fatigueDetected,
      velocityDropPct,
      newRepCount: state.currentRepCount + 1,
      earnedXp,
      repDuration,
    };
  },

  setJointAngles: (angles) => set({ currentJointAngles: angles }),

  // ── Privacy Counters ──────────────────────────────────────────────────────
  framesProcessed: 0,
  incrementFramesProcessed: () => set((state) => ({
    framesProcessed: state.framesProcessed + 1,
  })),
  videoFramesTransmitted: 0, // Always 0 — WASM local processing guarantee
}));
