import { useState, useEffect, useMemo } from 'react'
import Modal from '@/components/ui/Modal.jsx'
import styles from './GroupEditorModal.module.scss'

// أيقونات SVG خفيفة
const ArrowUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const ArrowDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

function GroupEditorModal({
  isOpen,
  onClose,
  group,
  allAdhkar = [],
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) {
  const [editingTargetId, setEditingTargetId] = useState(null)
  const [tempTarget, setTempTarget] = useState('')
  const [targetError, setTargetError] = useState('')
  const [searchAvailable, setSearchAvailable] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setEditingTargetId(null)
      setTempTarget('')
      setTargetError('')
      setSearchAvailable('')
      setBusyId(null)
    }
  }, [isOpen])

  // حماية آمنة لعناصر المجموعة
  const items = group?.items ?? []

  // استخراج الأذكار المتاحة وفلترتها بالبحث
  const usedIds = useMemo(() => new Set(items.map((i) => i.zekr_id)), [items])

  const filteredAvailableAdhkar = useMemo(() => {
    const available = allAdhkar.filter((z) => !usedIds.has(z.id))
    if (!searchAvailable.trim()) return available
    return available.filter((z) =>
      z.text.toLowerCase().includes(searchAvailable.trim().toLowerCase())
    )
  }, [allAdhkar, usedIds, searchAvailable])

  if (!group) return null

  // ===========================
  // Handlers
  // ===========================

  const handleAdd = async (zekr_id) => {
    setBusyId(`add-${zekr_id}`)
    try {
      const zekr = allAdhkar.find((z) => z.id === zekr_id)
      const target = zekr?.default_target ?? null
      await onAddItem(group.id, zekr_id, target)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (itemId) => {
    setBusyId(`del-${itemId}`)
    try {
      await onDeleteItem(group.id, itemId)
    } finally {
      setBusyId(null)
    }
  }

  const handleMoveUp = async (item, index) => {
    if (index === 0 || busyId) return
    const prev = items[index - 1]
    setBusyId(`move-${item.id}`)
    try {
      await onUpdateItem(group.id, item.id, { position: prev.position ?? index - 1 })
      await onUpdateItem(group.id, prev.id, { position: item.position ?? index })
    } finally {
      setBusyId(null)
    }
  }

  const handleMoveDown = async (item, index) => {
    if (index === items.length - 1 || busyId) return
    const next = items[index + 1]
    setBusyId(`move-${item.id}`)
    try {
      await onUpdateItem(group.id, item.id, { position: next.position ?? index + 1 })
      await onUpdateItem(group.id, next.id, { position: item.position ?? index })
    } finally {
      setBusyId(null)
    }
  }

  const handleEditTarget = (item) => {
    setEditingTargetId(item.id)
    setTempTarget(item.target != null ? String(item.target) : '')
    setTargetError('')
  }

  const handleSaveTarget = async (item) => {
    let finalTarget = null

    if (tempTarget.trim() !== '') {
      const num = Number(tempTarget)
      if (!Number.isInteger(num) || num < 1 || num > 10000) {
        setTargetError('بين 1 و 10,000')
        return
      }
      finalTarget = num
    }

    setBusyId(`target-${item.id}`)
    try {
      await onUpdateItem(group.id, item.id, { target: finalTarget })
      setEditingTargetId(null)
      setTempTarget('')
      setTargetError('')
    } finally {
      setBusyId(null)
    }
  }

  const handleCancelTarget = () => {
    setEditingTargetId(null)
    setTempTarget('')
    setTargetError('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={group.name}>
      <div className={styles.body}>
        {group.description && (
          <p className={styles.description}>{group.description}</p>
        )}

        {/* قسم أذكار المجموعة الحالية */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              أذكار المجموعة <span className={styles.badge}>{items.length}</span>
            </h4>
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyCard}>
              لا توجد أذكار مضافة لهذه المجموعة حتى الآن.
            </div>
          ) : (
            <ul className={styles.itemsList}>
              {items.map((item, index) => {
                const isCurrentBusy = busyId === `move-${item.id}` || busyId === `del-${item.id}`
                return (
                  <li
                    key={item.id}
                    className={`${styles.item} ${isCurrentBusy ? styles.isBusy : ''}`}
                  >
                    {/* رقم الترتيب */}
                    <div className={styles.positionBadge}>{index + 1}</div>

                    <div className={styles.itemInfo}>
                      <span className={styles.itemText}>{item.text}</span>

                      {/* تعديل الهدف أو عرضه */}
                      {editingTargetId === item.id ? (
                        <div className={styles.targetEditGroup}>
                          <input
                            className={`${styles.targetInput} ${targetError ? styles.hasError : ''}`}
                            type="number"
                            value={tempTarget}
                            onChange={(e) => {
                              setTempTarget(e.target.value)
                              if (targetError) setTargetError('')
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTarget(item)
                              if (e.key === 'Escape') handleCancelTarget()
                            }}
                            autoFocus
                            placeholder="افتراضي"
                            min={1}
                            max={10000}
                          />
                          <button
                            type="button"
                            className={styles.saveBtn}
                            onClick={() => handleSaveTarget(item)}
                            title="حفظ"
                          >
                            <CheckIcon />
                          </button>
                          <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={handleCancelTarget}
                            title="إلغاء"
                          >
                            <CloseIcon />
                          </button>
                          {targetError && (
                            <span className={styles.inlineError}>{targetError}</span>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={styles.targetDisplay}
                          onClick={() => handleEditTarget(item)}
                          title="اضغط لتعديل هدف هذا الذكر"
                        >
                          🎯 الهدف: {item.target ?? item.default_target ?? 'مفتوح'}
                        </button>
                      )}
                    </div>

                    {/* أزرار الترتيب والحذف */}
                    <div className={styles.itemActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handleMoveUp(item, index)}
                        disabled={index === 0 || !!busyId}
                        title="تحريك لأعلى"
                      >
                        <ArrowUpIcon />
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handleMoveDown(item, index)}
                        disabled={index === items.length - 1 || !!busyId}
                        title="تحريك لأسفل"
                      >
                        <ArrowDownIcon />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.danger}`}
                        onClick={() => handleDelete(item.id)}
                        disabled={!!busyId}
                        title="إزالة من المجموعة"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* قسم الأذكار المتاحة للإضافة */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              أذكار يمكنك إضافتها <span className={styles.badge}>{filteredAvailableAdhkar.length}</span>
            </h4>
          </div>

          {/* شريط البحث في الأذكار المتاحة */}
          {allAdhkar.length > 5 && (
            <input
              type="text"
              className={styles.searchInput}
              placeholder="ابحث عن ذكر لإضافته..."
              value={searchAvailable}
              onChange={(e) => setSearchAvailable(e.target.value)}
            />
          )}

          {filteredAvailableAdhkar.length === 0 ? (
            <p className={styles.emptyHint}>
              {searchAvailable ? 'لا توجد نتائج مطابقة' : 'جميع أذكارك مضافة بالفعل في هذه المجموعة.'}
            </p>
          ) : (
            <ul className={`${styles.itemsList} ${styles.scrollable}`}>
              {filteredAvailableAdhkar.map((zekr) => (
                <li key={zekr.id} className={styles.availableItem}>
                  <span className={styles.itemText}>{zekr.text}</span>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => handleAdd(zekr.id)}
                    disabled={busyId === `add-${zekr.id}`}
                    title="إضافة للمجموعة"
                  >
                    <PlusIcon />
                    <span>إضافة</span>
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
