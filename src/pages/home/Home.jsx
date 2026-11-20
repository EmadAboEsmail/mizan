import { useState } from 'react'
import { readWirdProgress } from '@/utils/wirdProgress.js'
import { readLastWird } from '@/utils/lastWird.js'
import { Link } from 'react-router-dom'
import { ArrowLeft, LockKeyhole, Plus } from 'lucide-react'
import { useAdhkarQuery, useCountsQuery, useGroupsQuery } from '@/queries/zekr'
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

const PIN_KEY = 'mizan_pinned_spaces_v1'
function loadPins() {
  try {
    const ids = JSON.parse(localStorage.getItem(PIN_KEY) ?? '["zekr","budget"]')
    if (Array.isArray(ids)) return [...new Set(ids)].filter((id) => workspaces.some((space) => space.id === id)).slice(0, 2)
  } catch { /* use defaults */ }
  return ['zekr', 'budget']
}

export default function Home() {
  const [pins, setPins] = useState(loadPins)
  const lastWirdId = readLastWird()
  const { data: groups = EMPTY } = useGroupsQuery()
  const lastWird = groups.find((group) => String(group.id) === lastWirdId && group.items?.length)
  const wirdProgress = lastWird && readWirdProgress(lastWird.id, lastWird.items)
  const togglePin = (id) => {
    const next = pins.includes(id) ? pins.filter((pin) => pin !== id) : [...pins, id].slice(-2)
    setPins(next)
    try { localStorage.setItem(PIN_KEY, JSON.stringify(next)) } catch { /* optional */ }
  }
  const { isLocked } = useBudgetLock()
  const { data: adhkar = EMPTY } = useAdhkarQuery()
  const { data: counts } = useCountsQuery()
  const [currentId] = useCurrentZekrId(adhkar)
  const current = adhkar.find((item) => String(item.id) === String(currentId))
  const hasProgress = current && (counts?.[current.id] ?? 0) > 0
  const zekrPath = lastWird ? `/zekr/sabh?${new URLSearchParams({ mode: 'group', group: String(lastWird.id) })}` : current ? `/zekr/sabh?${new URLSearchParams({ zekr: current.id })}` : '/zekr/sabh'

  return (
    <div className={styles.page} dir="rtl">
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true"><MizanMark size={23} accentColor="#D4B88C" /></span>
          <span>مِيزان<small>دفتر يومك</small></span>
        </div>
        <div className={styles.controls}><PrivacyToggle /><ThemeToggle /></div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="today-heading">
          <p className={styles.date}>{dateFormatter.format(new Date())}</p>
          <h1 id="today-heading">اليوم</h1>
          <p className={styles.lead}>وردك ومصروفك، في صفحة واحدة.</p>
          <div className={styles.actions}>
            <Link className={styles.zekrAction} to={zekrPath}>
              <TasbihIcon size={22} />
              <strong>{lastWird ? (wirdProgress ? 'أكمل وردك' : 'ابدأ وردك') : hasProgress ? 'تابع ذِكرك' : 'ابدأ الذِكر'}</strong>
              <small>{lastWird ? lastWird.name : current?.text || 'افتح السبحة'}</small>
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
          {[[pins.map((id) => workspaces.find((space) => space.id === id)), 'المفضّلة'], [workspaces.filter(({ id }) => !pins.includes(id)), 'باقي المساحات']].map(([items, label]) => items.length > 0 && (
            <div key={label}>
              <h3 className={styles.catalogLabel}>{label}</h3>
              <ul className={styles.catalog} aria-label={label}>
                {items.map(({ id, path, Icon, name, description }) => (
                  <li key={id} className={styles.pinRow}>
                    <Link to={path} className={styles.space} data-space={id}>
                      <span className={styles.spaceIcon} aria-hidden="true"><Icon size={22} /></span>
                      <span className={styles.spaceText}><strong>{name}</strong><small>{description}</small></span>
                      <ArrowLeft size={18} aria-hidden="true" />
                    </Link>
                    <button type="button" className={styles.pinButton} aria-pressed={pins.includes(id)} aria-label={`تثبيت ${name} في المفضّلة`} onClick={() => togglePin(id)}>{pins.includes(id) ? '★' : '☆'}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <TodayBalanceCard isLocked={isLocked} />
      </main>
      <footer className={styles.footer}>مِيزان · بياناتك محفوظة على جهازك</footer>
    </div>
  )
}
