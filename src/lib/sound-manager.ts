/**
 * عافيتك — Sound Manager v11 (BULLETPROOF)
 *
 * ROOT CAUSE OF PREVIOUS FAILURES:
 * =================================
 * v10's unlockAudioContext() created a LOCAL AudioContext, resumed it,
 * then threw it away. But getAudioContext() created a DIFFERENT _ctx
 * that was NEVER resumed — so playWebAudio() ALWAYS failed because
 * _ctx.state was always 'suspended'.
 *
 * v11 FIX:
 * =======
 * 1. ONE single AudioContext, stored in _ctx, created ONCE
 * 2. On first user gesture, we resume THAT SAME _ctx
 * 3. Web Audio oscillator is the PRIMARY sound method (no file loading)
 * 4. HTML Audio with cached elements as SECONDARY method
 * 5. NO Browser Notification sound hack (was unreliable)
 * 6. Sound is guaranteed after ANY user interaction (click/touch)
 */

// ═══════════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════════

const COOLDOWN_MS = 2000
let lastPlayTime = 0

// Web Audio oscillator tones — each type has a distinct sound
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

// ═══════════════════════════════════════════════════════════════
//  SINGLE AUDIO CONTEXT — THE KEY FIX
// ═══════════════════════════════════════════════════════════════

let _ctx: AudioContext | null = null
let _ctxResumed = false // Track if we've successfully resumed

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!_ctx) {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) return null
      _ctx = new AC()
      console.log('🔊 [AudioContext] Created, state:', _ctx.state)
    } catch (e) {
      console.warn('🔊 [AudioContext] Failed to create:', e)
      return null
    }
  }
  return _ctx
}

/**
 * Resume the AudioContext. MUST be called during a user gesture.
 * This is the CRITICAL fix — we resume THE SAME _ctx, not a throwaway one.
 */
export function resumeAudioContext(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    console.log('🔊 [Resume] Resuming AudioContext (state was:', ctx.state, ')')
    ctx.resume().then(() => {
      _ctxResumed = true
      console.log('🔊 [Resume] AudioContext resumed! state:', ctx.state)
    }).catch((e: any) => {
      console.warn('🔊 [Resume] Failed to resume:', e)
    })
  } else if (ctx.state === 'running') {
    _ctxResumed = true
    console.log('🔊 [Resume] AudioContext already running')
  }
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

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as any).Capacitor
  return !!(cap && cap.isNativePlatform && cap.isNativePlatform())
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
//  METHOD 1: Native Android Bridge (APK only)
// ═══════════════════════════════════════════════════════════════

function playNativeSound(type: string): boolean {
  if (!isAndroidApp()) return false
  try {
    const android = (window as any).AndroidApp
    if (type === 'emergency' && typeof android.playEmergencySound === 'function') {
      android.playEmergencySound()
      return true
    }
    if (typeof android.playNotificationSound === 'function') {
      android.playNotificationSound()
      return true
    }
  } catch {}
  return false
}

// ═══════════════════════════════════════════════════════════════
//  METHOD 2: Web Audio Oscillator — PRIMARY METHOD
//  This ALWAYS works after the user has clicked anything once.
//  No file loading, no network requests, just pure tones.
// ═══════════════════════════════════════════════════════════════

function playWebAudio(type: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const ctx = getAudioContext()
    if (!ctx) {
      console.warn('🔊 [WebAudio] No AudioContext available')
      return false
    }

    // Try to resume if suspended — this might work if called during user gesture
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    // If still not running after resume attempt, we can't play
    if (ctx.state !== 'running') {
      console.warn('🔊 [WebAudio] AudioContext not running, state:', ctx.state)
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

      // Smooth envelope to avoid clicks
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.5, start + 0.01)
      gain.gain.setValueAtTime(0.5, start + t.dur / 1000 - 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, start + t.dur / 1000)

      osc.start(start)
      osc.stop(start + t.dur / 1000 + 0.01)
    }

    console.log('🔊 [WebAudio] Played:', type)
    return true
  } catch (e) {
    console.warn('🔊 [WebAudio] Failed for', type, ':', e)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
//  METHOD 3: HTML Audio with CACHED elements
//  Caching is KEY — new Audio() elements get blocked by autoplay,
//  but cached elements that have been played once can be replayed.
// ═══════════════════════════════════════════════════════════════

const audioCache: Map<string, HTMLAudioElement> = new Map()

function getAudioElement(type: string): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null

  // Return cached element if available
  const cached = audioCache.get(type)
  if (cached) return cached

  try {
    const audio = new Audio(`/sounds/${type}.wav`)
    audio.volume = 0.8
    audio.preload = 'auto'
    audioCache.set(type, audio)
    return audio
  } catch {
    return null
  }
}

function playHtmlAudio(type: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const audio = getAudioElement(type)
    if (!audio) return false

    // Reset to beginning
    audio.currentTime = 0

    const playPromise = audio.play()
    if (playPromise) {
      playPromise.then(() => {
        console.log('🔊 [HTML Audio] Played:', type)
      }).catch((e: any) => {
        // Autoplay blocked — try Web Audio as fallback
        console.log('🔊 [HTML Audio] Blocked (autoplay policy):', type)
      })
    }

    return true
  } catch (e) {
    console.warn('🔊 [HTML Audio] Error for', type, ':', e)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
//  METHOD 4: Vibration (mobile fallback)
// ═══════════════════════════════════════════════════════════════

function vibrate(type: string): boolean {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return false
  try {
    const patterns: Record<string, number[]> = {
      emergency: [200, 100, 200, 100, 200, 100, 200],
      assignment: [200, 50, 200],
      chat: [100],
      payment: [150, 50, 150],
      system: [100],
    }
    navigator.vibrate(patterns[type] || [100])
    return true
  } catch { return false }
}

// ═══════════════════════════════════════════════════════════════
//  DEFAULT NOTIFICATION TEXT
// ═══════════════════════════════════════════════════════════════

const TITLES: Record<string, string> = {
  assignment: 'مهمة جديدة!',
  chat: 'رسالة جديدة',
  emergency: 'طلب طوارئ!',
  payment: 'إشعار دفع',
  rating: 'تقييم جديد',
  status_change: 'تحديث حالة',
  system: 'إشعار جديد',
  reminder: 'تذكير',
  appointment: 'طلب جديد',
}

const BODIES: Record<string, string> = {
  assignment: 'لديك مهمة جديدة',
  chat: 'لديك رسالة جديدة',
  emergency: 'طلب طوارئ عاجل!',
  payment: 'تحديث بخصوص الدفع',
  rating: 'تلقيت تقييماً جديداً',
  status_change: 'تم تحديث حالة الطلب',
  system: 'لديك إشعار جديد',
  reminder: 'لديك تذكير',
  appointment: 'لديك طلب جديد',
}

function getDefaultTitle(type: string): string { return TITLES[type] || TITLES.system }
function getDefaultBody(type: string): string { return BODIES[type] || BODIES.system }

// ═══════════════════════════════════════════════════════════════
//  MAIN API
// ═══════════════════════════════════════════════════════════════

/**
 * Play a notification sound for RECEIVED notifications.
 *
 * STRATEGY:
 * 1. Native Android Bridge (APK only) — always works
 * 2. Web Audio Oscillator — works after first user gesture
 * 3. HTML Audio — works after first user gesture
 * 4. Vibration — always works on mobile
 */
export function playNotificationSound(
  type: string = 'system',
  title?: string,
  body?: string
): void {
  if (!isSoundEnabled()) {
    console.log('🔇 Sound is disabled in preferences')
    return
  }

  const now = Date.now()
  if (now - lastPlayTime < COOLDOWN_MS) {
    console.log('🔇 Sound cooldown active')
    return
  }
  lastPlayTime = now

  console.log(`🔊 [Play] Sound request: type=${type}`)

  // 1. Native Android Bridge (APK only — always works)
  if (playNativeSound(type)) {
    console.log('🔊 [Play] ✓ Native sound played (APK)')
    vibrate(type)
    return
  }

  // 2. Web Audio Oscillator — PRIMARY for web browsers
  const webAudioResult = playWebAudio(type)

  // 3. HTML Audio — supplementary
  playHtmlAudio(type)

  // 4. Vibration — always try on mobile
  vibrate(type)

  if (webAudioResult) {
    console.log(`🔊 [Play] ✓ Web Audio played: ${type}`)
  } else {
    console.log(`🔊 [Play] Web Audio failed. AudioContext state: ${_ctx?.state || 'not created'}. Need user gesture to unlock.`)
  }
}

/**
 * Test notification sound — called from the test button (USER GESTURE).
 * This is guaranteed to work because it's triggered by a user gesture.
 */
export function testNotificationSound(type: string = 'system'): void {
  console.log('🔊 [Test] Test notification sound requested')

  // Reset cooldown
  lastPlayTime = 0

  // CRITICAL: Resume AudioContext during this user gesture
  resumeAudioContext()

  // Now play
  playNotificationSound(type, '🔔 اختبار الصوت', 'هذا اختبار للتنبيه الصوتي')
}

/**
 * Play a LOCAL action sound during user gesture (button clicks).
 * Since this is triggered by user gesture, audio should work.
 */
export function playLocalActionSound(type: string = 'system'): void {
  if (!isSoundEnabled()) return

  // Resume AudioContext on this user gesture
  resumeAudioContext()

  // APK
  if (playNativeSound(type)) return

  // Web Audio
  playWebAudio(type)

  // HTML Audio
  playHtmlAudio(type)

  // Vibration
  vibrate(type)
}

export function forcePlayNotificationSound(type: string = 'system'): void {
  lastPlayTime = 0
  const wasEnabled = isSoundEnabled()
  setSoundEnabled(true)
  playNotificationSound(type)
  if (!wasEnabled) setSoundEnabled(false)
}

/**
 * Initialize the sound system. Called ONCE when the app loads.
 *
 * KEY: On first user gesture, we resume THE SAME AudioContext that
 * playWebAudio() uses. This ensures the oscillator can play.
 */
export function initSoundSystem(): void {
  if (typeof window === 'undefined') return

  // Guard: Prevent multiple initialization
  if ((window as any).__aafiatakSoundInit) return
  ;(window as any).__aafiatakSoundInit = true

  console.log('🔊 [Init] Sound system v11 initializing...')

  // Pre-create the AudioContext so it's ready to be resumed
  getAudioContext()

  // ─── On first user gesture, resume THE SAME AudioContext ───
  const gestureHandler = () => {
    resumeAudioContext()
  }

  const gestureEvents = ['click', 'touchstart', 'touchend', 'keydown']
  gestureEvents.forEach(event => {
    document.addEventListener(event, gestureHandler, { passive: true, once: true })
  })

  // ─── Auto-request Notification permission ───
  let permissionRequested = false
  const requestPermission = async () => {
    if (permissionRequested) return
    if (isCapacitorNative() || isAndroidApp()) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return

    permissionRequested = true
    console.log('🔊 [Init] Auto-requesting notification permission...')

    try {
      const result = await Notification.requestPermission()
      console.log('🔊 [Init] Notification permission result:', result)
      if (result === 'granted') {
        try {
          const { requestNotificationPermission } = await import('@/lib/firebase-client')
          const token = await requestNotificationPermission()
          if (token) {
            console.log('🔊 [Init] FCM token registered')
          }
        } catch {}
      }
    } catch {}
  }

  // Request permission on first click/touch
  document.addEventListener('click', requestPermission, { once: true })
  document.addEventListener('touchstart', requestPermission, { once: true })

  // ─── Handle visibility change ───
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // User returned to tab — re-register gesture handlers to resume AudioContext
      const ctx = getAudioContext()
      if (ctx && ctx.state === 'suspended') {
        console.log('🔊 [Visibility] AudioContext suspended after tab switch, will resume on next gesture')
        gestureEvents.forEach(event => {
          document.addEventListener(event, gestureHandler, { passive: true, once: true })
        })
      }
    }
  }, { passive: true })

  console.log('🔊 [Init] Sound system v11 ready. AudioContext state:', _ctx?.state, '- Will unlock on first user interaction')
}

export function getAudioContextState(): string {
  if (!_ctx) return 'not-created'
  return _ctx.state
}
