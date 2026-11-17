import { useEffect, useRef } from 'react'
import { setNativeVolumeIntercept } from '@/utils/haptics.js'

// KEYCODE_VOLUME_UP = 24, KEYCODE_VOLUME_DOWN = 25 (Android KeyEvent)
const VOLUME_KEY_CODES = new Set([24, 25])

let activeVolumeConsumers = 0

export function extractVolumeKeyCode(event) {
  if (!event) return null

  // 1) Capacitor triggerWindowJSEvent يضع الحقول مباشرة على كائن Event (event.keyCode)
  if (typeof event.keyCode === 'number') {
    return event.keyCode
  }

  // 2) CustomEvent (محاكاة الويب أو صيغة detail ككائن أو نص JSON)
  let detail = event.detail
  if (typeof detail === 'string') {
    try {
      detail = JSON.parse(detail)
    } catch {
      return null
    }
  }

  if (detail && typeof detail.keyCode === 'number') {
    return detail.keyCode
  }

  return null
}

/**
 * يستقبل ضغطات أزرار رفع/خفض الصوت في أندرويد للتسبيح،
 * ويفعّل اعتراض الأزرار فقط عندما تكون شاشة السبحة نشطة وبدون نوافذ منبثقة.
 */
export function useVolumeButton(onPress, enabled = true) {
  const onPressRef = useRef(onPress)

  useEffect(() => {
    onPressRef.current = onPress
  }, [onPress])

  useEffect(() => {
    if (!enabled) return

    activeVolumeConsumers += 1
    setNativeVolumeIntercept(true)

    const handleVolumeEvent = (event) => {
      const code = extractVolumeKeyCode(event)
      if (code !== null && VOLUME_KEY_CODES.has(code)) {
        onPressRef.current?.(code)
      }
    }

    // محاكاة أزرار الصوت على الويب للتجربة: F1 = رفع الصوت (24)، F2 = خفض الصوت (25)
    const handleDevKey = (e) => {
      if (e.repeat) return
      if (e.key === 'F1' || e.key === 'F2') {
        e.preventDefault()
        const keyCode = e.key === 'F1' ? 24 : 25
        window.dispatchEvent(
          new CustomEvent('volumeButtonPress', { detail: { keyCode } })
        )
      }
    }

    window.addEventListener('volumeButtonPress', handleVolumeEvent)
    window.addEventListener('keydown', handleDevKey)

    return () => {
      window.removeEventListener('volumeButtonPress', handleVolumeEvent)
      window.removeEventListener('keydown', handleDevKey)
      activeVolumeConsumers = Math.max(0, activeVolumeConsumers - 1)
      if (activeVolumeConsumers === 0) {
        setNativeVolumeIntercept(false)
      }
    }
  }, [enabled])
}
