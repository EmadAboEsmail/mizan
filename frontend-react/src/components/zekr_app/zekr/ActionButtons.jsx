import { useState } from 'react'
import styles from './ActionButtons.module.scss'

function ActionButtons({ zekrText, onReset, onClick, progress, isComplete }) {
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    setClicked(true)
    setTimeout(() => setClicked(false), 150)
    onClick()
  }

  return (
    <div className={styles.buttons}>
      <button className={styles.reset} onClick={onReset}>
        مسح
      </button>

      <button
        className={`${styles.click} ${clicked ? styles.clicked : ''} ${isComplete ? styles.complete : ''}`}
        style={{ '--progress': `${progress}%` }}
        onClick={handleClick}
      >
        <span>{zekrText}</span>
      </button>    </div>
  )
}

export default ActionButtons
