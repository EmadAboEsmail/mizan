import { memo } from 'react'
import CategoryIcon from '@/components/budget/CategoryIcon.jsx'
import { formatAmount, formatDayHeader } from './transactionsHelpers.js'
import styles from './TransactionRow.module.scss'

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

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

const TransactionRow = memo(function TransactionRow({
  txn,
  category,
  onEdit,
  onDelete,
  isExpanded = false,
  onToggle,
}) {
  const hasMore = !!(txn.details || txn.description)
  const showExpanded = isExpanded && hasMore
  const isIncome = txn.type === 'income'

  const handleRowClick = () => {
    if (hasMore && onToggle) onToggle()
  }

  const handleKeyDown = (e) => {
    if (!hasMore) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRowClick()
    }
  }

  return (
    <div className={styles.itemWrapper}>
      <div
        className={`${styles.item} ${showExpanded ? styles.itemExpanded : ''} ${hasMore ? styles.itemClickable : ''}`}
        onClick={handleRowClick}
        onKeyDown={handleKeyDown}
        role={hasMore ? 'button' : undefined}
        tabIndex={hasMore ? 0 : undefined}
        aria-expanded={hasMore ? showExpanded : undefined}
      >
        <CategoryIcon category={category} size={42} />

        <div className={styles.itemInfo}>
          <div className={styles.itemTop}>
            <span className={styles.itemCategory}>
              {category?.name || 'غير محدد'}
            </span>
            <span className={`${styles.itemAmount} ${isIncome ? styles.amountIncome : styles.amountExpense}`}>
              {isIncome ? '+' : '−'}
              {formatAmount(txn.amount)}
            </span>
          </div>
          <div className={styles.itemBottom}>
            <span className={styles.itemDesc}>
              {txn.description || txn.details || '—'}
            </span>
            <span className={styles.itemDate}>{formatDayHeader(txn.date)}</span>
          </div>
        </div>

        {hasMore && (
          <span className={`${styles.chevron} ${showExpanded ? styles.chevronOpen : ''}`}>
            <ChevronIcon />
          </span>
        )}
      </div>

      {showExpanded && (
        <div className={styles.expandedContent}>
          {txn.details && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>📝 تفاصيل</span>
              <span className={styles.detailValue}>{txn.details}</span>
            </div>
          )}
          {txn.description && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>📄 وصف</span>
              <span className={styles.detailValue}>{txn.description}</span>
            </div>
          )}

          <div className={styles.expandedActions}>
            <button
              type="button"
              className={styles.expandEditBtn}
              onClick={(e) => {
                e.stopPropagation()
                onEdit(txn)
              }}
            >
              <EditIcon />
              <span>تعديل</span>
            </button>
            <button
              type="button"
              className={styles.expandDeleteBtn}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(txn)
              }}
            >
              <DeleteIcon />
              <span>حذف</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export default TransactionRow
