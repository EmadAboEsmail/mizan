import { Link } from 'react-router-dom'
import styles from './AppCard.module.scss'

function AppCard({ app, index = 0 }) {
  const cardClass = `${styles.card} ${app.available ? '' : styles.disabled
    }`

  // لو التطبيق مش متاح، نعرضه كـ div مش Link
  if (!app.available) {
    return (
      <div
        className={cardClass}
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        <span className={styles.icon}>{app.icon}</span>
        <h2 className={styles.name}>{app.name}</h2>
        <p className={styles.desc}>{app.description}</p>
        <span className={styles.badge}>قريبًا</span>
      </div>
    )
  }

  return (
    <Link
      to={app.path}
      className={cardClass}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <span className={styles.icon}>{app.icon}</span>
      <h2 className={styles.name}>{app.name}</h2>
      <p className={styles.desc}>{app.description}</p>
    </Link>
  )
}

export default AppCard
