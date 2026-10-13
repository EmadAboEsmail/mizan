import styles from './SettingsSection.module.scss'

function SettingsSection({ title, children }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.content}>{children}</div>
    </section>
  )
}

export default SettingsSection
