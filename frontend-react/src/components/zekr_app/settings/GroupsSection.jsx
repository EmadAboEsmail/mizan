import { useState } from 'react'
import SettingsSection from './SettingsSection.jsx'
import GroupFormModal from './GroupFormModal.jsx'
import GroupEditorModal from './GroupEditorModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './GroupsSection.module.scss'

function GroupsSection({
  groups,
  onAdd,
  onUpdate,
  onDelete,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  allAdhkar,
}) {
  const [formMode, setFormMode] = useState(null) // null | 'add' | { editing: group }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editorGroupId, setEditorGroupId] = useState(null)

  const editorGroup = groups.find((g) => g.id === editorGroupId)

  const handleAdd = async (name, description) => {
    await onAdd(name, description)
    setFormMode(null)
  }

  const handleUpdate = async (name, description) => {
    await onUpdate(formMode.editing.id, name, description)
    setFormMode(null)
  }

  const handleDelete = async () => {
    await onDelete(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <SettingsSection title="المجموعات">
      {groups.length === 0 ? (
        <p className={styles.empty}>لا توجد مجموعات بعد</p>
      ) : (
        <ul className={styles.list}>
          {groups.map((g) => (
            <li key={g.id} className={styles.item}>
              <button
                className={styles.groupBtn}
                onClick={() => setEditorGroupId(g.id)}
              >
                <span className={styles.groupName}>{g.name}</span>
                <span className={styles.groupCount}>
                  {g.items?.length ?? 0} ذكر
                </span>
              </button>

              <div className={styles.actions}>
                <button
                  className={styles.action}
                  onClick={() => setFormMode({ editing: g })}
                  aria-label="تعديل"
                >
                  ✏️
                </button>
                <button
                  className={`${styles.action} ${styles.danger}`}
                  onClick={() => setDeleteTarget(g)}
                  aria-label="حذف"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button className={styles.addBtn} onClick={() => setFormMode('add')}>
        + إضافة مجموعة
      </button>

      <GroupFormModal
        isOpen={formMode === 'add' || formMode?.editing != null}
        onClose={() => setFormMode(null)}
        onConfirm={formMode === 'add' ? handleAdd : handleUpdate}
        initial={formMode?.editing ?? null}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المجموعة؟"
        message={`سيتم حذف "${deleteTarget?.name}" وكل أذكارها. لا يمكن التراجع.`}
        confirmLabel="نعم، احذف"
        cancelLabel="إلغاء"
        danger
      />

      <GroupEditorModal
        isOpen={editorGroupId !== null}
        onClose={() => setEditorGroupId(null)}
        group={editorGroup}
        allAdhkar={allAdhkar}
        onAddItem={onAddItem}
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
      />
    </SettingsSection>
  )
}

export default GroupsSection
