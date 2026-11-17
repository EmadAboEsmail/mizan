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
