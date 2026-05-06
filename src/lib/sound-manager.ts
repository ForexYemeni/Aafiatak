/**
 * عافيتك — Sound Manager v5 (Professional Grade)
 * 
 * ROOT CAUSE OF v4 FAILURE:
 * When Browser Notification succeeded, it returned true and SKIPPED Web Audio.
 * But Browser Notification's OS sound is extremely quiet on most devices,
 * especially on mobile. The Web Audio API plays a LOUD, CUSTOM tone which
 * is what the user actually needs. They must work IN PARALLEL, not as alternatives.
 * 
 * SOLUTION: Play Browser Notification (visual) AND Web Audio (audible) simultaneously.
 * - Browser Notification = visual alert + subtle OS sound (backup)
 * - Web Audio API = loud, clear custom notification tone (primary)
 * 
 * Priority for RECEIVED notifications (polling/push):
 * 1. Android APK: Native bridge → done
 * 2. Browser: Web Audio (LOUD sound) + Browser Notification (visual) IN PARALLEL
 * 
 * Priority for LOCAL action sounds (button clicks):
 * 1. Android APK: Native bridge → done
 * 2. Browser: Web Audio (always works because user gesture unlocks AudioContext)
 */

// ═══════════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════════

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
//  METHOD 1: Native Android Bridge (APK only — ALWAYS WORKS)
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
//  METHOD 2: Web Audio API (LOUD custom tones)
//  This is the PRIMARY audible method for browsers.
//  Works when AudioContext is "running" (after user interaction).
// ═══════════════════════════════════════════════════════════════

let _ctx: AudioContext | null = null

async function getRunningContext(): Promise<AudioContext | null> {
  if (!_ctx) {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) return null
      _ctx = new AC()
      console.log('🔊 AudioContext created, state:', _ctx.state)
    } catch { return null }
  }

  if (_ctx.state === 'running') return _ctx

  // Try to resume — may fail if no user gesture
  if (_ctx.state === 'suspended') {
    try {
      await _ctx.resume()
      if (_ctx.state === 'running') {
        console.log('🔊 AudioContext resumed successfully')
        return _ctx
      }
    } catch {
      console.log('🔊 AudioContext resume failed (needs user interaction)')
    }
  }

  return null
}

async function playWebAudio(type: string): Promise<boolean> {
  try {
    const ctx = await getRunningContext()
    if (!ctx || ctx.state !== 'running') {
      console.log('🔊 Web Audio: AudioContext not running, state:', _ctx?.state || 'null')
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

      // Loud, clear tone with smooth envelope
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.5, start + 0.01)  // 0.5 = loud
      gain.gain.setValueAtTime(0.5, start + t.dur / 1000 - 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, start + t.dur / 1000)

      osc.start(start)
      osc.stop(start + t.dur / 1000 + 0.01)
    }

    console.log('🔊 ✅ Web Audio played [' + type + ']')
    return true
  } catch (e) {
    console.warn('🔊 Web Audio failed:', e)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
//  METHOD 3: Browser Notification API (VISUAL alert + OS sound)
//  This shows a system notification AND plays the OS notification sound.
//  Works WITHOUT AudioContext. Used IN PARALLEL with Web Audio.
// ═══════════════════════════════════════════════════════════════

function showBrowserNotification(title: string, body: string, type: string): boolean {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission !== 'granted') return false
  // Skip in APK (native bridge handles it)
  if (isCapacitorNative() || isAndroidApp()) return false

  try {
    const tag = `aafiatak-${type}-${Date.now()}`
    
    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      dir: 'rtl',
      lang: 'ar',
      tag,
      silent: false,      // Play OS notification sound
      renotify: true,      // Force sound even if tag exists
      requireInteraction: type === 'emergency' || type === 'assignment',
    })

    // Auto-close after 6 seconds
    setTimeout(() => {
      try { notification.close() } catch {}
    }, 6000)

    notification.onclick = () => {
      try { window.focus(); notification.close() } catch {}
    }

    console.log('🔊 ✅ Browser Notification shown [' + type + ']')
    return true
  } catch (e) {
    console.warn('🔊 Browser Notification failed:', e)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
//  METHOD 4: HTML Audio element (last resort)
// ═══════════════════════════════════════════════════════════════

function playFileAudio(type: string): boolean {
  try {
    const audio = new Audio(`/sounds/${type}.wav`)
    audio.volume = 0.7
    audio.play().then(() => {
      console.log('🔊 ✅ File audio played [' + type + ']')
    }).catch(() => {})
    return true
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
//  MAIN API
// ═══════════════════════════════════════════════════════════════

/**
 * Play a notification sound for RECEIVED notifications.
 * This is called when polling detects a new notification or when
 * a push notification arrives.
 * 
 * CRITICAL: Browser Notification + Web Audio run IN PARALLEL.
 * - Browser Notification = visual alert + OS sound (backup)
 * - Web Audio = loud, clear custom tone (primary audible alert)
 */
export async function playNotificationSound(
  type: string = 'system',
  title?: string,
  body?: string
): Promise<void> {
  console.log('🔊 playNotificationSound called [' + type + ']')

  if (!isSoundEnabled()) {
    console.log('🔊 SKIPPED: sound disabled')
    return
  }

  const now = Date.now()
  if (now - lastPlayTime < COOLDOWN_MS) {
    console.log('🔊 SKIPPED: cooldown (' + (COOLDOWN_MS - (now - lastPlayTime)) + 'ms)')
    return
  }
  lastPlayTime = now

  // ─── APK: Native bridge only (always works) ───
  if (playNativeSound(type)) return

  // ─── Browser: Play BOTH Web Audio AND Browser Notification ───
  // They serve DIFFERENT purposes and must work IN PARALLEL:
  // - Web Audio = loud, clear, custom notification tone (PRIMARY)
  // - Browser Notification = visual popup + OS sound (BACKUP)

  const notifTitle = title || getDefaultTitle(type)
  const notifBody = body || getDefaultBody(type)

  // Start Browser Notification (don't await - fire and forget)
  showBrowserNotification(notifTitle, notifBody, type)

  // Try Web Audio (PRIMARY audible method)
  const webAudioOk = await playWebAudio(type)
  if (webAudioOk) return  // Best case: loud custom tone played

  // If Web Audio failed (AudioContext suspended), try file audio
  const fileAudioOk = playFileAudio(type)
  if (fileAudioOk) return

  // If all audio methods failed, the Browser Notification (if shown)
  // will at least play the OS notification sound as a last resort
  if (Notification.permission === 'granted' && !isCapacitorNative() && !isAndroidApp()) {
    console.log('🔊 ⚠️ Web Audio failed but Browser Notification may have OS sound')
  } else {
    console.warn('🔊 ❌ ALL sound methods failed for [' + type + ']')
  }
}

/**
 * Play a LOCAL action sound. Called during user gestures (button clicks).
 * This always works because the user gesture unlocks AudioContext.
 */
export async function playLocalActionSound(type: string = 'system'): Promise<void> {
  console.log('🔊 playLocalActionSound called [' + type + ']')

  // Native bridge for APK
  if (playNativeSound(type)) return

  // Web Audio first (user gesture = AudioContext unlocked)
  if (await playWebAudio(type)) return

  // Fallback: file audio
  if (playFileAudio(type)) return

  console.warn('🔊 ❌ Local action sound failed [' + type + ']')
}

/**
 * Force play a sound (ignores cooldown and preference).
 * Used by the test button.
 */
export async function forcePlayNotificationSound(type: string = 'system'): Promise<void> {
  console.log('🔊 FORCE play [' + type + ']')
  lastPlayTime = 0
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
 * Initialize sound system. Called on app mount.
 * Sets up event listeners to unlock AudioContext on first user interaction.
 */
export function initSoundSystem(): void {
  console.log('🔊 initSoundSystem() called')

  let unlocked = false

  const unlock = async () => {
    if (unlocked) return
    const ctx = await getRunningContext()
    if (ctx && ctx.state === 'running') {
      unlocked = true
      console.log('🔊 AudioContext unlocked! Sound notifications will work.')
      // Play a nearly-silent tone to fully activate the context
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        gain.gain.setValueAtTime(0.001, ctx.currentTime)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.01)
      } catch {}
      // Remove listeners after unlock
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('touchend', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)
    document.addEventListener('touchend', unlock)
    document.addEventListener('keydown', unlock)
  }

  // Try to resume immediately
  getRunningContext().then(ctx => {
    if (ctx) {
      unlocked = true
      console.log('🔊 AudioContext ready on init, state:', ctx.state)
    } else {
      console.log('🔊 AudioContext needs user interaction to unlock - will auto-unlock on first click/touch')
    }
  })
}

/**
 * Check if AudioContext is currently running (for debugging)
 */
export function getAudioContextState(): string {
  if (!_ctx) return 'not-created'
  return _ctx.state
}

// ═══════════════════════════════════════════════════════════════
//  DEFAULT NOTIFICATION TEXT
// ═══════════════════════════════════════════════════════════════

const TITLES: Record<string, string> = {
  assignment: 'مهمة جديدة! 📋',
  chat: 'رسالة جديدة 💬',
  emergency: 'طلب طوارئ! 🚨',
  payment: 'إشعار دفع 💰',
  rating: 'تقييم جديد ⭐',
  status_change: 'تحديث حالة 🔄',
  system: 'إشعار جديد 🔔',
  reminder: 'تذكير ⏰',
  appointment: 'طلب جديد 📥',
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

function getDefaultTitle(type: string): string {
  return TITLES[type] || TITLES.system
}

function getDefaultBody(type: string): string {
  return BODIES[type] || BODIES.system
}
