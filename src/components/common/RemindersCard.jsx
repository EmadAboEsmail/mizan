import { Bell, Sunrise, Sunset, Wallet } from 'lucide-react'
import { useReminders } from '@/hooks/useReminders.js'
import {
  requestNotificationPermission,
  triggerHapticFeedback,
} from '@/utils/haptics.js'
import { useToast } from '@/hooks/useToast.js'
import styles from './RemindersCard.module.scss'

const ITEMS = [
  {
    key: 'morning',
    label: 'أذكار الصباح',
    desc: 'تذكير يومي هادئ لبدء يومك بالذكر',
    Icon: Sunrise,
    tone: 'zekr',
  },
  {
    key: 'evening',
    label: 'أذكار المساء',
    desc: 'تذكير يومي لختام النهار بالسكينة',
    Icon: Sunset,
    tone: 'zekr',
  },
  {
    key: 'budget',
    label: 'تسجيل مصروفات اليوم',
    desc: 'تذكير مسائي سريع لمراجعة توازنك المالي',
    Icon: Wallet,
    tone: 'budget',
  },
]

export default function RemindersCard({ filter = null }) {
  const { reminders, updateReminder } = useReminders()
  const { showToast } = useToast()

  const visible = filter
    ? ITEMS.filter((it) => filter.includes(it.key))
    : ITEMS

  const handleToggle = async (key) => {
    const cur = reminders[key]
    const nextEnabled = !cur?.enabled
    triggerHapticFeedback('light')

    if (nextEnabled) {
      const granted = await requestNotificationPermission()
      if (!granted) {
        showToast('يرجى السماح بالإشعارات من إعدادات الجهاز أولاً', 'error')
        return
      }
    }

    await updateReminder(key, { enabled: nextEnabled })
    showToast(
      nextEnabled
        ? `تم تفعيل التذكير اليومي الساعة ${cur.time}`
        : 'تم إيقاف التذكير'
    )
  }

  const handleTimeChange = async (key, newTime) => {
    await updateReminder(key, { time: newTime })
    if (reminders[key]?.enabled) {
      showToast(`تم تحديث الموعد إلى ${newTime}`)
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.note}>
        <Bell size={14} strokeWidth={2.1} aria-hidden="true" />
        <span>تعمل المنبّهات محلياً على جهازك دون إنترنت وتبقى بعد إعادة التشغيل.</span>
      </p>

      <div className={styles.list}>
        {visible.map(({ key, label, desc, Icon, tone }) => {
          const item = reminders[key]
          const isOn = Boolean(item?.enabled)
          return (
            <div
              key={key}
              className={`${styles.row} ${isOn ? styles.rowActive : ''}`}
            >
              <div className={styles.rowTop}>
                <div className={styles.info}>
                  <span
                    className={`${styles.iconBox} ${
                      tone === 'budget' ? styles.budgetTone : styles.zekrTone
                    }`}
                    aria-hidden="true"
                  >
                    <Icon size={17} strokeWidth={2.1} />
                  </span>
                  <div className={styles.texts}>
                    <span className={styles.label}>{label}</span>
                    <span className={styles.desc}>{desc}</span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  aria-label={`تفعيل تذكير ${label}`}
                  className={`${styles.switch} ${isOn ? styles.switchOn : ''}`}
                  onClick={() => handleToggle(key)}
                >
                  <span className={styles.thumb} aria-hidden="true" />
                </button>
              </div>

              <div className={styles.timeRow}>
                <label htmlFor={`rem-time-${key}`} className={styles.timeLabel}>
                  موعد التذكير اليومي
                </label>
                <input
                  id={`rem-time-${key}`}
                  type="time"
                  className={styles.timeInput}
                  value={item?.time || '07:00'}
                  onChange={(e) => handleTimeChange(key, e.target.value)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
