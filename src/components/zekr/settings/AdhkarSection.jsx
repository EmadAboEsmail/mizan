import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import {
  useAdhkarQuery,
  useCreateAdhkarMutation,
  useUpdateAdhkarMutation,
  useReorderAdhkarMutation,
  useDeleteAdhkarMutation,
} from '@/queries/zekr'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import SettingsSection from './SettingsSection.jsx'
import AdhkarFormModal from './AdhkarFormModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './AdhkarSection.module.scss'

const EMPTY_LIST = []

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

function AdhkarSection({ standalone = false }) {
  // ─── Query ───
  const { data: allAdhkar = EMPTY_LIST } = useAdhkarQuery()

  // ─── Mutations ───
  const { mutateAsync: createAdhkar } = useCreateAdhkarMutation()
  const { mutateAsync: updateAdhkar } = useUpdateAdhkarMutation()
  const { mutateAsync: reorderAdhkar } = useReorderAdhkarMutation()
  const { mutateAsync: deleteAdhkar, isPending: isDeleting } =
    useDeleteAdhkarMutation()

  // ─── UI State ───
  const [formMode, setFormMode] = useState(null) // null | 'add' | { editing: zekr }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')

  // فلترة الأذكار بالبحث
  const filteredAdhkar = useMemo(() => {
    if (!search.trim()) return allAdhkar
    return allAdhkar.filter((z) =>
      z.text.toLowerCase().includes(search.trim().toLowerCase())
    )
  }, [allAdhkar, search])

  const handleAdd = async (text, target, virtue = null) => {
    await createAdhkar({ text, defaultTarget: target, virtue })
    setFormMode(null)
  }

  const handleUpdate = async (text, target, virtue = null) => {
    await updateAdhkar({
      id: formMode.editing.id,
      text,
      defaultTarget: target,
      virtue,
    })
    setFormMode(null)
  }

  const canReorder = !search.trim() && allAdhkar.length > 1

  const handleMove = async (index, dir) => {
    const nextIdx = index + dir
    if (nextIdx < 0 || nextIdx >= allAdhkar.length) return
    const ids = allAdhkar.map((z) => z.id)
    ;[ids[index], ids[nextIdx]] = [ids[nextIdx], ids[index]]
    triggerHapticFeedback('light')
    await reorderAdhkar(ids)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteAdhkar(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      console.error('فشل حذف الذكر:', err)
    }
  }

  return (
    <SettingsSection standalone={standalone} id="adhkar" title={`الأذكار (${allAdhkar.length})`}>
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
            {filteredAdhkar.map((z, idx) => (
              <li key={z.id} className={styles.item}>
                <div className={styles.info}>
                  {z.text.length > 160 ? (
                    <details className={styles.longText}>
                      <summary>{z.text.slice(0, 110)}… عرض النص الكامل</summary>
                      <p className={styles.text}>{z.text}</p>
                    </details>
                  ) : <span className={styles.text}>{z.text}</span>}
                  {z.virtue && (
                    <span className={styles.virtueNote}>{z.virtue}</span>
                  )}
                  {z.default_target ? (
                    <span className={styles.targetBadge}>
                      🎯 الهدف: {z.default_target.toLocaleString('en')}
                    </span>
                  ) : (
                    <span className={styles.noTargetBadge}>مفتوح</span>
                  )}
                </div>

                <div className={styles.actions}>
                  {canReorder && (
                    <>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        title="تحريك لأعلى"
                        aria-label={`تحريك ${z.text} لأعلى`}
                      >
                        <ChevronUp size={15} strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === filteredAdhkar.length - 1}
                        title="تحريك لأسفل"
                        aria-label={`تحريك ${z.text} لأسفل`}
                      >
                        <ChevronDown size={15} strokeWidth={2.2} />
                      </button>
                    </>
                  )}
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
              {search
                ? 'لا توجد أذكار تطابق بحثك'
                : 'لم تقم بإضافة أي أذكار بعد'}
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
