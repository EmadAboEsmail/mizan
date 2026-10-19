import { useState, useMemo } from 'react'
import styles from './ZekrFilter.module.scss'

function ZekrFilter({ adhkar = [], value, onChange }) {
  const [search, setSearch] = useState('')

  const showSearch = adhkar.length > 5

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return adhkar

    const matches = adhkar.filter((z) =>
      z.text.toLowerCase().includes(q)
    )

    // ✅ نضمن إن الذكر المختار حاليًا يفضل ظاهر
    if (value && !matches.some((z) => z.id === value)) {
      const selected = adhkar.find((z) => z.id === value)
      if (selected) return [selected, ...matches]
    }
    return matches
  }, [adhkar, search, value])

  return (
    <div className={styles.filterContainer}>
      {showSearch && (
        <input
          type="text"
          className={styles.searchInput}
          placeholder="ابحث عن ذكر..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="بحث في الأذكار"
        />
      )}

      <div className={styles.scrollArea}>
        <button
          type="button"
          className={`${styles.chip} ${value === null ? styles.active : ''}`}
          onClick={() => onChange(null)}
        >
          الكل
        </button>

        {filtered.map((z) => {
          const isActive = value === z.id
          return (
            <button
              key={z.id}
              type="button"
              className={`${styles.chip} ${isActive ? styles.active : ''}`}
              // ✅ click-to-toggle: ضغط مرة تانية يلغي الاختيار
              onClick={() => onChange(isActive ? null : z.id)}
              title={z.text}
            >
              {z.text}
            </button>
          )
        })}

        {filtered.length === 0 && search && (
          <span className={styles.noResults}>لا توجد نتائج</span>
        )}
      </div>
    </div>
  )
}

export default ZekrFilter
