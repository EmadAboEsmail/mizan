import { useState, useMemo } from 'react'
import { useZekrData } from '@/context/ZekrDataContext'
import SettingsSection from './SettingsSection.jsx'
import AdhkarFormModal from './AdhkarFormModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './AdhkarSection.module.scss'

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

function AdhkarSection() {
  // ✅ الـ context مباشرة — بدون props
  const {
    allAdhkar,
    handleAddAdhkar,
    handleUpdateAdhkar,
    handleDeleteAdhkar,
  } = useZekrData()

  const [formMode, setFormMode] = useState(null) // null | 'add' | { editing: zekr }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch] = useState('')

  // فلترة الأذكار بالبحث
  const filteredAdhkar = useMemo(() => {
    if (!search.trim()) return allAdhkar
    return allAdhkar.filter((z) =>
      z.text.toLowerCase().includes(search.trim().toLowerCase())
    )
  }, [allAdhkar, search])

  const handleAdd = async (text, target) => {
    await handleAddAdhkar(text, target)
    setFormMode(null)
  }

  const handleUpdate = async (text, target) => {
    await handleUpdateAdhkar(formMode.editing.id, text, target)
    setFormMode(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await handleDeleteAdhkar(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      console.error('فشل حذف الذكر:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <SettingsSection id="adhkar" title={`الأذكار (${allAdhkar.length})`}>
      <div className={styles.sectionContainer}>
        {/* شريط الإجراءات العلوي: زر الإضافة وشريط البحث */}
        <div className={styles.topBar}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setFormMode('add')}
          >
            <span>+</span>
            <span>إضافة ذكر جديد</span>
          </button>

          {allAdhkar.length > 4 && (
            <input
              type="text"
              className={styles.searchInput}
              placeholder="بحث في الأذكار..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>

        {/* قائمة الأذكار */}
        {filteredAdhkar.length > 0 ? (
          <ul className={styles.list}>
            {filteredAdhkar.map((z) => (
              <li key={z.id} className={styles.item}>
                <div className={styles.info}>
                  <span className={styles.text}>{z.text}</span>
                  {z.default_target ? (
                    <span className={styles.targetBadge}>
                      🎯 الهدف: {z.default_target.toLocaleString('en')}
                    </span>
                  ) : (
                    <span className={styles.noTargetBadge}>مفتوح</span>
                  )}
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.edit}`}
                    onClick={() => setFormMode({ editing: z })}
                    title="تعديل"
                    aria-label={`تعديل ${z.text}`}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.danger}`}
                    onClick={() => setDeleteTarget(z)}
                    title="حذف"
                    aria-label={`حذف ${z.text}`}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📿</div>
            <p className={styles.emptyText}>
              {search ? 'لا توجد أذكار تطابق بحثك' : 'لم تقم بإضافة أي أذكار بعد'}
            </p>
          </div>
        )}
      </div>

      {/* نوافذ الإدخال والتأكيد */}
      <AdhkarFormModal
        isOpen={formMode === 'add' || formMode?.editing != null}
        onClose={() => setFormMode(null)}
        onConfirm={formMode === 'add' ? handleAdd : handleUpdate}
        initial={formMode?.editing ?? null}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف الذكر؟"
        message={`سيتم حذف "${deleteTarget?.text}" نهائياً مع كافة الأعداد والإحصائيات الخاصة به.`}
        confirmLabel={isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
        cancelLabel="إلغاء"
        danger
      />
    </SettingsSection>
  )
}

export default AdhkarSection
