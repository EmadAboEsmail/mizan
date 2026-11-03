
import { useEffect, useRef, memo } from 'react'
import styles from './AdhkarSelect.module.scss'

const EMPTY = []

function AdhkarSelect({ adhkar = EMPTY, value, onChange }) {
  const activeRef = useRef(null)

  // يوصّل الـ chip المختار لنص الشاشة عند كل انتقال
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [value])

  if (adhkar.length === 0) return null

  return (
    <div className={styles.wrapper} role="tablist" aria-label="اختيار الذكر">
      <div className={styles.scrollArea}>
        {adhkar.map((zekr) => {
          // مقارنة آمنة لو أحدهما رقم والآخر نص
          const isSelected = String(zekr.id) === String(value)
          return (
            <button
              key={zekr.id}
              ref={isSelected ? activeRef : null}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`${styles.chip} ${isSelected ? styles.active : ''}`}
              onClick={() => onChange(zekr.id)}
              title={zekr.text}
            >
              <span className={styles.chipText}>{zekr.text}</span>
              {zekr.default_target > 0 && (
                <span className={styles.chipTarget}>{zekr.default_target}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default memo(AdhkarSelect)

