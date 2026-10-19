import { useState, useRef, useEffect } from 'react'
import styles from './ActionButtons.module.scss'

function ActionButtons({
  zekrText,
  onReset,
  onClick,
  progress,
  count = 0,        // ← جديد: العدد الحالي (لتعطيل reset عند 0)
  isComplete,
  showReset = true,
  isFocusMode = false,
}) {
  const [clicked, setClicked] = useState(false)
  const timerRef = useRef(null)

  const handleClick = (e) => {
    e?.preventDefault()
    e?.stopPropagation()

    // ✅ animation مع timer واحد (يمنع تراكم timers)
    setClicked(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setClicked(false), 150)

    onClick()
  }

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const resetDisabled = !onReset || count === 0

  return (
    <div className={`${styles.buttons} ${isFocusMode ? styles.focusButtons : ''}`}>
      {showReset && !isFocusMode && (
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

      <button
        type="button"
        className={`
          ${styles.click}
          ${clicked ? styles.clicked : ''}
          ${isComplete ? styles.complete : ''}
          ${isFocusMode ? styles.floatingRightBtn : ''}
        `}
        style={{ '--progress': `${progress}%` }}
        onClick={handleClick}
        aria-label="تسبيح"
      >
        <span>{isFocusMode ? 'سبّح' : zekrText}</span>
      </button>
    </div>
  )
}

export default ActionButtons
