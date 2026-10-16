import { useState, useEffect, useRef, useMemo } from 'react'
import styles from './AdhkarSelect.module.scss'

// أيقونة السهم الدائري
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// أيقونة علامة الصح
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

function AdhkarSelect({ adhkar = [], value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const searchInputRef = useRef(null)

  const selected = adhkar.find((z) => z.id === value)

  // فلترة الأذكار بالبحث
  const filteredAdhkar = useMemo(() => {
    if (!search.trim()) return adhkar
    return adhkar.filter((z) =>
      z.text.toLowerCase().includes(search.trim().toLowerCase())
    )
  }, [adhkar, search])

  // إغلاق القائمة عند النقر خارجها
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

  // إعادة ضبط البحث وتركيز حقل البحث عند الفتح
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      if (adhkar.length > 5) {
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
    }
  }, [isOpen, adhkar.length])

  const handleSelect = (id) => {
    onChange(id)
    setIsOpen(false)
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      {/* زر فتح القائمة */}
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="اختيار الذكر الحالي"
      >
        <span className={styles.label}>
          {selected?.text ?? 'اختر ذكرًا للبدء...'}
        </span>
        <span className={styles.arrow}>
          <ChevronDownIcon />
        </span>
      </button>

      {/* القائمة المنسدلة */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* شريط بحث يظهر لو كانت الأذكار أكثر من 5 */}
          {adhkar.length > 5 && (
            <div className={styles.searchBox}>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="ابحث عن ذكر..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <ul className={styles.menu} role="listbox">
            {filteredAdhkar.length === 0 ? (
              <li className={styles.empty}>لا توجد أذكار مطابقة للبحث</li>
            ) : (
              filteredAdhkar.map((zekr) => {
                const isSelected = zekr.id === value
                return (
                  <li
                    key={zekr.id}
                    role="option"
                    aria-selected={isSelected}
                    className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSelect(zekr.id)}
                  >
                    <div className={styles.itemInfo}>
                      <span className={styles.itemText}>{zekr.text}</span>
                      {zekr.default_target ? (
                        <span className={styles.targetBadge}>
                          {zekr.default_target}
                        </span>
                      ) : null}
                    </div>

                    {isSelected && (
                      <span className={styles.checkIcon}>
                        <CheckIcon />
                      </span>
                    )}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AdhkarSelect
