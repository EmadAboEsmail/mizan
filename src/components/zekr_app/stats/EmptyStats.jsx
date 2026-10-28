import { useNavigate } from 'react-router-dom'
import styles from './EmptyStats.module.scss'

function EmptyStats({ hasAnyAdhkar, selectedZekrName, onClearFilter }) {
  const navigate = useNavigate()

  // الحالة 1: مفيش أذكار خالص في التطبيق
  if (!hasAnyAdhkar) {
    return (
      <div className={styles.emptyCard}>
        <div className={styles.emptyIcon}>📿</div>
        <p className={styles.emptyTitle}>لا توجد أذكار بعد</p>
        <p className={styles.emptySub}>
          ابدأ بإضافة ذكرك الأول من الإعدادات لتظهر إحصائياتك هنا.
        </p>
        <button
          type="button"
          className={styles.emptyBtn}
          onClick={() => navigate('/zekr/settings')}
        >
          إضافة ذكر الآن
        </button>
      </div>
    )
  }

  // الحالة 2: في ذكر مختار لكن مفيش تسبيحات في الفترة
  if (selectedZekrName) {
    return (
      <div className={styles.emptyCard}>
        <div className={styles.emptyIcon}>🎯</div>
        <p className={styles.emptyTitle}>لا توجد تسبيحات لهذا الذكر</p>
        <p className={styles.emptySub}>
          لم تقم بتسبيح "{selectedZekrName}" في هذه الفترة. جرّب فترة أخرى أو
          ابدأ الآن.
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

  // الحالة 3: في أذكار لكن مفيش تسبيحات في الفترة (بدون فلتر)
  return (
    <div className={styles.emptyCard}>
      <div className={styles.emptyIcon}>🌱</div>
      <p className={styles.emptyTitle}>لا توجد تسبيحات في هذه الفترة</p>
      <p className={styles.emptySub}>
        ابدأ بالذكر وسيظهر تقدمك هنا مباشرة.
      </p>
      <button
        type="button"
        className={styles.emptyBtn}
        onClick={() => navigate('/zekr/sabh')}
      >
        ابدأ التسبيح
      </button>
    </div>
  )
}

export default EmptyStats

