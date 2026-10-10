import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { Dumbbell, Play, Home, Building2, Flower2 } from 'lucide-react';

// ============================================================================
// MODEL TYPE 1: TARGETED SINGLE MUSCLE GROUP MODEL (TargetedExerciseModel)
// Concentrates on specific muscle isolation, joint angles, & home/gym progression.
// ============================================================================
const targetedExerciseModels = [
 {
 id: 'chest',
 name: 'Chest (Pectorals)',
 category: 'upper',
 targetMuscles: 'Pectoralis major, Pectoralis minor, Anterior deltoids',
 angleKey: 'shoulder_elbow_wrist',
 extensionAngle: '160°+',
 flexionAngle: '90°',
 homeVariations: [
 { name: 'Incline Push-Ups', level: 'Beginner', desc: 'Hands elevated on a bed, chair, or wall to target lower chest.' },
 { name: 'Flat Floor Push-Ups', level: 'Intermediate', desc: 'Standard push-ups targeting overall chest width and thickness.' },
 { name: 'Decline Push-Ups', level: 'Advanced', desc: 'Feet elevated on a couch or chair to overload upper chest.' }
 ],
 gymVariations: [
 { name: 'Barbell / DB Flat Bench Press', level: 'Beginner', desc: 'Classic compound movement for building base chest mass.' },
 { name: 'Incline Dumbbell Press', level: 'Intermediate', desc: 'Pressing at 30°-45° angle to isolate upper pec fibers.' },
 { name: 'Cable Chest Flyes', level: 'Advanced', desc: 'Continuous cable tension targeting inner chest peak contraction.' }
 ]
 },
 {
 id: 'back',
 name: 'Back (Lats & Upper Back)',
 category: 'upper',
 targetMuscles: 'Latissimus dorsi, Rhomboids, Trapezius, Rear deltoids',
 angleKey: 'shoulder_elbow_hip',
 extensionAngle: '170°+',
 flexionAngle: '70°',
 homeVariations: [
 { name: 'Doorframe / Towel Iso Rows', level: 'Beginner', desc: 'Lean back while holding a sturdy doorframe & row torso inward.' },
 { name: 'Superman Holds', level: 'Intermediate', desc: 'Lie face down, lift chest & arms to engage upper back & erectors.' },
 { name: 'Inverted Rows Under Table', level: 'Advanced', desc: 'Grip table edge, keep core stiff, pull chest to table rim.' }
 ],
 gymVariations: [
 { name: 'Lat Pulldowns', level: 'Beginner', desc: 'Vertical pulling focused on lat width and upper back posture.' },
 { name: 'Bent-Over Barbell Rows', level: 'Intermediate', desc: 'Heavy horizontal row for middle-back thickness and density.' },
 { name: 'Seated Cable Rows', level: 'Advanced', desc: 'Controlled horizontal pulling with constant cable resistance.' }
 ]
 },
 {
 id: 'shoulders',
 name: 'Shoulders (Deltoids)',
 category: 'upper',
 targetMuscles: 'Anterior (front), Lateral (side), Posterior (rear) deltoids',
 angleKey: 'shoulder_elbow_wrist',
 extensionAngle: '170°+',
 flexionAngle: '90°',
 homeVariations: [
 { name: 'Pike Push-Ups', level: 'Beginner', desc: 'Hips raised high in inverted V position to load front delts.' },
 { name: 'Resistance Band / Jug Lateral Raises', level: 'Intermediate', desc: 'Raise weights sideways to isolate lateral deltoid head.' },
 { name: 'Wall Handstand Holds / Push-Ups', level: 'Advanced', desc: 'Advanced vertical bodyweight press with wall support.' }
 ],
 gymVariations: [
 { name: 'Seated Dumbbell Press', level: 'Beginner', desc: 'Natural wrist rotation and balanced unilateral shoulder drive.' },
 { name: 'Standing Barbell Overhead Press (OHP)', level: 'Intermediate', desc: 'Premier compound lift for total shoulder mass & core stability.' },
 { name: 'Cable Lateral Raises', level: 'Advanced', desc: 'Isolate side delts with continuous cable line of tension.' }
 ]
 },
 {
 id: 'biceps',
 name: 'Biceps (Arm Flexors)',
 category: 'arms',
 targetMuscles: 'Biceps brachii (short & long head), Brachialis',
 angleKey: 'shoulder_elbow_wrist',
 extensionAngle: '160°+',
 flexionAngle: '40°',
 homeVariations: [
 { name: 'Towel Self-Resistance Curls', level: 'Beginner', desc: 'Loop towel under foot, curl up while applying manual leg resistance.' },
 { name: 'Resistance Band / Backpack Curls', level: 'Intermediate', desc: 'Curl weighted backpack or band with elbows pinned to sides.' },
 { name: 'Underhand Table Inverted Rows', level: 'Advanced', desc: 'Supinated grip under table edge to pull up and load biceps.' }
 ],
 gymVariations: [
 { name: 'Standing Alternating DB Curls', level: 'Beginner', desc: 'Classic free-weight curl allowing full wrist supination at peak.' },
 { name: 'EZ-Bar Preacher Curls', level: 'Intermediate', desc: 'Locks elbows on pad to eliminate momentum & isolate lower bicep.' },
 { name: 'Incline Bench DB Curls', level: 'Advanced', desc: 'Stretches long head of bicep at bottom for deep muscle activation.' }
 ]
 },
 {
 id: 'triceps',
 name: 'Triceps (Arm Extensors)',
 category: 'arms',
 targetMuscles: 'Triceps brachii (lateral, medial, long heads)',
 angleKey: 'shoulder_elbow_wrist',
 extensionAngle: '170°+',
 flexionAngle: '70°',
 homeVariations: [
 { name: 'Chair or Bench Dips', level: 'Beginner', desc: 'Hands on sturdy chair behind you, lower hips toward floor.' },
 { name: 'Diamond Push-Ups', level: 'Intermediate', desc: 'Hands close together forming diamond shape to emphasize triceps.' },
 { name: 'Overhead Water Jug Extensions', level: 'Advanced', desc: 'Raise bottle overhead with both hands to stretch long head.' }
 ],
 gymVariations: [
 { name: 'Rope Triceps Cable Pushdowns', level: 'Beginner', desc: 'Cable-based isolation targeting lateral and outer heads.' },
 { name: 'Lying Barbell Skullcrushers', level: 'Intermediate', desc: 'Heavy extension movement targeting medial & long heads on flat bench.' },
 { name: 'Weighted Parallel Bar Dips', level: 'Advanced', desc: 'Compound triceps movement pressing bodyweight plus added plates.' }
 ]
 },
 {
 id: 'quads',
 name: 'Quadriceps (Front Thighs)',
 category: 'lower',
 targetMuscles: 'Rectus femoris, Vastus lateralis, Vastus medialis, Vastus intermedius',
 angleKey: 'hip_knee_ankle',
 extensionAngle: '170°+',
 flexionAngle: '90°',
 homeVariations: [
 { name: 'Bodyweight Air Squats', level: 'Beginner', desc: 'Foundation leg exercise focusing on depth and quad recruitment.' },
 { name: 'Bulgarian Split Squats', level: 'Intermediate', desc: 'Back foot elevated on couch; heavy unilateral load on front leg.' },
 { name: 'Sissy Squats', level: 'Advanced', desc: 'Leaning backward while bending knees forward to isolate quads.' }
 ],
 gymVariations: [
 { name: 'Goblet Squats with DB', level: 'Beginner', desc: 'Front-loaded squat keeping spine upright & quad tension high.' },
 { name: 'Barbell Back / Front Squats', level: 'Intermediate', desc: 'King of leg exercises loading total leg structure under weight.' },
 { name: 'Leg Press / Hack Squat Machine', level: 'Advanced', desc: 'High load volume on quads without spine axial loading strain.' }
 ]
 },
 {
 id: 'hamstrings_glutes',
 name: 'Hamstrings & Glutes (Posterior Chain)',
 category: 'lower',
 targetMuscles: 'Biceps femoris, Semitendinosus, Gluteus maximus, Gluteus medius',
 angleKey: 'hip_knee_ankle',
 extensionAngle: '170°+',
 flexionAngle: '90°',
 homeVariations: [
 { name: 'Single-Leg Glute Bridges', level: 'Beginner', desc: 'Drive through one heel to lift hips and fire glutes & hamstrings.' },
 { name: 'Single-Leg Bodyweight RDLs', level: 'Intermediate', desc: 'Hinge at hip while extending opposite leg back for hamstring stretch.' },
 { name: 'Nordic Hamstring Curls', level: 'Advanced', desc: 'Ankles secured under couch, lowering torso forward under control.' }
 ],
 gymVariations: [
 { name: 'Lying or Seated Leg Curls', level: 'Beginner', desc: 'Machine isolation bending knees against smooth cable load.' },
 { name: 'Barbell Romanian Deadlifts (RDLs)', level: 'Intermediate', desc: 'Heavy hip-hinge movement building hamstring elasticity & glute size.' },
 { name: 'Barbell Hip Thrusts', level: 'Advanced', desc: 'Upper back on bench with loaded barbell across hips for peak glute power.' }
 ]
 },
 {
 id: 'calves',
 name: 'Calves (Lower Leg)',
 category: 'lower',
 targetMuscles: 'Gastrocnemius, Soleus',
 angleKey: 'knee_ankle_toe',
 extensionAngle: '160°+',
 flexionAngle: '80°',
 homeVariations: [
 { name: 'Single-Leg Wall Calf Raises', level: 'Beginner', desc: 'Stand on one foot near wall and push up onto toes smoothly.' },
 { name: 'Stair-Edge Calf Raises', level: 'Intermediate', desc: 'Stand on step edge to achieve a full stretch at bottom of rep.' },
 { name: 'Seated Weighted Calf Raises', level: 'Advanced', desc: 'Sitting with heavy object on knees to target deeper soleus.' }
 ],
 gymVariations: [
 { name: 'Standing Machine Calf Raises', level: 'Beginner', desc: 'Direct shoulder loading building upper gastrocnemius head.' },
 { name: 'Seated Machine Calf Raises', level: 'Intermediate', desc: 'Performed with bent knees to isolate lower soleus muscle.' },
 { name: 'Leg Press Calf Presses', level: 'Advanced', desc: 'Pressing weight sled using ankle plantarflexion at end range.' }
 ]
 },
 {
 id: 'core',
 name: 'Core (Abdominals & Obliques)',
 category: 'core',
 targetMuscles: 'Rectus abdominis, Transverse abdominis, Internal & external obliques',
 angleKey: 'shoulder_hip_knee',
 extensionAngle: '180°',
 flexionAngle: '120°',
 homeVariations: [
 { name: 'Forearm Planks', level: 'Beginner', desc: 'Static isometric hold for overall abdominal stiffness & core depth.' },
 { name: 'Bicycle Crunches', level: 'Intermediate', desc: 'Rotational movement targeting upper rectus abdominis & obliques.' },
 { name: 'Dragon Flags / Ab Rollouts', level: 'Advanced', desc: 'High-leverage extension loading lower & upper core wall.' }
 ],
 gymVariations: [
 { name: 'Decline Cable Crunches', level: 'Beginner', desc: 'Weighted spinal flexion targeting rectus abdominis under resistance.' },
 { name: 'Hanging Leg Raises', level: 'Intermediate', desc: 'Hanging from pull-up bar, lifting legs to waist height without momentum.' },
 { name: 'Kneeling Cable Woodchoppers', level: 'Advanced', desc: 'Diagonal rotational cable drive training explosive anti-rotation.' }
 ]
 }
];

// ============================================================================
// MODEL TYPE 2: COMPOUND FULL-BODY HYBRID MOVEMENT MODEL (FullBodyCompoundModel)
// Multi-joint kinetic chain movements recruiting upper & lower body simultaneously.
// ============================================================================
const compoundHybridModels = [
 {
 id: 'burpee_thruster',
 name: '1. The Burpee / Thruster Hybrid',
 category: 'full_body',
 movementPattern: 'Explosive Vertical Hinge & Push Press',
 primaryMuscles: 'Quads, Glutes, Core, Chest, Shoulders',
 homeVersion: {
 title: 'Bodyweight Burpee',
 steps: 'Drop into a push-up position, press back up, snap feet under hips, and jump explosively upward.'
 },
 gymVersion: {
 title: 'Dumbbell Thruster',
 steps: 'Hold dumbbells at shoulder rack height, perform a deep 90° squat, and drive upward using leg momentum to press weights overhead.'
 },
 difficultyProgression: [
 { level: 'Beginner', name: 'Step-Back Burpee / Wall Thruster' },
 { level: 'Intermediate', name: 'Standard Burpee / Goblet Thruster' },
 { level: 'Advanced', name: 'Barbell Thruster & Tuck Jump Burpee' }
 ]
 },
 {
 id: 'renegade_row',
 name: '2. The Renegade Row Pattern',
 category: 'full_body',
 movementPattern: 'Anti-Rotational Core & Horizontal Pull',
 primaryMuscles: 'Lats, Core, Triceps, Shoulders, Forearms',
 homeVersion: {
 title: 'Plank Shoulder-Taps',
 steps: 'Hold a rigid push-up plank position, alternate tapping each shoulder without tilting hips or twisting lower back.'
 },
 gymVersion: {
 title: 'Dumbbell Renegade Row',
 steps: 'Hold a push-up plank with hands gripping two hex dumbbells; row one weight up to hip while stabilizing core, then alternate.'
 },
 difficultyProgression: [
 { level: 'Beginner', name: 'Knee Plank Taps' },
 { level: 'Intermediate', name: 'Standard Plank Shoulder Taps' },
 { level: 'Advanced', name: 'Heavy Hex DB Renegade Row Push-Up' }
 ]
 },
 {
 id: 'deadlift_clean',
 name: '3. The Deadlift & Clean Pattern',
 category: 'full_body',
 movementPattern: 'Posterior Hip-Hinge & Kinetic Power Drive',
 primaryMuscles: 'Hamstrings, Glutes, Lower Back, Upper Traps, Forearms',
 homeVersion: {
 title: 'Single-Leg Hinge & Reach',
 steps: 'Stand on one leg, hinge at hip while extending opposite leg backward, touch floor, and drive back up using glute power.'
 },
 gymVersion: {
 title: 'Barbell Clean and Press',
steps: 'Lift barbell dynamically from floor to shoulder rack position, then drive overhead in one continuous compound stroke.'
 },
 difficultyProgression: [
 { level: 'Beginner', name: 'Bodyweight Good Mornings' },
 { level: 'Intermediate', name: 'Single-Leg Hinge & DB Deadlift' },
 { level: 'Advanced', name: 'Olympic Barbell Clean & Push Press' }
 ]
 }
];

const yogaModels = [
  {
    id: 'yoga_downward_dog',
    name: 'Downward Facing Dog',
    targetMuscles: 'Hamstrings, Calves, Shoulders',
    level: 'Beginner',
    desc: 'Classic yoga pose stretching the posterior chain and shoulders.',
    angleKey: 'shoulder_hip_knee',
    extensionAngle: '180°',
    flexionAngle: '90°'
  },
  {
    id: 'yoga_warrior_two',
    name: 'Warrior II',
    targetMuscles: 'Quads, Glutes, Core',
    level: 'Intermediate',
    desc: 'Standing pose that opens hips and builds leg endurance.',
    angleKey: 'hip_knee_ankle',
    extensionAngle: '180°',
    flexionAngle: '90°'
  },
  {
    id: 'yoga_tree_pose',
    name: 'Tree Pose',
    targetMuscles: 'Core, Ankle Stabilizers',
    level: 'Beginner',
    desc: 'Balance pose focusing on single-leg stability and focus.',
    angleKey: 'hip_knee_ankle',
    extensionAngle: '180°',
    flexionAngle: '180°'
  }
];

export default function ExerciseLibrary({ onStartWorkout }) {
  const { setActiveExercise } = useWorkoutStore();
  const [envTab, setEnvTab] = useState('home'); // 'home', 'gym', 'yoga'

  const handleLaunchTargeted = (ex, variation) => {
    setActiveExercise({
      id: `${ex.id}_${variation.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: variation.name,
      targetReps: 12,
      angleKey: ex.angleKey || 'hip_knee_ankle'
    });
    onStartWorkout();
  };

  const handleLaunchCompound = (compound, isGym) => {
    const varTitle = isGym ? compound.gymVersion.title : compound.homeVersion.title;
    setActiveExercise({
      id: compound.id,
      name: varTitle,
      targetReps: 10,
      angleKey: 'hip_knee_ankle'
    });
    onStartWorkout();
  };
  
  const handleLaunchYoga = (yoga) => {
    setActiveExercise({
      id: yoga.id,
      name: yoga.name,
      targetReps: 5,
      angleKey: yoga.angleKey
    });
    onStartWorkout();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-16 font-sans">
      {/* Simple Header & Tabs */}
      <div className="glass-panel p-4 flex flex-col gap-4 shadow-sm border border-slate-200 bg-white/70">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Select Your Workout</h1>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'gym', label: 'Gym', icon: Building2 },
            { id: 'yoga', label: 'Yoga', icon: Flower2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setEnvTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${
                envTab === tab.id ? 'bg-white shadow text-[#E50914]' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List of Exercises based on envTab */}
      <div className="space-y-3">
        {envTab === 'home' && (
          <>
            {targetedExerciseModels.map(ex => (
              ex.homeVariations.map((v, idx) => (
                <div key={`${ex.id}-${idx}`} className="glass-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white/50 hover:bg-white transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900">{v.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{v.desc}</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md mt-2 inline-block uppercase tracking-wider">{ex.name}</span>
                  </div>
                  <button onClick={() => handleLaunchTargeted(ex, v)} className="w-full sm:w-auto px-4 py-2.5 bg-[#E50914] text-white rounded-xl shrink-0 shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2 font-bold text-xs">
                    <Play className="w-4 h-4 fill-white" /> Launch
                  </button>
                </div>
              ))
            ))}
            {compoundHybridModels.map(compound => (
                <div key={compound.id} className="glass-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white/50 hover:bg-white transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900">{compound.homeVersion.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{compound.homeVersion.steps}</p>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-md mt-2 inline-block uppercase tracking-wider">Full-Body Hybrid</span>
                  </div>
                  <button onClick={() => handleLaunchCompound(compound, false)} className="w-full sm:w-auto px-4 py-2.5 bg-[#E50914] text-white rounded-xl shrink-0 shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2 font-bold text-xs">
                    <Play className="w-4 h-4 fill-white" /> Launch
                  </button>
                </div>
            ))}
          </>
        )}

        {envTab === 'gym' && (
          <>
            {targetedExerciseModels.map(ex => (
              ex.gymVariations.map((v, idx) => (
                <div key={`${ex.id}-${idx}`} className="glass-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white/50 hover:bg-white transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900">{v.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{v.desc}</p>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-md mt-2 inline-block uppercase tracking-wider">{ex.name}</span>
                  </div>
                  <button onClick={() => handleLaunchTargeted(ex, v)} className="w-full sm:w-auto px-4 py-2.5 bg-[#E50914] text-white rounded-xl shrink-0 shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2 font-bold text-xs">
                    <Play className="w-4 h-4 fill-white" /> Launch
                  </button>
                </div>
              ))
            ))}
            {compoundHybridModels.map(compound => (
                <div key={compound.id} className="glass-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white/50 hover:bg-white transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900">{compound.gymVersion.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{compound.gymVersion.steps}</p>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-md mt-2 inline-block uppercase tracking-wider">Full-Body Hybrid</span>
                  </div>
                  <button onClick={() => handleLaunchCompound(compound, true)} className="w-full sm:w-auto px-4 py-2.5 bg-[#E50914] text-white rounded-xl shrink-0 shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2 font-bold text-xs">
                    <Play className="w-4 h-4 fill-white" /> Launch
                  </button>
                </div>
            ))}
          </>
        )}

        {envTab === 'yoga' && (
          <>
            {yogaModels.map(yoga => (
                <div key={yoga.id} className="glass-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white/50 hover:bg-white transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900">{yoga.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{yoga.desc}</p>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md mt-2 inline-block uppercase tracking-wider">Flexibility & Core</span>
                  </div>
                  <button onClick={() => handleLaunchYoga(yoga)} className="w-full sm:w-auto px-4 py-2.5 bg-[#E50914] text-white rounded-xl shrink-0 shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2 font-bold text-xs">
                    <Play className="w-4 h-4 fill-white" /> Launch
                  </button>
                </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
