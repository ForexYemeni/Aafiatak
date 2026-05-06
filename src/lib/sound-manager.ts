/**
 * عافيتك — Sound Manager v2
 * Robust notification sound system with multiple fallback layers:
 *
 * Layer 1: Native Android bridge (AndroidApp.playNotificationSound) — most reliable for APK
 * Layer 2: Web Audio API (synthesized tones) — works everywhere, no file dependency
 * Layer 3: HTMLAudioElement (WAV files) — optional, may be blocked by autoplay policy
 *
 * Respects user sound preferences stored in localStorage.
 */

// ─── Sound type → audio file mapping ───
const SOUND_FILES: Record<string, string> = {
  assignment: '/sounds/assignment.wav',
  chat: '/sounds/chat.wav',
  emergency: '/sounds/emergency.wav',
  payment: '/sounds/payment.wav',
  rating: '/sounds/rating.wav',
  status_change: '/sounds/status_change.wav',
  system: '/sounds/system.wav',
  reminder: '/sounds/reminder.wav',
  appointment: '/sounds/appointment.wav',
}

// ─── Web Audio API tone patterns ───
const WEB_AUDIO_PATTERNS: Record<string, { frequency: number; duration: number; repeat: number; gap: number; type: OscillatorType }> = {
  assignment:    { frequency: 880, duration: 180, repeat: 2, gap: 120, type: 'sine' },
  chat:          { frequency: 660, duration: 120, repeat: 3, gap: 60,  type: 'triangle' },
  emergency:     { frequency: 1200, duration: 250, repeat: 3, gap: 150, type: 'sawtooth' },
  payment:       { frequency: 523, duration: 200, repeat: 2, gap: 100, type: 'sine' },
  rating:        { frequency: 784, duration: 120, repeat: 2, gap: 80,  type: 'sine' },
  status_change: { frequency: 440, duration: 250, repeat: 1, gap: 0,   type: 'sine' },
  system:        { frequency: 600, duration: 150, repeat: 2, gap: 100, type: 'triangle' },
  reminder:      { frequency: 700, duration: 180, repeat: 2, gap: 120, type: 'sine' },
  appointment:   { frequency: 932, duration: 150, repeat: 2, gap: 80,  type: 'sine' },
}

// ─── Audio cache for file playback ───
const audioCache: Record<string, HTMLAudioElement> = {}

// ─── Track AudioContext for resume after user interaction ───
let globalAudioContext: AudioContext | null = null
let audioContextResumed = false

// ─── Get or create shared AudioContext ───
function getAudioContext(): AudioContext | null {
  try {
    if (!globalAudioContext) {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (globalAudioContext.state === 'suspended' && audioContextResumed) {
      globalAudioContext.resume()
    }
    return globalAudioContext
  } catch {
    return null
  }
}

// ─── Resume AudioContext on first user interaction ───
function resumeAudioOnInteraction() {
  if (audioContextResumed) return
  const resume = () => {
    audioContextResumed = true
    if (globalAudioContext && globalAudioContext.state === 'suspended') {
      globalAudioContext.resume().catch(() => {})
    }
  }
  // Listen for first user interaction to unlock audio
  const events = ['click', 'touchstart', 'keydown', 'pointerdown']
  const handler = () => {
    resume()
    events.forEach(e => document.removeEventListener(e, handler))
  }
  if (typeof document !== 'undefined') {
    events.forEach(e => document.addEventListener(e, handler, { once: true }))
  }
}

// ─── Check if running in Android APK ───
function isAndroidApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).AndroidApp?.playNotificationSound
}

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as any).Capacitor
  return !!(cap && cap.isNativePlatform && cap.isNativePlatform())
}

// ─── Get user sound preference ───
export function isSoundEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true
  const saved = localStorage.getItem('aafiatak-sound-enabled')
  return saved !== 'false' // default: true
}

// ─── Set sound preference ───
export function setSoundEnabled(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('aafiatak-sound-enabled', String(enabled))
  }
}

// ═══════════════════════════════════════════
//  SOUND PLAYBACK METHODS (ordered by reliability)
// ═══════════════════════════════════════════

// ─── Method 1: Native Android bridge (MOST RELIABLE for APK) ───
function playNativeAndroidSound(type: string): boolean {
  if (!isAndroidApp()) return false
  try {
    const android = (window as any).AndroidApp
    if (android && typeof android.playNotificationSound === 'function') {
      android.playNotificationSound()
      console.log('🔊 Sound played via native Android bridge')
      return true
    }
  } catch (err) {
    console.warn('🔊 Native Android sound failed:', err)
  }
  return false
}

// ─── Method 2: Web Audio API (works in browser + WebView) ───
function playWebAudioSound(type: string = 'system'): boolean {
  try {
    const audioCtx = getAudioContext()
    if (!audioCtx) return false

    // Try to resume if suspended
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }

    const config = WEB_AUDIO_PATTERNS[type] || WEB_AUDIO_PATTERNS.system

    for (let i = 0; i < config.repeat; i++) {
      const startTime = audioCtx.currentTime + (i * (config.duration + config.gap)) / 1000

      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.frequency.value = config.frequency
      oscillator.type = config.type

      // Volume envelope (smooth fade in/out)
      gainNode.gain.setValueAtTime(0.001, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.3, startTime + 0.01)
      gainNode.gain.setValueAtTime(0.3, startTime + config.duration / 1000 - 0.03)
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration / 1000)

      oscillator.start(startTime)
      oscillator.stop(startTime + config.duration / 1000 + 0.01)
    }

    console.log('🔊 Sound played via Web Audio API [' + type + ']')
    return true
  } catch (err) {
    console.warn('🔊 Web Audio API failed:', err)
    return false
  }
}

// ─── Method 3: HTMLAudioElement (file-based, may be blocked by autoplay) ───
function playAudioFile(type: string): boolean {
  const filePath = SOUND_FILES[type]
  if (!filePath) return false

  try {
    let audio = audioCache[type]
    if (!audio) {
      audio = new Audio(filePath)
      audio.preload = 'auto'
      audio.volume = 0.5
      audioCache[type] = audio
    }

    audio.currentTime = 0
    audio.play().then(() => {
      console.log('🔊 Sound played via audio file [' + type + ']')
    }).catch(() => {
      // Autoplay blocked — this is expected, Web Audio API fallback handles it
    })
    return true // Return true optimistically, actual playback is async
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════
//  MAIN PLAY FUNCTION
// ═══════════════════════════════════════════

// ─── Cooldown to prevent duplicate sounds ───
let lastSoundTime = 0
const SOUND_COOLDOWN_MS = 3000

export async function playNotificationSound(type: string = 'system'): Promise<void> {
  // Check user preference
  if (!isSoundEnabled()) {
    console.log('🔊 Sound skipped: disabled by user')
    return
  }

  // Cooldown check
  const now = Date.now()
  if (now - lastSoundTime < SOUND_COOLDOWN_MS) {
    console.log('🔊 Sound skipped: cooldown active')
    return
  }
  lastSoundTime = now

  console.log('🔊 Playing notification sound [' + type + ']...')

  // ─── Try methods in order of reliability ───

  // Method 1: Native Android bridge (most reliable for APK)
  if (playNativeAndroidSound(type)) {
    return // Success!
  }

  // Method 2: Web Audio API (most reliable for browser)
  if (playWebAudioSound(type)) {
    return // Success!
  }

  // Method 3: Audio file (backup)
  if (playAudioFile(type)) {
    return // Likely success (async)
  }

  console.warn('🔊 All sound methods failed for type:', type)
}

// ─── Play sound WITHOUT cooldown (for forced playback like test button) ───
export async function forcePlayNotificationSound(type: string = 'system'): Promise<void> {
  const wasEnabled = isSoundEnabled()
  setSoundEnabled(true)
  lastSoundTime = 0 // Reset cooldown
  await playNotificationSound(type)
  setSoundEnabled(wasEnabled)
}

// ─── Preload sounds and prepare audio context ───
export function preloadSounds(): void {
  // Resume AudioContext on user interaction
  resumeAudioOnInteraction()

  // Preload audio files
  Object.entries(SOUND_FILES).forEach(([type, path]) => {
    if (!audioCache[type]) {
      const audio = new Audio(path)
      audio.preload = 'auto'
      audio.volume = 0.5
      audioCache[type] = audio
    }
  })

  // Pre-create AudioContext on first user interaction
  resumeAudioOnInteraction()
}

// ─── Test a specific sound (used from settings) ───
export async function testNotificationSound(type: string = 'system'): Promise<void> {
  await forcePlayNotificationSound(type)
}

// ─── Initialize sound system (call on app mount) ───
export function initSoundSystem(): void {
  resumeAudioOnInteraction()
  preloadSounds()
}
