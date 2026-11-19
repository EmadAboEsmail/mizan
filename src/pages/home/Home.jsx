import { Link } from 'react-router-dom'
import { ArrowLeft, LockKeyhole, Plus } from 'lucide-react'
import { useAdhkarQuery, useCountsQuery } from '@/queries/zekr'
import { useCurrentZekrId } from '@/contexts/ZekrDataContext'
import { useBudgetLock } from '@/hooks/useBudgetLock.js'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import PrivacyToggle from '@/components/ui/PrivacyToggle.jsx'
import { MizanMark, TasbihIcon } from '@/components/ui/BrandIcons.jsx'
import TodayBalanceCard from './TodayBalanceCard.jsx'
import { workspaces } from './workspaces.js'
import styles from './Home.module.scss'

const EMPTY = []
const dateFormatter = new Intl.DateTimeFormat('ar-EG-u-ca-islamic', { weekday: 'long', day: 'numeric', month: 'long' })

export default function Home() {
  const { isLocked } = useBudgetLock()
  const { data: adhkar = EMPTY } = useAdhkarQuery()
  const { data: counts } = useCountsQuery()
  const [currentId] = useCurrentZekrId(adhkar)
  const current = adhkar.find((item) => String(item.id) === String(currentId))
  const hasProgress = current && (counts?.[current.id] ?? 0) > 0
  const zekrPath = current ? `/zekr/sabh?${new URLSearchParams({ zekr: current.id })}` : '/zekr/sabh'

  return (
    <div className={styles.page} dir="rtl">
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true"><MizanMark size={23} accentColor="#E7BF7C" /></span>
          <span>مِيزان<small>مساحات يومك</small></span>
        </div>
        <div className={styles.controls}><PrivacyToggle /><ThemeToggle /></div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="today-heading">
          <p className={styles.date}>{dateFormatter.format(new Date())}</p>
          <h1 id="today-heading">اليوم</h1>
          <p className={styles.lead}>ابدأ بما يهمّك الآن.</p>
          <div className={styles.actions}>
            <Link className={styles.zekrAction} to={zekrPath}>
              <TasbihIcon size={22} />
              <strong>{hasProgress ? 'تابع ذِكرك' : 'ابدأ الذِكر'}</strong>
              <small>{current?.text || 'افتح السبحة'}</small>
            </Link>
            <Link className={styles.budgetAction} to="/budget/transactions?add=1">
              {isLocked ? <LockKeyhole size={22} aria-hidden="true" /> : <Plus size={22} aria-hidden="true" />}
              <strong>{isLocked ? 'افتح الميزانية' : 'سجّل مصروفًا'}</strong>
              <small>{isLocked ? 'افتح القفل للتسجيل' : 'إضافة سريعة'}</small>
            </Link>
          </div>
        </section>

        <section aria-labelledby="spaces-heading">
          <h2 id="spaces-heading" className={styles.sectionTitle}>مساحات مِيزان</h2>
          <ul className={styles.catalog}>
            {workspaces.map(({ id, path, Icon, name, description }) => (
              <li key={id}>
                <Link to={path} className={styles.space} data-space={id}>
                  <span className={styles.spaceIcon} aria-hidden="true"><Icon size={22} /></span>
                  <span className={styles.spaceText}><strong>{name}</strong><small>{description}</small></span>
                  <ArrowLeft size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <TodayBalanceCard isLocked={isLocked} />
      </main>
      <footer className={styles.footer}>مِيزان · بياناتك محفوظة على جهازك</footer>
    </div>
  )
}
