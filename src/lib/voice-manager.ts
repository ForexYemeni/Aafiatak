/**
 * عافيتك — TTS Voice Notification Manager v1.0
 *
 * نظام الإشعارات الصوتية المتقدمة - يحول نص الإشعارات إلى كلام مسموع
 *
 * FEATURES:
 * =========
 * 1. تحويل نص الإشعارات إلى كلام عربي/إنجليزي واضح
 * 2. اختيار صوت ذكر/أنثى
 * 3. التحكم بمستوى الصوت وسرعة القراءة
 * 4. ساعات هادئة (Quiet Hours)
 * 5. طابور إشعارات صوتية - يقرأ إشعار واحد في كل مرة
 * 6. يتكامل مع sound-manager الموجود (يشغل نغمة ثم يقرأ النص)
 * 7. يعمل على المتصفح + Android + PWA
 *
 * STRATEGY:
 * - First: Play the notification tone (via sound-manager)
 * - Then: Read the notification text aloud (TTS)
 * - This gives a professional experience: tone → voice message
 */

import { isSoundEnabled, playNotificationSound, resumeAudioContext } from './sound-manager'

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type VoiceGender = 'male' | 'female'
export type VoiceLanguage = 'ar' | 'en'

export interface TTSSettings {
  enabled: boolean
  volume: number           // 0-100
  voiceGender: VoiceGender
  language: VoiceLanguage
  rate: number             // 0.5 - 2.0
  quietHoursEnabled: boolean
  quietStart: string       // "22:00"
  quietEnd: string         // "07:00"
  playToneBeforeVoice: boolean  // Play notification tone before TTS
}

export interface VoiceNotification {
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
  type: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

// ═══════════════════════════════════════════════════════════════
//  DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════════

const SETTINGS_KEY = 'aafiatak-tts-settings'

const DEFAULT_SETTINGS: TTSSettings = {
  enabled: true,
  volume: 80,
  voiceGender: 'female',
  language: 'ar',
  rate: 1.0,
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '07:00',
  playToneBeforeVoice: true,
}

// ═══════════════════════════════════════════════════════════════
//  SETTINGS PERSISTENCE
// ═══════════════════════════════════════════════════════════════

export function getTTSSettings(): TTSSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch {}
  return DEFAULT_SETTINGS
}

export function saveTTSSettings(settings: Partial<TTSSettings>): TTSSettings {
  const current = getTTSSettings()
  const updated = { ...current, ...settings }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  }
  return updated
}

export function isTTSEnabled(): boolean {
  return getTTSSettings().enabled
}

export function setTTSEnabled(enabled: boolean): void {
  saveTTSSettings({ enabled })
}

// ═══════════════════════════════════════════════════════════════
//  QUIET HOURS CHECK
// ═══════════════════════════════════════════════════════════════

function isQuietHours(start?: string, end?: string): boolean {
  if (!start || !end) return false

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } else {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }
}

// ═══════════════════════════════════════════════════════════════
//  VOICE SELECTION
// ═══════════════════════════════════════════════════════════════

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    cachedVoices = voices
  }
  return cachedVoices.length > 0 ? cachedVoices : voices
}

function findBestVoice(lang: VoiceLanguage, gender: VoiceGender): SpeechSynthesisVoice | null {
  const voices = loadVoices()
  if (voices.length === 0) return null

  const langCode = lang === 'ar' ? 'ar' : 'en'

  // Female keywords in voice names
  const femaleKeywords = ['female', 'woman', 'zira', 'naayf', 'samantha', 'karen', 'moira', 'tessa', 'fiona', 'victoria']
  const maleKeywords = ['male', 'man', 'david', 'daniel', 'james', 'thomas', 'alex', 'fred']

  const genderKeywords = gender === 'female' ? femaleKeywords : maleKeywords

  // 1. Exact match: language + gender
  let voice = voices.find(
    (v) => v.lang.startsWith(langCode) && genderKeywords.some((kw) => v.name.toLowerCase().includes(kw))
  )
  if (voice) return voice

  // 2. Arabic-specific: any Arabic voice
  if (lang === 'ar') {
    voice = voices.find((v) => v.lang.startsWith('ar'))
    if (voice) return voice

    // Try Arabic with country code
    voice = voices.find((v) => v.lang.includes('ar-') || v.lang.includes('ar_'))
    if (voice) return voice
  }

  // 3. English-specific: any English voice with gender
  if (lang === 'en') {
    voice = voices.find((v) => v.lang.startsWith('en') && genderKeywords.some((kw) => v.name.toLowerCase().includes(kw)))
    if (voice) return voice
  }

  // 4. Fallback: any voice matching language
  voice = voices.find((v) => v.lang.startsWith(langCode))
  if (voice) return voice

  return null
}

// ═══════════════════════════════════════════════════════════════
//  TTS ENGINE
// ═══════════════════════════════════════════════════════════════

let isSpeaking = false
const voiceQueue: Array<{ notif: VoiceNotification; resolve: (success: boolean) => void }> = []

function processQueue(): void {
  if (isSpeaking || voiceQueue.length === 0) return

  const { notif, resolve } = voiceQueue.shift()!
  speakNow(notif)
    .then(resolve)
    .catch(() => resolve(false))
}

async function speakNow(notif: VoiceNotification): Promise<boolean> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('🗣️ [TTS] Speech synthesis not available')
    return false
  }

  const settings = getTTSSettings()

  // Check if voice notifications are enabled
  if (!settings.enabled) {
    console.log('🗣️ [TTS] Voice notifications disabled')
    return false
  }

  // Check quiet hours
  if (settings.quietHoursEnabled && isQuietHours(settings.quietStart, settings.quietEnd)) {
    console.log('🗣️ [TTS] Quiet hours active, skipping voice')
    return false
  }

  // Check global sound setting
  if (!isSoundEnabled()) {
    console.log('🗣️ [TTS] Global sound disabled')
    return false
  }

  isSpeaking = true

  try {
    // Resume AudioContext if possible (for tone playback)
    resumeAudioContext()

    // Step 1: Play notification tone first
    if (settings.playToneBeforeVoice) {
      playNotificationSound(notif.type, notif.titleAr, notif.bodyAr)
      // Wait for tone to finish before speaking
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    // Step 2: Prepare TTS text
    const lang = settings.language
    const title = lang === 'ar' ? notif.titleAr : notif.titleEn
    const body = lang === 'ar' ? notif.bodyAr : notif.bodyEn
    const fullText = `${title}. ${body}`

    // Step 3: Create utterance
    const utterance = new SpeechSynthesisUtterance(fullText)
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US'

    // Step 4: Find the best voice
    const voice = findBestVoice(lang, settings.voiceGender)
    if (voice) {
      utterance.voice = voice
      console.log('🗣️ [TTS] Using voice:', voice.name, `(${voice.lang})`)
    } else {
      console.log('🗣️ [TTS] No matching voice found, using default')
    }

    // Step 5: Apply settings
    utterance.volume = settings.volume / 100
    utterance.rate = settings.rate
    utterance.pitch = settings.voiceGender === 'female' ? 1.1 : 0.9

    // Priority adjustments
    if (notif.priority === 'urgent') {
      utterance.rate = Math.min(settings.rate * 1.2, 2.0)
      utterance.volume = 1.0
    } else if (notif.priority === 'low') {
      utterance.rate = Math.max(settings.rate * 0.9, 0.5)
      utterance.volume = Math.max(settings.volume / 150, 0.3)
    }

    // Step 6: Speak
    return new Promise((resolve) => {
      utterance.onstart = () => {
        console.log('🗣️ [TTS] Speaking:', title)
      }

      utterance.onend = () => {
        isSpeaking = false
        console.log('🗣️ [TTS] Finished speaking')
        // Process next in queue
        setTimeout(() => processQueue(), 300)
        resolve(true)
      }

      utterance.onerror = (event) => {
        console.warn('🗣️ [TTS] Error:', event.error)
        isSpeaking = false
        setTimeout(() => processQueue(), 300)
        resolve(false)
      }

      // Chrome bug: cancel any ongoing speech before new one
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)

      // Chrome bug: speechSynthesis can pause randomly
      // Keep it alive with a periodic resume
      const keepAlive = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(keepAlive)
          return
        }
        window.speechSynthesis.resume()
      }, 5000)

      // Safety timeout: stop after 30 seconds
      setTimeout(() => {
        clearInterval(keepAlive)
        if (isSpeaking) {
          window.speechSynthesis.cancel()
          isSpeaking = false
          resolve(false)
        }
      }, 30000)
    })
  } catch (e) {
    console.warn('🗣️ [TTS] Error:', e)
    isSpeaking = false
    setTimeout(() => processQueue(), 300)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Speak a notification aloud.
 * If another notification is currently being spoken, this one is queued.
 * The notification tone plays first, then the TTS reads the text.
 *
 * @param notif - The notification to speak
 * @returns Promise<boolean> - true if speech started successfully
 */
export function speakNotification(notif: VoiceNotification): Promise<boolean> {
  return new Promise((resolve) => {
    voiceQueue.push({ notif, resolve })
    if (!isSpeaking) {
      processQueue()
    }
  })
}

/**
 * Stop all TTS speech immediately and clear the queue.
 */
export function stopTTS(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  isSpeaking = false
  voiceQueue.length = 0
}

/**
 * Pause current TTS speech.
 */
export function pauseTTS(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause()
  }
}

/**
 * Resume paused TTS speech.
 */
export function resumeTTS(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.resume()
  }
}

/**
 * Check if TTS is currently speaking.
 */
export function isTTSSpeaking(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  return isSpeaking || window.speechSynthesis.speaking
}

/**
 * Get the number of queued notifications waiting to be spoken.
 */
export function getTTSQueueLength(): number {
  return voiceQueue.length
}

/**
 * Test the TTS system with a sample notification.
 * This should be called during a user gesture (button click).
 */
export async function testTTS(gender?: VoiceGender, lang?: VoiceLanguage): Promise<boolean> {
  // Ensure voices are loaded
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    loadVoices()
    // Some browsers load voices asynchronously
    if (window.speechSynthesis.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        const onVoicesChanged = () => {
          loadVoices()
          resolve()
        }
        window.speechSynthesis.onvoiceschanged = onVoicesChanged
        setTimeout(resolve, 2000) // Timeout fallback
      })
    }
  }

  const testLang = lang || getTTSSettings().language
  const testGender = gender || getTTSSettings().voiceGender

  const testNotif: VoiceNotification = {
    titleAr: 'اختبار الإشعارات الصوتية',
    titleEn: 'Voice Notification Test',
    bodyAr: testLang === 'ar' ? 'مرحباً، هذا اختبار لنظام الإشعارات الصوتية في عافيتك' : 'Hello, this is a test of the Aafiatak voice notification system',
    bodyEn: 'Hello, this is a test of the Aafiatak voice notification system',
    type: 'system',
    priority: 'normal',
  }

  // Temporarily override settings
  const originalSettings = getTTSSettings()
  saveTTSSettings({
    enabled: true,
    voiceGender: testGender,
    language: testLang,
    playToneBeforeVoice: false, // Don't play tone during test
  })

  const result = await speakNotification(testNotif)

  // Restore original settings
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(originalSettings))

  return result
}

/**
 * Initialize TTS system - preload voices.
 * Should be called once when the app loads.
 */
export function initTTS(): void {
  if (typeof window === 'undefined') return

  if ((window as any).__aafiatakTTSInit) return
  ;(window as any).__aafiatakTTSInit = true

  console.log('🗣️ [TTS] Initializing voice notification system...')

  // Preload voices
  loadVoices()

  // Some browsers load voices asynchronously
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      const voices = loadVoices()
      console.log(`🗣️ [TTS] ${voices.length} voices loaded`)

      // Log available Arabic voices
      const arabicVoices = voices.filter(v => v.lang.startsWith('ar'))
      if (arabicVoices.length > 0) {
        console.log('🗣️ [TTS] Arabic voices available:', arabicVoices.map(v => `${v.name} (${v.lang})`).join(', '))
      } else {
        console.warn('🗣️ [TTS] No Arabic voices found! TTS will use default voice.')
      }
    }
  }

  console.log('🗣️ [TTS] Voice notification system ready')
}

// ═══════════════════════════════════════════════════════════════
//  NOTIFICATION TYPE → ARABIC TEXT MAPPING
// ═══════════════════════════════════════════════════════════════

export const VOICE_TEMPLATES: Record<string, { titleAr: string; titleEn: string; bodyAr: string; bodyEn: string }> = {
  assignment: {
    titleAr: 'مهمة جديدة',
    titleEn: 'New Assignment',
    bodyAr: 'لديك مهمة جديدة معينة. يرجى الاطلاع على التفاصيل',
    bodyEn: 'You have a new assignment. Please check the details',
  },
  chat: {
    titleAr: 'رسالة جديدة',
    titleEn: 'New Message',
    bodyAr: 'لديك رسالة جديدة',
    bodyEn: 'You have a new message',
  },
  emergency: {
    titleAr: 'طلب طوارئ',
    titleEn: 'Emergency Request',
    bodyAr: 'طلب طوارئ عاجل! يرجى الرد فوراً',
    bodyEn: 'Urgent emergency request! Please respond immediately',
  },
  payment: {
    titleAr: 'إشعار دفع',
    titleEn: 'Payment Notification',
    bodyAr: 'تم تحديث حالة الدفع',
    bodyEn: 'Payment status has been updated',
  },
  rating: {
    titleAr: 'تقييم جديد',
    titleEn: 'New Rating',
    bodyAr: 'تلقيت تقييماً جديداً',
    bodyEn: 'You received a new rating',
  },
  status_change: {
    titleAr: 'تحديث حالة',
    titleEn: 'Status Update',
    bodyAr: 'تم تحديث حالة الطلب',
    bodyEn: 'Request status has been updated',
  },
  system: {
    titleAr: 'إشعار جديد',
    titleEn: 'New Notification',
    bodyAr: 'لديك إشعار جديد من النظام',
    bodyEn: 'You have a new system notification',
  },
  reminder: {
    titleAr: 'تذكير',
    titleEn: 'Reminder',
    bodyAr: 'لديك تذكير مهم',
    bodyEn: 'You have an important reminder',
  },
  appointment: {
    titleAr: 'طلب جديد',
    titleEn: 'New Request',
    bodyAr: 'لديك طلب خدمة جديد',
    bodyEn: 'You have a new service request',
  },
}

/**
 * Create a VoiceNotification from a generic notification.
 * Uses templates for default text, but allows custom text.
 */
export function createVoiceNotification(
  type: string,
  customTitleAr?: string,
  customBodyAr?: string,
  customTitleEn?: string,
  customBodyEn?: string,
  priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
): VoiceNotification {
  const template = VOICE_TEMPLATES[type] || VOICE_TEMPLATES.system

  return {
    titleAr: customTitleAr || template.titleAr,
    titleEn: customTitleEn || template.titleEn,
    bodyAr: customBodyAr || template.bodyAr,
    bodyEn: customBodyEn || template.bodyEn,
    type,
    priority,
  }
}
