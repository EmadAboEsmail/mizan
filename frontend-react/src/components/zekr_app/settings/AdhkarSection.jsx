import { useState } from 'react'
import SettingsSection from './SettingsSection.jsx'
import AdhkarFormModal from './AdhkarFormModal.jsx'
import ConfirmModal from '../ui/ConfirmModal.jsx'
import styles from './AdhkarSection.module.scss'

function AdhkarSection({
  adhkar,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [formMode, setFormMode] = useState(null) // null | 'add' | { editing: zekr }
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleAdd = async (text, target) => {
    await onAdd(text, target)
    setFormMode(null)
  }

  const handleUpdate = async (text, target) => {
    await onUpdate(formMode.editing.id, text, target)
    setFormMode(null)
  }

  const handleDelete = async () => {
    await onDelete(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <SettingsSection title="الأذكار">
      <ul className={styles.list}>
        {adhkar.map((z) => (
          <li key={z.id} className={styles.item}>
            <span className={styles.text}>{z.text}</span>
            <div className={styles.actions}>
              <button
                className={styles.action}
                onClick={() => setFormMode({ editing: z })}
                aria-label="تعديل"
              >
                ✏️
              </button>
              <button
                className={`${styles.action} ${styles.danger}`}
                onClick={() => setDeleteTarget(z)}
                aria-label="حذف"
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        className={styles.addBtn}
        onClick={() => setFormMode('add')}
      >
        + إضافة ذكر
      </button>

      <AdhkarFormModal
        isOpen={formMode === 'add' || (formMode?.editing != null)}
        onClose={() => setFormMode(null)}
        onConfirm={formMode === 'add' ? handleAdd : handleUpdate}
        initial={formMode?.editing ?? null}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف الذكر؟"
        message={`سيتم حذف "${deleteTarget?.text}" مع كل بياناته (الأعداد والأهداف والإحصائيات). لا يمكن التراجع.`}
        confirmLabel="نعم، احذف"
        cancelLabel="إلغاء"
        danger
      />
    </SettingsSection>
  )
}

export default AdhkarSection
