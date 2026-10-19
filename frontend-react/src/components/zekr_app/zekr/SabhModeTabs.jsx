import { memo } from 'react'
import styles from './SabhModeTabs.module.scss'

// أيقونة الوضع العادي (تسبيح حر / مفرد)
const SingleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

// أيقونة وضع المجموعات (أوراد مجمعة / طبقات)
const LayersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
)

const MODES = [
  { id: 'normal', label: 'تسبيح حر', Icon: SingleIcon },
  { id: 'group', label: 'المجموعات', Icon: LayersIcon },
]

function SabhModeTabs({ value, onChange }) {
  return (
    <div className={styles.tabsWrapper} role="tablist" aria-label="وضع السبحة">
      {MODES.map((m) => {
        const isActive = value === m.id
        const IconComponent = m.Icon

        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => onChange(m.id)}
          >
            <span className={styles.icon}>
              <IconComponent />
            </span>
            <span>{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default memo(SabhModeTabs)
