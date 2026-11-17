import { Sparkles, ShieldCheck, WifiOff, Share2, Heart } from 'lucide-react'
import { MizanMark } from '@/components/ui/BrandIcons.jsx'
import SettingsSection from './SettingsSection.jsx'
import styles from './AboutSection.module.scss'
import { useToast } from '@/hooks/useToast.js'

function AboutSection() {
  const { showToast } = useToast()

  const handleShare = async () => {
    const shareData = {
      title: 'مِيزان — ذِكر وميزانية',
      text: 'مِيزان — سبحة إلكترونية هادئة وإدارة ميزانية شخصية بدون إنترنت.',
      url: window.location.origin,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // تم إلغاء المشاركة
      }
    } else {
      try {
        await navigator.clipboard?.writeText(window.location.origin)
        showToast('تم نسخ رابط التطبيق بنجاح')
      } catch {
        showToast('تعذر نسخ الرابط، حاول مرة أخرى')
      }
    }
  }

  return (
    <SettingsSection id="about" title="عن مِيزان">
      <div className={styles.aboutCard}>
        <div className={styles.header}>
          <div className={styles.logoBadge} aria-hidden="true">
            <MizanMark size={26} />
          </div>
          <div className={styles.appMeta}>
            <div className={styles.titleRow}>
              <h3 className={styles.appName}>مِيزان · ذِكر</h3>
              <span className={styles.versionBadge}>v1.0</span>
            </div>
            <p className={styles.appDesc}>
              سبحة إلكترونية هادئة تتيح لك التسبيح بتركيز ومتابعة أورادك اليومية.
            </p>
          </div>
        </div>

        <div className={styles.features}>
          <div className={styles.featureItem}>
            <Sparkles size={14} strokeWidth={2.1} aria-hidden="true" />
            <span>بدون إعلانات</span>
          </div>
          <div className={styles.featureItem}>
            <ShieldCheck size={14} strokeWidth={2.1} aria-hidden="true" />
            <span>بياناتك على جهازك</span>
          </div>
          <div className={styles.featureItem}>
            <WifiOff size={14} strokeWidth={2.1} aria-hidden="true" />
            <span>يعمل بدون إنترنت</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.shareBtn}
            onClick={handleShare}
          >
            <Share2 size={15} strokeWidth={2.2} aria-hidden="true" />
            <span>مشاركة التطبيق مع من تحب</span>
          </button>
        </div>

        <div className={styles.footerNote}>
          <Heart size={13} strokeWidth={2.1} aria-hidden="true" />
          <span>صدقة جارية · لا تنسونا من صالح دعائكم</span>
        </div>
      </div>
    </SettingsSection>
  )
}

export default AboutSection
