import { useNavigate } from 'react-router-dom'
import { Target, Sprout } from 'lucide-react'
import { TasbihIcon } from '@/components/ui/BrandIcons.jsx'
import EmptyState from '@/components/ui/EmptyState.jsx'
import styles from './EmptyStats.module.scss'

function EmptyStats({ hasAnyAdhkar, selectedZekrName, onClearFilter }) {
  const navigate = useNavigate()

  if (!hasAnyAdhkar) {
    return (
      <EmptyState
        accent="zekr"
        icon={<TasbihIcon size={26} />}
        title="لا توجد أذكار بعد"
        subtitle="ابدأ بإضافة ذكرك الأول من الإعدادات لتظهر إحصائياتك هنا."
        action={() => navigate('/zekr/settings')}
        actionLabel="إضافة ذكر الآن"
      />
    )
  }

  if (selectedZekrName) {
    return (
      <div className={styles.emptyCard}>
        <div className={styles.emptyIcon} aria-hidden="true">
          <Target size={24} strokeWidth={2} />
        </div>
        <p className={styles.emptyTitle}>لا توجد تسبيحات لهذا الذكر</p>
        <p className={styles.emptySub}>
          لم تقم بتسبيح &laquo;{selectedZekrName}&raquo; في هذه الفترة. جرّب
          فترة أخرى أو ابدأ الآن.
        </p>
        <div className={styles.emptyActions}>
          <button
            type="button"
            className={styles.emptyBtn}
            onClick={() => navigate('/zekr/sabh')}
          >
            ابدأ التسبيح
          </button>
          {onClearFilter && (
            <button
              type="button"
              className={styles.emptyBtnSecondary}
              onClick={onClearFilter}
            >
              عرض كل الأذكار
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <EmptyState
      accent="zekr"
      icon={<Sprout size={26} strokeWidth={1.9} />}
      title="لا توجد تسبيحات في هذه الفترة"
      subtitle="ابدأ بالذكر وسيظهر تقدمك هنا مباشرة."
      action={() => navigate('/zekr/sabh')}
      actionLabel="ابدأ التسبيح"
    />
  )
}

export default EmptyStats

