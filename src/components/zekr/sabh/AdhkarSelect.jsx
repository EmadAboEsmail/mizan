import { useMemo, memo } from 'react'
import styles from './AdhkarSelect.module.scss'

function AdhkarSelect({ adhkar = [], value, onChange }) {
  // نعرض الأذكار كـ chips أفقية قابلة للتمرير
  const items = useMemo(() => adhkar, [adhkar])

  if (items.length === 0) return null

  return (
    <div className={styles.wrapper} role="tablist" aria-label="اختيار الذكر">
      <div className={styles.scrollArea}>
        {items.map((zekr) => {
          const isSelected = zekr.id === value
          return (
            <button
              key={zekr.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`${styles.chip} ${isSelected ? styles.active : ''}`}
              onClick={() => onChange(zekr.id)}
              title={zekr.text}
            >
              <span className={styles.chipText}>{zekr.text}</span>
              {zekr.default_target && (
                <span className={styles.chipTarget}>
                  {zekr.default_target}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default memo(AdhkarSelect)
