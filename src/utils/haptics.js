import { Capacitor, registerPlugin } from '@capacitor/core'
import { Haptics } from '@capacitor/haptics'

const MizanNative = registerPlugin('MizanNative')

/**
 * تشغيل اهتزاز لمسي متوافق مع جميع إصدارات أندرويد والويب.
 * @param {'light' | 'medium' | 'heavy' | 'success'} type
 */
export async function triggerHapticFeedback(type = 'light') {
  if (Capacitor.isNativePlatform()) {
    try {
      await MizanNative.haptic({ type })
      return
    } catch {
      // احتياطي عبر إضافة Capacitor الرسمية في حال عدم توفر الإضافة المحلية
      try {
        const duration =
          type === 'success' || type === 'heavy'
            ? 100
            : type === 'medium'
              ? 65
              : 45
        await Haptics.vibrate({ duration })
      } catch (err) {
        console.warn('[Haptics] Fallback failed:', err)
      }
    }
    return
  }

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      if (type === 'success' || type === 'heavy') {
        navigator.vibrate([45, 55, 80])
      } else {
        navigator.vibrate(type === 'medium' ? 50 : 30)
      }
    }
  } catch {
    // بعض المتصفحات تمنع vibrate بدون تفاعل مباشر
  }
}

/**
 * تفعيل أو إيقاف اعتراض أزرار رفع/خفض الصوت للتسبيح على أندرويد.
 */
export function setNativeVolumeIntercept(enabled) {
  if (!Capacitor.isNativePlatform()) return
  MizanNative.setVolumeIntercept({ enabled: Boolean(enabled) }).catch(() => {})
}

/**
 * تفعيل أو إيقاف ملء الشاشة الغامر (إخفاء شريط الحالة وشريط التنقل والهوامش الآمنة) في وضع التركيز.
 */
export function setNativeImmersiveMode(enabled) {
  if (!Capacitor.isNativePlatform()) return
  MizanNative.setImmersiveMode({ enabled: Boolean(enabled) }).catch(() => {})
}

/**
 * خفض إضاءة الشاشة لأدنى درجة أثناء قفل الجيب في وضع التركيز (OLED Lock).
 */
export function setNativeScreenDim(enabled) {
  if (!Capacitor.isNativePlatform()) return
  MizanNative.setScreenDim({ enabled: Boolean(enabled) }).catch(() => {})
}

/**
 * مزامنة لون وأيقونات الشريط العلوي والسفلي مع الوضع الفاتح/الداكن.
 */
export function setNativeSystemBarTheme(isDark) {
  if (!Capacitor.isNativePlatform()) return
  MizanNative.setSystemBarTheme({ dark: Boolean(isDark) }).catch(() => {})
}

// ═══════════════════════════════════════
// Screen-Off / Lock-Screen Pocket Tasbih
// ═══════════════════════════════════════
export async function startNativePocketMode({
  zekrId,
  zekrText,
  count = 0,
  target = 0,
  vibrate = true,
}) {
  if (!Capacitor.isNativePlatform()) return { running: false }
  return MizanNative.startPocketMode({
    zekrId: String(zekrId),
    zekrText: String(zekrText || 'التسبيح'),
    count: Math.max(0, Number(count) || 0),
    target: Math.max(0, Number(target) || 0),
    vibrate: Boolean(vibrate),
  })
}

export function updateNativePocketMode({
  zekrId,
  zekrText,
  count,
  target,
  vibrate,
}) {
  if (!Capacitor.isNativePlatform()) return
  MizanNative.updatePocketMode({
    zekrId: String(zekrId),
    zekrText: String(zekrText || 'التسبيح'),
    count: Math.max(0, Number(count) || 0),
    target: Math.max(0, Number(target) || 0),
    vibrate: Boolean(vibrate),
  }).catch(() => {})
}

export async function stopNativePocketMode() {
  if (!Capacitor.isNativePlatform()) return { running: false }
  return MizanNative.stopPocketMode()
}

export async function getNativePocketStatus() {
  if (!Capacitor.isNativePlatform()) {
    return { running: false, zekrId: '', count: 0 }
  }
  try {
    return await MizanNative.getPocketStatus()
  } catch {
    return { running: false, zekrId: '', count: 0 }
  }
}

export async function drainNativePocketClicks() {
  if (!Capacitor.isNativePlatform()) return []
  try {
    const res = await MizanNative.drainPocketClicks()
    return Array.isArray(res?.items) ? res.items : []
  } catch {
    return []
  }
}
