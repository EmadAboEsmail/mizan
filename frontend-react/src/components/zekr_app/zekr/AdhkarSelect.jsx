import { useState, useEffect, useRef } from 'react'
import styles from './AdhkarSelect.module.scss'

function AdhkarSelect({ adhkar, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  const selected = adhkar.find((z) => z.id === value)

  // إغلاق لما تدوس بره
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // إغلاق بـ Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.code === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSelect = (id) => {
    onChange(id)
    setIsOpen(false)
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen((o) => !o)}
      >
        <span className={styles.label}>{selected?.text ?? 'اختر ذكرًا'}</span>
        <span className={styles.arrow}>▾</span>
      </button>

      {isOpen && (
        <ul className={styles.menu}>
          {adhkar.map((zekr) => (
            <li
              key={zekr.id}
              className={`${styles.item} ${zekr.id === value ? styles.selected : ''
                }`}
              onClick={() => handleSelect(zekr.id)}
            >
              <span>{zekr.text}</span>
              {zekr.id === value && <span className={styles.check}>✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AdhkarSelect
