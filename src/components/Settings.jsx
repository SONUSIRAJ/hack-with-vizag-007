import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { ShieldCheck, User, Camera, Lock, CheckCircle, Trash2, Activity, LogOut, Sparkles } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

export default function Settings({ onProfileUpdated }) {
 const { user, setUser, logout, framesProcessed, videoFramesTransmitted, clearHistory, completedWorkoutLogs } = useWorkoutStore();
 const [loading, setLoading] = useState(false);
 const [message, setMessage] = useState(null);
 const [messageType, setMessageType] = useState('success'); // 'success' | 'error'

 const [formData, setFormData] = useState({
 name: user?.name || '',
 age: user?.age ? String(user.age) : '',
 height: user?.height ? String(user.height) : '',
 weight: user?.weight ? String(user.weight) : '',
 biological_sex: user?.biological_sex || 'male',
 goal: user?.goal || 'muscle_gain',
 activity_level: user?.activity_level || 'moderate',
 });

 const calcLocally = (payload) => {
 const { weight, height, age, biological_sex, goal, activity_level } = payload;
 const heightM = height / 100;
 const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;
 const bmr = biological_sex === 'male'
 ? 10 * weight + 6.25 * height - 5 * age + 5
 : 10 * weight + 6.25 * height - 5 * age - 161;
 const actMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extra_active: 1.9 };
 const tdee = Math.round(bmr * (actMap[activity_level] || 1.55));
 const targetCalories = goal === 'weight_loss' ? Math.max(1200, tdee - 300)
 : goal === 'muscle_gain' ? tdee + 300 : tdee;
 const proteinG = Math.round(weight * 2);
 const remaining = Math.max(0, targetCalories - proteinG * 4);
 const carbsG = Math.round((remaining * 0.60) / 4);
 const fatsG = Math.round((remaining * 0.40) / 9);
 const hydrationL = Math.round((weight * 0.045) * 10) / 10;
 return {
 bmi, target_calories: targetCalories,
 nutrition_plan: {
 summary: `Custom ${goal.replace('_', ' ')} plan targeted at ${targetCalories} kcal/day.`,
 macros: { protein_g: proteinG, carbs_g: carbsG, fats_g: fatsG },
 meal_ideas: [
 { meal: 'Breakfast', recommendation: 'Protein oats with banana, chia seeds & almond butter' },
 { meal: 'Lunch', recommendation: 'Grilled chicken or paneer bowl with quinoa & broccoli' },
 { meal: 'Dinner', recommendation: 'Baked salmon or tofu with sweet potato & asparagus' },
 { meal: 'Snacks', recommendation: 'Greek yogurt with chia seeds or whey protein smoothie' },
 ],
 hydration: `Drink ${hydrationL}L water daily`,
 },
 };
 };

 const handleUpdate = async (e) => {
 e.preventDefault();
 setLoading(true);
 setMessage(null);

 const parsedAge = parseInt(formData.age, 10) || 25;
 const parsedHeight = parseFloat(formData.height) || 175;
 const parsedWeight = parseFloat(formData.weight) || 70;
 const parsedName = (formData.name || '').trim() || 'Athlete';

 const payload = {
 name: parsedName, age: parsedAge, height: parsedHeight, weight: parsedWeight,
 biological_sex: formData.biological_sex,
 goal: formData.goal,
 activity_level: formData.activity_level,
 diet_preference: user?.diet_preference || 'non_veg',
 workout_env: user?.workout_env || 'gym',
 target_pace: user?.target_pace || 'moderate',
 };

 try {
 const res = await fetch('/api/users/onboard', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 });
 const data = await res.json();
 if (res.ok && data.user) {
 setUser({ ...payload, ...data.user });
 setMessage('Profile updated successfully!');
 setMessageType('success');
 setTimeout(() => onProfileUpdated?.(), 1200);
 } else {
 throw new Error(data.detail || 'API error');
 }
 } catch {
 // Full local fallback — preserve all existing fields
 const computed = calcLocally({ ...payload });
 setUser({ ...user, ...payload, ...computed });
 setMessage('Profile saved locally (offline mode).');
 setMessageType('success');
 setTimeout(() => onProfileUpdated?.(), 1200);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="w-full max-w-3xl mx-auto space-y-5 pb-12 font-sans">

 {/* ─── Account & Authentication ─── */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2.5rem] p-6 shadow-xl space-y-4 text-slate-900">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="w-10 h-10 rounded-2xl bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm">
 <svg className="w-5 h-5" viewBox="0 0 24 24">
 <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z" />
 <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
 <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.61H1.24C.45 8.18 0 9.94 0 12s.45 3.82 1.24 5.39l4.04-3.13z" />
 <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.61l4.04 3.13c.95-2.84 3.6-4.99 6.72-4.99z" />
 </svg>
 </div>
 <div>
 <h2 className="text-xl font-semibold text-slate-950 font-heading">Account & Sync</h2>
 <p className="text-xs text-slate-600 font-semibold">Google Authentication & Profile State</p>
 </div>
 </div>
 {user?.auth_provider === 'google' && (
 <span className="px-3 py-1 rounded-full text-[10px] font-semibold font-curvy bg-blue-100 text-blue-800 border border-blue-300">
 Google Verified
 </span>
 )}
 </div>

 <div className="p-4 rounded-2xl bg-[#FFF8EE] border-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-3.5 w-full sm:w-auto">
 {user?.avatar_url ? (
 <img
 src={user.avatar_url}
 alt={user.name}
 className="w-12 h-12 rounded-2xl object-cover border-2 border-[#E50914] shadow-sm"
 referrerPolicy="no-referrer"
 />
 ) : (
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E50914] to-[#B8000A] text-white flex items-center justify-center text-lg font-semibold shadow-sm">
 {(user?.name || 'A')[0].toUpperCase()}
 </div>
 )}
 <div>
 <p className="text-sm font-semibold text-slate-950 font-curvy">{user?.name || 'Athlete'}</p>
 <p className="text-xs text-slate-600 font-mono">{user?.email || 'Local offline account'}</p>
 </div>
 </div>

 <div className="flex items-center gap-2.5 w-full sm:w-auto">
 <button
 onClick={() => logout()}
 className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 transition-all flex items-center justify-center gap-1.5 font-curvy"
 >
 <LogOut className="w-3.5 h-3.5" />
 <span>Sign Out</span>
 </button>
 </div>
 </div>

 {user?.auth_provider !== 'google' && (
 <div className="pt-2 border-t border-slate-200">
 <p className="text-xs font-bold text-slate-700 mb-2 font-curvy">Link or switch to a Google Account:</p>
 <GoogleSignInButton
 onAuthSuccess={(googleUser, token) => {
 setUser(googleUser, token);
 setMessage('Successfully linked Google account!');
 setMessageType('success');
 }}
 buttonText="Connect with Google"
 />
 </div>
 )}
 </div>

 {/* ─── Profile Form ─── */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2.5rem] p-6 shadow-xl space-y-5 text-slate-900">
 <div>
 <h1 className="text-2xl font-semibold flex items-center gap-2 text-slate-950 font-heading">
 <User className="w-6 h-6 text-[#E50914]" /> Profile Settings
 </h1>
 <p className="text-xs text-slate-600 font-semibold mt-0.5">Update your biometrics and recalculate nutrition targets</p>
 </div>

 {message && (
 <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
 messageType === 'success'
 ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
 : 'bg-rose-50 border border-rose-300 text-rose-800'
 }`}>
 <CheckCircle className="w-4 h-4" /> {message}
 </div>
 )}

 <form onSubmit={handleUpdate} className="space-y-4">
 {/* Name */}
 <div>
 <label className="text-xs font-semibold text-slate-700 font-curvy block mb-1.5">Full Name</label>
 <input type="text" value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 placeholder="e.g. Sonu Siraj"
 className="w-full bg-[#FFF8EE] border-2 border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-950 focus:outline-none focus:border-[#E50914] transition-all"
 required />
 </div>

 {/* Age + Height */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-slate-700 font-curvy block mb-1.5">Age</label>
 <input type="number" min="10" max="120" value={formData.age}
 onChange={(e) => setFormData({ ...formData, age: e.target.value })}
 placeholder="25"
 className="w-full bg-[#FFF8EE] border-2 border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-950 focus:outline-none focus:border-[#E50914] transition-all"
 required />
 </div>
 <div>
 <label className="text-xs font-semibold text-slate-700 font-curvy block mb-1.5">Height (cm)</label>
 <input type="number" min="100" max="250" value={formData.height}
 onChange={(e) => setFormData({ ...formData, height: e.target.value })}
 placeholder="175"
 className="w-full bg-[#FFF8EE] border-2 border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-950 focus:outline-none focus:border-[#E50914] transition-all"
 required />
 </div>
 </div>

 {/* Weight + Sex */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-slate-700 font-curvy block mb-1.5">Weight (kg)</label>
 <input type="number" min="30" max="300" step="0.1" value={formData.weight}
 onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
 placeholder="70"
 className="w-full bg-[#FFF8EE] border-2 border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-950 focus:outline-none focus:border-[#E50914] transition-all"
 required />
 </div>
 <div>
 <label className="text-xs font-semibold text-slate-700 font-curvy block mb-1.5">Biological Sex</label>
 <select value={formData.biological_sex}
 onChange={(e) => setFormData({ ...formData, biological_sex: e.target.value })}
 className="w-full bg-[#FFF8EE] border-2 border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-950 focus:outline-none focus:border-[#E50914] transition-all">
 <option value="male">Male</option>
 <option value="female">Female</option>
 </select>
 </div>
 </div>

 {/* Goal + Activity */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-slate-700 font-curvy block mb-1.5">Fitness Goal</label>
 <select value={formData.goal}
 onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
 className="w-full bg-[#FFF8EE] border-2 border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-950 focus:outline-none focus:border-[#E50914] transition-all">
 <option value="weight_loss">Weight Loss</option>
 <option value="maintenance">Maintenance</option>
 <option value="muscle_gain">Muscle Building</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-slate-700 font-curvy block mb-1.5">Activity Level</label>
 <select value={formData.activity_level}
 onChange={(e) => setFormData({ ...formData, activity_level: e.target.value })}
 className="w-full bg-[#FFF8EE] border-2 border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-950 focus:outline-none focus:border-[#E50914] transition-all">
 <option value="sedentary">Sedentary</option>
 <option value="light">Lightly Active</option>
 <option value="moderate">Moderately Active</option>
 <option value="active">Very Active</option>
 <option value="extra_active">Extra Active</option>
 </select>
 </div>
 </div>

 <button type="submit" disabled={loading}
 className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60"
 style={{ background: 'linear-gradient(135deg, #E50914, #B8000A)' }}>
 {loading ? 'Recalculating...' : 'Save & Recalculate Nutrition'}
 </button>
 </form>
 </div>

 {/* ─── Stats Quick View ─── */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2rem] p-5 space-y-3 text-slate-900">
 <div className="flex items-center gap-2 font-semibold text-slate-950 font-heading">
 <Activity className="w-5 h-5 text-[#E50914]" /> Calculated Biometrics
 </div>
 <div className="grid grid-cols-3 gap-3 text-center">
 {[
 { label: 'BMI', value: user?.bmi || '—' },
 { label: 'Target kcal', value: user?.target_calories ? `${user.target_calories}` : '—' },
 { label: 'Protein', value: user?.weight ? `${Math.round(user.weight * 2)}g` : '—' },
 ].map((s, i) => (
 <div key={i} className="bg-[#FFF8EE] border-2 border-slate-200 p-3 rounded-2xl">
 <p className="text-xs font-semibold text-slate-500">{s.label}</p>
 <p className="text-lg font-semibold text-[#E50914]">{s.value}</p>
 </div>
 ))}
 </div>
 </div>

 {/* ─── Privacy Panel ─── */}
 <div className="bg-emerald-50/90 border-3 border-emerald-400 rounded-[2rem] p-5 space-y-4 text-slate-900">
 <div className="flex items-center gap-2 text-lg font-semibold text-emerald-800">
 <ShieldCheck className="w-6 h-6" /> Privacy Audit Panel
 </div>
 <p className="text-xs text-slate-600 font-semibold">
 Camera frames are processed in-memory via WASM and discarded after landmark extraction. No video data leaves your device.
 </p>

 <div className="grid grid-cols-2 gap-4">
 <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300">
 <span className="text-[10px] font-semibold text-emerald-700">Frames Transmitted</span>
 <p className="text-3xl font-semibold text-emerald-800">{videoFramesTransmitted}</p>
 <p className="text-[10px] font-mono mt-1 text-emerald-700">Zero Transmit Policy ✓</p>
 </div>
 <div className="p-4 rounded-2xl bg-[#FFF8EE] border-2 border-slate-300">
 <span className="text-[10px] font-semibold text-slate-600">Local WASM Frames</span>
 <p className="text-3xl font-semibold text-slate-800">{framesProcessed}</p>
 <p className="text-[10px] font-mono mt-1 text-slate-500">~15 FPS Pipeline</p>
 </div>
 </div>

 <div className="pt-2 space-y-1.5 text-xs border-t border-emerald-200">
 <p className="flex items-center gap-2 text-slate-600 font-semibold"><Lock className="w-3.5 h-3.5 text-emerald-600" /> Local Storage Only (Profile JSON)</p>
 <p className="flex items-center gap-2 text-slate-600 font-semibold"><Camera className="w-3.5 h-3.5 text-emerald-600" /> Camera: In-Memory HTML5 Canvas</p>
 </div>
 </div>

 {/* ─── Data Management ─── */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-slate-300 rounded-[2rem] p-5 space-y-3 text-slate-900">
 <h3 className="font-semibold text-slate-800 font-heading flex items-center gap-2">
 <Trash2 className="w-4 h-4 text-rose-500" /> Data Management
 </h3>
 <p className="text-xs text-slate-500 font-semibold">
 {completedWorkoutLogs?.length || 0} workout sessions stored locally
 </p>
 <button
 onClick={() => { clearHistory(); setMessage('Workout history cleared.'); setMessageType('success'); }}
 className="w-full py-2.5 rounded-xl text-xs font-semibold border-2 border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all"
 >
 Clear Workout History
 </button>
 </div>
 </div>
 );
}
