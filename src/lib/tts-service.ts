'use client';

import { useNotificationStore } from '@/stores/notification-store';
import type { AafiatakNotification, VoiceGender, VoiceLanguage } from '@/types/aafiatak';

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private queue: AafiatakNotification[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.initVoices();
    }
  }

  private initVoices() {
    if (!this.synth) return;

    // Load voices (some browsers load them asynchronously)
    const loadVoices = () => {
      const voices = this.synth!.getVoices();
      console.log(`[TTS] Loaded ${voices.length} voices`);
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  async speak(notification: AafiatakNotification): Promise<boolean> {
    const settings = useNotificationStore.getState().voiceSettings;

    // Check if voice notifications are enabled
    if (!settings.enabled) {
      console.log('[TTS] Voice notifications disabled');
      return false;
    }

    // Check quiet hours
    if (settings.quietHoursEnabled && this.isQuietHours(settings.quietStart, settings.quietEnd)) {
      console.log('[TTS] Quiet hours active, skipping voice');
      return false;
    }

    if (!this.synth) {
      console.warn('[TTS] Speech synthesis not available');
      return false;
    }

    // If currently speaking, add to queue
    if (this.isSpeaking) {
      this.queue.push(notification);
      return true;
    }

    return this.playNotification(notification);
  }

  private async playNotification(notification: AafiatakNotification): Promise<boolean> {
    if (!this.synth) return false;

    const settings = useNotificationStore.getState().voiceSettings;
    const lang = settings.language;
    const gender = settings.voiceGender;

    // Get the appropriate text
    const title = lang === 'ar' ? notification.titleAr : notification.title;
    const body = lang === 'ar' ? notification.bodyAr : notification.body;
    const text = `${title}. ${body}`;

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set language
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';

    // Find the best matching voice
    const voice = this.findVoice(lang, gender);
    if (voice) {
      utterance.voice = voice;
    }

    // Apply settings
    utterance.volume = settings.volume / 100;
    utterance.rate = settings.rate;
    utterance.pitch = gender === 'female' ? 1.1 : 0.9;

    // Priority-based adjustments
    if (notification.priority === 'urgent') {
      utterance.rate = Math.min(settings.rate * 1.2, 2.0);
      utterance.volume = 1.0;
    } else if (notification.priority === 'low') {
      utterance.rate = Math.max(settings.rate * 0.9, 0.5);
      utterance.volume = Math.max(settings.volume / 150, 0.3);
    }

    return new Promise((resolve) => {
      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log(`[TTS] Speaking: ${title}`);
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        resolve(true);

        // Process queue
        if (this.queue.length > 0) {
          const next = this.queue.shift()!;
          this.playNotification(next);
        }
      };

      utterance.onerror = (event) => {
        console.error('[TTS] Error:', event.error);
        this.isSpeaking = false;
        this.currentUtterance = null;
        resolve(false);

        // Still process queue
        if (this.queue.length > 0) {
          const next = this.queue.shift()!;
          this.playNotification(next);
        }
      };

      this.currentUtterance = utterance;
      this.synth!.speak(utterance);
    });
  }

  private findVoice(lang: VoiceLanguage, gender: VoiceGender): SpeechSynthesisVoice | null {
    if (!this.synth) return null;

    const voices = this.synth.getVoices();
    const langCode = lang === 'ar' ? 'ar' : 'en';

    // Try to find exact match: language + gender
    const genderKeywords = gender === 'female' ? ['female', 'woman', 'zira', 'naayf'] : ['male', 'man', 'david'];

    // First try: language code + gender keyword in voice name
    let voice = voices.find(
      (v) =>
        v.lang.startsWith(langCode) &&
        genderKeywords.some((kw) => v.name.toLowerCase().includes(kw))
    );

    if (voice) return voice;

    // Second try: just language code
    voice = voices.find((v) => v.lang.startsWith(langCode));

    if (voice) return voice;

    // Third try: any Arabic voice for Arabic language
    if (lang === 'ar') {
      voice = voices.find((v) => v.lang.includes('ar'));
      if (voice) return voice;
    }

    return null;
  }

  private isQuietHours(start?: string, end?: string): boolean {
    if (!start || !end) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      // Same day range (e.g., 09:00 - 17:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight range (e.g., 22:00 - 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.queue = [];
  }

  pause() {
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  // Test voice with a sample text
  async testVoice(gender: VoiceGender, lang: VoiceLanguage): Promise<boolean> {
    const testText = lang === 'ar' ? 'مرحبا، هذا اختبار للإشعارات الصوتية' : 'Hello, this is a voice notification test';

    const testNotification: AafiatakNotification = {
      id: 'test',
      userId: 'test',
      type: 'system',
      title: lang === 'ar' ? 'اختبار' : 'Test',
      titleAr: 'اختبار',
      body: testText,
      bodyAr: testText,
      category: 'system',
      priority: 'normal',
      isRead: false,
      isVoiceRead: false,
      voicePlayed: false,
      createdAt: new Date().toISOString(),
    };

    // Temporarily override settings for test
    const store = useNotificationStore.getState();
    const originalSettings = { ...store.voiceSettings };
    store.updateVoiceSettings({ enabled: true, voiceGender: gender, language: lang });

    const result = await this.speak(testNotification);

    // Restore settings
    store.updateVoiceSettings(originalSettings);

    return result;
  }
}

// Singleton instance
export const ttsService = new TTSService();
export default ttsService;
