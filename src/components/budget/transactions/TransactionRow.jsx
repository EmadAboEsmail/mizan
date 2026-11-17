import { memo } from 'react'
import { ChevronDown, Pencil, Trash2, Calendar } from 'lucide-react'
import CategoryIcon from '@/components/budget/CategoryIcon.jsx'
import { formatAmount, formatDate } from './lib/transactionsHelpers.js'
import styles from './TransactionRow.module.scss'

const TransactionRow = memo(function TransactionRow({
  txn,
  category,
  onEdit,
  onDelete,
  isExpanded = false,
  onToggle,
}) {
  const isIncome = txn.type === 'income'
  const subtitle = txn.details || txn.description || null

  const handleRowClick = () => {
    onToggle?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRowClick()
    }
  }

  return (
    <div
      className={`${styles.rowWrapper} ${
        isExpanded ? styles.rowWrapperOpen : ''
      }`}
    >
      <div
        className={styles.row}
        onClick={handleRowClick}
        onKeyDown={handleKeyDown}
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
            {isIncome ? '+' : '−'}
            {formatAmount(txn.amount)}
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
                onDelete(txn)
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
