import SettingsSection from './SettingsSection.jsx'
import styles from './AboutSection.module.scss'

function AboutSection() {
  const handleShare = async () => {
    const shareData = {
      title: 'تطبيق ذِكر',
      text: 'تطبيق ذِكر - سبحة إلكترونية لمتابعة وإحصاء أذكارك اليومية 📿',
      url: window.location.origin,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // تم إلغاء المشاركة بواسطة المستخدم
      }
    } else {
      // نسخ الرابط لو كان المتصفح لا يدعم Web Share
      await navigator.clipboard?.writeText(window.location.origin)
      alert('تم نسخ رابط التطبيق بنجاح!')
    }
  }

  return (
    <SettingsSection title="عن التطبيق">
      <div className={styles.aboutCard}>
        {/* رأس البطاقة: الشعار والمعلومات الأساسية */}
        <div className={styles.header}>
          <div className={styles.logoBadge}>📿</div>
          <div className={styles.appMeta}>
            <div className={styles.titleRow}>
              <h3 className={styles.appName}>ذِكر</h3>
              <span className={styles.versionBadge}>v1.0.0</span>
            </div>
            <p className={styles.appDesc}>
              سبحة إلكترونية ذكية تتيح لك التسبيح بتركيز ومتابعة إحصائيات أذكارك يومياً.
            </p>
          </div>
        </div>

        {/* مميزات التطبيق (Features Chips) */}
        <div className={styles.features}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>✨</span>
            <span>بدون إعلانات</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🔒</span>
            <span>بياناتك محفوظة بأمان</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>⚡</span>
            <span>يعمل بدون إنترنت</span>
          </div>
        </div>

        {/* زر المشاركة */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.shareBtn}
            onClick={handleShare}
          >
            <span>مشاركة التطبيق مع من تحب</span>
            <span className={styles.shareIcon}>↗</span>
          </button>
        </div>

        {/* لمسة ختامية لطيفة */}
        <div className={styles.footerNote}>
          🤍 صدقة جارية • لا تنسونا من صالح دعائكم
        </div>
      </div>
    </SettingsSection>
  )
}

export default AboutSection
