import { Sparkles, ShieldCheck, PieChart, Heart } from 'lucide-react'
import { MizanMark } from '@/components/ui/BrandIcons.jsx'
import styles from './AboutSection.module.scss'

function AboutSection() {
  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.logo} aria-hidden="true">
          <MizanMark size={26} />
        </div>
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h3 className={styles.name}>مِيزان · الميزانية</h3>
            <span className={styles.version}>v1.0</span>
          </div>
          <p className={styles.desc}>
            دفتر ذكي لمتابعة الدخل والمصروف وحدود الإنفاق مع تقارير شهرية واضحة.
          </p>
        </div>
      </div>

      <div className={styles.features}>
        <span className={styles.feature}>
          <Sparkles size={13} strokeWidth={2.1} aria-hidden="true" /> بدون إعلانات
        </span>
        <span className={styles.feature}>
          <ShieldCheck size={13} strokeWidth={2.1} aria-hidden="true" /> محفوظة على جهازك
        </span>
        <span className={styles.feature}>
          <PieChart size={13} strokeWidth={2.1} aria-hidden="true" /> تقارير واضحة
        </span>
      </div>

      <p className={styles.footer}>
        <Heart
          size={13}
          strokeWidth={2.1}
          style={{ display: 'inline', verticalAlign: '-2px', marginInlineEnd: 5 }}
          aria-hidden="true"
        />
        صُنع بإتقان · لا تنسونا من صالح دعائكم
      </p>
    </section>
  )
}

export default AboutSection
