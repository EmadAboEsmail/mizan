import { useState, useEffect, useRef } from 'react'
import { Copy, Check, Target, Pencil, Plus } from 'lucide-react'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import { useZekrFontPrefs } from '@/hooks/useZekrFontScale.js'
import { triggerHapticFeedback } from '@/utils/haptics.js'
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

const SWIPE_THRESHOLD_PX = 52
const fmt = (n) => n.toLocaleString('en')
const cx = (...c) => c.filter(Boolean).join(' ')

function getAdaptiveFontSize(text, scale = 1, isFocus = false) {
  const len = (text || '').length
  const s = Number.isFinite(scale) ? scale : 1
  if (isFocus) {
    if (len < 30)
      return `clamp(${(1.55 * s).toFixed(2)}rem, ${(5.5 * s).toFixed(1)}vw, ${(2.2 * s).toFixed(2)}rem)`
    if (len < 60)
      return `clamp(${(1.32 * s).toFixed(2)}rem, ${(4.5 * s).toFixed(1)}vw, ${(1.85 * s).toFixed(2)}rem)`
    if (len < 100)
      return `clamp(${(1.12 * s).toFixed(2)}rem, ${(3.8 * s).toFixed(1)}vw, ${(1.52 * s).toFixed(2)}rem)`
    return `clamp(${(0.96 * s).toFixed(2)}rem, ${(3.1 * s).toFixed(1)}vw, ${(1.28 * s).toFixed(2)}rem)`
  }
  if (len < 36)
    return `clamp(${(1.34 * s).toFixed(2)}rem, ${(5.0 * s).toFixed(1)}vw, ${(1.78 * s).toFixed(2)}rem)`
  if (len < 80)
    return `clamp(${(1.18 * s).toFixed(2)}rem, ${(4.3 * s).toFixed(1)}vw, ${(1.52 * s).toFixed(2)}rem)`
  return `clamp(${(1.04 * s).toFixed(2)}rem, ${(3.6 * s).toFixed(1)}vw, ${(1.32 * s).toFixed(2)}rem)`
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
  onSwipeNext,
  onSwipePrev,
  canSwipeNext = false,
  canSwipePrev = false,
  isComplete,
  isFocusMode = false,
}) {
  const safeCount = count ?? 0
  const [copied, setCopied] = useState(false)
  const [ticking, setTicking] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const prevCountRef = useRef(safeCount)
  const copyTimerRef = useRef(null)
  const touchRef = useRef({ active: false, startX: 0, startY: 0, locked: null })
  const animatedCount = useAnimatedNumber(safeCount, 280)
  const { scale, fontStyle } = useZekrFontPrefs()

  const swipeEnabled =
    !isFocusMode && Boolean(onSwipeNext || onSwipePrev) && (canSwipeNext || canSwipePrev)

  useEffect(() => {
    const prev = prevCountRef.current
    prevCountRef.current = safeCount
    if (safeCount <= prev) return

    const startTimer = setTimeout(() => setTicking(true), 0)
    const endTimer = setTimeout(() => setTicking(false), 150)
    return () => {
      clearTimeout(startTimer)
      clearTimeout(endTimer)
    }
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

  // سحب أفقي للتنقل بين الأذكار (في RTL: السحب لليمين = التالي، السحب لليسار = السابق)
  const handleTouchStart = (e) => {
    if (!swipeEnabled) return
    if (e.target?.closest?.('button')) return
    const t = e.touches[0]
    touchRef.current = {
      active: true,
      startX: t.clientX,
      startY: t.clientY,
      locked: null,
    }
  }

  const handleTouchMove = (e) => {
    const state = touchRef.current
    if (!state.active) return
    const t = e.touches[0]
    const dx = t.clientX - state.startX
    const dy = t.clientY - state.startY

    if (!state.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      state.locked = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y'
    }
    if (state.locked !== 'x') return

    // مقاومة مطاطية لطيفة عند الأطراف
    const allowDir = (dx > 0 && canSwipeNext) || (dx < 0 && canSwipePrev)
    const damp = allowDir ? 0.42 : 0.12
    setSwipeX(Math.max(-68, Math.min(68, dx * damp)))
  }

  const handleTouchEnd = (e) => {
    const state = touchRef.current
    if (!state.active) return
    state.active = false

    const changed = e.changedTouches?.[0]
    const dx = changed ? changed.clientX - state.startX : 0
    const wasHorizontal = state.locked === 'x'
    setSwipeX(0)

    if (!wasHorizontal) return
    // في RTL القائمة تبدأ من اليمين وتتحرك لليسار:
    // سحب الإصبع لليمين (dx > 0) يسحب البطاقة التالية من اليسار -> التالي
    if (dx >= SWIPE_THRESHOLD_PX && canSwipeNext) {
      triggerHapticFeedback('light')
      onSwipeNext?.()
    } else if (dx <= -SWIPE_THRESHOLD_PX && canSwipePrev) {
      triggerHapticFeedback('light')
      onSwipePrev?.()
    }
  }

  const isNaskh = fontStyle === 'naskh'
  const computedFontSize = getAdaptiveFontSize(
    zekrText,
    isNaskh ? scale * 1.08 : scale,
    isFocusMode
  )

  return (
    <div
      className={cx(
        styles.displayCard,
        isComplete && !isFocusMode && styles.completeGlow,
        isFocusMode && styles.focusDisplay
      )}
      style={
        swipeX !== 0
          ? {
              transform: `translateX(${swipeX}px)`,
              transition: 'none',
            }
          : undefined
      }
      onTouchStart={swipeEnabled ? handleTouchStart : undefined}
      onTouchMove={swipeEnabled ? handleTouchMove : undefined}
      onTouchEnd={swipeEnabled ? handleTouchEnd : undefined}
      onTouchCancel={swipeEnabled ? handleTouchEnd : undefined}
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
          className={cx(styles.text, isNaskh && styles.naskhText)}
          style={{ fontSize: computedFontSize }}
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
