/**
 * عافيتك — Sound Manager v3 (Professional Grade)
 * 
 * PROBLEM: Previous versions had a critical bug where AudioContext.resume() was
 * called without await, meaning the AudioContext stayed "suspended" and all
 * oscillators played silence. This is the #1 reason sounds never worked.
 *
 * SOLUTION: Proper async AudioContext lifecycle management:
 * 1. Create AudioContext on first user interaction (required by browsers)
 * 2. Await resume() before playing any sound
 * 3. Native Android bridge as primary for APK (always works, no AudioContext needed)
 * 4. Extensive logging for debugging
 */

// ═══════════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════════

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

const TONES: Record<string, { freq: number; dur: number; repeat: number; gap: number; wave: OscillatorType }> = {
  assignment:    { freq: 880,  dur: 180, repeat: 2, gap: 120, wave: 'sine' },
  chat:          { freq: 660,  dur: 120, repeat: 3, gap: 60,  wave: 'triangle' },
  emergency:     { freq: 1200, dur: 250, repeat: 3, gap: 150, wave: 'sawtooth' },
  payment:       { freq: 523,  dur: 200, repeat: 2, gap: 100, wave: 'sine' },
  rating:        { freq: 784,  dur: 120, repeat: 2, gap: 80,  wave: 'sine' },
  status_change: { freq: 440,  dur: 250, repeat: 1, gap: 0,   wave: 'sine' },
  system:        { freq: 600,  dur: 150, repeat: 2, gap: 100, wave: 'triangle' },
  reminder:      { freq: 700,  dur: 180, repeat: 2, gap: 120, wave: 'sine' },
  appointment:   { freq: 932,  dur: 150, repeat: 2, gap: 80,  wave: 'sine' },
}

const COOLDOWN_MS = 3000
let lastPlayTime = 0

// ═══════════════════════════════════════════════════════════════
//  AUDIOCONTEXT LIFECYCLE (the critical fix)
// ═══════════════════════════════════════════════════════════════

let _ctx: AudioContext | null = null
let _ctxReady = false // true after successfully resumed

/**
 * Get a RUNNING AudioContext. Creates one if needed, resumes if suspended.
 * MUST be awaited because resume() is async.
 */
async function getRunningContext(): Promise<AudioContext | null> {
  // Create if needed
  if (!_ctx) {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) {
        console.error('🔊 AudioContext API not available')
        return null
      }
      _ctx = new AC()
      console.log('🔊 AudioContext created, initial state:', _ctx.state)
    } catch (e) {
      console.error('🔊 Failed to create AudioContext:', e)
      return null
    }
  }

  // If already running, return immediately
  if (_ctx.state === 'running') {
    _ctxReady = true
    return _ctx
  }

  // If suspended, resume (THIS IS THE FIX — we await it!)
  if (_ctx.state === 'suspended') {
    try {
      console.log('🔊 AudioContext is suspended, attempting resume...')
      await _ctx.resume()
      console.log('🔊 AudioContext resumed! state:', _ctx.state)
      _ctxReady = true
      return _ctx
    } catch (e) {
      console.warn('🔊 AudioContext resume failed (needs user interaction):', e)
      return null
    }
  }

  return _ctx
}

/**
 * Initialize sound system. MUST be called on app mount.
 * Sets up a one-time click handler to unlock AudioContext.
 */
export function initSoundSystem(): void {
  console.log('🔊 initSoundSystem() called')

  const unlock = async () => {
    console.log('🔊 User interaction detected — unlocking audio...')
    const ctx = await getRunningContext()
    if (ctx) {
      console.log('🔊 Audio unlocked! state:', ctx.state)
      // Play a very short silent tone to fully activate the context
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        gain.gain.setValueAtTime(0.001, ctx.currentTime) // Nearly silent
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.01)
      } catch {}
    }
    // Remove all listeners
    document.removeEventListener('click', unlock)
    document.removeEventListener('touchstart', unlock)
    document.removeEventListener('touchend', unlock)
    document.removeEventListener('keydown', unlock)
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('click', unlock, { once: false })
    document.addEventListener('touchstart', unlock, { once: false })
    document.addEventListener('touchend', unlock, { once: false })
    document.addEventListener('keydown', unlock, { once: false })
  }

  // Also try to resume immediately (might work if there was prior interaction)
  getRunningContext().then(ctx => {
    if (ctx) console.log('🔊 AudioContext ready on init, state:', ctx.state)
    else console.log('🔊 AudioContext needs user interaction to unlock')
  })
}

// ═══════════════════════════════════════════════════════════════
//  PLATFORM DETECTION
// ═══════════════════════════════════════════════════════════════

function isAndroidApp(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const a = (window as any).AndroidApp
    return !!(a && typeof a.playNotificationSound === 'function')
  } catch { return false }
}

// ═══════════════════════════════════════════════════════════════
//  USER PREFERENCES
// ═══════════════════════════════════════════════════════════════

export function isSoundEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true
  return localStorage.getItem('aafiatak-sound-enabled') !== 'false'
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('aafiatak-sound-enabled', String(enabled))
  }
}

// ═══════════════════════════════════════════════════════════════
//  SOUND METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Method 1: Native Android bridge — MOST RELIABLE for APK
 * Uses Android RingtoneManager, always works regardless of WebView/AudioContext state
 */
function playNativeSound(type: string): boolean {
  if (!isAndroidApp()) return false
  try {
    const android = (window as any).AndroidApp
    if (type === 'emergency' && typeof android.playEmergencySound === 'function') {
      android.playEmergencySound()
      console.log('🔊 ✅ Native emergency sound played')
      return true
    }
    if (typeof android.playNotificationSound === 'function') {
      android.playNotificationSound()
      console.log('🔊 ✅ Native notification sound played')
      return true
    }
  } catch (e) {
    console.warn('🔊 Native sound failed:', e)
  }
  return false
}

/**
 * Method 2: Web Audio API — works in browser and WebView
 * NOW PROPERLY AWAITS AudioContext.resume() before creating oscillators!
 */
async function playWebAudio(type: string): Promise<boolean> {
  try {
    const ctx = await getRunningContext()
    if (!ctx || ctx.state !== 'running') {
      console.warn('🔊 Web Audio: AudioContext not running, state:', ctx?.state)
      return false
    }

    const t = TONES[type] || TONES.system

    for (let i = 0; i < t.repeat; i++) {
      const start = ctx.currentTime + (i * (t.dur + t.gap)) / 1000

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = t.freq
      osc.type = t.wave

      // Smooth volume envelope
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.01)
      gain.gain.setValueAtTime(0.35, start + t.dur / 1000 - 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, start + t.dur / 1000)

      osc.start(start)
      osc.stop(start + t.dur / 1000 + 0.01)
    }

    console.log('🔊 ✅ Web Audio sound played [' + type + ']')
    return true
  } catch (e) {
    console.warn('🔊 Web Audio failed:', e)
    return false
  }
}

/**
 * Method 3: HTML Audio element (WAV file)
 * May be blocked by autoplay policy — only works after user interaction
 */
function playFileAudio(type: string): boolean {
  const path = SOUND_FILES[type]
  if (!path) return false

  try {
    const audio = new Audio(path)
    audio.volume = 0.6
    audio.play().then(() => {
      console.log('🔊 ✅ File audio played [' + type + ']')
    }).catch((e) => {
      console.warn('🔊 File audio blocked (autoplay policy):', e?.name || e)
    })
    return true
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
//  MAIN API
// ═══════════════════════════════════════════════════════════════

/**
 * Play a notification sound. Tries methods in order of reliability.
 * On Android APK: native bridge → Web Audio → file
 * On browser: Web Audio → file
 */
export async function playNotificationSound(type: string = 'system'): Promise<void> {
  console.log('🔊 playNotificationSound called [' + type + ']')

  // Check preference
  if (!isSoundEnabled()) {
    console.log('🔊 SKIPPED: sound disabled by user')
    return
  }

  // Cooldown
  const now = Date.now()
  if (now - lastPlayTime < COOLDOWN_MS) {
    console.log('🔊 SKIPPED: cooldown (' + (COOLDOWN_MS - (now - lastPlayTime)) + 'ms remaining)')
    return
  }
  lastPlayTime = now

  // Method 1: Native Android (synchronous, always works)
  if (playNativeSound(type)) return

  // Method 2: Web Audio API (async, needs AudioContext running)
  if (await playWebAudio(type)) return

  // Method 3: File audio (may be blocked by autoplay)
  if (playFileAudio(type)) return

  console.error('🔊 ❌ ALL sound methods failed for [' + type + ']')
}

/**
 * Force play a sound (ignores cooldown and preference).
 * Used by the test button.
 */
export async function forcePlayNotificationSound(type: string = 'system'): Promise<void> {
  console.log('🔊 FORCE play [' + type + ']')
  lastPlayTime = 0 // Reset cooldown
  const wasEnabled = isSoundEnabled()
  setSoundEnabled(true)
  await playNotificationSound(type)
  if (!wasEnabled) setSoundEnabled(false)
}

/**
 * Test a sound type (alias for forcePlay)
 */
export async function testNotificationSound(type: string = 'system'): Promise<void> {
  await forcePlayNotificationSound(type)
}

/**
 * Preload sound files into cache
 */
export function preloadSounds(): void {
  Object.entries(SOUND_FILES).forEach(([type, path]) => {
    try {
      const audio = new Audio(path)
      audio.preload = 'auto'
      audio.volume = 0.5
    } catch {}
  })
}

/**
 * Check if AudioContext is currently running (for debugging)
 */
export function getAudioContextState(): string {
  if (!_ctx) return 'not-created'
  return _ctx.state
}
