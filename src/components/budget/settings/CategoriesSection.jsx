import { useState, useMemo } from 'react'
import { useBudget } from '@/contexts/BudgetContext'
import CategoryIcon from '@/components/budget/CategoryIcon.jsx'
import CategoryFormModal from './CategoryFormModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './CategoriesSection.module.scss'

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

function CategoriesSection() {
  const {
    categories,
    transactions,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useBudget()

  const [formOpen, setFormOpen] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // خريطة عدد المعاملات لكل تصنيف
  const txnCountByCategory = useMemo(() => {
    const map = {}
    transactions.forEach((t) => {
      map[t.category_id] = (map[t.category_id] || 0) + 1
    })
    return map
  }, [transactions])

  const expenseCats = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  )
  const incomeCats = useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories]
  )

  const handleOpenAdd = (type = 'expense') => {
    setEditingCat({ defaultType: type })
    setFormOpen(true)
  }

  const handleOpenEdit = (cat) => {
    setEditingCat(cat)
    setFormOpen(true)
  }

  const handleSubmit = async (dataOrId, updates) => {
    if (editingCat && editingCat.id) {
      await updateCategory(editingCat.id, updates)
    } else {
      await createCategory(dataOrId)
    }
    setFormOpen(false)
    setEditingCat(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const renderCategoryList = (list, type) => {
    if (list.length === 0) {
      return (
        <p className={styles.emptyType}>
          لا توجد تصنيفات {type === 'income' ? 'دخل' : 'مصروف'} بعد
        </p>
      )
    }

    return (
      <ul className={styles.list}>
        {list.map((cat) => {
          const count = txnCountByCategory[cat.id] || 0
          return (
            <li key={cat.id} className={styles.item}>
              <CategoryIcon category={cat} size={38} />
              <div className={styles.info}>
                <span className={styles.name}>{cat.name}</span>
                <span className={styles.count}>
                  {count} {count === 1 ? 'معاملة' : 'معاملة'}
                </span>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.edit}`}
                  onClick={() => handleOpenEdit(cat)}
                  title="تعديل"
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.danger}`}
                  onClick={() => setDeleteTarget(cat)}
                  title="حذف"
                >
                  <DeleteIcon />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>إدارة التصنيفات</h3>
      </div>

      {/* تصنيفات المصاريف */}
      <div className={styles.group}>
        <div className={styles.groupHeader}>
          <h4 className={styles.groupTitle}>
            <span className={styles.badgeExpense}>💸</span>
            المصاريف ({expenseCats.length})
          </h4>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => handleOpenAdd('expense')}
          >
            + إضافة
          </button>
        </div>
        {renderCategoryList(expenseCats, 'expense')}
      </div>

      {/* تصنيفات الدخل */}
      <div className={styles.group}>
        <div className={styles.groupHeader}>
          <h4 className={styles.groupTitle}>
            <span className={styles.badgeIncome}>💰</span>
            الدخل ({incomeCats.length})
          </h4>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => handleOpenAdd('income')}
          >
            + إضافة
          </button>
        </div>
        {renderCategoryList(incomeCats, 'income')}
      </div>

      <CategoryFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingCat(null)
        }}
        onConfirm={handleSubmit}
        initial={editingCat?.id ? editingCat : null}
        defaultType={editingCat?.defaultType || 'expense'}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف التصنيف؟"
        message={`سيتم حذف "${deleteTarget?.name}". لا يمكن الحذف لو فيه معاملات مرتبطة.`}
        confirmLabel={isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
        cancelLabel="إلغاء"
        danger
      />
    </section>
  )
}

export default CategoriesSection
