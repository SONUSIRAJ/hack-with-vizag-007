import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { voiceCoach } from '../utils/VoiceCoach';
import {
  Sparkles, Mic, MicOff, Send, Bot, User,
  Volume2, VolumeX, RefreshCw, Lightbulb, Trash2, ChevronDown
} from 'lucide-react';

const QUICK_PROMPTS = [
  { icon: "💬", text: "Yo Vigo! How's it going?" },
  { icon: "🔥", text: "I feel lazy today, hype me up!" },
  { icon: "🥗", text: "What should I eat post-workout?" },
  { icon: "😴", text: "Schedule my sleep & recovery cycle" },
  { icon: "💪", text: "Fix my squat form tips" },
  { icon: "📊", text: "Give me my nutrition breakdown" },
];

function formatTime(date) {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Simple markdown-lite renderer: bold, newlines
function renderContent(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Handle bold **text**
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className={i > 0 && line === '' ? 'mt-2' : ''}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
        )}
      </p>
    );
  });
}

export default function AICoachChat() {
  const { user, voiceEnabled, toggleVoiceEnabled, chatMessages, setChatMessages, clearChatMessages } = useWorkoutStore();

  const greeting = user?.name
    ? `Yo ${user.name}! 👋 I'm **VIGO** — your AI best friend & fitness coach.\n\nAsk me anything: diet, workouts, sleep, motivation... or just vibe! 🔥`
    : `Hey! 👋 I'm **VIGO** — your AI best friend & fitness coach.\n\nAsk me anything about fitness, nutrition, sleep, or just chat! 💪`;

  const initialGreeting = { role: 'assistant', content: greeting, time: new Date().toISOString() };

  // Use persistent store messages if present, otherwise default to initialGreeting
  const messages = (chatMessages && chatMessages.length > 0)
    ? chatMessages
    : [initialGreeting];

  const updateMessages = (updater) => {
    const current = (useWorkoutStore.getState().chatMessages?.length > 0)
      ? useWorkoutStore.getState().chatMessages
      : [initialGreeting];
    const next = typeof updater === 'function' ? updater(current) : updater;
    setChatMessages(next);
  };

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Show scroll-to-bottom button when user scrolls up
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const handler = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 120);
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Set up speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript;
      setInputMessage(spoken);
      setIsListening(false);
      if (spoken?.trim()) handleSendMessage(spoken.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Chrome!');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputMessage('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text, time: new Date().toISOString() };
    const updatedHistory = [...messages, userMsg];
    updateMessages(updatedHistory);
    setInputMessage('');
    setLoading(true);

    const userWeight = user?.weight || 70;
    const userProtein = user?.nutrition_plan?.macros?.protein_g || Math.round(userWeight * 2);
    const userCals = user?.target_calories || 2200;
    const userName = user?.name || 'Athlete';

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 'guest',
          message: text,
          conversation_history: updatedHistory.slice(-14).map(m => ({
            role: m.role,
            content: m.content
          })),
          user_context: {
            name: userName,
            weight: userWeight,
            bmi: user?.bmi || 22.5,
            target_calories: userCals,
            goal: user?.goal || 'muscle_gain',
            protein: userProtein,
            age: user?.age,
            height: user?.height,
            diet: user?.diet || 'non_veg',
            activity_level: user?.activity_level || 'moderate',
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const aiMsg = { role: 'assistant', content: data.reply, time: new Date().toISOString() };
        updateMessages(prev => [...prev, aiMsg]);
        if (voiceEnabled) voiceCoach.speak(data.reply);
      } else {
        throw new Error(data.detail || 'API error');
      }
    } catch (err) {
      console.warn('AI Chat fallback:', err);
      const reply = generateSmartFallback(text, userName, userCals, userProtein, userWeight, user);
      const aiMsg = { role: 'assistant', content: reply, time: new Date().toISOString() };
      updateMessages(prev => [...prev, aiMsg]);
      if (voiceEnabled) voiceCoach.speak(reply);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const generateSmartFallback = (query, name, cals, protein, weight, user) => {
    const q = query.toLowerCase();
    const goal = user?.goal?.replace(/_/g, ' ') || 'muscle gain';

    if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('how are you')) {
      return `Hey ${name}! 💪 Ready to work on your ${goal} goals today? What are we focusing on — workout, diet, sleep, or recovery?`;
    }

    if (q.includes('lazy') || q.includes('motivated') || q.includes('motivation') || q.includes('tired') || q.includes('giving up')) {
      return `That happens 😄 Don't force a heavy workout if you're exhausted, ${name}. Try a light session or take a recovery day. Are you physically tired, or just not feeling motivated today?`;
    }

    if (q.includes('missed') || q.includes('skipped')) {
      return `No stress! One missed workout won't destroy your progress 💪 Just get back to your routine tomorrow. What stopped you today?`;
    }

    if (q.includes('junk') || q.includes('cheat') || q.includes('pizza') || q.includes('burger')) {
      return `Relax, one meal won't ruin your progress 😄 Just get back to your normal routine at the next meal. No need to punish yourself!`;
    }

    if (q.includes('sleep') || q.includes('rest') || q.includes('bedtime') || q.includes('recovery')) {
      return `🌙 **Sleep & Recovery Protocol:**\n\n• **Target:** 7.5–8 hours (e.g., 10:30 PM – 6:30 AM)\n• **Tip:** Dim screens 45 minutes before bed to recover better.\n\nHow many hours of sleep did you get last night?`;
    }

    if (q.includes('diet') || q.includes('meal') || q.includes('eat') || q.includes('food') || q.includes('nutrition') || q.includes('protein')) {
      return `🥗 **${goal} Nutrition Tips:**\n\n• **Calories:** ~${cals} kcal/day\n• **Protein Target:** ~${protein}g/day\n\nFocus on protein + carbs like eggs with rice, chicken, paneer, oats, or dal. What foods do you usually have at home?`;
    }

    if (q.includes('workout') || q.includes('exercise') || q.includes('squat') || q.includes('pushup') || q.includes('gym')) {
      return `💪 **Workout Focus (${goal}):**\n\n1. **Squats** — 3 sets × 10–12 reps (Keep chest up, knees over toes)\n2. **Push-ups** — 3 sets × 10–12 reps (Rigid core, controlled depth)\n3. **Bicep Curls / Rows** — 3 sets × 12 reps\n\nQuality form matters most! How many days per week can you train?`;
    }

    return `Hey ${name}! I'm here to help with your workouts, diet, sleep, or recovery. What specifically would you like to work on right now?`;
  };

  const clearChat = () => {
    clearChatMessages();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col font-sans" style={{ height: 'calc(100vh - 140px)', minHeight: 500 }}>

      {/* ─── Header ─── */}
      <div className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-t-[2.5rem] px-5 py-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #E50914, #B8000A)' }}>
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2 leading-tight">
              VIGO — AI Coach
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Online" />
            </h2>
            <p className="text-xs text-slate-500 font-medium">Your personal best friend · Always here 💪</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            title="Clear chat"
            className="p-2.5 rounded-xl border-2 border-slate-200 bg-white/70 text-slate-500 hover:border-rose-300 hover:text-rose-500 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleVoiceEnabled}
            title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
            className="p-2.5 rounded-xl border-2 transition-all"
            style={voiceEnabled
              ? { background: '#E50914', color: '#fff', borderColor: '#E50914' }
              : { background: '#FFF8EE', color: '#475569', borderColor: '#CBD5E1' }}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ─── Messages Area ─── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 bg-[#FFFBF0]/97 border-x-3 border-[#E50914] p-4 md:p-5 overflow-y-auto space-y-4 relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-xs font-bold ${
              msg.role === 'user'
                ? 'bg-[#E50914] text-white'
                : 'bg-[#FFF8EE] text-[#E50914] border-2 border-[#E50914]'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className="flex flex-col gap-1 max-w-[80%]" style={{ alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-[#E50914] text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
              }`}>
                <div className="space-y-1">
                  {renderContent(msg.content)}
                </div>
              </div>
              {msg.time && (
                <span className="text-[10px] text-slate-400 px-1">
                  {formatTime(msg.time)}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-[#FFF8EE] text-[#E50914] border-2 border-[#E50914] flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E50914] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#E50914] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#E50914] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-500 font-medium">VIGO is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-4 right-4 p-2 rounded-full bg-[#E50914] text-white shadow-lg hover:bg-[#B8000A] transition-all animate-bounce"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ─── Quick Prompts ─── */}
      <div className="bg-[#FFFBF0]/97 border-x-3 border-[#E50914] px-4 py-2.5 flex items-center gap-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}>
        <Lightbulb className="w-4 h-4 text-[#E50914] shrink-0" />
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p.text)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-white border border-slate-200 text-slate-700 hover:border-[#E50914] hover:bg-rose-50 hover:text-[#E50914] transition-all disabled:opacity-50 shrink-0"
          >
            {p.icon} {p.text}
          </button>
        ))}
      </div>

      {/* ─── Input Bar ─── */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        className="bg-[#FAF5E8]/95 backdrop-blur-xl border-3 border-[#E50914] rounded-b-[2.5rem] p-4 shadow-xl flex items-center gap-3"
      >
        <button
          type="button"
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Speak to VIGO'}
          className={`p-3 rounded-2xl transition-all border-2 shrink-0 ${
            isListening
              ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? '🎤 Listening... speak now' : 'Ask VIGO anything — diet, workouts, sleep, or just chat...'}
          className="flex-1 bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E50914] transition-all shadow-inner"
          disabled={loading}
          autoComplete="off"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="p-3.5 rounded-2xl text-white shadow-lg transition-all disabled:opacity-40 disabled:scale-95 hover:scale-105 shrink-0"
          style={{ background: 'linear-gradient(135deg, #E50914, #B8000A)' }}
        >
          {loading
            ? <RefreshCw className="w-5 h-5 animate-spin" />
            : <Send className="w-5 h-5 fill-white" />
          }
        </button>
      </form>
    </div>
  );
}
