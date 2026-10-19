import AppCard from './AppCard.jsx'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import QuickStats from './QuickStates.jsx'
import ContinueCard from './ContinueCard.jsx'
import styles from './Home.module.scss'

const APPS = [
  {
    id: 'zekr',
    name: 'ذِكر',
    category: 'إسلامي / عبادات',
    description: 'سبحة إلكترونية ذكية بأذكار متنوعة وإحصائيات دقيقة لأورادك اليومية.',
    path: '/zekr',
    icon: '📿',
    available: true,
    accentColor: '#059669',
  },
  {
    id: 'bubble-sort',
    name: 'ترتيب الفقاعات',
    category: 'خوارزميات / تعليمي',
    description: 'محاكاة بصرية تفاعلية لشرح خطوات خوارزمية Bubble Sort خطوة بخطوة.',
    path: '/bubble-sort',
    icon: '🔢',
    available: false,
    accentColor: '#3b82f6',
  },
  {
    id: 'selection-sort',
    name: 'ترتيب الاختيار',
    category: 'خوارزميات / تعليمي',
    description: 'تصور بصري لمفهوم خوارزمية Selection Sort وكيفية إيجاد العنصر الأصغر.',
    path: '/selection-sort',
    icon: '📊',
    available: false,
    accentColor: '#8b5cf6',
  },
]

const AVAILABLE_COUNT = APPS.filter((a) => a.available).length

function Home() {
  return (
    <div className={styles.home}>
      <div className={styles.ambientGlow} />

      {/* ✅ إصلاح: themeToggleFloat (lowercase) */}
      <div className={styles.themeToggleFloat}>
        <ThemeToggle />
      </div>

      <header className={styles.header}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          <span>منصة التطبيقات والأدوات</span>
        </div>

        <h1 className={styles.title}>مساحتي الرقمية</h1>
        <p className={styles.subtitle}>
          مجموعة من الأدوات التفاعلية والتطبيقات المفيدة المصنوعة بشغف وتجربة مستخدم
          مدروسة.
        </p>

        {/* ✅ نشاط المستخدم (يظهر لو عنده بيانات) */}
        <QuickStats />

        {/* إحصائيات المنصة */}
        <div className={styles.statsBar}>
          <span className={styles.statItem}>
            <strong>{APPS.length}</strong> مشاريع
          </span>
          <span className={styles.statDivider}>•</span>
          <span className={styles.statItem}>
            <strong className={styles.activeText}>{AVAILABLE_COUNT}</strong> متاح
            الآن
          </span>
          <span className={styles.statDivider}>•</span>
          <span className={styles.statItem}>
            <strong>{APPS.length - AVAILABLE_COUNT}</strong> قيد التطوير
          </span>
        </div>
      </header>

      <main className={styles.gridSection}>
        {/* ✅ تابع من حيث توقفت */}
        <ContinueCard />

        <div className={styles.grid}>
          {APPS.map((app, i) => (
            <AppCard key={app.id} app={app} index={i} />
          ))}
        </div>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          صُنع بإتقان وشغف 🤍 • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}

export default Home
