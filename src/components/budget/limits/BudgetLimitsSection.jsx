import { useState, useMemo } from 'react'
import { useBudget } from '@/context/BudgetContext'
import LimitFormModal from './LimitFormModal.jsx'
import LimitProgressCard from './LimitProgressCard.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './BudgetLimitsSection.module.scss'

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

function formatAmount(n) {
  const num = Number(n || 0)
  const fixed = num.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${withCommas}.${decPart}`
}

function BudgetLimitsSection() {
  const {
    categories,
    limits,
    currentMonth,
    createOrUpdateLimit,
    updateLimit,
    deleteLimit,
  } = useBudget()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLimit, setEditingLimit] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // خريطة التصنيفات
  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )

  // limits الحالية للشهر المختار
  const currentLimits = limits?.limits || []

  const handleOpenAdd = () => {
    setEditingLimit(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (limit) => {
    setEditingLimit(limit)
    setIsFormOpen(true)
  }

  const handleSubmit = async (dataOrId, amount) => {
    if (editingLimit) {
      await updateLimit(editingLimit.id, amount)
    } else {
      await createOrUpdateLimit(dataOrId)
    }
    setIsFormOpen(false)
    setEditingLimit(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await deleteLimit(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // لو مفيش شهر مختار ("كل الفترات")
  if (!currentMonth) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.title}>الميزانية الشهرية</h3>
        </div>
        <div className={styles.noMonth}>
          اختر شهراً محدداً لعرض أو إدارة الميزانية.
          <br />
          <small>الميزانية تكون شهرية — لا تعمل مع "كل الفترات".</small>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>الميزانية الشهرية</h3>
          <p className={styles.subtitle}>
            {limits?.month || currentMonth} — {currentLimits.length} تصنيف
          </p>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={handleOpenAdd}
          title="إضافة ميزانية"
        >
          <PlusIcon />
          <span>إضافة</span>
        </button>
      </div>

      {/* إجمالي الشهر */}
      {limits && currentLimits.length > 0 && (
        <div className={styles.totalCard}>
          <div className={styles.totalRow}>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>إجمالي الميزانية</span>
              <span className={styles.totalValue}>
                {formatAmount(limits.total_limit)}
              </span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>صُرف</span>
              <span className={styles.totalValue}>
                {formatAmount(limits.total_spent)}
              </span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>
                {limits.total_remaining >= 0 ? 'متبقي' : 'تجاوز'}
              </span>
              <span
                className={`${styles.totalValue} ${limits.total_remaining < 0 ? styles.negative : ''
                  }`}
              >
                {formatAmount(Math.abs(limits.total_remaining))}
              </span>
            </div>
          </div>

          <div className={styles.totalProgressTrack}>
            <div
              className={`${styles.totalProgressFill} ${limits.total_percent >= 100
                ? styles.over
                : limits.total_percent >= 75
                  ? styles.warning
                  : ''
                }`}
              style={{ width: `${Math.min(limits.total_percent, 100)}%` }}
            />
          </div>
          <span className={styles.totalPercent}>
            {limits.total_percent.toFixed(1)}% مستهلك من إجمالي الميزانية
          </span>
        </div>
      )}

      {/* قائمة الميزانيات */}
      {currentLimits.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💰</div>
          <p className={styles.emptyTitle}>لا توجد ميزانيات لهذا الشهر</p>
          <p className={styles.emptySub}>
            أضف ميزانية لتصنيف مصروف لتتبع نفقاتك
          </p>
          <button
            type="button"
            className={styles.emptyAddBtn}
            onClick={handleOpenAdd}
          >
            إضافة أول ميزانية
          </button>
        </div>
      ) : (
        <div className={styles.limitsList}>
          {currentLimits.map((limit) => (
            <LimitProgressCard
              key={limit.id}
              limit={limit}
              category={catMap[limit.category_id]}
              onEdit={handleOpenEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <LimitFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingLimit(null)
        }}
        onConfirm={handleSubmit}
        initial={editingLimit}
        categories={categories}
        existingLimits={currentLimits}
        currentMonth={currentMonth}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف الميزانية؟"
        message={`سيتم حذف ميزانية "${catMap[deleteTarget?.category_id]?.name || 'التصنيف'
          }". المعاملات لن تتأثر.`}
        confirmLabel={isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
        cancelLabel="إلغاء"
        danger
      />
    </section>
  )
}

export default BudgetLimitsSection
