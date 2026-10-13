import SettingsSection from './SettingsSection.jsx'
import styles from './AboutSection.module.scss'

function AboutSection() {
  return (
    <SettingsSection title="عن التطبيق">
      <div className={styles.row}>
        <span className={styles.label}>الاسم</span>
        <span className={styles.value}>ذِكر</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>الإصدار</span>
        <span className={styles.value}>1.0.0</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>الوصف</span>
        <span className={styles.value}>سبحة إلكترونية بأذكار متنوعة</span>
      </div>
    </SettingsSection>
  )
}

export default AboutSection
