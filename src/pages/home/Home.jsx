import { useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { useAdhkarQuery, useCountsQuery } from '@/queries/zekr'
import { useSummaryQuery } from '@/queries/budget'
import { getCurrentMonth } from '@/contexts/BudgetContext'
import { usePrivacyMode, maskText } from '@/hooks/usePrivacyMode.js'
import { useCurrency } from '@/hooks/useCurrency.js'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import PrivacyToggle from '@/components/ui/PrivacyToggle.jsx'
import { MizanMark, TasbihIcon, BudgetIcon } from '@/components/ui/BrandIcons.jsx'
import AppCard from './AppCard.jsx'
import TodayBalanceCard from './TodayBalanceCard.jsx'
import ContinueCard from './ContinueCard.jsx'
import QuickStats from './QuickStats.jsx'
import styles from './Home.module.scss'

const EMPTY_LIST = []
const EMPTY_MAP = {}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'طاب سُحورك'
  if (h < 12) return 'صباح الخير'
  if (h < 17) return 'طاب نهارك'
  if (h < 20) return 'مساء الخير'
  return 'طاب مساؤك'
}

function getHijriDate() {
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

function formatCompactMoney(n, sym = 'ج.م') {
  const num = Number(n || 0)
  const sign = num > 0 ? '+' : num < 0 ? '−' : ''
  return `${sign}${Math.abs(num).toLocaleString('en', { maximumFractionDigits: 0 })} ${sym}`
}

export default function Home() {
  const greeting = getGreeting()
  const hijri = getHijriDate()
  const thisMonth = useMemo(() => getCurrentMonth(), [])

  const { isPrivate } = usePrivacyMode()
  const { symbol } = useCurrency()
  const { data: adhkar = EMPTY_LIST } = useAdhkarQuery()
  const { data: counts = EMPTY_MAP } = useCountsQuery()
  const { data: monthSummary = null } = useSummaryQuery(thisMonth)

  const totalTasbihat = useMemo(
    () => Object.values(counts).reduce((sum, c) => sum + (c || 0), 0),
    [counts]
  )

  const zekrStat = useMemo(() => {
    if (totalTasbihat > 0) {
      return `${totalTasbihat.toLocaleString('en')} تسبيحة مسجّلة`
    }
    if (adhkar.length > 0) {
      return `${adhkar.length.toLocaleString('en')} ذكر جاهز للورد`
    }
    return 'ابدأ وردك اليومي'
  }, [totalTasbihat, adhkar.length])

  const budgetStat = useMemo(() => {
    if (monthSummary && monthSummary.transaction_count > 0) {
      return `صافي الشهر: ${
        isPrivate
          ? maskText(symbol)
          : formatCompactMoney(monthSummary.net, symbol)
      }`
    }
    return 'سجّل دخلك ومصروفك بسهولة'
  }, [monthSummary, isPrivate, symbol])

  const apps = [
    {
      id: 'zekr',
      name: 'ذِكر',
      tagline: 'سكينة يومك',
      category: 'عبادات',
      description: 'سبحة هادئة بأوراد مخصصة ووضع تركيز وإحصائيات يومية.',
      stat: zekrStat,
      ctaLabel: 'افتح السبحة',
      path: '/zekr/sabh',
      icon: <TasbihIcon size={26} />,
      accent: 'zekr',
      available: true,
    },
    {
      id: 'budget',
      name: 'الميزانية',
      tagline: 'وضوح مالك',
      category: 'مالي',
      description: 'تتبّع الدخل والمصروف وحدود الإنفاق مع تقارير شهرية واضحة.',
      stat: budgetStat,
      ctaLabel: 'افتح الميزانية',
      path: '/budget/transactions',
      icon: <BudgetIcon size={25} />,
      accent: 'budget',
      available: true,
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.ambientTop} aria-hidden="true" />

      <header className={styles.topBar}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <MizanMark size={23} accentColor="#F0BC68" />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>مِيزان</span>
            <span className={styles.brandTag}>توازن يومك ومالك</span>
          </div>
        </div>
        <div className={styles.topActions}>
          <PrivacyToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          {hijri && (
            <span className={styles.eyebrow}>
              <Calendar size={13} strokeWidth={2.1} aria-hidden="true" />
              <span>{hijri}</span>
            </span>
          )}
          <h1 className={styles.title}>{greeting}</h1>
          <p className={styles.subtitle}>
            سكينة الذكر ووضوح المال — في مساحة واحدة هادئة تعمل دون اتصال.
          </p>
        </section>

        <TodayBalanceCard />

        <ContinueCard />

        <section className={styles.gridSection} aria-label="أقسام مِيزان">
          <div className={styles.grid}>
            {apps.map((app, i) => (
              <AppCard key={app.id} app={app} index={i} />
            ))}
          </div>
        </section>

        <QuickStats />
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerOrnament} aria-hidden="true">
          <span className={styles.footerLine} />
          <span className={styles.footerDot} />
          <span className={styles.footerLine} />
        </span>
        <p className={styles.footerText}>
          مِيزان · بياناتك محفوظة على جهازك بالكامل
        </p>
      </footer>
    </div>
  )
}
