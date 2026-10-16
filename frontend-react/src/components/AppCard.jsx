import { Link } from 'react-router-dom'
import styles from './AppCard.module.scss'

// أيقونة سهم التنقل
const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

function AppCard({ app, index = 0 }) {
  const isAvailable = !!app.available

  // نحدد نوع العنصر: Link لو متاح، و div لو غير متاح (بدون تكرار JSX)
  const Component = isAvailable ? Link : 'div'

  return (
    <Component
      to={isAvailable ? app.path : undefined}
      className={`${styles.card} ${isAvailable ? styles.available : styles.disabled}`}
      style={{
        animationDelay: `${index * 0.08}s`,
        '--accent-color': app.accentColor || '#059669', // تمرير اللون المميز كـ CSS Variable
      }}
      aria-disabled={!isAvailable}
      aria-label={`${app.name} - ${isAvailable ? 'متاح للاستخدام' : 'قيد التطوير'}`}
    >
      {/* الشريط العلوي للبطاقة: الأيقونة مع التصنيف والشارة */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>{app.icon}</span>
        </div>

        <div className={styles.badgeGroup}>
          {app.category && (
            <span className={styles.category}>{app.category}</span>
          )}
          <span className={`${styles.statusBadge} ${isAvailable ? styles.statusActive : styles.statusSoon}`}>
            {isAvailable ? 'متاح' : 'قريباً'}
          </span>
        </div>
      </div>

      {/* تفاصيل البطاقة */}
      <div className={styles.body}>
        <h2 className={styles.name}>{app.name}</h2>
        <p className={styles.desc}>{app.description}</p>
      </div>

      {/* تذييل البطاقة (Call To Action) */}
      <div className={styles.footer}>
        {isAvailable ? (
          <div className={styles.actionText}>
            <span>فتح التطبيق</span>
            <span className={styles.arrow}><ArrowLeftIcon /></span>
          </div>
        ) : (
          <span className={styles.disabledHint}>قيد التطوير ⏳</span>
        )}
      </div>
    </Component>
  )
}

export default AppCard
