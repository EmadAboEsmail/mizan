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
    e?.preventDefault()
    e?.stopPropagation()

    // تشغيل الأنيميشن
    setClicked(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setClicked(false), 150)

    // تنفيذ دالة التسبيح
    onClick()
  }

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return (
    <div className={`${styles.buttons} ${isFocusMode ? styles.focusButtons : ''}`}>

      {/* زر المسح: يظهر دائماً في الوضع العادي، ويختفي فقط في وضع التركيز */}
      {showReset && !isFocusMode && (
        <button
          type="button"
          className={styles.reset}
          onClick={onReset}
          disabled={!onReset} // بيتعطل لو العدد 0، بس بيفضل ظاهر
          title="تصفير"
        >
          ↺
        </button>
      )}

      {/* زر التسبيح */}
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
