import { useState } from 'react'
import { useZekrData } from '@/context/ZekrDataContext'
import SettingsSection from './SettingsSection.jsx'
import GroupFormModal from './GroupFormModal.jsx'
import GroupEditorModal from './GroupEditorModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './GroupsSection.module.scss'

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const DeleteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

function GroupsSection() {
  // ✅ الـ context مباشرة — بدون props
  const {
    groups,
    allAdhkar,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleAddGroupItem,
    handleUpdateGroupItem,
    handleDeleteGroupItem,
  } = useZekrData()

  const [formMode, setFormMode] = useState(null) // null | 'add' | { editing: group }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editorGroupId, setEditorGroupId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const editorGroup = groups.find((g) => g.id === editorGroupId)

  const handleAdd = async (name, description) => {
    await handleAddGroup(name, description)
    setFormMode(null)
  }

  const handleUpdate = async (name, description) => {
    await handleUpdateGroup(formMode.editing.id, name, description)
    setFormMode(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await handleDeleteGroup(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      console.error('فشل حذف المجموعة:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <SettingsSection id="groups" title={`المجموعات (${groups.length})`}>
      <div className={styles.container}>
        {/* شريط الإجراءات العلوي */}
        <div className={styles.topBar}>
          <p className={styles.hint}>
            رتّب أذكارك في مجموعات (مثل: أذكار الصباح، بعد الصلاة) لتكرارها تلقائياً.
          </p>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setFormMode('add')}
          >
            <span>+</span>
            <span>مجموعة جديدة</span>
          </button>
        </div>

        {/* عرض المجموعات */}
        {groups.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>📂</div>
            <p className={styles.emptyTitle}>لا توجد مجموعات حتى الآن</p>
            <p className={styles.emptySub}>
              أنشئ مجموعتك الأولى واجمع أذكارك المفضلة للورد اليومي.
            </p>
          </div>
        ) : (
          <ul className={styles.list}>
            {groups.map((g) => {
              const count = g.items?.length ?? 0
              return (
                <li key={g.id} className={styles.item}>
                  <button
                    type="button"
                    className={styles.mainClickable}
                    onClick={() => setEditorGroupId(g.id)}
                    title="اضغط لترتيب وتعديل أذكار المجموعة"
                  >
                    <div className={styles.folderBadge}>
                      <FolderIcon />
                    </div>

                    <div className={styles.info}>
                      <div className={styles.titleLine}>
                        <span className={styles.name}>{g.name}</span>
                        <span className={styles.countBadge}>
                          {count === 0 ? 'فارغة' : `${count} ${count > 10 ? 'ذكر' : 'أذكار'}`}
                        </span>
                      </div>

                      {g.description && (
                        <p className={styles.description}>{g.description}</p>
                      )}
                    </div>

                    <span className={styles.openArrow}>
                      <ArrowLeftIcon />
                    </span>
                  </button>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.edit}`}
                      onClick={() => setFormMode({ editing: g })}
                      title="تعديل الاسم والوصف"
                      aria-label={`تعديل مجموعة ${g.name}`}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={() => setDeleteTarget(g)}
                      title="حذف المجموعة"
                      aria-label={`حذف مجموعة ${g.name}`}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* نافذة إضافة / تعديل الاسم والوصف */}
      <GroupFormModal
        isOpen={formMode === 'add' || formMode?.editing != null}
        onClose={() => setFormMode(null)}
        onConfirm={formMode === 'add' ? handleAdd : handleUpdate}
        initial={formMode?.editing ?? null}
      />

      {/* نافذة تأكيد الحذف */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المجموعة؟"
        message={`سيتم حذف مجموعة "${deleteTarget?.name}" وكل محتوياتها نهائياً.`}
        confirmLabel={isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
        cancelLabel="إلغاء"
        danger
      />

      {/* نافذة تحرير محتوى وترتيب الأذكار */}
      <GroupEditorModal
        isOpen={editorGroupId !== null}
        onClose={() => setEditorGroupId(null)}
        group={editorGroup}
        allAdhkar={allAdhkar}
        onAddItem={handleAddGroupItem}
        onUpdateItem={handleUpdateGroupItem}
        onDeleteItem={handleDeleteGroupItem}
      />
    </SettingsSection>
  )
}

export default GroupsSection
