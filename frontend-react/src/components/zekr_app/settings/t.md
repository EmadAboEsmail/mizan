import SettingsSection from './SettingsSection.jsx'
import styles from './AboutSection.module.scss'

function AboutSection() {
  return (
    <SettingsSection title="عن التطبيق">
      <div className={styles.row}>
        <span className={styles.label}>الاسم</span>
        <span className={styles.value}>ذِكر</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>الإصدار</span>
        <span className={styles.value}>1.0.0</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>الوصف</span>
        <span className={styles.value}>سبحة إلكترونية بأذكار متنوعة</span>
      </div>
    </SettingsSection>
  )
}

export default AboutSection
@use '@/styles/variables' as *;

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 0.95rem;
}

.label {
  color: $text-display-light;
  opacity: 0.7;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}

.value {
  color: $text-display-light;
  font-weight: bold;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}
import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal.jsx'
import styles from './AdhkarFormModal.module.scss'

function AdhkarFormModal({ isOpen, onClose, onConfirm, initial = null }) {
  const [text, setText] = useState('')
  const [target, setTarget] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setText(initial?.text ?? '')
      setTarget(initial?.default_target ?? '')
      setError('')
    }
  }, [isOpen, initial])

  const handleConfirm = () => {
    const trimmedText = text.trim()
    if (!trimmedText) {
      setError('الرجاء إدخال نص الذكر')
      return
    }

    let targetValue = null
    if (target !== '') {
      const num = Number(target)
      if (isNaN(num) || num < 1 || num > 10000) {
        setError('الهدف يجب أن يكون بين 1 و 10000')
        return
      }
      targetValue = num
    }

    onConfirm(trimmedText, targetValue)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'تعديل الذكر' : 'إضافة ذكر'}
    >
      <label className={styles.label}>
        نص الذكر
        <input
          className={styles.input}
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError('')
          }}
          autoFocus
        />
      </label>

      <label className={styles.label}>
        الهدف (اختياري)
        <input
          className={styles.input}
          type="number"
          value={target}
          onChange={(e) => {
            setTarget(e.target.value)
            setError('')
          }}
          placeholder="اتركه فارغًا لذكر بدون هدف"
          min={1}
          max={10000}
        />
      </label>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttons}>
        <button className={styles.cancel} onClick={onClose}>
          إلغاء
        </button>
        <button className={styles.confirm} onClick={handleConfirm}>
          {initial ? 'حفظ' : 'إضافة'}
        </button>
      </div>
    </Modal>
  )
}

export default AdhkarFormModal
@use '@/styles/variables' as *;

.label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: $text-display-light;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}

.input {
  width: 100%;
  padding: 10px 12px;
  font-size: 1rem;
  font-family: $font-main;
  background-color: $bg-display-light;
  border: 1px solid $border-light;
  border-radius: $border-radius;
  color: $text-display-light;
  outline: none;
  transition: border-color $transition;

  :global(body.dark) & {
    background-color: $bg-display-dark;
    border-color: $border-dark;
    color: $text-display-dark;
  }

  &:focus {
    border-color: $text-light;

    :global(body.dark) & {
      border-color: $text-dark;
    }
  }
}

.error {
  font-size: 0.9rem;
  color: #d32f2f;
  text-align: center;
}

.buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.cancel,
.confirm {
  flex: 1;
  padding: 10px;
  font-size: 1rem;
  font-family: $font-main;
  border-radius: $border-radius;
  cursor: pointer;
  transition: transform $transition, opacity $transition;

  &:active {
    transform: scale(0.95);
  }
}

.cancel {
  background-color: transparent;
  border: 1px solid $border-light;
  color: $text-display-light;

  :global(body.dark) & {
    border-color: $border-dark;
    color: $text-display-dark;
  }

  &:hover {
    background-color: $bg-btn-hover-light;

    :global(body.dark) & {
      background-color: $bg-btn-hover-dark;
    }
  }
}

.confirm {
  background-color: $text-light;
  border: 1px solid $text-light;
  color: white;

  :global(body.dark) & {
    background-color: $text-dark;
    border-color: $text-dark;
    color: #111;
  }

  &:hover {
    opacity: 0.9;
  }
}
import { useState } from 'react'
import SettingsSection from './SettingsSection.jsx'
import AdhkarFormModal from './AdhkarFormModal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
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
@use '@/styles/variables' as *;

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: $bg-btn-light;
  border-radius: calc(#{$border-radius} - 2px);
  gap: 8px;

  :global(body.dark) & {
    background-color: $bg-btn-dark;
  }
}

.text {
  flex: 1;
  font-size: 0.95rem;
  color: $text-display-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}

.actions {
  display: flex;
  gap: 4px;
}

.action {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color $transition;

  &:hover {
    background-color: $bg-btn-hover-light;

    :global(body.dark) & {
      background-color: $bg-btn-hover-dark;
    }
  }
}

.danger:hover {
  background-color: #ffcdd2;

  :global(body.dark) & {
    background-color: #5a2424;
  }
}

.addBtn {
  width: 100%;
  padding: 10px;
  font-size: 0.95rem;
  font-family: $font-main;
  background-color: $text-light;
  color: white;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  transition: opacity $transition, transform $transition;

  :global(body.dark) & {
    background-color: $text-dark;
    color: #111;
  }

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.98);
  }
}
import { useTheme } from '@/context/ThemeContext.jsx'
import SettingsSection from './SettingsSection.jsx'
import styles from './AppearanceSection.module.scss'

function AppearanceSection() {
  const { theme, toggleTheme } = useTheme()

  return (
    <SettingsSection title="المظهر">
      <div className={styles.row}>
        <span className={styles.label}>الثيم الحالي</span>
        <span className={styles.value}>
          {theme === 'dark' ? 'داكن 🌙' : 'فاتح ☀️'}
        </span>
      </div>

      <button className={styles.toggleBtn} onClick={toggleTheme}>
        التبديل إلى {theme === 'dark' ? 'الفاتح' : 'الداكن'}
      </button>
    </SettingsSection>
  )
}

export default AppearanceSection
@use '@/styles/variables' as *;

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 0.95rem;
}

.label {
  color: $text-display-light;
  opacity: 0.7;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}

.value {
  color: $text-display-light;
  font-weight: bold;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}

.toggleBtn {
  margin-top: 8px;
  padding: 10px 16px;
  font-size: 0.95rem;
  font-family: $font-main;
  background-color: $text-light;
  color: white;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  transition: opacity $transition, transform $transition;

  :global(body.dark) & {
    background-color: $text-dark;
    color: #111;
  }

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.97);
  }
}
import { useState } from 'react'
import SettingsSection from './SettingsSection.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './DataSection.module.scss'

function DataSection({ onDeleteCounts, onDeleteTargets, onDeleteClicks, onDeleteAll }) {
  const [confirm, setConfirm] = useState(null)  // null | 'counts' | 'targets' | 'clicks' | 'all'
  const [loading, setLoading] = useState(false)

  const openConfirm = (type) => setConfirm(type)
  const closeConfirm = () => setConfirm(null)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      if (confirm === 'counts') await onDeleteCounts()
      else if (confirm === 'targets') await onDeleteTargets()
      else if (confirm === 'clicks') await onDeleteClicks()
      else if (confirm === 'all') await onDeleteAll()

      closeConfirm()
    } catch (err) {
      console.error('فشل المسح:', err)
    } finally {
      setLoading(false)
    }
  }

  const CONFIRM_DATA = {
    counts: {
      title: 'مسح كل الأعداد؟',
      message: 'سيتم تصفير عدد كل الأذكار. لا يمكن التراجع.',
    },
    targets: {
      title: 'مسح كل الأهداف؟',
      message: 'سيتم حذف كل الأهداف المعدّلة والرجوع للافتراضي.',
    },
    clicks: {
      title: 'مسح كل الإحصائيات؟',
      message: 'سيتم حذف كل سجل الضغطات. لا يمكن التراجع.',
    },
    all: {
      title: 'مسح كل البيانات؟',
      message: 'سيتم مسح كل الأعداد والأهداف والإحصائيات. لا يمكن التراجع!',
    },
  }

  return (
    <SettingsSection title="البيانات">
      <button className={styles.btn} onClick={() => openConfirm('counts')}>
        مسح الأعداد الحالية
      </button>
      <button className={styles.btn} onClick={() => openConfirm('targets')}>
        مسح الأهداف المعدّلة
      </button>
      <button className={styles.btn} onClick={() => openConfirm('clicks')}>
        مسح الإحصائيات
      </button>
      <button
        className={`${styles.btn} ${styles.danger}`}
        onClick={() => openConfirm('all')}
      >
        مسح كل البيانات
      </button>

      <ConfirmModal
        isOpen={confirm !== null}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        title={confirm ? CONFIRM_DATA[confirm].title : ''}
        message={confirm ? CONFIRM_DATA[confirm].message : ''}
        confirmLabel={loading ? 'جاري...' : 'نعم، امسح'}
        cancelLabel="إلغاء"
        danger
      />
    </SettingsSection>
  )
}

export default DataSection
@use '@/styles/variables' as *;

.btn {
  width: 100%;
  padding: 10px 16px;
  font-size: 0.95rem;
  font-family: $font-main;
  background-color: $bg-btn-light;
  color: $text-display-light;
  border: 1px solid $border-light;
  border-radius: $border-radius;
  cursor: pointer;
  text-align: right;
  transition: background-color $transition, transform $transition;

  :global(body.dark) & {
    background-color: $bg-btn-dark;
    color: $text-display-dark;
    border-color: $border-dark;
  }

  &:hover {
    background-color: $bg-btn-hover-light;

    :global(body.dark) & {
      background-color: $bg-btn-hover-dark;
    }
  }

  &:active {
    transform: scale(0.98);
  }
}

.danger {
  background-color: #ffebee;
  border-color: #d32f2f;
  color: #d32f2f;

  :global(body.dark) & {
    background-color: #4a1c1c;
    border-color: #d32f2f;
    color: #ff8a80;
  }

  &:hover {
    background-color: #ffcdd2;

    :global(body.dark) & {
      background-color: #5a2424;
    }
  }
}
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
@use '@/styles/variables' as *;

.body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.description {
  font-size: 0.9rem;
  color: $text-display-light;
  opacity: 0.8;
  text-align: center;
  padding: 8px;
  background-color: $bg-display-light;
  border-radius: $border-radius;

  :global(body.dark) & {
    color: $text-display-dark;
    background-color: $bg-display-dark;
  }
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sectionTitle {
  font-size: 0.95rem;
  color: $text-light;
  font-weight: bold;

  :global(body.dark) & {
    color: $text-dark;
  }
}

.empty {
  text-align: center;
  padding: 16px;
  font-size: 0.9rem;
  color: $text-display-light;
  opacity: 0.6;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}

.itemsList {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: $bg-display-light;
  border: 1px solid $border-light;
  border-radius: $border-radius;

  :global(body.dark) & {
    background-color: $bg-display-dark;
    border-color: $border-dark;
  }
}

.itemPosition {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: $text-light;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  flex-shrink: 0;

  :global(body.dark) & {
    background-color: $text-dark;
    color: #111;
  }
}

.itemInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.itemText {
  font-size: 0.95rem;
  color: $text-display-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}

/* الهدف كزر */
.targetDisplay {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8rem;
  color: $text-display-light;
  opacity: 0.6;
  cursor: pointer;
  text-align: right;
  align-self: flex-start;
  transition: opacity $transition;

  :global(body.dark) & {
    color: $text-display-dark;
  }

  &:hover {
    opacity: 1;
    text-decoration: underline;
  }
}

/* تعديل الهدف */
.targetEdit {
  display: flex;
  gap: 4px;
  align-items: center;
}

.targetInput {
  width: 70px;
  padding: 4px 6px;
  font-size: 0.85rem;
  font-family: $font-main;
  background-color: $bg-btn-light;
  border: 1px solid $border-light;
  border-radius: 4px;
  color: $text-display-light;
  outline: none;
  text-align: center;

  :global(body.dark) & {
    background-color: $bg-btn-dark;
    border-color: $border-dark;
    color: $text-display-dark;
  }

  &:focus {
    border-color: $text-light;

    :global(body.dark) & {
      border-color: $text-dark;
    }
  }
}

.saveBtn,
.cancelBtn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color $transition;

  &:active {
    transform: scale(0.9);
  }
}

.saveBtn {
  background-color: #4caf50;
  color: white;

  &:hover {
    background-color: #43a047;
  }
}

.cancelBtn {
  background-color: #ddd;
  color: #555;

  :global(body.dark) & {
    background-color: #444;
    color: #ccc;
  }

  &:hover {
    background-color: #ccc;

    :global(body.dark) & {
      background-color: #555;
    }
  }
}

/* أزرار الإجراءات (↑ ↓ ✕) */
.itemActions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.moveBtn,
.deleteBtn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: transparent;
  border: 1px solid $border-light;
  color: $text-display-light;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color $transition, border-color $transition;

  :global(body.dark) & {
    border-color: $border-dark;
    color: $text-display-dark;
  }

  &:active:not(:disabled) {
    transform: scale(0.9);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.moveBtn:hover:not(:disabled) {
  background-color: $bg-btn-hover-light;
  border-color: $text-light;

  :global(body.dark) & {
    background-color: $bg-btn-hover-dark;
    border-color: $text-dark;
  }
}

.deleteBtn:hover {
  background-color: #ffcdd2;
  border-color: #d32f2f;
  color: #d32f2f;

  :global(body.dark) & {
    background-color: #5a2424;
    border-color: #d32f2f;
    color: #ff8a80;
  }
}

/* زر الإضافة (+) */
.addBtn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: $text-light;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity $transition, transform $transition;

  :global(body.dark) & {
    background-color: $text-dark;
    color: #111;
  }

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.9);
  }
}
import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal.jsx'
import styles from './GroupFormModal.module.scss'

function GroupFormModal({ isOpen, onClose, onConfirm, initial = null }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? '')
      setDescription(initial?.description ?? '')
      setError('')
    }
  }, [isOpen, initial])

  const handleConfirm = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('الرجاء إدخال اسم المجموعة')
      return
    }
    onConfirm(trimmed, description.trim() || null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'تعديل المجموعة' : 'إضافة مجموعة'}
    >
      <label className={styles.label}>
        الاسم
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </label>

      <label className={styles.label}>
        الوصف (اختياري)
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </label>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttons}>
        <button className={styles.cancel} onClick={onClose}>
          إلغاء
        </button>
        <button className={styles.confirm} onClick={handleConfirm}>
          {initial ? 'حفظ' : 'إضافة'}
        </button>
      </div>
    </Modal>
  )
}

export default GroupFormModal
@use '@/styles/variables' as *;

.label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: $text-display-light;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}

.input,
.textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 1rem;
  font-family: $font-main;
  background-color: $bg-display-light;
  border: 1px solid $border-light;
  border-radius: $border-radius;
  color: $text-display-light;
  outline: none;
  transition: border-color $transition;
  resize: vertical;

  :global(body.dark) & {
    background-color: $bg-display-dark;
    border-color: $border-dark;
    color: $text-display-dark;
  }

  &:focus {
    border-color: $text-light;

    :global(body.dark) & {
      border-color: $text-dark;
    }
  }
}

.error {
  font-size: 0.9rem;
  color: #d32f2f;
  text-align: center;
}

.buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.cancel,
.confirm {
  flex: 1;
  padding: 10px;
  font-size: 1rem;
  font-family: $font-main;
  border-radius: $border-radius;
  cursor: pointer;
  transition: transform $transition, opacity $transition;

  &:active {
    transform: scale(0.95);
  }
}

.cancel {
  background-color: transparent;
  border: 1px solid $border-light;
  color: $text-display-light;

  :global(body.dark) & {
    border-color: $border-dark;
    color: $text-display-dark;
  }

  &:hover {
    background-color: $bg-btn-hover-light;

    :global(body.dark) & {
      background-color: $bg-btn-hover-dark;
    }
  }
}

.confirm {
  background-color: $text-light;
  border: 1px solid $text-light;
  color: white;

  :global(body.dark) & {
    background-color: $text-dark;
    border-color: $text-dark;
    color: #111;
  }

  &:hover {
    opacity: 0.9;
  }
}
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
@use '@/styles/variables' as *;

.empty {
  text-align: center;
  padding: 16px;
  font-size: 0.9rem;
  color: $text-display-light;
  opacity: 0.6;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background-color: $bg-btn-light;
  border-radius: calc(#{$border-radius} - 2px);

  :global(body.dark) & {
    background-color: $bg-btn-dark;
  }
}

.groupBtn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: calc(#{$border-radius} - 4px);
  text-align: right;
  transition: background-color $transition;

  &:hover {
    background-color: $bg-btn-hover-light;

    :global(body.dark) & {
      background-color: $bg-btn-hover-dark;
    }
  }
}

.groupName {
  font-size: 0.95rem;
  font-weight: bold;
  color: $text-display-light;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}

.groupCount {
  font-size: 0.75rem;
  color: $text-display-light;
  opacity: 0.6;

  :global(body.dark) & {
    color: $text-display-dark;
  }
}

.actions {
  display: flex;
  gap: 4px;
}

.action {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color $transition;

  &:hover {
    background-color: $bg-btn-hover-light;

    :global(body.dark) & {
      background-color: $bg-btn-hover-dark;
    }
  }
}

.danger:hover {
  background-color: #ffcdd2;

  :global(body.dark) & {
    background-color: #5a2424;
  }
}

.addBtn {
  width: 100%;
  padding: 10px;
  font-size: 0.95rem;
  font-family: $font-main;
  background-color: $text-light;
  color: white;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  transition: opacity $transition, transform $transition;

  :global(body.dark) & {
    background-color: $text-dark;
    color: #111;
  }

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.98);
  }
}
import styles from './SettingsSection.module.scss'

function SettingsSection({ title, children }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.content}>{children}</div>
    </section>
  )
}

export default SettingsSection
@use '@/styles/variables' as *;

.section {
  padding: 16px;
  background-color: $bg-display-light;
  border: 1px solid $border-light;
  border-radius: $border-radius;

  :global(body.dark) & {
    background-color: $bg-display-dark;
    border-color: $border-dark;
  }
}

.title {
  font-size: 1rem;
  margin-bottom: 12px;
  color: $text-light;
  border-bottom: 1px solid $border-light;
  padding-bottom: 8px;

  :global(body.dark) & {
    color: $text-dark;
    border-color: $border-dark;
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
import SettingsSection from './SettingsSection.jsx'
import AppearanceSection from './AppearanceSection.jsx'
import AdhkarSection from './AdhkarSection.jsx'
import GroupsSection from './GroupsSection.jsx'
import DataSection from './DataSection.jsx'
import AboutSection from './AboutSection.jsx'
import styles from './SettingsTab.module.scss'

function SettingsTab({
  adhkar,
  onDeleteCounts,
  onDeleteTargets,
  onDeleteClicks,
  onDeleteAll,
  onAddAdhkar,
  onUpdateAdhkar,
  onDeleteAdhkar,
  groups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddGroupItem,
  onUpdateGroupItem,
  onDeleteGroupItem,
}) {
  return (
    <div className={styles.settings}>
      <AppearanceSection />

      <GroupsSection
        groups={groups}
        onAdd={onAddGroup}
        onUpdate={onUpdateGroup}
        onDelete={onDeleteGroup}
        onAddItem={onAddGroupItem}
        onUpdateItem={onUpdateGroupItem}
        onDeleteItem={onDeleteGroupItem}
        allAdhkar={adhkar}
      />

      <AdhkarSection
        adhkar={adhkar}
        onAdd={onAddAdhkar}
        onUpdate={onUpdateAdhkar}
        onDelete={onDeleteAdhkar}
      />

      <DataSection
        onDeleteCounts={onDeleteCounts}
        onDeleteTargets={onDeleteTargets}
        onDeleteClicks={onDeleteClicks}
        onDeleteAll={onDeleteAll}
      />

      <AboutSection />
    </div>
  )
}

export default SettingsTab
@use '@/styles/variables' as *;

.settings {
  display: flex;
  flex-direction: column;
  gap: $gap;
  padding: $padding 0;
}
