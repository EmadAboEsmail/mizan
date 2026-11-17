import { useState, useEffect, useRef } from 'react'
import { Copy, Check, Target, Pencil, Plus } from 'lucide-react'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import styles from './ZekrDisplay.module.scss'

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

function getAdaptiveFontSize(text) {
  const len = (text || '').length
  if (len < 30) return 'clamp(1.55rem, 5.5vw, 2.15rem)'
  if (len < 60) return 'clamp(1.32rem, 4.5vw, 1.8rem)'
  if (len < 100) return 'clamp(1.12rem, 3.8vw, 1.5rem)'
  return 'clamp(0.95rem, 3vw, 1.25rem)'
}

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
  sessionCount = 0,
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
  const animatedCount = useAnimatedNumber(safeCount, 280)

  useEffect(() => {
    const prev = prevCountRef.current
    prevCountRef.current = safeCount
    if (safeCount <= prev) return

    setTicking(true)
    const t = setTimeout(() => setTicking(false), 150)
    return () => clearTimeout(t)
  }, [safeCount])

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
    e.stopPropagation()
    onClickCount?.(e)
  }

  const focusFontSize = isFocusMode ? getAdaptiveFontSize(zekrText) : undefined

  return (
    <div
      className={cx(
        styles.displayCard,
        isComplete && !isFocusMode && styles.completeGlow,
        isFocusMode && styles.focusDisplay
      )}
    >
      <div className={styles.textContainer}>
        {!isFocusMode && (
          <span className={styles.ornament} aria-hidden="true">
            <span className={styles.ornamentLine} />
            <span className={styles.ornamentDiamond} />
            <span className={styles.ornamentLine} />
          </span>
        )}

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
              className={cx(styles.metaBtn, copied && styles.copied)}
              onClick={handleCopy}
              aria-label="نسخ نص الذكر"
            >
              {copied ? (
                <>
                  <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy size={13} strokeWidth={2.1} aria-hidden="true" />
                  <span>نسخ</span>
                </>
              )}
            </button>

            {target ? (
              <button
                type="button"
                className={cx(
                  styles.metaBtn,
                  styles.targetBadge,
                  isComplete && styles.targetComplete
                )}
                onClick={handleTargetClick}
                aria-label={`الهدف الحالي ${target}، اضغط للتعديل`}
              >
                <Target size={13} strokeWidth={2.2} aria-hidden="true" />
                <span>الهدف {fmt(target)}</span>
                <Pencil
                  size={11}
                  strokeWidth={2.2}
                  className={styles.editIcon}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <button
                type="button"
                className={cx(styles.metaBtn, styles.setTargetBtn)}
                onClick={handleTargetClick}
                aria-label="تحديد هدف لهذا الذكر"
              >
                <Plus size={13} strokeWidth={2.4} aria-hidden="true" />
                <span>تحديد هدف</span>
              </button>
            )}
          </div>
        )}
      </div>

      {isFocusMode && typeof count === 'number' && (
        <div
          className={cx(
            styles.focusCounter,
            isComplete && styles.focusCounterComplete
          )}
        >
          <span style={srOnly} aria-live="polite" aria-atomic="true">
            {fmt(safeCount)}
            {target ? ` من ${fmt(target)}` : ''}
          </span>

          <span
            aria-hidden="true"
            className={cx(
              styles.focusCountNum,
              ticking && styles.focusCountTick
            )}
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
