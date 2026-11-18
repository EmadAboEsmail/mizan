import { useEffect, useRef, memo } from 'react'
import { Check } from 'lucide-react'
import styles from './AdhkarSelect.module.scss'

const EMPTY = []
const EMPTY_MAP = {}

function AdhkarSelect({
  adhkar = EMPTY,
  counts = EMPTY_MAP,
  targets = EMPTY_MAP,
  value,
  onChange,
}) {
  const activeRef = useRef(null)

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
          const isSelected = String(zekr.id) === String(value)
          const count = Number(counts[zekr.id]) || 0
          const target =
            targets[zekr.id] ?? (zekr.default_target > 0 ? zekr.default_target : null)
          const isDone = Boolean(target && count >= target)
          const progressPct =
            target && count > 0 && !isDone
              ? Math.min(100, Math.round((count / target) * 100))
              : 0

          return (
            <button
              key={zekr.id}
              ref={isSelected ? activeRef : null}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={[
                styles.chip,
                isSelected ? styles.active : '',
                isDone && !isSelected ? styles.completed : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChange(zekr.id)}
              title={zekr.text}
            >
              {progressPct > 0 && !isSelected && (
                <span
                  className={styles.progressBar}
                  style={{ width: `${progressPct}%` }}
                  aria-hidden="true"
                />
              )}

              <span className={styles.chipText}>{zekr.text}</span>

              {isDone ? (
                <span
                  className={`${styles.chipTarget} ${styles.chipDone}`}
                  aria-label="مكتمل"
                >
                  <Check size={11} strokeWidth={3} aria-hidden="true" />
                </span>
              ) : target > 0 ? (
                <span className={styles.chipTarget}>
                  {count > 0 ? `${count}/${target}` : target}
                </span>
              ) : count > 0 ? (
                <span className={styles.chipTarget}>{count}</span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default memo(AdhkarSelect)
