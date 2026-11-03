import { useState, useRef, useEffect } from 'react'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import styles from './ActionButtons.module.scss'

// SVG ring constants
const RING_SIZE = 220
const RING_CENTER = RING_SIZE / 2
const RING_RADIUS = 96
const RING_STROKE = 8
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ActionButtons({
  onReset,
  onClick,
  progress = 0,
  count = 0,
  target = null,
  isComplete,
  showReset = true,
  isFocusMode = false,
}) {
  const [clicked, setClicked] = useState(false)
  const timerRef = useRef(null)
  const animatedCount = useAnimatedNumber(count, 350)

  const handleClick = (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    setClicked(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setClicked(false), 150)
    onClick()
  }

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const resetDisabled = !onReset || count === 0

  // Focus mode → زر صغير عائم
  if (isFocusMode) {
    return (
      <button
        type="button"
        className={`
          ${styles.click}
          ${styles.floatingFocusBtn}
          ${clicked ? styles.clicked : ''}
          ${isComplete ? styles.complete : ''}
        `}
        style={{ '--progress': `${Math.min(progress, 100)}%` }}
        onClick={handleClick}
        aria-label="تسبيح"
      >
        <span className={styles.focusLabel}>سبّح</span>
      </button>
    )
  }

  // normal mode
  const safeProgress = Math.min(Math.max(progress, 0), 100)
  const dashOffset = RING_CIRCUMFERENCE - (safeProgress / 100) * RING_CIRCUMFERENCE

  return (
    <div className={styles.buttons}>
      <div className={styles.counterWrap}>
        <button
          type="button"
          className={`
            ${styles.click}
            ${clicked ? styles.clicked : ''}
            ${isComplete ? styles.complete : ''}
          `}
          onClick={handleClick}
          aria-label="تسبيح"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Progress Ring */}
          <svg
            className={styles.ring}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            aria-hidden="true"
          >
            <circle
              className={styles.ringBg}
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              strokeWidth={RING_STROKE}
            />
            <circle
              className={styles.ringProgress}
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              strokeWidth={RING_STROKE}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>

          {/* المحتوى الداخلي */}
          <span className={styles.inner}>
            <span className={styles.bigCount}>
              {animatedCount.toLocaleString('en')}
            </span>
            {target && (
              <span className={styles.fromTarget}>
                من {target.toLocaleString('en')}
              </span>
            )}
            {!target && (
              <span className={styles.hintText}>اضغط للتسبيح</span>
            )}
          </span>
        </button>

        {showReset && (
          <button
            type="button"
            className={styles.reset}
            onClick={onReset}
            disabled={resetDisabled}
            title={resetDisabled ? 'لا يوجد عدد لتصفيره' : 'تصفير العدد'}
            aria-label="تصفير العدد"
          >
            ↺
          </button>
        )}
      </div>
    </div>
  )
}

export default ActionButtons
