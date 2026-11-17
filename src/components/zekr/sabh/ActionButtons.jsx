import { useState, useRef, useEffect } from 'react'
import { RotateCcw, Check } from 'lucide-react'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import styles from './ActionButtons.module.scss'

const RING_SIZE = 228
const RING_CENTER = RING_SIZE / 2
const RING_RADIUS = 100
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
  extraAction = null,
}) {
  const [clicked, setClicked] = useState(false)
  const timerRef = useRef(null)
  const animatedCount = useAnimatedNumber(count, 260)

  const handleClick = (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    setClicked(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setClicked(false), 140)
    onClick()
  }

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const resetDisabled = !onReset || count === 0

  if (isFocusMode) {
    return (
      <button
        type="button"
        className={[
          styles.click,
          styles.floatingFocusBtn,
          clicked ? styles.clicked : '',
          isComplete ? styles.complete : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ '--progress': `${Math.min(progress, 100)}%` }}
        onClick={handleClick}
        aria-label="تسبيح"
      >
        <span className={styles.focusLabel}>سبّح</span>
      </button>
    )
  }

  const safeProgress = Math.min(Math.max(progress, 0), 100)
  const dashOffset =
    RING_CIRCUMFERENCE - (safeProgress / 100) * RING_CIRCUMFERENCE

  return (
    <div className={styles.buttons}>
      <div className={styles.counterWrap}>
        <button
          type="button"
          className={[
            styles.click,
            clicked ? styles.clicked : '',
            isComplete ? styles.complete : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={handleClick}
          aria-label="اضغط للتسبيح"
          aria-live="polite"
          aria-atomic="true"
        >
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
            {safeProgress > 0 && (
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
            )}
          </svg>

          <span className={styles.inner}>
            <span className={styles.bigCount}>
              {animatedCount.toLocaleString('en')}
            </span>

            {isComplete && target ? (
              <span className={styles.doneBadge}>
                <Check size={12} strokeWidth={2.8} aria-hidden="true" />
                <span>أتممت {target.toLocaleString('en')}</span>
              </span>
            ) : target ? (
              <span className={styles.fromTarget}>
                من {target.toLocaleString('en')}
              </span>
            ) : (
              <span className={styles.hintText}>اضغط للتسبيح</span>
            )}
          </span>
        </button>
      </div>

      {(showReset || extraAction) && (
        <div className={styles.secondaryRow}>
          {showReset && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={onReset}
              disabled={resetDisabled}
              title={resetDisabled ? 'لا يوجد عدد لتصفيره' : 'تصفير العدد'}
              aria-label="تصفير العدد"
            >
              <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>تصفير</span>
            </button>
          )}
          {extraAction}
        </div>
      )}
    </div>
  )
}

export default ActionButtons
