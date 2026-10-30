import AppCard from './AppCard.jsx'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import styles from './Home.module.scss'

const APPS = [
  {
    id: 'zekr',
    name: 'ذِكر',
    tagline: 'سكينة يومك',
    category: 'عبادات',
    description: 'سبحة ذكية بأذكار وإحصائيات دقيقة لأورادك اليومية.',
    path: '/zekr',
    icon: '📿',
    accent: 'zekr',
    available: true,
  },
  {
    id: 'budget',
    name: 'الميزانية',
    tagline: 'وضوح مالك',
    category: 'مالي',
    description: 'تتبع الدخل والمصروف مع تقارير بصرية شهرية.',
    path: '/budget',
    icon: '💰',
    accent: 'budget',
    available: true,
  },
]

// توقيت بسيط لتغيير التحية
function getGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'طاب سُحورك'
  if (h < 12) return 'صباح الخير'
  if (h < 17) return 'طاب نهارك'
  if (h < 20) return 'مساء الخير'
  return 'طاب مساؤك'
}

function getHijriApprox() {
  // تقريبي — بدون مكتبة
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  } catch {
    return ''
  }
}

export default function Home() {
  const greeting = getGreeting()
  const hijri = getHijriApprox()

  return (
    <div className={styles.page}>
      {/* طبقة ديكور علوية ناعمة */}
      <div className={styles.ambientTop} aria-hidden="true" />

      <header className={styles.topBar}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>۞</div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>مساحتي</span>
            <span className={styles.brandTag}>فضاء رقمي هادئ</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>{hijri || 'مساحة رقمية'}</span>
          <h1 className={styles.title}>{greeting}</h1>
          <p className={styles.subtitle}>
            أدوات صغيرة مصنوعة بعناية، لترافقك في يومك دون ضجيج.
          </p>
          <div className={styles.divider} aria-hidden="true">
            <span className={styles.dividerLine} />
            <span className={styles.dividerDot} />
            <span className={styles.dividerLine} />
          </div>
        </section>

        <section className={styles.grid} aria-label="التطبيقات المتاحة">
          {APPS.map((app, i) => (
            <AppCard key={app.id} app={app} index={i} />
          ))}
        </section>

        <section className={styles.comingSoon} aria-label="قادم قريباً">
          <div className={styles.comingSoonInner}>
            <span className={styles.comingSoonIcon}>✦</span>
            <div>
              <h3 className={styles.comingSoonTitle}>أدوات جديدة قادمة</h3>
              <p className={styles.comingSoonText}>
                نعمل على أدوات إضافية بذات الروح الهادئة.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerLine} />
        <p className={styles.footerText}>
          صُنع بشغف · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}

