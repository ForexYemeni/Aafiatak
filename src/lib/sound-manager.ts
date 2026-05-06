/**
 * عافيتك — Sound Manager v4 (Professional Grade)
 * 
 * ROOT CAUSE OF ALL PREVIOUS FAILURES:
 * Web Audio API requires a "running" AudioContext, which can ONLY be activated
 * by a user gesture. When the polling detects a new notification automatically
 * (not from a user gesture), the AudioContext is "suspended" and ALL sounds fail.
 * 
 * SOLUTION: Use the Browser Notification API as the PRIMARY method.
 * Browser Notifications play the OS notification sound AUTOMATICALLY, without
 * needing AudioContext. This is the ONLY reliable way to play sound without
 * user interaction in web browsers.
 * 
 * Priority order:
 * 1. Android APK: Native bridge (always works, no WebView limitations)
 * 2. Browser: Browser Notification API (plays OS sound, no AudioContext needed)
 * 3. Fallback: Web Audio API (only works after user interaction)
 * 4. Fallback: HTML Audio element (may be blocked by autoplay policy)
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
//  METHOD 1: Native Android Bridge (APK only)
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
//  METHOD 2: Browser Notification API (PRIMARY for web)
//  This plays the OS notification sound AUTOMATICALLY.
//  No AudioContext needed, no user gesture needed.
//  Only requires notification permission to be granted.
// ═══════════════════════════════════════════════════════════════

function playBrowserNotificationSound(title: string, body: string, type: string): boolean {
  // Skip if notification permission not granted
  if (typeof Notification === 'undefined') return false
  if (Notification.permission !== 'granted') {
    console.log('🔊 Browser Notification skipped: permission not granted')
    return false
  }

  // In APK, native bridge is preferred (browser notifications are weird in WebView)
  if (isCapacitorNative() || isAndroidApp()) return false

  try {
    // Determine appropriate icon and tag
    const tag = `aafiatak-${type}-${Date.now()}`
    
    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      dir: 'rtl',
      lang: 'ar',
      tag,
      silent: false, // IMPORTANT: This ensures the OS plays a sound
      requireInteraction: type === 'emergency' || type === 'assignment',
    })

    // Auto-close after 5 seconds (don't clutter notification center)
    setTimeout(() => {
      try { notification.close() } catch {}
    }, 5000)

    // Click handler - focus the window
    notification.onclick = () => {
      try {
        window.focus()
        notification.close()
      } catch {}
    }

    console.log('🔊 ✅ Browser Notification shown with sound [' + type + ']')
    return true
  } catch (e) {
    console.warn('🔊 Browser Notification failed:', e)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
//  METHOD 3: Web Audio API (fallback, needs user interaction)
// ═══════════════════════════════════════════════════════════════

let _ctx: AudioContext | null = null

async function getRunningContext(): Promise<AudioContext | null> {
  if (!_ctx) {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) return null
      _ctx = new AC()
    } catch { return null }
  }

  if (_ctx.state === 'running') return _ctx

  if (_ctx.state === 'suspended') {
    try {
      await _ctx.resume()
      if (_ctx.state === 'running') return _ctx
    } catch {}
  }

  return null
}

async function playWebAudio(type: string): Promise<boolean> {
  try {
    const ctx = await getRunningContext()
    if (!ctx || ctx.state !== 'running') return false

    const t = TONES[type] || TONES.system

    for (let i = 0; i < t.repeat; i++) {
      const start = ctx.currentTime + (i * (t.dur + t.gap)) / 1000

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = t.freq
      osc.type = t.wave

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.01)
      gain.gain.setValueAtTime(0.35, start + t.dur / 1000 - 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, start + t.dur / 1000)

      osc.start(start)
      osc.stop(start + t.dur / 1000 + 0.01)
    }

    console.log('🔊 ✅ Web Audio played [' + type + ']')
    return true
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
//  METHOD 4: HTML Audio element (last resort)
// ═══════════════════════════════════════════════════════════════

function playFileAudio(type: string): boolean {
  try {
    const audio = new Audio(`/sounds/${type}.wav`)
    audio.volume = 0.6
    audio.play().catch(() => {})
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
 * 
 * On Android APK: Native bridge → Web Audio → File audio
 * On browser: Browser Notification (OS sound) → Web Audio → File audio
 * 
 * @param type Notification type (determines sound tone)
 * @param title Title for browser notification (used by Method 2)
 * @param body Body for browser notification (used by Method 2)
 */
export async function playNotificationSound(
  type: string = 'system',
  title?: string,
  body?: string
): Promise<void> {
  console.log('🔊 playNotificationSound called [' + type + ']')

  // Check preference
  if (!isSoundEnabled()) {
    console.log('🔊 SKIPPED: sound disabled by user')
    return
  }

  // Cooldown
  const now = Date.now()
  if (now - lastPlayTime < COOLDOWN_MS) {
    console.log('🔊 SKIPPED: cooldown')
    return
  }
  lastPlayTime = now

  // Method 1: Native Android (synchronous, always works in APK)
  if (playNativeSound(type)) return

  // Method 2: Browser Notification API (plays OS sound automatically)
  const notifTitle = title || getDefaultTitle(type)
  const notifBody = body || getDefaultBody(type)
  if (playBrowserNotificationSound(notifTitle, notifBody, type)) return

  // Method 3: Web Audio API (async, needs AudioContext running)
  if (await playWebAudio(type)) return

  // Method 4: File audio (may be blocked by autoplay)
  if (playFileAudio(type)) return

  console.warn('🔊 ⚠️ ALL sound methods failed for [' + type + '] — this is OK if no user interaction yet')
}

/**
 * Play a LOCAL action sound. Called during user gestures (button clicks).
 * This DOES work because the user gesture unlocks the AudioContext.
 * Use this for immediate feedback when the user performs an action.
 */
export async function playLocalActionSound(type: string = 'system'): Promise<void> {
  console.log('🔊 playLocalActionSound called [' + type + ']')

  // Always try to play, even if global sound check would fail
  // Local actions should always give feedback

  // Native bridge for APK
  if (playNativeSound(type)) return

  // For browser: Try Web Audio first (user gesture unlocks AudioContext)
  if (await playWebAudio(type)) return

  // Fallback: file audio
  if (playFileAudio(type)) return

  // Last resort: try browser notification
  const notifTitle = getDefaultTitle(type)
  const notifBody = getDefaultBody(type)
  playBrowserNotificationSound(notifTitle, notifBody, type)
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
 * Initialize sound system. MUST be called on app mount.
 * Sets up a one-time click handler to unlock AudioContext.
 */
export function initSoundSystem(): void {
  console.log('🔊 initSoundSystem() called')

  const unlock = async () => {
    const ctx = await getRunningContext()
    if (ctx) {
      console.log('🔊 AudioContext unlocked! state:', ctx.state)
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        gain.gain.setValueAtTime(0.001, ctx.currentTime)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.01)
      } catch {}
    }
    document.removeEventListener('click', unlock)
    document.removeEventListener('touchstart', unlock)
    document.removeEventListener('touchend', unlock)
    document.removeEventListener('keydown', unlock)
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)
    document.addEventListener('touchend', unlock)
    document.addEventListener('keydown', unlock)
  }

  // Try to resume immediately (might work if there was prior interaction)
  getRunningContext().then(ctx => {
    if (ctx) console.log('🔊 AudioContext ready on init')
    else console.log('🔊 AudioContext needs user interaction')
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
//  DEFAULT NOTIFICATION TEXT (for Browser Notification API)
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
