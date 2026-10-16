import { useState, useEffect, useRef } from 'react'
import styles from './GroupSelect.module.scss'

// أيقونات SVG أنيقة
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

function GroupSelect({ groups = [], value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  // العثور على المجموعة المحددة حالياً
  const selected = groups.find((g) => g.id === value)

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

  if (groups.length === 0) {
    return (
      <div className={styles.empty}>
        📂 لا توجد مجموعات أذكار. أضِف واحدة من صفحة الإعدادات.
      </div>
    )
  }

  const handleSelect = (group) => {
    onChange(group.id) // نرسل الـ ID بنوعه الأصلي (رقم أو نص) دون تشويه
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
        aria-label="اختيار مجموعة الأذكار"
      >
        <div className={styles.triggerContent}>
          <span className={styles.folderIcon}>
            <FolderIcon />
          </span>
          <span className={styles.label}>
            {selected ? selected.name : 'اختر مجموعة أذكار للبدء...'}
          </span>
          {selected && (
            <span className={styles.countBadge}>
              {selected.items?.length ?? 0} ذكر
            </span>
          )}
        </div>

        <span className={styles.arrow}>
          <ChevronDownIcon />
        </span>
      </button>

      {/* القائمة المنسدلة */}
      {isOpen && (
        <div className={styles.dropdown}>
          <ul className={styles.menu} role="listbox">
            {groups.map((g) => {
              const isSelected = g.id === value
              const itemCount = g.items?.length ?? 0
              return (
                <li
                  key={g.id}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSelect(g)}
                >
                  <div className={styles.itemInfo}>
                    <div className={styles.titleLine}>
                      <span className={styles.name}>{g.name}</span>
                      <span className={styles.itemCountBadge}>
                        {itemCount} ذكر
                      </span>
                    </div>

                    {g.description && (
                      <span className={styles.desc}>{g.description}</span>
                    )}
                  </div>

                  {isSelected && (
                    <span className={styles.checkIcon}>
                      <CheckIcon />
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default GroupSelect
