import styles from './AboutSection.module.scss'

function AboutSection() {
  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.logo}>💰</div>
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h3 className={styles.name}>الميزانية</h3>
            <span className={styles.version}>v1.0.0</span>
          </div>
          <p className={styles.desc}>
            تطبيق إدارة الدخل والمصروف مع تحليلات مفصلة ورسوم بيانية.
          </p>
        </div>
      </div>

      <div className={styles.features}>
        <span className={styles.feature}>✨ بدون إعلانات</span>
        <span className={styles.feature}>🔒 بياناتك آمنة</span>
        <span className={styles.feature}>📊 تقارير مفصلة</span>
      </div>

      <p className={styles.footer}>
        🤍 صُنع بإتقان • لا تنسونا من صالح دعائكم
      </p>
    </section>
  )
}

export default AboutSection
