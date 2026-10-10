import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { Activity, ShieldCheck, Sparkles, User, Ruler, Scale, Target, Activity as ActivityIcon, Utensils, ArrowRight, Dumbbell, Home, CheckSquare, Square, Plus, Camera, ImagePlus, Loader2 } from 'lucide-react';


export default function Onboarding({ onComplete }) {
  const setUser = useWorkoutStore((state) => state.setUser);
  
  // 1 = Login, 2 = Biometrics, 3 = Environment & Equipment, 4 = AI Body Fat Analysis
  const [step, setStep] = useState(1);
  const [googleUser, setGoogleUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    height: '175',
    weight: '70',
    biological_sex: 'male',
    age: '24',
    goal: 'muscle_gain',
    activity_level: 'moderate',
    diet: 'non_veg'
  });

  const [workoutEnv, setWorkoutEnv] = useState('gym');
  const [selectedEquipment, setSelectedEquipment] = useState(['Dumbbells']);
  const [customEquipment, setCustomEquipment] = useState('');
  const [guestName, setGuestName] = useState('');
  
  const gymEquipmentOptions = [
    'Dumbbells', 'Barbell', 'Kettlebells', 'Cable Machine', 'Pull-up Bar', 'Bench',
    'Smith Machine', 'Squat Rack', 'Leg Press', 'Leg Extension', 'Leg Curl',
    'Lat Pulldown', 'Seated Row', 'Pec Deck / Fly Machine', 'Treadmill', 'Rowing Machine',
    'Elliptical', 'Resistance Bands', 'Medicine Balls', 'Plyo Box'
  ];

  const [uploadedImages, setUploadedImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null
  });

  const handleImageUpload = (e, side) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages(prev => ({ ...prev, [side]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGoogleAuthSuccess = (user, token) => {
    setGoogleUser(user);
    setAuthToken(token);
    setStep(2);
  };

  const handleBiometricsSubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const toggleEquipment = (item) => {
    if (selectedEquipment.includes(item)) {
      setSelectedEquipment(selectedEquipment.filter(e => e !== item));
    } else {
      setSelectedEquipment([...selectedEquipment, item]);
    }
  };

  const handleAddCustomEquipment = () => {
    if (customEquipment.trim() && !selectedEquipment.includes(customEquipment.trim())) {
      setSelectedEquipment([...selectedEquipment, customEquipment.trim()]);
      setCustomEquipment('');
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const userId = googleUser?.id || `guest_${Date.now()}`;
    const userName = googleUser?.name || guestName || 'Athlete';
    const userEmail = googleUser?.email || '';
    const userAvatar = googleUser?.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${userId}&scale=90&backgroundColor=transparent`;

    const payload = {
      name: userName,
      age: parseInt(formData.age, 10),
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      biological_sex: formData.biological_sex,
      goal: formData.goal,
      activity_level: formData.activity_level,
      diet: formData.diet,
      workout_env: workoutEnv,
      equipment: workoutEnv === 'gym' ? selectedEquipment : [],
      user_id: userId
    };

    try {
      const res = await fetch('/api/users/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok && data.user) {
        const finalUser = {
          ...data.user,
          id: userId,
          email: userEmail,
          avatar_url: userAvatar
        };
        setUser(finalUser, authToken);
        setStep(4); // Move to AI Image Analysis
      } else {
        throw new Error(data.detail || 'Failed to complete onboarding');
      }
    } catch (err) {
      console.error("Onboarding setup error:", err);
      setError(err.message || 'Failed to generate your personalized plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageAnalysisSubmit = async (e) => {
    e.preventDefault();
    setAnalyzingImages(true);
    setError(null);

    // Filter out null images just in case, though the MVP will work even if they skip uploading all 4.
    const validImages = Object.values(uploadedImages).filter(img => img !== null);

    try {
      const res = await fetch('/api/ai/analyze-body-fat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: googleUser?.id || 'guest_user',
          biological_sex: formData.biological_sex,
          images: validImages
        })
      });
      
      const data = await res.json();
      if (res.ok && data.analysis) {
        // We update the user store with the newly generated avatar and analysis tip
        useWorkoutStore.getState().updateUser({
          avatar_url: data.analysis.avatar_url,
          body_fat_analysis: {
            targets: data.analysis.target_fat_areas,
            tip: data.analysis.coach_tip
          }
        });
        onComplete();
      } else {
        throw new Error('Failed to analyze images');
      }
    } catch (err) {
      console.error("Image analysis error:", err);
      setError('Analysis failed, but we can skip this for now.');
      // Allow them to proceed even if it fails
      onComplete();
    } finally {
      setAnalyzingImages(false);
    }
  };

  const handleGuestStart = () => {
    const name = guestName.trim() || 'Athlete';
    const guestId = `guest_${Date.now()}`;
    setGoogleUser({
      id: guestId,
      name: name,
      email: '',
      avatar_url: `https://api.dicebear.com/7.x/micah/svg?seed=${guestId}&scale=90&backgroundColor=transparent`,
      auth_provider: 'local'
    });
    setStep(2);
  };

  // STEP 1: Initial Welcome Screen (No Google Sign-In)
  if (step === 1) {

    return (
      <div 
        className="min-h-screen bg-[#FAF5E8] flex items-center justify-center font-sans p-4 relative overflow-hidden" 
        style={{ backgroundImage: 'radial-gradient(#E50914 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
      >
        <div className="w-full max-w-md bg-[#FFF8EE]/95 backdrop-blur-xl border-4 border-[#E50914] rounded-[2.5rem] p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(229,9,20,0.2)] relative z-10 flex flex-col items-center text-center">
          
          <div className="mb-6 bg-[#E50914] p-4 rounded-[2rem] shadow-lg transform -rotate-6 hover:rotate-0 transition-transform">
            <Activity className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold text-slate-950 mb-2">
            VigorFIT <span className="text-[#E50914]">Fitness</span>
          </h1>
          <p className="text-xs font-bold text-slate-700 mb-8 px-2 border-b-2 border-slate-200 pb-4">
            AI Master Brain Dashboard
          </p>

          <div className="w-full mb-4">
            <input
              type="text"
              placeholder="Enter your name (optional)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGuestStart(); }}
              className="w-full bg-white border-2 border-slate-300 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#E50914] transition-all text-center placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={handleGuestStart}
            className="w-full bg-[#E50914] hover:bg-[#C40812] text-white font-semibold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border-2 border-transparent hover:border-red-900 mb-6"
          >
            <Sparkles className="w-5 h-5" />
            <span>GET STARTED</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100 py-2.5 px-6 rounded-full border-2 border-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Verified</span>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Biometrics Setup Screen
  if (step === 2) {
    return (
      <div 
        className="min-h-screen bg-[#FAF5E8] flex items-center justify-center font-sans p-4 md:p-8 relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(#E50914 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
      >
        <div className="w-full max-w-2xl bg-[#FFF8EE]/95 backdrop-blur-xl border-4 border-[#E50914] rounded-[2.5rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(229,9,20,0.2)] relative z-10">
          
          <div className="text-center mb-8 border-b-2 border-slate-200 pb-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-950">
              Build Your <span className="text-[#E50914]">Profile</span>
            </h2>
            <p className="text-[10px] font-semibold text-slate-500 mt-2">
              Step 1 of 2: Calibrate your biomechanical engine
            </p>
          </div>

          <form onSubmit={handleBiometricsSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#E50914]" /> Full Name
                </label>
                <input
                  type="text"
                  value={googleUser?.name || guestName || 'Athlete'}
                  onChange={(e) => setGuestName(e.target.value)}
                  readOnly={!!googleUser?.name}
                  className={`w-full border-2 border-slate-300 rounded-2xl px-4 py-3.5 text-sm font-semibold ${googleUser?.name ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900 focus:outline-none focus:border-[#E50914]'}`}
                />
              </div>
              
              <div>
                <label className="text-[10px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  Biological Sex
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['male', 'female'].map((sex) => (
                    <button
                      key={sex}
                      type="button"
                      onClick={() => setFormData({ ...formData, biological_sex: sex })}
                      className={`py-3.5 rounded-2xl text-xs font-semibold transition-all border-2 ${
                        formData.biological_sex === sex
                          ? 'bg-[#E50914] text-white border-[#E50914]'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {sex.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  Age
                </label>
                <input
                  type="number" min="10" max="120" required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full bg-white border-2 border-slate-300 rounded-2xl px-4 py-3.5 text-base font-semibold text-slate-900 focus:outline-none focus:border-[#E50914] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#E50914]" /> Height <span className="text-slate-400">(cm)</span>
                </label>
                <input
                  type="number" min="50" max="250" required
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full bg-white border-2 border-slate-300 rounded-2xl px-4 py-3.5 text-base font-semibold text-slate-900 focus:outline-none focus:border-[#E50914] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-[#E50914]" /> Weight <span className="text-slate-400">(kg)</span>
                </label>
                <input
                  type="number" min="20" max="300" required
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full bg-white border-2 border-slate-300 rounded-2xl px-4 py-3.5 text-base font-semibold text-slate-900 focus:outline-none focus:border-[#E50914] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#E50914]" /> Primary Goal
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full bg-white border-2 border-slate-300 rounded-2xl px-4 py-3.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#E50914] transition-all appearance-none"
                >
                  <option value="muscle_gain">Build Muscle</option>
                  <option value="weight_loss">Fat Loss</option>
                  <option value="maintenance">Maintenance / Recomp</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <ActivityIcon className="w-3.5 h-3.5 text-[#E50914]" /> Activity Level
                </label>
                <select
                  value={formData.activity_level}
                  onChange={(e) => setFormData({ ...formData, activity_level: e.target.value })}
                  className="w-full bg-white border-2 border-slate-300 rounded-2xl px-4 py-3.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#E50914] transition-all appearance-none"
                >
                  <option value="sedentary">Sedentary (1-2 days)</option>
                  <option value="light">Light (3 days)</option>
                  <option value="moderate">Moderate (4-5 days)</option>
                  <option value="active">Highly Active (6+ days)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[#E50914]" /> Diet Preference
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'non_veg', label: 'Non-Vegetarian' },
                  { id: 'veg', label: 'Vegetarian' }
                ].map((diet) => (
                  <button
                    key={diet.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, diet: diet.id })}
                    className={`py-3.5 rounded-2xl text-xs font-semibold transition-all border-2 ${
                      formData.diet === diet.id
                        ? 'bg-[#E50914] text-white border-[#E50914]'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {diet.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-8 bg-[#E50914] hover:bg-[#C40812] text-white font-semibold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border-2 border-transparent hover:border-red-900"
            >
              <span>CONTINUE</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // STEP 3: Environment & Equipment
  if (step === 3) {
    return (
      <div 
        className="min-h-screen bg-[#FAF5E8] flex items-center justify-center font-sans p-4 md:p-8 relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(#E50914 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
    >
      <div className="w-full max-w-2xl bg-[#FFF8EE]/95 backdrop-blur-xl border-4 border-[#E50914] rounded-[2.5rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(229,9,20,0.2)] relative z-10">
        
        <div className="text-center mb-8 border-b-2 border-slate-200 pb-6 relative">
          <button 
            type="button"
            onClick={() => setStep(2)}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-500 hover:bg-slate-200"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-950">
            Workout <span className="text-[#E50914]">Environment</span>
          </h2>
          <p className="text-[10px] font-semibold text-slate-500 mt-2">
            Step 2 of 2: Configure your training setup
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-100 border-2 border-[#E50914] text-[#E50914] text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleFinalSubmit} className="space-y-6">
          
          <div>
            <label className="text-[10px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              Where will you train?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWorkoutEnv('home')}
                className={`py-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${
                  workoutEnv === 'home'
                    ? 'bg-[#E50914] text-white border-[#E50914] shadow-md'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                <Home className="w-6 h-6" />
                <span className="text-xs font-semibold">Home Workout</span>
              </button>
              
              <button
                type="button"
                onClick={() => setWorkoutEnv('gym')}
                className={`py-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${
                  workoutEnv === 'gym'
                    ? 'bg-[#E50914] text-white border-[#E50914] shadow-md'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                <Dumbbell className="w-6 h-6" />
                <span className="text-xs font-semibold">Gym Workout</span>
              </button>
            </div>
          </div>

          {workoutEnv === 'home' && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Home Training Activated</p>
                <p className="text-xs text-emerald-700 mt-1">
                  We'll prioritize bodyweight exercises, running, skipping, and calisthenics routines tailored for zero-equipment environments.
                </p>
              </div>
            </div>
          )}

          {workoutEnv === 'gym' && (
            <div>
              <label className="text-[10px] font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                Select Available Equipment
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {gymEquipmentOptions.map((item) => (
                  <div 
                    key={item} 
                    onClick={() => toggleEquipment(item)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedEquipment.includes(item)
                        ? 'bg-rose-50 border-[#E50914] text-[#E50914]'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {selectedEquipment.includes(item) ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs font-semibold">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Other equipment (e.g. Hex Bar)" 
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomEquipment();
                    }
                  }}
                  className="flex-1 bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#E50914] transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddCustomEquipment}
                  className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-[#E50914] hover:bg-[#C40812] text-white font-semibold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-red-900"
          >
            {loading ? (
              <span className="animate-pulse">GENERATING PLAN...</span>
            ) : (
              <>
                <span>CONFIRM SETUP</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
    );
  }

  // STEP 4: AI Body Fat Analysis (Image Upload)
  return (
    <div 
      className="min-h-screen bg-[#FAF5E8] flex items-center justify-center font-sans p-4 md:p-8 relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(#E50914 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
    >
      <div className="w-full max-w-3xl bg-[#FFF8EE]/95 backdrop-blur-xl border-4 border-[#E50914] rounded-[2.5rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(229,9,20,0.2)] relative z-10">
        
        <div className="text-center mb-8 border-b-2 border-slate-200 pb-6 relative">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-950">
            AI Body <span className="text-[#E50914]">Analysis</span>
          </h2>
          <p className="text-[10px] font-semibold text-slate-500 mt-2">
            Upload photos in 4 directions to generate your personalized Avatar & Fat Distribution map.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-100 border-2 border-[#E50914] text-[#E50914] text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleImageAnalysisSubmit} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['front', 'back', 'left', 'right'].map((side) => (
              <div key={side} className="flex flex-col items-center gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{side}</label>
                <div className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-300 bg-white relative overflow-hidden flex items-center justify-center group hover:border-[#E50914] transition-colors cursor-pointer">
                  {uploadedImages[side] ? (
                    <img src={uploadedImages[side]} alt={side} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#E50914]">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-[10px] font-semibold">Upload/Capture</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageUpload(e, side)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Privacy Guarantee</p>
              <p className="text-xs text-amber-700 mt-1">
                Images are analyzed instantly by our AI Vision pipeline. We do NOT store your images. You can also skip this step and generate a random avatar.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onComplete}
              disabled={analyzingImages}
              className="w-1/3 bg-white hover:bg-slate-50 text-slate-600 font-semibold py-4 rounded-2xl shadow border-2 border-slate-300 transition-all text-sm"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={analyzingImages}
              className="w-2/3 bg-[#E50914] hover:bg-[#C40812] text-white font-semibold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-red-900 text-sm"
            >
              {analyzingImages ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ANALYZING...</span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-5 h-5" />
                  <span>ANALYZE & GENERATE AVATAR</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
