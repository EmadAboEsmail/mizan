import { useState, useEffect, useRef } from 'react'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import styles from './ZekrDisplay.module.scss'

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

// ✅ خط يتكيف مع طول النص (للـ focus mode)
function getAdaptiveFontSize(text) {
  const len = (text || '').length
  if (len < 30) return 'clamp(1.6rem, 5.5vw, 2.2rem)'
  if (len < 60) return 'clamp(1.35rem, 4.5vw, 1.85rem)'
  if (len < 100) return 'clamp(1.15rem, 3.8vw, 1.55rem)'
  return 'clamp(0.95rem, 3vw, 1.3rem)'
}

function ZekrDisplay({
  zekrText,
  count,
  sessionCount = 0,  // ✅ جديد: عدد هذه الجلسة
  target,
  onClickCount,
  isComplete,
  isFocusMode = false,
}) {
  const [copied, setCopied] = useState(false)
  const [ticking, setTicking] = useState(false)
  const prevCountRef = useRef(count ?? 0)
  const animatedCount = useAnimatedNumber(count ?? 0, 350)

  // ✅ animation نبضة عند كل زيادة
  useEffect(() => {
    const current = count ?? 0
    if (current > prevCountRef.current) {
      setTicking(true)
      const t = setTimeout(() => setTicking(false), 160)
      prevCountRef.current = current
      return () => clearTimeout(t)
    }
    prevCountRef.current = current
  }, [count])

  const handleCopy = async (e) => {
    e.stopPropagation()
    if (!zekrText) return
    try {
      await navigator.clipboard.writeText(zekrText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (err) {
      console.error('فشل النسخ:', err)
    }
  }

  const focusFontSize = isFocusMode ? getAdaptiveFontSize(zekrText) : undefined

  return (
    <div
      className={`
        ${styles.displayCard}
        ${isComplete ? styles.completeGlow : ''}
        ${isFocusMode ? styles.focusDisplay : ''}
      `}
    >
      <div className={styles.textContainer}>
        <h2
          className={styles.text}
          style={focusFontSize ? { fontSize: focusFontSize } : undefined}
        >
          {zekrText}
        </h2>

        {!isFocusMode && (
          <div className={styles.meta}>
            <button
              type="button"
              className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
              onClick={handleCopy}
              title="نسخ نص الذكر"
              aria-label="نسخ نص الذكر"
            >
              {copied ? (
                <>
                  <CheckIcon />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <CopyIcon />
                  <span>نسخ</span>
                </>
              )}
            </button>

            {target ? (
              <button
                type="button"
                className={`${styles.targetBadge} ${isComplete ? styles.targetComplete : ''}`}
                onClick={onClickCount}
                title="اضغط لتعديل الهدف"
                aria-label={`الهدف الحالي ${target}، اضغط للتعديل`}
              >
                <span>🎯 {target.toLocaleString('en')}</span>
                <span className={styles.editIcon}>
                  <EditIcon />
                </span>
              </button>
            ) : (
              <button
                type="button"
                className={styles.setTargetBtn}
                onClick={onClickCount}
                title="اضغط لتحديد هدف لهذا الذكر"
              >
                + تحديد هدف
              </button>
            )}
          </div>
        )}
      </div>

      {/* ✅ العداد في وضع التركيز */}
      {isFocusMode && typeof count === 'number' && (
        <div
          className={`${styles.focusCounter} ${isComplete ? styles.focusCounterComplete : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <span
            className={`${styles.focusCountNum} ${ticking ? styles.focusCountTick : ''}`}
          >
            {animatedCount.toLocaleString('en')}
          </span>

          {target && (
            <span className={styles.focusCountTarget}>
              من {target.toLocaleString('en')}
            </span>
          )}

          {/* ✅ عداد الجلسة */}
          {sessionCount > 0 && (
            <span className={styles.sessionHint}>
              {sessionCount.toLocaleString('en')} في هذه الجلسة
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default ZekrDisplay
