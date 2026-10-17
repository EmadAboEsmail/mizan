import { useState, useRef, useEffect } from 'react'
import styles from './ActionButtons.module.scss'

function ActionButtons({
  zekrText,
  onReset,
  onClick,
  progress,
  isComplete,
  showReset = true,
  isFocusMode = false
}) {
  const [clicked, setClicked] = useState(false)
  const timerRef = useRef(null)

  const handleClick = (e) => {
    e?.stopPropagation()
    setClicked(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setClicked(false), 150)
    onClick()
  }

  // تنظيف الـ timer لو المكوّن اتقفل أثناء الضغط
  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return (
    <div className={`${styles.buttons} ${isFocusMode ? styles.focusButtons : ''}`}>
      {/* زر التصفير: يظهر فقط إذا لم نكن في وضع التركيز وكان مسموحاً */}
      {showReset && onReset && !isFocusMode && (
        <button className={styles.reset} onClick={onReset} title="تصفير">
          ↺
        </button>
      )}

      {/* زر التسبيح */}
      <button
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
        {/* في وضع التركيز نعرض 'سبّح' فقط لصغر حجم الزر، وفي الوضع العادي نعرض نص الذكر */}
        <span>{isFocusMode ? 'سبّح' : zekrText}</span>
      </button>
    </div>
  )
}

export default ActionButtons
