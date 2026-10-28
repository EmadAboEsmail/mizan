import { useState, useEffect, useRef } from 'react'

/**
 * Hook لتحريك رقم من قيمته الحالية لقيمة جديدة.
 * يستخدم requestAnimationFrame + ease-out cubic.
 *
 * @param {number} target - القيمة النهائية
 * @param {number} duration - مدة التحريك بالميلي ثانية
 * @returns {number} - القيمة الحالية للعرض
 */
export function useAnimatedNumber(target, duration = 700) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const from = fromRef.current
    const to = typeof target === 'number' && isFinite(target) ? target : 0

    if (from === to) return

    let startTime = null
    const animate = (timestamp) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(from + (to - from) * eased)
      setDisplay(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        fromRef.current = to
        setDisplay(to)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return display
}

