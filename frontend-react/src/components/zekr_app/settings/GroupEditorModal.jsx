import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal.jsx'
import styles from './GroupEditorModal.module.scss'

function GroupEditorModal({
  isOpen,
  onClose,
  group,
  allAdhkar = [],
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) {
  // state محلي لتعديل الهدف
  const [editingTargetId, setEditingTargetId] = useState(null)
  const [tempTarget, setTempTarget] = useState('')

  // إعادة تعيين عند الإغلاق
  useEffect(() => {
    if (!isOpen) {
      setEditingTargetId(null)
      setTempTarget('')
    }
  }, [isOpen])

  if (!group) return null

  // الأذكار المتاحة (مش في المجموعة)
  const usedIds = new Set(group.items.map((i) => i.zekr_id))
  const availableAdhkar = allAdhkar.filter((z) => !usedIds.has(z.id))

  // ===========================
  // Handlers
  // ===========================

  const handleAdd = async (zekr_id) => {
    const zekr = allAdhkar.find((z) => z.id === zekr_id)
    const target = zekr?.default_target ?? null
    await onAddItem(group.id, zekr_id, target)
  }

  const handleDelete = async (itemId) => {
    await onDeleteItem(group.id, itemId)
  }

  // ترتيب: فوق
  const handleMoveUp = async (item, index) => {
    if (index === 0) return
    const prev = group.items[index - 1]

    // نبدّل الـ positions
    await onUpdateItem(group.id, item.id, { position: prev.position })
    await onUpdateItem(group.id, prev.id, { position: item.position })
  }

  // ترتيب: تحت
  const handleMoveDown = async (item, index) => {
    if (index === group.items.length - 1) return
    const next = group.items[index + 1]

    await onUpdateItem(group.id, item.id, { position: next.position })
    await onUpdateItem(group.id, next.id, { position: item.position })
  }

  // تعديل الهدف
  const handleEditTarget = (item) => {
    setEditingTargetId(item.id)
    setTempTarget(String(item.target ?? item.default_target ?? ''))
  }

  const handleSaveTarget = async (item) => {
    const num = Number(tempTarget)
    if (isNaN(num) || num < 1 || num > 10000) {
      alert('الرجاء إدخال رقم صحيح بين 1 و 10000')
      return
    }
    await onUpdateItem(group.id, item.id, { target: num })
    setEditingTargetId(null)
    setTempTarget('')
  }

  const handleCancelTarget = () => {
    setEditingTargetId(null)
    setTempTarget('')
  }

  const handleTargetKeyDown = (e, item) => {
    if (e.key === 'Enter') handleSaveTarget(item)
    if (e.key === 'Escape') handleCancelTarget()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={group.name}>
      <div className={styles.body}>
        {group.description && (
          <p className={styles.description}>{group.description}</p>
        )}

        {/* ===========================
            أذكار المجموعة
        =========================== */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            الأذكار ({group.items.length})
          </h4>

          {group.items.length === 0 ? (
            <p className={styles.empty}>لا توجد أذكار بعد</p>
          ) : (
            <ul className={styles.itemsList}>
              {group.items.map((item, index) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemPosition}>{index + 1}</div>

                  <div className={styles.itemInfo}>
                    <div className={styles.itemText}>{item.text}</div>

                    {editingTargetId === item.id ? (
                      <div className={styles.targetEdit}>
                        <input
                          className={styles.targetInput}
                          type="number"
                          value={tempTarget}
                          onChange={(e) => setTempTarget(e.target.value)}
                          onKeyDown={(e) => handleTargetKeyDown(e, item)}
                          autoFocus
                          min={1}
                          max={10000}
                        />
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleSaveTarget(item)}
                          aria-label="حفظ"
                        >
                          ✓
                        </button>
                        <button
                          className={styles.cancelBtn}
                          onClick={handleCancelTarget}
                          aria-label="إلغاء"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        className={styles.targetDisplay}
                        onClick={() => handleEditTarget(item)}
                      >
                        الهدف: {item.target ?? item.default_target ?? '—'}
                      </button>
                    )}
                  </div>

                  <div className={styles.itemActions}>
                    <button
                      className={styles.moveBtn}
                      onClick={() => handleMoveUp(item, index)}
                      disabled={index === 0}
                      aria-label="فوق"
                    >
                      ↑
                    </button>
                    <button
                      className={styles.moveBtn}
                      onClick={() => handleMoveDown(item, index)}
                      disabled={index === group.items.length - 1}
                      aria-label="تحت"
                    >
                      ↓
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(item.id)}
                      aria-label="حذف"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ===========================
            الأذكار المتاحة
        =========================== */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            الأذكار المتاحة ({availableAdhkar.length})
          </h4>

          {availableAdhkar.length === 0 ? (
            <p className={styles.empty}>كل الأذكار مضافة بالفعل</p>
          ) : (
            <ul className={styles.itemsList}>
              {availableAdhkar.map((zekr) => (
                <li key={zekr.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemText}>{zekr.text}</div>
                  </div>
                  <button
                    className={styles.addBtn}
                    onClick={() => handleAdd(zekr.id)}
                    aria-label="إضافة"
                  >
                    +
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default GroupEditorModal
