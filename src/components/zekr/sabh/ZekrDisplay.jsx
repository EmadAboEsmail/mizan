
import { useState, useEffect, useRef } from 'react'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import styles from './ZekrDisplay.module.scss'

const iconProps = { 'aria-hidden': 'true', focusable: 'false' }

const CopyIcon = () => (
  <svg {...iconProps} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const CheckIcon = () => (
  <svg {...iconProps} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const EditIcon = () => (
  <svg {...iconProps} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const fmt = (n) => n.toLocaleString('en')
const cx = (...c) => c.filter(Boolean).join(' ')

// خط يتكيف مع طول النص (للـ focus mode)
function getAdaptiveFontSize(text) {
  const len = (text || '').length
  if (len < 30) return 'clamp(1.6rem, 5.5vw, 2.2rem)'
  if (len < 60) return 'clamp(1.35rem, 4.5vw, 1.85rem)'
  if (len < 100) return 'clamp(1.15rem, 3.8vw, 1.55rem)'
  return 'clamp(0.95rem, 3vw, 1.3rem)'
}

// نسخ مع fallback للمتصفحات/البيئات اللي مفيهاش Clipboard API
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    if (!document.execCommand('copy')) throw new Error('execCommand failed')
  } finally {
    document.body.removeChild(ta)
  }
}

function ZekrDisplay({
  zekrText,
  count,
  sessionCount = 0, // عدد هذه الجلسة
  target,
  onClickCount,
  isComplete,
  isFocusMode = false,
}) {
  const safeCount = count ?? 0
  const [copied, setCopied] = useState(false)
  const [ticking, setTicking] = useState(false)
  const prevCountRef = useRef(safeCount)
  const copyTimerRef = useRef(null)
  const animatedCount = useAnimatedNumber(safeCount, 350)

  // animation نبضة عند كل زيادة
  useEffect(() => {
    const prev = prevCountRef.current
    prevCountRef.current = safeCount
    if (safeCount <= prev) return

    setTicking(true)
    const t = setTimeout(() => setTicking(false), 160)
    return () => clearTimeout(t)
  }, [safeCount])

  // تنضيف تايمر النسخ عند إزالة الكومبوننت
  useEffect(() => () => clearTimeout(copyTimerRef.current), [])

  const handleCopy = async (e) => {
    e.stopPropagation()
    if (!zekrText) return
    try {
      await copyText(zekrText)
      setCopied(true)
      clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(false), 1800)
    } catch (err) {
      console.error('فشل النسخ:', err)
    }
  }

  const handleTargetClick = (e) => {
    e.stopPropagation() // يمنع زيادة العداد لو الأب عنده onClick
    onClickCount?.(e)
  }

  const focusFontSize = isFocusMode ? getAdaptiveFontSize(zekrText) : undefined

  return (
    <div
      className={cx(
        styles.displayCard,
        isComplete && styles.completeGlow,
        isFocusMode && styles.focusDisplay
      )}
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
              className={cx(styles.copyBtn, copied && styles.copied)}
              onClick={handleCopy}
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
                className={cx(styles.targetBadge, isComplete && styles.targetComplete)}
                onClick={handleTargetClick}
                aria-label={`الهدف الحالي ${target}، اضغط للتعديل`}
              >
                <span aria-hidden="true">🎯 {fmt(target)}</span>
                <span className={styles.editIcon}>
                  <EditIcon />
                </span>
              </button>
            ) : (
              <button
                type="button"
                className={styles.setTargetBtn}
                onClick={handleTargetClick}
                aria-label="تحديد هدف لهذا الذكر"
              >
                + تحديد هدف
              </button>
            )}
          </div>
        )}
      </div>

      {/* العداد في وضع التركيز */}
      {isFocusMode && typeof count === 'number' && (
        <div className={cx(styles.focusCounter, isComplete && styles.focusCounterComplete)}>
          {/* الرقم الحقيقي لقارئ الشاشة (بدون أرقام وسيطة من الـ animation) */}
          <span style={srOnly} aria-live="polite" aria-atomic="true">
            {fmt(safeCount)}
            {target ? ` من ${fmt(target)}` : ''}
          </span>

          <span
            aria-hidden="true"
            className={cx(styles.focusCountNum, ticking && styles.focusCountTick)}
          >
            {fmt(animatedCount)}
          </span>

          {target && (
            <span aria-hidden="true" className={styles.focusCountTarget}>
              من {fmt(target)}
            </span>
          )}

          {sessionCount > 0 && (
            <span className={styles.sessionHint}>
              {fmt(sessionCount)} في هذه الجلسة
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default ZekrDisplay

