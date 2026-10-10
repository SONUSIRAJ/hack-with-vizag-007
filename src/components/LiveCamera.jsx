import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useWorkoutStore } from '../store/workoutStore';
import { voiceCoach } from '../utils/VoiceCoach';
import { audioEffects } from '../utils/AudioEffects';
import { AlertTriangle, ShieldCheck, Activity, RefreshCw, Volume2, VolumeX, Zap, Timer, Play, Pause, Camera } from 'lucide-react';

export default function LiveCamera({ onFinishWorkout }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const lastInferenceTimeRef = useRef(0);
  const restIntervalRef = useRef(null);
  const simIntervalRef = useRef(null);
  const lowestAngleRef = useRef(180);
  const userTargetFlexRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [repStage, setRepStage] = useState('UP');
  const [currentAngle, setCurrentAngle] = useState(180);
  const [minFlexionAngle, setMinFlexionAngle] = useState(180);
  const [feedback, setFeedback] = useState('Position yourself in front of camera');
  const [isRerouting, setIsRerouting] = useState(false);
  const [xpPopups, setXpPopups] = useState([]);

  const requestWebcamAccess = async () => {
    try {
      setCameraError(null);
      setIsLoading(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: "user" } });
        setCameraGranted(true);
        setFeedback("Local camera permission granted! Scanning 33 MediaPipe body landmarks.");
        voiceCoach.speak("Access granted. Local camera active.");
      } else {
        setCameraGranted(true);
      }
    } catch (err) {
      console.warn("User Media Error:", err);
      setCameraError("Camera permission blocked or unavailable. Click 'Start Simulator' to run.");
    } finally {
      setIsLoading(false);
    }
  };

  const {
    activeExercise: rawActiveExercise, currentRepCount, currentFormScore, registerCompletedRep,
    setJointAngles, incrementFramesProcessed, isFatigued, rerouteData, setRerouteData,
    voiceEnabled, toggleVoiceEnabled, isGhostModeActive, ghostSession,
    restTimerSeconds, startRestTimer, decrementRestTimer
  } = useWorkoutStore();

  const activeExercise = rawActiveExercise || {
    id: 'squats',
    name: 'Bodyweight Squats',
    targetReps: 15,
    angleKey: 'hip_knee_ankle'
  };

  useEffect(() => { voiceCoach.setEnabled(voiceEnabled); audioEffects.setEnabled(voiceEnabled); }, [voiceEnabled]);
  useEffect(() => { voiceCoach.speak(`Starting ${activeExercise.name}. Stand in frame or use simulator.`, true); }, [activeExercise.name]);

  useEffect(() => {
    if (restTimerSeconds > 0) {
      restIntervalRef.current = setInterval(() => decrementRestTimer(), 1000);
    } else { clearInterval(restIntervalRef.current); }
    return () => clearInterval(restIntervalRef.current);
  }, [restTimerSeconds]);

  const calculateAngle = (a, b, c) => {
    if (!a || !b || !c) return 180;
    // Check visibility thresholds to avoid jitter when joints are hidden
    if ((a.visibility !== undefined && a.visibility < 0.4) ||
        (b.visibility !== undefined && b.visibility < 0.4) ||
        (c.visibility !== undefined && c.visibility < 0.4)) {
      return 180;
    }
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360.0 - angle;
    return Math.round(angle);
  };

  useEffect(() => {
    let isMounted = true;
    let timer = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn("MediaPipe load timeout safeguard (2.5s). Enabling interactive pose tracker.");
        setIsLoading(false);
      }
    }, 2500);

    const initMediaPipe = async () => {
      try {
        setIsLoading(true);
        setCameraError(null);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
        if (isMounted) {
          poseLandmarkerRef.current = landmarker;
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("Primary MediaPipe load warning, attempting fallback CDN:", err);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
          );
          const landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"
            },
            runningMode: "VIDEO",
            numPoses: 1
          });
          if (isMounted) {
            poseLandmarkerRef.current = landmarker;
            setIsLoading(false);
          }
        } catch (err2) {
          console.error("MediaPipe load error:", err2);
          if (isMounted) {
            setCameraError("Camera AI loading fallback active. Use 'Simulate' or '+1 Rep' to test tracking.");
            setIsLoading(false);
          }
        }
      }
    };
    initMediaPipe();
    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, []);

  const handleFatigueTrigger = async (velocityDropPct, repCount) => {
    setIsRerouting(true);
    setFeedback("Fatigue detected! Rerouting to recovery.");
    voiceCoach.speak("Fatigue detected! Switching to recovery mode.", true);
    audioEffects.playFatigueAlert();
    try {
      const res = await fetch('/api/ai/fatigue-reroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_exercise: activeExercise.name,
          completed_reps: repCount,
          target_reps: activeExercise.targetReps || 12,
          rep_velocity_drop_pct: velocityDropPct,
          avg_form_score: currentFormScore
        })
      });
      const data = await res.json();
      setRerouteData(data);
      if (data.coach_message) voiceCoach.speak(data.coach_message);
    } catch (err) {
      console.error("Fatigue API failed:", err);
    } finally {
      setIsRerouting(false);
    }
  };

  const toggleSimulator = () => {
    if (isSimulating) {
      setIsSimulating(false);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setFeedback("Simulator paused.");
    } else {
      setIsSimulating(true);
      setFeedback("Demo Simulation Active...");
      voiceCoach.speak("Simulation active.", true);
      let step = 0;
      simIntervalRef.current = setInterval(() => {
        step++;
        incrementFramesProcessed();
        const simAngle = step % 2 === 1 ? 75 : 170;
        setCurrentAngle(simAngle);
        setJointAngles({ primary: simAngle });
        setRepStage(step % 2 === 1 ? 'DOWN' : 'UP');

        if (step % 2 === 0) {
          const formScore = Math.floor(Math.random() * 15) + 85;
          const { fatigueDetected, velocityDropPct, newRepCount, earnedXp } = registerCompletedRep(formScore);
          audioEffects.playRepDing();
          voiceCoach.speak(`Rep ${newRepCount}! ${formScore >= 90 ? 'Great form!' : ''}`);
          setFeedback(`Simulated Rep ${newRepCount} (+${earnedXp} XP)`);

          const popId = Date.now();
          setXpPopups((prev) => [...prev, { id: popId, text: `+${earnedXp} XP` }]);
          setTimeout(() => setXpPopups((prev) => prev.filter((p) => p.id !== popId)), 1200);

          if (newRepCount === 5) handleFatigueTrigger(42.5, newRepCount);
        }
      }, 1400);
    }
  };

  const processFrame = useCallback(() => {
    if (isSimulating) return;
    const webcam = webcamRef.current;
    const canvas = canvasRef.current;
    const landmarker = poseLandmarkerRef.current;
    if (!webcam || !webcam.video || webcam.video.readyState < 2 || !canvas || !landmarker || restTimerSeconds > 0) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }
    const video = webcam.video;
    const now = performance.now();
    if (now - lastInferenceTimeRef.current >= 66) {
      lastInferenceTimeRef.current = now;
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        incrementFramesProcessed();
        const results = landmarker.detectForVideo(video, now);
        const ctx = canvas.getContext('2d');
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (results.landmarks && results.landmarks.length > 0) {
          drawSkeleton(ctx, results.landmarks[0], canvas.width, canvas.height);
          evaluateRep(results.landmarks[0]);
        } else {
          setFeedback('No pose detected. Move into camera frame.');
        }
      }
    }
    requestRef.current = requestAnimationFrame(processFrame);
  }, [activeExercise, repStage, minFlexionAngle, isFatigued, restTimerSeconds, isSimulating]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(processFrame);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [processFrame]);

  const evaluateRep = (landmarks) => {
    let angle = 180, targetFlex = 90, extensionThresh = 160;
    const eid = activeExercise.id.toLowerCase();

    // Exact SIH26196 locked specifications:
    // Squats: hip-knee-ankle angle; rep = extension (~170°+) to flexion (~90° or below)
    // Push-ups: shoulder-elbow-wrist angle; rep = extension (~160°+) to flexion (~90° or below)
    // Bicep Curls: shoulder-elbow-wrist angle; rep = extension (~160°+) to flexion (~40° or below)
    if (eid.includes('squat')) {
      const leftKnee = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
      const rightKnee = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
      angle = Math.min(leftKnee, rightKnee);
      targetFlex = 90;
      extensionThresh = 170;
    } else if (eid.includes('pushup')) {
      const leftElbow = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
      const rightElbow = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
      angle = (leftElbow + rightElbow) / 2;
      targetFlex = 90;
      extensionThresh = 160;
    } else {
      const leftBicep = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
      const rightBicep = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
      angle = Math.min(leftBicep, rightBicep);
      targetFlex = 40;
      extensionThresh = 160;
    }

    const r = Math.round(angle);
    setCurrentAngle(r);
    setJointAngles({ primary: r });

    // Apply dynamic user calibration if it exists
    if (userTargetFlexRef.current) {
      targetFlex = userTargetFlexRef.current;
    }

    if (repStage === 'UP') {
      if (r < lowestAngleRef.current) {
        lowestAngleRef.current = r;
      }
      
      if (r <= targetFlex + 10) {
        setRepStage('DOWN');
        setMinFlexionAngle(r);
        setFeedback('Good flexion depth! Extend back up');
        voiceCoach.speak('Push up');
      } else if (r > lowestAngleRef.current + 25 && lowestAngleRef.current <= targetFlex + 30) {
        // Dynamic Calibration: User reversed direction early but got close to target
        userTargetFlexRef.current = lowestAngleRef.current;
        targetFlex = lowestAngleRef.current;
        setRepStage('DOWN');
        setMinFlexionAngle(lowestAngleRef.current);
        setFeedback(`ROM auto-calibrated to ${lowestAngleRef.current}°! Extend up.`);
      } else {
        setFeedback(eid.includes('squat') ? `Squat lower to ${targetFlex}°` : (eid.includes('curl') ? `Curl arm to ${targetFlex}°` : `Lower chest to ${targetFlex}°`));
      }
    } else {
      if (r < minFlexionAngle) setMinFlexionAngle(r);
      if (r >= extensionThresh) {
        let score = Math.max(60, Math.round(100 - Math.max(0, minFlexionAngle - targetFlex) * 1.5));
        const { fatigueDetected, velocityDropPct, newRepCount, earnedXp } = registerCompletedRep(score);
        setRepStage('UP');
        lowestAngleRef.current = 180; // reset for next rep
        setFeedback(`Rep ${newRepCount} (+${earnedXp} XP)`);
        audioEffects.playRepDing();
        voiceCoach.speak(`Rep ${newRepCount}! ${score >= 85 ? 'Great form!' : ''}`);

        const popId = Date.now();
        setXpPopups((p) => [...p, { id: popId, text: `+${earnedXp} XP` }]);
        setTimeout(() => setXpPopups((p) => p.filter((x) => x.id !== popId)), 1200);

        if (newRepCount % 5 === 0 && newRepCount < activeExercise.targetReps) {
          startRestTimer(30);
          audioEffects.playVictoryFanfare();
          voiceCoach.speak('Rest interval started.');
        }
        if (fatigueDetected && !isFatigued) handleFatigueTrigger(velocityDropPct, newRepCount);
      }
    }
  };

  const drawSkeleton = (ctx, landmarks, w, h) => {
    const connections = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];

    // Draw glowing bone connectors
    ctx.strokeStyle = isFatigued ? '#EF4444' : '#38BDF8';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = isFatigued ? 'rgba(239, 68, 68, 0.8)' : 'rgba(56, 189, 248, 0.8)';

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i], p2 = landmarks[j];
      if (p1 && p2 && (p1.visibility ?? 1) > 0.4 && (p2.visibility ?? 1) > 0.4) {
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }
    });

    // Draw joint nodes
    landmarks.forEach((lm) => {
      if ((lm.visibility ?? 1) > 0.4) {
        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#FF5722';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      }
    });

    ctx.shadowBlur = 0;
  };

  const handleManualRep = () => {
    const score = Math.floor(Math.random() * 15) + 85;
    const { fatigueDetected, velocityDropPct, newRepCount, earnedXp } = registerCompletedRep(score);
    audioEffects.playRepDing();
    voiceCoach.speak(`Rep ${newRepCount}! ${score >= 85 ? 'Great form!' : ''}`);
    setFeedback(`Manual Rep ${newRepCount} (+${earnedXp} XP)`);

    const popId = Date.now();
    setXpPopups((prev) => [...prev, { id: popId, text: `+${earnedXp} XP` }]);
    setTimeout(() => setXpPopups((prev) => prev.filter((p) => p.id !== popId)), 1200);

    if (newRepCount % 5 === 0 && newRepCount < activeExercise.targetReps) {
      startRestTimer(30);
      audioEffects.playVictoryFanfare();
      voiceCoach.speak('Rest interval started.');
    }
    if (fatigueDetected && !isFatigued) handleFatigueTrigger(velocityDropPct, newRepCount);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center gap-4">
      {/* Top Bar */}
      <div className="w-full glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Biomechanics Tracker</span>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {activeExercise.name}
            <span className="badge badge-crimson">{activeExercise.targetReps || 12} Reps</span>
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={requestWebcamAccess}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-lg animate-pulse"
            style={{ background: 'linear-gradient(135deg, #C41E3A, #FF5722)', color: '#fff' }}>
            <Camera className="w-4 h-4" />
            <span>Access Local Webcam</span>
          </button>
          <button onClick={handleManualRep}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30">
            +1 Rep
          </button>
          <button onClick={toggleSimulator}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isSimulating ? 'animate-pulse' : ''}`}
            style={isSimulating
              ? { background: 'var(--crimson)', color: '#fff' }
              : { background: 'var(--bg-accent)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }>
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulating ? 'Pause Sim' : 'Simulate'}</span>
          </button>
          <button onClick={toggleVoiceEnabled}
            className="p-2.5 rounded-xl transition-all"
            style={voiceEnabled
              ? { background: 'rgba(196,30,58,0.15)', color: '#FF4D6D', border: '1px solid rgba(196,30,58,0.3)' }
              : { background: 'var(--bg-accent)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
            }>
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div className="text-right">
            <p className="text-2xl font-black text-slate-100">{currentRepCount}</p>
            <p className="text-[10px] uppercase font-bold text-slate-400">Reps</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-black ${currentFormScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{currentFormScore}%</p>
            <p className="text-[10px] uppercase font-bold text-slate-400">Form</p>
          </div>
        </div>
      </div>

      {/* 5-Step Pipeline Visualizer */}
      <div className="w-full glass-card p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold border border-slate-800 text-slate-300">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>1. Local Webcam</span>
        </div>
        <span className="text-slate-600">➔</span>
        <div className="flex items-center gap-1.5 text-rose-400">
          <span>2. Camera Permission</span>
        </div>
        <span className="text-slate-600">➔</span>
        <div className="flex items-center gap-1.5 text-amber-400">
          <span>3. Video Appears</span>
        </div>
        <span className="text-slate-600">➔</span>
        <div className="flex items-center gap-1.5 text-purple-400">
          <span>4. MediaPipe Pose (33 Landmarks)</span>
        </div>
        <span className="text-slate-600">➔</span>
        <div className="flex items-center gap-1.5 text-cyan-400">
          <span>5. Skeleton Drawn on Camera</span>
        </div>
      </div>

      {/* Camera Video Area */}
      <div className="relative w-full aspect-[3/4] md:aspect-video rounded-2xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-800">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/90 backdrop-blur-sm">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
            <p className="text-sm font-semibold text-slate-200">Initializing MediaPipe WASM Model...</p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-x-4 top-4 z-30 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between">
            <span>{cameraError}</span>
            <button onClick={toggleSimulator} className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg ml-2">
              Start Simulator
            </button>
          </div>
        )}

        {restTimerSeconds > 0 && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 backdrop-blur-md bg-slate-950/90">
            <Timer className="w-12 h-12 animate-pulse text-rose-500" />
            <span className="text-5xl font-black text-slate-100 font-mono">{restTimerSeconds}s</span>
            <p className="text-sm font-semibold text-slate-300">Rest Interval</p>
            <button onClick={() => startRestTimer(0)} className="btn-primary px-4 py-2 text-xs mt-2">Skip Rest</button>
          </div>
        )}

        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          onUserMedia={() => setCameraError(null)}
          onUserMediaError={(err) => {
            console.warn("Webcam access error:", err);
            setCameraError("Camera permission blocked or unavailable. Click 'Start Simulator' to run.");
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />

        {/* XP Popups */}
        <div className="absolute top-16 right-4 z-20 pointer-events-none flex flex-col gap-1">
          {xpPopups.map((p) => (
            <div key={p.id} className="animate-bounce text-white font-black text-sm px-3.5 py-1 rounded-full shadow-xl"
                 style={{ background: 'linear-gradient(135deg, #C41E3A, #FF5722)' }}>
              ⚡ {p.text}
            </div>
          ))}
        </div>
      </div>

      {/* Live Metrics & Feedback (Moved OUTSIDE the video for clean view on mobile) */}
      <div className="w-full flex flex-col gap-3">
        {/* Feedback Bar */}
        <div className="w-full p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 border border-slate-800 text-slate-100 shadow-xl gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full shadow-lg ${repStage === 'DOWN' || isSimulating ? 'animate-ping bg-rose-500' : 'bg-emerald-400'}`} />
            <span className="text-base md:text-lg font-bold">{feedback}</span>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold px-3 py-1.5 bg-slate-800 rounded-lg">
            {isSimulating ? 'SIMULATOR MODE' : `Stage: ${repStage}`}
          </span>
        </div>

        {/* Info Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Angle Badge */}
          <div className="px-3 py-2 rounded-xl flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-800 font-semibold shadow-sm">
            <Activity className="w-5 h-5 text-rose-500" />
            <span className="text-sm font-mono">Angle: <strong className="text-rose-600 text-lg">{currentAngle}°</strong></span>
          </div>

          {/* Privacy Verified Badge */}
          <div className="px-3 py-2 rounded-xl flex items-center gap-2 text-sm bg-emerald-50 text-emerald-800 border-2 border-emerald-200 font-bold shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Local WASM | <strong className="text-emerald-700">0 Frames Sent</strong></span>
          </div>

          {/* Ghost Mode */}
          {isGhostModeActive && (
            <div className="px-3 py-2 rounded-xl flex items-center gap-2 bg-purple-50 border-2 border-purple-200 text-purple-800 font-bold shadow-sm">
              <Zap className="w-5 h-5 text-purple-600" />
              <div className="text-xs">
                <p>Ghost Pace: {ghostSession.bestRepSpeedSec}s/rep</p>
                <p className="text-[10px] text-purple-500">Target: {ghostSession.bestFormScore}% Form</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fatigue Reroute */}
      {rerouteData && (
        <div className="w-full glass-panel p-5 space-y-3"
             style={{ background: 'rgba(220,38,38,0.03)', border: '1px solid rgba(220,38,38,0.15)' }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 animate-bounce" style={{ color: '#dc2626' }} />
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#dc2626' }}>Fatigue Reroute Triggered</h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{rerouteData.reason}</p>
            </div>
          </div>
          <p className="text-sm italic font-medium" style={{ color: 'var(--text-primary)' }}>"{rerouteData.coach_message}"</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rerouteData.replacement_exercises?.map((ex, idx) => (
              <div key={idx} className="glass-card p-3">
                <div className="flex justify-between items-center text-xs font-bold" style={{ color: '#dc2626' }}>
                  <span>{ex.name}</span>
                  <span className="badge" style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.15)' }}>{ex.duration_sec}s</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{ex.instructions}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finish Button */}
      <div className="w-full flex justify-end pt-2">
        <button onClick={onFinishWorkout} className="btn-primary px-6 py-3">
          Finish Workout & View Summary
        </button>
      </div>
    </div>
  );
}
