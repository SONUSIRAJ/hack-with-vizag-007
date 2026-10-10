import React, { useState, useEffect } from 'react';
import { useWorkoutStore } from './store/workoutStore';
import { useBluetoothStore } from './store/bluetoothStore';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import LiveCamera from './components/LiveCamera';
import Summary from './components/Summary';
import History from './components/History';
import ExerciseLibrary from './components/ExerciseLibrary';
import Nutrition from './components/Nutrition';
import AICoachChat from './components/AICoachChat';
import Settings from './components/Settings';
import { LayoutDashboard, Camera, BarChart3, Dumbbell, Utensils, RotateCcw, Bot, Settings as SettingsIcon, ShieldCheck, Sparkles, LogOut, User as UserIcon, ChevronDown, Activity, Bluetooth, Watch, X } from 'lucide-react';

export default function App() {
  const { user, setUser, logout, startSession, stopSession, xp, streak, loadWorkoutLogs } = useWorkoutStore();
  const { isConnected, isConnecting, connectToWatch, disconnect, distanceWalked, speed } = useBluetoothStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    loadWorkoutLogs();
  }, [loadWorkoutLogs]);

  const userLevel = Math.floor(xp / 100) + 1;

  if (!user) {
    return <Onboarding onComplete={() => setActiveTab('dashboard')} />;
  }

  const handleStartWorkout = () => {
    startSession();
    setActiveTab('workout');
  };

  const handleFinishWorkout = () => {
    stopSession();
    setActiveTab('summary');
  };

  const handleResetProfile = () => {
    localStorage.removeItem('ai_fitness_user');
    setUser(null);
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'library', icon: Dumbbell, label: 'Exercises' },
    { id: 'workout', icon: Camera, label: 'Workout', isCenter: true },
    { id: 'chat', icon: Bot, label: 'AI Chat' },
    { id: 'nutrition', icon: Utensils, label: 'Diet' },
    { id: 'history', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div 
      className="min-h-screen flex flex-col relative bg-[#FAF5E8] text-slate-900 font-sans"
      style={{ backgroundImage: 'radial-gradient(#E50914 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
    >
      {/* ═══ Top Navigation Header ═══ */}
      <header className="sticky top-0 z-50 bg-[#FAF5E8]/95 backdrop-blur-xl border-b-3 border-[#E50914] shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105"
                 style={{ background: '#E50914' }}>
              <Activity className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950 flex items-center gap-1.5">
                VigorFIT
                <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
              </h1>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2.5">

            {/* Bluetooth Watch Status */}
            <div className="hidden sm:flex items-center gap-2 mr-2">
              {isConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 shadow-sm animate-float-in">
                  <Watch className="w-4 h-4 text-green-600" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-green-700 leading-tight">Watch Connected</span>
                    <span className="text-[10px] font-medium text-green-600 leading-tight">{Number(distanceWalked).toFixed(0)}m | {speed}m/s</span>
                  </div>
                  <button onClick={disconnect} className="ml-1 p-1 hover:bg-green-100 rounded-full transition-colors" title="Disconnect Watch">
                    <X className="w-3 h-3 text-green-700" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={connectToWatch}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF8EE] hover:border-[#E50914] border-2 border-slate-300 transition-all shadow-sm"
                  title="Connect Bluetooth Watch"
                >
                  <Bluetooth className={`w-4 h-4 ${isConnecting ? 'text-[#E50914] animate-pulse' : 'text-slate-500'}`} />
                  <span className="text-[11px] font-black text-slate-800 font-curvy">{isConnecting ? 'Connecting...' : 'Connect Watch'}</span>
                </button>
              )}
            </div>

            {/* User Profile & Account Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-[#FFF8EE] border-2 border-slate-300 hover:border-[#E50914] transition-all shadow-sm"
                title="Account Menu"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || "User"}
                    className="w-7 h-7 rounded-xl object-cover border border-slate-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#E50914] to-[#B8000A] text-white flex items-center justify-center text-xs font-black">
                    {(user?.name || 'A')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-black text-slate-800 hidden lg:inline font-curvy max-w-[100px] truncate">
                  {user?.name?.split(' ')[0] || 'Athlete'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#FFFDF7] border-2 border-slate-300 shadow-2xl py-3 px-3.5 z-50 text-slate-900 space-y-3 animate-float-in">
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-10 h-10 rounded-xl object-cover border-2 border-[#E50914]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#B8000A] text-white flex items-center justify-center text-sm font-black">
                          {(user?.name || 'A')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-slate-950 font-curvy truncate">
                          {user?.name || 'Athlete'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {user?.email || (user?.auth_provider === 'google' ? 'Google Account' : 'Local Profile')}
                        </p>
                      </div>
                    </div>

                    {user?.auth_provider === 'google' && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[10px] font-black text-blue-700">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
                          <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.61H1.24C.45 8.18 0 9.94 0 12s.45 3.82 1.24 5.39l4.04-3.13z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.61l4.04 3.13c.95-2.84 3.6-4.99 6.72-4.99z" />
                        </svg>
                        <span>Google Account Connected</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <button
                        onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4 text-slate-500" />
                        <span>Profile & Settings</span>
                      </button>

                      <button
                        onClick={() => { setShowUserMenu(false); logout(); }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-black text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 animate-float-in z-10">
        {activeTab === 'dashboard' && <Dashboard onStartWorkout={handleStartWorkout} onEditProfile={() => setActiveTab('settings')} />}
        {activeTab === 'library' && <ExerciseLibrary onStartWorkout={handleStartWorkout} />}
        {activeTab === 'workout' && <LiveCamera onFinishWorkout={handleFinishWorkout} />}
        {activeTab === 'nutrition' && <Nutrition />}
        {activeTab === 'chat' && <AICoachChat />}
        {activeTab === 'history' && <History />}
        {activeTab === 'summary' && <Summary onRestartWorkout={handleStartWorkout} onGoHome={() => setActiveTab('dashboard')} />}
        {activeTab === 'settings' && <Settings onProfileUpdated={() => setActiveTab('dashboard')} />}
      </main>

      {/* ═══ Floating AI Coach Button ═══ */}
      {activeTab !== 'chat' && (
        <button
          onClick={() => setActiveTab('chat')}
          className="fixed bottom-24 right-5 z-40 p-3.5 rounded-2xl shadow-2xl hover:scale-105 transition-all flex items-center gap-2 font-semibold"
          style={{ background: '#E50914', color: '#fff' }}
          title="Talk to AI Coach"
        >
          <Bot className="w-5 h-5" />
          <span className="text-sm font-semibold hidden sm:inline pr-1">AI Coach</span>
        </button>
      )}

      {/* ═══ Bottom Navigation Bar ═══ */}
      <nav className="sticky bottom-0 z-50 bg-[#FAF5E8]/95 backdrop-blur-xl border-t-3 border-[#E50914] py-2 px-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (item.isCenter) {
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab('library')}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className="p-3.5 rounded-2xl shadow-xl -mt-6 border-4 border-[#FAF5E8] transition-transform hover:scale-110"
                       style={{ background: 'linear-gradient(135deg, #E50914, #B8000A)' }}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-black text-[#E50914] font-curvy">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => item.id === 'workout' ? setActiveTab('library') : setActiveTab(item.id)}
                className="flex flex-col items-center gap-0.5 transition-colors p-1"
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#E50914]' : 'text-slate-500 hover:text-slate-900'}`} />
                <span className={`text-[10px] font-extrabold font-curvy ${isActive ? 'text-[#E50914]' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
