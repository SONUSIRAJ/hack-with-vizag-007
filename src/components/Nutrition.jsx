import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { Sparkles, RefreshCw, Utensils, Flame, Droplets, HeartPulse, CheckCircle2, Apple, Leaf, Zap } from 'lucide-react';

// ── Local macro calculator (Mifflin-St Jeor + 2g/kg protein) ─────────────────
function calcNutrition(user, goal) {
 const weight = user?.weight || 70;
 const height = user?.height || 175;
 const age = user?.age || 25;
 const sex = user?.biological_sex || 'male';
 const activity = user?.activity_level || 'moderate';

 const bmr = sex === 'male'
 ? 10 * weight + 6.25 * height - 5 * age + 5
 : 10 * weight + 6.25 * height - 5 * age - 161;

 const actMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extra_active: 1.9 };
 const tdee = Math.round(bmr * (actMap[activity] || 1.55));

 const targetCals =
 goal === 'weight_loss' ? Math.max(1200, tdee - 350) :
 goal === 'muscle_gain' ? tdee + 300 :
 goal === 'vegetarian' ? tdee : // maintenance
 goal === 'maintenance' ? tdee : tdee;

 const proteinG = Math.round(weight * 2);
 const remaining = Math.max(0, targetCals - proteinG * 4);
 const carbsG = Math.round((remaining * 0.58) / 4);
 const fatsG = Math.round((remaining * 0.42) / 9);
 const hydration = Math.round((weight * 0.045) * 10) / 10;

 return { tdee, targetCals, proteinG, carbsG, fatsG, hydration };
}

// ── Meal templates per protocol ───────────────────────────────────────────────
const MEAL_PLANS = {
 muscle_gain: [
 { meal: 'Breakfast', time: '7:30 AM', recommendation: 'Protein oats with banana, chia seeds, almond butter & 3 whole eggs', cal: 520 },
 { meal: 'Lunch', time: '1:00 PM', recommendation: 'Grilled chicken or paneer bowl with quinoa, roasted broccoli & olive oil', cal: 620 },
 { meal: 'Dinner', time: '7:30 PM', recommendation: 'Baked salmon or tofu with sweet potato, asparagus & brown rice', cal: 590 },
 { meal: 'Snack', time: '4:00 PM', recommendation: 'Whey protein shake + rice cakes with peanut butter & banana', cal: 380 },
 ],
 weight_loss: [
 { meal: 'Breakfast', time: '8:00 AM', recommendation: 'Greek yogurt with mixed berries, flax seeds & 2 boiled eggs', cal: 320 },
 { meal: 'Lunch', time: '1:00 PM', recommendation: 'Grilled chicken salad with leafy greens, cucumber, tomato & olive oil dressing', cal: 380 },
 { meal: 'Dinner', time: '7:00 PM', recommendation: 'Baked fish or paneer with steamed broccoli & cauliflower rice', cal: 350 },
 { meal: 'Snack', time: '4:30 PM', recommendation: 'Apple slices with 2 tbsp almond butter or a handful of almonds', cal: 180 },
 ],
 vegetarian: [
 { meal: 'Breakfast', time: '8:00 AM', recommendation: 'Moong dal cheela with curd, or tofu scramble with multigrain toast', cal: 420 },
 { meal: 'Lunch', time: '1:00 PM', recommendation: 'Paneer tikka bowl with quinoa, mixed vegetables & mint chutney', cal: 540 },
 { meal: 'Dinner', time: '7:30 PM', recommendation: 'Dal makhani with brown rice, mixed sabzi & raita', cal: 520 },
 { meal: 'Snack', time: '4:00 PM', recommendation: 'Roasted chana, mixed nuts or fruit smoothie with plant protein', cal: 280 },
 ],
 maintenance: [
 { meal: 'Breakfast', time: '8:00 AM', recommendation: 'Whole egg omelette with veggies & whole-grain toast, or protein oats', cal: 420 },
 { meal: 'Lunch', time: '1:00 PM', recommendation: 'Lean protein (chicken / paneer) bowl with rice, vegetables & salad', cal: 520 },
 { meal: 'Dinner', time: '7:30 PM', recommendation: 'Baked fish or dal with chapati, green vegetables & curd', cal: 480 },
 { meal: 'Snack', time: '4:00 PM', recommendation: 'Mixed fruit with yogurt, or handful of nuts & seeds', cal: 250 },
 ],
};

export default function Nutrition() {
 const { user, setUser } = useWorkoutStore();

 // Normalize user goal to a valid diet protocol
 const normalizeGoal = (g) => {
 if (!g) return 'muscle_gain';
 if (['muscle_gain','weight_loss','vegetarian','maintenance'].includes(g)) return g;
 return 'muscle_gain';
 };

 const [dietType, setDietType] = useState(normalizeGoal(user?.goal));
 const [loading, setLoading] = useState(false);
 const [message, setMessage] = useState(null);

 // Barcode Lookup State
 const [barcodeInput, setBarcodeInput] = useState('');
 const [scannedProduct, setScannedProduct] = useState(null);
 const [barcodeLoading, setBarcodeLoading] = useState(false);
 const [barcodeError, setBarcodeError] = useState(null);
 const [customMeals, setCustomMeals] = useState([]);

 const SAMPLE_BARCODES = [
   { label: 'Nutella', code: '3017620422003' },
   { label: 'Coca-Cola', code: '5449000000996' },
   { label: 'Amul Butter', code: '8901030775016' },
   { label: 'Parle-G', code: '8901719101051' },
 ];

 const handleBarcodeLookup = async (codeToSearch) => {
   const queryCode = (codeToSearch || barcodeInput).trim();
   if (!queryCode) return;
   setBarcodeLoading(true);
   setBarcodeError(null);
   setScannedProduct(null);

   try {
     const res = await fetch(`/api/nutrition/barcode/${encodeURIComponent(queryCode)}`);
     const data = await res.json();

     if (res.ok && data.found && data.product) {
       setScannedProduct(data.product);
     } else {
       setBarcodeError(data.message || `Barcode ${queryCode} not found in openFDA / OpenFoodFacts database.`);
     }
   } catch (err) {
     console.error('Barcode lookup error:', err);
     setBarcodeError('Failed to query barcode database.');
   } finally {
     setBarcodeLoading(false);
   }
 };

 const handleAddScannedMeal = (product) => {
   if (!product) return;
   const newMeal = {
     meal: 'Scanned Snack',
     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
     recommendation: `${product.name} (${product.brand}) — ${product.protein_g}g protein, ${product.carbs_g}g carbs, ${product.fat_g}g fat`,
     cal: Math.round(product.calories_kcal)
   };
   setCustomMeals((prev) => [newMeal, ...prev]);
   setMessage(`Added "${product.name}" to your daily meals!`);
 };

 // Compute macros from current user data + selected protocol
 const nutrition = calcNutrition(user, dietType);
 const baseMeals = MEAL_PLANS[dietType] || MEAL_PLANS.muscle_gain;
 const meals = [...customMeals, ...baseMeals];

 // Use stored plan values if available and same protocol as user goal
 const storedMacros = (user?.nutrition_plan?.macros && normalizeGoal(user?.goal) === dietType)
 ? user.nutrition_plan.macros
 : null;

 const proteinG = storedMacros?.protein_g ?? nutrition.proteinG;
 const carbsG = storedMacros?.carbs_g ?? nutrition.carbsG;
 const fatsG = storedMacros?.fats_g ?? nutrition.fatsG;
 const targetCals = user?.target_calories ?? nutrition.targetCals;
 const hydration = nutrition.hydration;

 const handleProtocolSelect = async (newGoal) => {
 setDietType(newGoal);
 setLoading(true);
 setMessage(null);

 const weight = user?.weight || 70;
 const height = user?.height || 175;
 const age = user?.age || 25;
 const sex = user?.biological_sex || 'male';
 const activity = user?.activity_level || 'moderate';
 const name = user?.name || 'Athlete';

 try {
 const res = await fetch('/api/users/onboard', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 name, age, height, weight,
 biological_sex: sex,
 goal: newGoal,
 activity_level: activity,
 }),
 });
 const data = await res.json();
 if (res.ok && data.user) {
 setUser({ ...user, ...data.user, goal: newGoal });
 setMessage('Nutrition plan updated!');
 } else throw new Error();
 } catch {
 // Full local fallback
 const computed = calcNutrition(user, newGoal);
 setUser({
 ...user,
 goal: newGoal,
 target_calories: computed.targetCals,
 nutrition_plan: {
 summary: `${newGoal.replace('_', ' ')} plan for ${name} — ${computed.targetCals} kcal/day`,
 macros: { protein_g: computed.proteinG, carbs_g: computed.carbsG, fats_g: computed.fatsG },
 meal_ideas: MEAL_PLANS[newGoal]?.map(m => ({ meal: m.meal, recommendation: m.recommendation })) || [],
 hydration: `Drink ${computed.hydration}L water daily`,
 },
 });
 setMessage('Plan calculated locally!');
 } finally {
 setLoading(false);
 }
 };

 const protocols = [
 { id: 'muscle_gain', label: '💪 High Protein', desc: 'Build muscle mass' },
 { id: 'weight_loss', label: '🔥 Fat Loss', desc: 'Caloric deficit' },
 { id: 'vegetarian', label: '🌿 Plant-Based', desc: 'Vegetarian diet' },
 { id: 'maintenance', label: '⚖️ Balanced Tone', desc: 'Maintain & tone' },
 ];

 const macroCards = [
 { label: 'Protein', value: `${proteinG}g`, sub: `${user?.weight || 70}kg × 2g/kg`, color: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-300', icon: Zap },
 { label: 'Carbohydrates',value: `${carbsG}g`, sub: '4 kcal/g • Energy', color: '#D97706', bg: 'bg-amber-50', border: 'border-amber-300', icon: Flame },
 { label: 'Healthy Fats', value: `${fatsG}g`, sub: '9 kcal/g • Hormones', color: '#DC2626', bg: 'bg-rose-50', border: 'border-rose-300', icon: Apple },
 ];

 return (
 <div className="w-full max-w-4xl mx-auto space-y-5 pb-12 font-sans">

 {/* ─── Header Card ─── */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2.5rem] p-6 shadow-xl space-y-5 text-slate-900">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl md:text-4xl font-semibold text-slate-950 font-heading flex items-center gap-2">
 <Leaf className="w-8 h-8 text-[#E50914]" /> Dietary Blueprint
 </h1>
 <p className="text-xs md:text-sm mt-1 font-semibold text-slate-700 font-curvy">
 Mifflin-St Jeor equation · {user?.weight || 70}kg × 2g/kg protein target
 </p>
 </div>

 <button onClick={() => handleProtocolSelect(dietType)} disabled={loading}
 className="px-5 py-3 rounded-2xl font-semibold text-white text-xs shadow-lg transition-all flex items-center gap-2 font-curvy hover:scale-105 disabled:opacity-60"
 style={{ background: 'linear-gradient(135deg, #E50914, #B8000A)' }}>
 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
 {loading ? 'Recalculating...' : 'Refresh AI Plan'}
 </button>
 </div>

 {message && (
 <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-800">
 <CheckCircle2 className="w-4 h-4" /> {message}
 </div>
 )}

 {/* Biometrics Summary */}
 <div className="bg-[#FFF8EE] border-2 border-slate-300 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
 <Flame className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[10px] font-semibold text-slate-600 font-curvy">Target Calories</p>
 <p className="text-lg font-semibold text-slate-950 font-curvy">{targetCals} kcal/day</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-300">
 <HeartPulse className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[10px] font-semibold text-slate-600 font-curvy">Body Mass Index</p>
 <p className="text-lg font-semibold text-slate-950 font-curvy">{user?.bmi || '—'} BMI</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800 border border-blue-300">
 <Droplets className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[10px] font-semibold text-slate-600 font-curvy">Hydration Target</p>
 <p className="text-lg font-semibold text-slate-950 font-curvy">{hydration}L / day</p>
 </div>
 </div>
 </div>

 {/* Protocol Selector */}
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-700 font-curvy">Select Diet Protocol</label>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 {protocols.map((d) => (
 <button key={d.id} onClick={() => handleProtocolSelect(d.id)}
 className="py-3 px-3 rounded-2xl text-xs font-semibold transition-all border-2 font-curvy text-left space-y-0.5 hover:scale-[1.03]"
 style={dietType === d.id
 ? { background: '#E50914', color: '#FFF', borderColor: '#E50914', boxShadow: '0 4px 18px rgba(229,9,20,0.35)' }
 : { background: '#FFF8EE', color: '#1E293B', borderColor: '#CBD5E1' }
 }>
 <div>{d.label}</div>
 <div className="text-[10px] opacity-70 font-semibold">{d.desc}</div>
 </button>
 ))}
 </div>
 </div>

 {/* Macro Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {macroCards.map((m, idx) => {
 const Icon = m.icon;
 const totalCals = idx === 0 ? proteinG * 4 : idx === 1 ? carbsG * 4 : fatsG * 9;
 const pct = Math.round((totalCals / Math.max(targetCals, 1)) * 100);
 return (
 <div key={idx} className={`p-5 rounded-2xl border-2 ${m.bg} ${m.border} shadow-sm`}>
 <div className="flex items-center gap-2 mb-2">
 <Icon className="w-4 h-4" style={{ color: m.color }} />
 <span className="text-[10px] font-semibold text-slate-700 font-curvy">{m.label}</span>
 </div>
 <p className="text-3xl font-semibold mt-1 font-curvy" style={{ color: m.color }}>{m.value}</p>
 <p className="text-xs font-mono font-bold mt-1 text-slate-500">{m.sub}</p>
 {/* Macro % bar */}
 <div className="mt-3 w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
 <div className="h-full rounded-full transition-all duration-700"
 style={{ width: `${pct}%`, background: m.color }} />
 </div>
 <p className="text-[9px] mt-1 font-bold" style={{ color: m.color }}>{pct}% of daily cals</p>
 </div>
 );
 })}
 </div>
 </div>

 {/* ─── Barcode Scanner & Lookup Tool ─── */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-[2rem] p-5 space-y-4 text-slate-900 shadow-lg">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="p-2.5 rounded-xl bg-[#E50914] text-white shadow-md">
 <Zap className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-xl font-bold font-heading text-slate-950 flex items-center gap-2">
 Barcode Food Scanner & FDA Database Lookup
 </h2>
 <p className="text-xs font-semibold text-slate-600">Scan or enter any product barcode (UPC / EAN / GTIN) for instant nutritional breakdown</p>
 </div>
 </div>
 </div>

 {/* Input Controls */}
 <div className="flex flex-col sm:flex-row items-center gap-2">
 <div className="relative flex-1 w-full">
 <input
 type="text"
 value={barcodeInput}
 onChange={(e) => setBarcodeInput(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleBarcodeLookup()}
 placeholder="Enter Barcode (e.g. 3017620422003, 5449000000996)..."
 className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#FFF8EE] border-2 border-slate-300 text-slate-900 font-mono text-sm focus:border-[#E50914] outline-none"
 />
 </div>
 <button
 onClick={() => handleBarcodeLookup()}
 disabled={barcodeLoading || !barcodeInput.trim()}
 className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-white text-xs shadow-md transition-all flex items-center justify-center gap-2 font-curvy hover:scale-105 disabled:opacity-50"
 style={{ background: 'linear-gradient(135deg, #E50914, #B8000A)' }}
 >
 {barcodeLoading ? (
 <RefreshCw className="w-4 h-4 animate-spin" />
 ) : (
 <Zap className="w-4 h-4" />
 )}
 <span>{barcodeLoading ? 'Searching...' : 'Lookup Barcode'}</span>
 </button>
 </div>

 {/* Sample Barcode Quick Chips */}
 <div className="flex flex-wrap items-center gap-2 pt-1">
 <span className="text-xs font-bold text-slate-500 font-curvy">Try Barcode:</span>
 {SAMPLE_BARCODES.map((item) => (
 <button
 key={item.code}
 onClick={() => {
 setBarcodeInput(item.code);
 handleBarcodeLookup(item.code);
 }}
 className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFF8EE] border border-slate-300 text-slate-700 hover:border-[#E50914] hover:bg-rose-50 transition-colors font-mono"
 >
 {item.label} ({item.code})
 </button>
 ))}
 </div>

 {/* Error Notification */}
 {barcodeError && (
 <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
 <Apple className="w-4 h-4 text-rose-600" />
 <span>{barcodeError}</span>
 </div>
 )}

 {/* Scanned Product Card */}
 {scannedProduct && (
 <div className="p-5 rounded-2xl bg-white border-2 border-emerald-300 shadow-md space-y-4 animate-float-in">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
 <div className="flex items-center gap-3">
 {scannedProduct.image_url ? (
 <img
 src={scannedProduct.image_url}
 alt={scannedProduct.name}
 className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-1 bg-white"
 />
 ) : (
 <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
 📦
 </div>
 )}
 <div>
 <h3 className="text-lg font-extrabold text-slate-950 font-heading">{scannedProduct.name}</h3>
 <p className="text-xs font-bold text-slate-500">{scannedProduct.brand} • Serving: {scannedProduct.serving_size}</p>
 <p className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">Verified by {scannedProduct.source}</p>
 </div>
 </div>

 <button
 onClick={() => handleAddScannedMeal(scannedProduct)}
 className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center gap-1.5 font-curvy"
 >
 <span>+ Add to Meal Schedule</span>
 </button>
 </div>

 {/* Macro Breakdown Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
 <span className="text-[10px] font-bold text-amber-700 uppercase">Calories</span>
 <p className="text-xl font-extrabold text-amber-900 font-curvy">{scannedProduct.calories_kcal} <span className="text-xs font-normal">kcal</span></p>
 </div>
 <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
 <span className="text-[10px] font-bold text-emerald-700 uppercase">Protein</span>
 <p className="text-xl font-extrabold text-emerald-900 font-curvy">{scannedProduct.protein_g} <span className="text-xs font-normal">g</span></p>
 </div>
 <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
 <span className="text-[10px] font-bold text-blue-700 uppercase">Carbohydrates</span>
 <p className="text-xl font-extrabold text-blue-900 font-curvy">{scannedProduct.carbs_g} <span className="text-xs font-normal">g</span></p>
 </div>
 <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
 <span className="text-[10px] font-bold text-rose-700 uppercase">Fats</span>
 <p className="text-xl font-extrabold text-rose-900 font-curvy">{scannedProduct.fat_g} <span className="text-xs font-normal">g</span></p>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* ─── Meal Schedule ─── */}
 <div className="space-y-3">
 <h2 className="text-2xl font-semibold text-slate-950 font-heading flex items-center gap-2">
 <Utensils className="w-5 h-5 text-[#E50914]" /> Daily Meal Schedule
 </h2>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {meals.map((m, idx) => (
 <div key={idx} className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-2xl p-5 space-y-2 text-slate-900 shadow-md motion-card">
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-2">
 <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-[#E50914] text-white font-curvy">
 {m.meal}
 </span>
 <span className="text-[10px] text-slate-500 font-semibold">{m.time}</span>
 </div>
 <div className="flex items-center gap-1">
 <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
 <span className="text-[10px] font-semibold text-slate-600">~{m.cal} kcal</span>
 </div>
 </div>
 <p className="text-sm font-bold text-slate-800 leading-relaxed">{m.recommendation}</p>
 </div>
 ))}
 </div>
 </div>

 {/* ─── Hydration Reminder ─── */}
 <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-blue-400 rounded-[2rem] p-5 flex items-center gap-4 text-slate-900">
 <div className="p-3 rounded-xl bg-blue-100 text-blue-700 shrink-0">
 <Droplets className="w-7 h-7" />
 </div>
 <div>
 <p className="font-semibold text-slate-800 font-heading">Hydration Goal: {hydration}L / Day</p>
 <p className="text-xs text-slate-600 font-semibold mt-0.5">
 Based on {user?.weight || 70}kg × 45ml/kg formula. Spread across 8–10 glasses throughout the day.
 </p>
 </div>
 </div>
 </div>
 );
}
