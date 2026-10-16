import styles from './Tabs.module.scss'

function Tabs({ tabs = [], active, onChange }) {
  return (
    <div className={styles.tabsWrapper} role="tablist" aria-label="أقسام التطبيق الرئيسية">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        const IconComponent = tab.icon

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {/* أيقونة اختيارية إن وُجدت */}
            {IconComponent && (
              <span className={styles.icon}>
                {typeof IconComponent === 'function' ? <IconComponent /> : IconComponent}
              </span>
            )}

            <span className={styles.label}>{tab.label}</span>

            {/* مؤشر ناعم أسفل التاب النشط */}
            {isActive && <span className={styles.activeIndicator} />}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
