import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import styles from './ActivityHeatmap.module.scss'

const WEEKS = 12
const EMPTY_MAP = {}

const MONTHS_SHORT = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

function pad2(n) {
  return String(n).padStart(2, '0')
}

function isoLocal(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function formatArabicDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS_SHORT[(m || 1) - 1]} ${y}`
}

function getLevel(count, maxCount) {
  if (!count || count <= 0) return 0
  const ratio = count / Math.max(maxCount, 33)
  if (ratio <= 0.22) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.8) return 3
  return 4
}

export default function ActivityHeatmap({ dailyCounts = EMPTY_MAP }) {
  const [selectedIso, setSelectedIso] = useState(null)

  const { columns, activeDays, maxCount, todayIso } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = isoLocal(today)

    // آخر عمود ينتهي بنهاية الأسبوع الحالي (الجمعة عند بداية السبت)
    const todaySatIdx = (today.getDay() + 1) % 7 // 0=السبت .. 6=الجمعة
    const start = new Date(today)
    start.setDate(today.getDate() - todaySatIdx - (WEEKS - 1) * 7)

    let max = 0
    let active = 0
    const cols = []

    for (let w = 0; w < WEEKS; w += 1) {
      const days = []
      for (let r = 0; r < 7; r += 1) {
        const cellDate = new Date(start)
        cellDate.setDate(start.getDate() + w * 7 + r)
        const iso = isoLocal(cellDate)
        const isFuture = cellDate > today
        const count = isFuture ? 0 : Number(dailyCounts?.[iso]) || 0
        if (count > 0) {
          active += 1
          if (count > max) max = count
        }
        days.push({
          iso,
          count,
          isFuture,
          isToday: iso === todayKey,
        })
      }
      cols.push(days)
    }

    return {
      columns: cols,
      activeDays: active,
      maxCount: max,
      todayIso: todayKey,
    }
  }, [dailyCounts])

  const activeIso = selectedIso || todayIso
  const activeCount = Number(dailyCounts?.[activeIso]) || 0

  return (
    <section className={styles.card} aria-label="خريطة المداومة اليومية">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.iconWrap} aria-hidden="true">
            <CalendarDays size={15} strokeWidth={2.2} />
          </span>
          <h3 className={styles.title}>خريطة المداومة</h3>
        </div>
        <span className={styles.badge}>
          {activeDays} يوم نشط / {WEEKS} أسبوعاً
        </span>
      </div>

      <div className={styles.grid} dir="ltr" role="grid">
        {columns.map((week, wIdx) => (
          <div key={wIdx} className={styles.col}>
            {week.map((day) => {
              if (day.isFuture) {
                return (
                  <span
                    key={day.iso}
                    className={`${styles.cell} ${styles.future}`}
                    aria-hidden="true"
                  />
                )
              }
              const lvl = getLevel(day.count, maxCount)
              const isSelected = selectedIso === day.iso
              return (
                <button
                  key={day.iso}
                  type="button"
                  className={[
                    styles.cell,
                    styles[`lvl${lvl}`],
                    day.isToday ? styles.today : '',
                    isSelected ? styles.selected : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    triggerHapticFeedback('light')
                    setSelectedIso((prev) =>
                      prev === day.iso ? null : day.iso
                    )
                  }}
                  aria-label={`${formatArabicDay(day.iso)}: ${day.count} تسبيحة`}
                  title={`${formatArabicDay(day.iso)} — ${day.count.toLocaleString('en')} تسبيحة`}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.dayInfo}>
          <strong>
            {activeIso === todayIso ? 'اليوم' : formatArabicDay(activeIso)}:
          </strong>{' '}
          {activeCount > 0
            ? `${activeCount.toLocaleString('en')} تسبيحة`
            : 'لا يوجد تسبيح مسجّل'}
        </span>

        <div className={styles.legend} aria-hidden="true">
          <span>أقل</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className={`${styles.legendCell} ${styles[`lvl${l}`]}`}
            />
          ))}
          <span>أكثر</span>
        </div>
      </div>
    </section>
  )
}
