/**
 * عافيتك — Sound Manager
 * Unified notification sound system with real audio files + Web Audio API fallback
 * Respects user sound preferences stored in localStorage
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

// ─── Web Audio API fallback patterns (used when audio files fail) ───
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

// ─── Audio cache to prevent re-downloading ───
const audioCache: Record<string, HTMLAudioElement> = {}

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

// ─── Play sound using HTMLAudioElement (file-based) ───
function playAudioFile(type: string): Promise<boolean> {
  return new Promise((resolve) => {
    const filePath = SOUND_FILES[type]
    if (!filePath) {
      resolve(false)
      return
    }

    let audio = audioCache[type]
    if (!audio) {
      audio = new Audio(filePath)
      audio.preload = 'auto'
      audio.volume = 0.5
      audioCache[type] = audio
    }

    // Reset to beginning
    audio.currentTime = 0

    const onEnded = () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      resolve(true)
    }

    const onError = () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      console.warn(`Sound file failed: ${filePath}, falling back to Web Audio`)
      resolve(false)
    }

    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    audio.play().catch(() => {
      // Autoplay blocked - try after user interaction
      resolve(false)
    })
  })
}

// ─── Play sound using Web Audio API (fallback) ───
function playWebAudioSound(type: string = 'system'): void {
  try {
    const config = WEB_AUDIO_PATTERNS[type] || WEB_AUDIO_PATTERNS.system
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }

    for (let i = 0; i < config.repeat; i++) {
      const startTime = audioCtx.currentTime + (i * (config.duration + config.gap)) / 1000

      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.frequency.value = config.frequency
      oscillator.type = config.type

      // Volume envelope
      gainNode.gain.setValueAtTime(0.001, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.25, startTime + 0.01)
      gainNode.gain.setValueAtTime(0.25, startTime + config.duration / 1000 - 0.03)
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration / 1000)

      oscillator.start(startTime)
      oscillator.stop(startTime + config.duration / 1000 + 0.01)
    }

    const totalDuration = config.repeat * (config.duration + config.gap) + 500
    setTimeout(() => {
      try { audioCtx.close() } catch {}
    }, totalDuration)
  } catch {
    // Silently fail — sound is optional
  }
}

// ─── Main play function: tries file first, falls back to Web Audio ───
export async function playNotificationSound(type: string = 'system'): Promise<void> {
  // Check user preference
  if (!isSoundEnabled()) return

  // Try playing from audio file first
  const fileSuccess = await playAudioFile(type)

  // If file playback failed, use Web Audio API as fallback
  if (!fileSuccess) {
    playWebAudioSound(type)
  }
}

// ─── Preload all sounds (call on first user interaction) ───
export function preloadSounds(): void {
  Object.entries(SOUND_FILES).forEach(([type, path]) => {
    if (!audioCache[type]) {
      const audio = new Audio(path)
      audio.preload = 'auto'
      audio.volume = 0.5
      audioCache[type] = audio
    }
  })
}

// ─── Test a specific sound (used from settings) ───
export async function testNotificationSound(type: string = 'system'): Promise<void> {
  // Temporarily force sound on for testing
  const wasEnabled = isSoundEnabled()
  setSoundEnabled(true)
  await playNotificationSound(type)
  setSoundEnabled(wasEnabled)
}
