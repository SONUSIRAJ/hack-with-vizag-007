// Real-time Voice AI Coach using Web Speech Synthesis API

class VoiceCoach {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.enabled = true;
    this.lastSpokenText = '';
    this.lastSpokenTime = 0;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled && this.synth) {
      this.synth.cancel();
    }
  }

  speak(text, priority = false) {
    if (!this.enabled || !this.synth) return;

    const now = Date.now();
    // Prevent duplicate speech within 2.5 seconds unless priority
    if (!priority && text === this.lastSpokenText && now - this.lastSpokenTime < 2500) {
      return;
    }

    if (priority) {
      this.synth.cancel(); // Clear queue for high priority events like fatigue alert
    }

    const cleanText = text
      .replace(/[*#_`•]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Pick clear English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.lastSpokenText = text;
    this.lastSpokenTime = now;
    this.synth.speak(utterance);
  }

  cancel() {
    if (this.synth) this.synth.cancel();
  }
}

export const voiceCoach = new VoiceCoach();
