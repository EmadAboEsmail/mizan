import { memo, useRef, useState } from 'react'
import { ChevronDown, Pencil, Trash2, Calendar } from 'lucide-react'
import CategoryIcon from '@/components/budget/CategoryIcon.jsx'
import { usePrivacyMode, maskText } from '@/hooks/usePrivacyMode.js'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import { formatAmount, formatDate } from './lib/transactionsHelpers.js'
import styles from './TransactionRow.module.scss'

const ACTION_WIDTH = 132

const TransactionRow = memo(function TransactionRow({
  txn,
  category,
  onEdit,
  onDelete,
  isExpanded = false,
  onToggle,
}) {
  const { isPrivate } = usePrivacyMode()
  const isIncome = txn.type === 'income'
  const subtitle = txn.details || txn.description || null

  const [offsetX, setOffsetX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const touchRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    baseOffset: 0,
    locked: null,
    moved: false,
  })

  const handleTouchStart = (e) => {
    if (isExpanded) return
    const t = e.touches[0]
    touchRef.current = {
      active: true,
      startX: t.clientX,
      startY: t.clientY,
      baseOffset: offsetX,
      locked: null,
      moved: false,
    }
  }

  const handleTouchMove = (e) => {
    const s = touchRef.current
    if (!s.active) return
    const t = e.touches[0]
    const dx = t.clientX - s.startX
    const dy = t.clientY - s.startY

    if (!s.locked) {
      if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return
      s.locked = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y'
    }
    if (s.locked !== 'x') return

    s.moved = true
    setSwiping(true)
    // سحب لليمين (dx > 0) يكشف أزرار الإجراءات في جهة اليسار في RTL
    const raw = s.baseOffset + dx
    const clamped = Math.max(0, Math.min(ACTION_WIDTH + 18, raw))
    setOffsetX(clamped)
  }

  const handleTouchEnd = () => {
    const s = touchRef.current
    if (!s.active) return
    s.active = false
    setSwiping(false)

    if (s.locked !== 'x') return
    if (offsetX >= ACTION_WIDTH * 0.42) {
      if (s.baseOffset === 0) triggerHapticFeedback('light')
      setOffsetX(ACTION_WIDTH)
    } else {
      setOffsetX(0)
    }
  }

  const handleRowClick = () => {
    if (touchRef.current.moved) {
      touchRef.current.moved = false
      return
    }
    if (offsetX > 0) {
      setOffsetX(0)
      return
    }
    onToggle?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRowClick()
    }
  }

  const displayAmount = isPrivate
    ? maskText('')
    : `${isIncome ? '+' : '−'}${formatAmount(txn.amount)}`

  return (
    <div
      className={`${styles.rowWrapper} ${
        isExpanded ? styles.rowWrapperOpen : ''
      }`}
    >
      <div className={styles.swipeContainer}>
        {/* أزرار السحب الخلفية (تعديل / حذف) */}
        {!isExpanded && (
          <div
            className={`${styles.swipeActions} ${
              offsetX > 0 ? styles.swipeActionsVisible : ''
            }`}
            aria-hidden={offsetX === 0}
          >
            <button
              type="button"
              tabIndex={offsetX > 0 ? 0 : -1}
              className={styles.swipeEditBtn}
              onClick={(e) => {
                e.stopPropagation()
                setOffsetX(0)
                onEdit(txn)
              }}
              aria-label="تعديل المعاملة"
            >
              <Pencil size={15} strokeWidth={2.3} aria-hidden="true" />
              <span>تعديل</span>
            </button>
            <button
              type="button"
              tabIndex={offsetX > 0 ? 0 : -1}
              className={styles.swipeDeleteBtn}
              onClick={(e) => {
                e.stopPropagation()
                setOffsetX(0)
                triggerHapticFeedback('medium')
                onDelete(txn, { immediate: true })
              }}
              aria-label="حذف المعاملة"
            >
              <Trash2 size={15} strokeWidth={2.3} aria-hidden="true" />
              <span>حذف</span>
            </button>
          </div>
        )}

        <div
          className={styles.row}
          style={
            offsetX > 0 || swiping
              ? {
                  transform: `translateX(${offsetX}px)`,
                  transition: swiping
                    ? 'none'
                    : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
                }
              : undefined
          }
          onClick={handleRowClick}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
        >
          <CategoryIcon category={category} size={40} />

          <div className={styles.info}>
            <span className={styles.category}>
              {category?.name || 'غير محدد'}
            </span>
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </div>

          <div className={styles.end}>
            <span
              className={`${styles.amount} ${
                isIncome ? styles.amountIncome : styles.amountExpense
              }`}
            >
              {displayAmount}
            </span>
            <span
              className={`${styles.chevron} ${
                isExpanded ? styles.chevronOpen : ''
              }`}
              aria-hidden="true"
            >
              <ChevronDown size={15} strokeWidth={2.2} />
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.expanded}>
          <div className={styles.metaLine}>
            <Calendar size={13} strokeWidth={2} aria-hidden="true" />
            <span>{formatDate(txn.date)}</span>
            <span className={styles.dot}>·</span>
            <span>{isIncome ? 'دخل' : 'مصروف'}</span>
          </div>

          {txn.details && (
            <div className={styles.detailBlock}>
              <span className={styles.detailLabel}>تفاصيل</span>
              <p className={`${styles.detailText} selectable`}>{txn.details}</p>
            </div>
          )}

          {txn.description && (
            <div className={styles.detailBlock}>
              <span className={styles.detailLabel}>ملاحظات</span>
              <p className={`${styles.detailText} selectable`}>
                {txn.description}
              </p>
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.editBtn}
              onClick={(e) => {
                e.stopPropagation()
                onEdit(txn)
              }}
            >
              <Pencil size={14} strokeWidth={2.2} aria-hidden="true" />
              <span>تعديل</span>
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(txn, { immediate: true })
              }}
            >
              <Trash2 size={14} strokeWidth={2.2} aria-hidden="true" />
              <span>حذف</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export default TransactionRow
