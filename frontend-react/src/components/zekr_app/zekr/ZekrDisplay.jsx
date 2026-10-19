import { useState } from 'react'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import styles from './ZekrDisplay.module.scss'

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

function ZekrDisplay({
  zekrText,
  count = 0,
  target,
  onClickCount,
  isComplete,
  isFocusMode = false,
}) {
  const [copied, setCopied] = useState(false)

  // ✅ counter animation — 350ms يكفي عشان يبقى سريع ومتجاوب
  const animatedCount = useAnimatedNumber(count, 350)

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

  return (
    <div
      className={`
        ${styles.displayCard}
        ${isComplete ? styles.completeGlow : ''}
        ${isFocusMode ? styles.focusDisplay : ''}
      `}
    >
      <div className={styles.textContainer}>
        <h2 className={styles.text}>{zekrText}</h2>

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
              <span className={styles.copyText}>تم النسخ</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span className={styles.copyText}>نسخ</span>
            </>
          )}
        </button>
      </div>

      <div className={styles.counterSection}>
        {/* ✅ aria-live: screen reader يعلن كل تغيير */}
        <div
          className={`${styles.currentNumber} ${isComplete ? styles.completeNumber : ''
            }`}
          aria-live="polite"
          aria-atomic="true"
          aria-label={`العدد الحالي ${count}`}
        >
          {animatedCount.toLocaleString('en')}
        </div>

        {target ? (
          <button
            type="button"
            className={`${styles.targetBadge} ${isComplete ? styles.targetComplete : ''
              }`}
            onClick={onClickCount}
            title="اضغط لتعديل الهدف"
            aria-label={`الهدف الحالي ${target}، اضغط للتعديل`}
          >
            <span>🎯 الهدف: {target.toLocaleString('en')}</span>
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
            <span>+ تحديد هدف</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default ZekrDisplay
