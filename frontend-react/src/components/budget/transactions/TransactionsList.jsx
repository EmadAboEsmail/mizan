import { memo } from 'react'
import { VariableSizeList as VirtualList } from 'react-window'
import TransactionRow from './TransactionRow.jsx'
import { formatAmount, formatDayHeader } from './transactionsHelpers.js'
import styles from './TransactionsList.module.scss'
import EmptyState from '../../ui/EmptyState.jsx'

// ═══════════════════════════════════════
// VirtualRow (header أو transaction)
// ═══════════════════════════════════════
const VirtualTransactionRow = memo(function VirtualTransactionRow({
  index,
  style,
  data,
}) {
  const { items, catMap, onEdit, onDelete, expandedId, onToggle } = data
  const item = items[index]

  if (!item) return null

  // ─── Date Header ───
  if (item.type === 'header') {
    const isPositive = item.total >= 0
    return (
      <div style={style}>
        <div className={styles.dateHeader}>
          <div className={styles.dateLeft}>
            <span className={styles.dateLabel}>{formatDayHeader(item.date)}</span>
            <span className={styles.dateCount}>
              {item.count} {item.count === 1 ? 'معاملة' : 'معاملات'}
            </span>
          </div>
          <span
            className={`${styles.dateTotal} ${isPositive ? styles.datePositive : styles.dateNegative}`}
          >
            {isPositive ? '+' : '−'}
            {formatAmount(Math.abs(item.total))}
          </span>
        </div>
      </div>
    )
  }

  // ─── Transaction ───
  const { txn } = item
  return (
    <div style={style}>
      <div className={styles.virtualRowInner}>
        <TransactionRow
          txn={txn}
          category={catMap[txn.category_id]}
          onEdit={onEdit}
          onDelete={onDelete}
          isExpanded={expandedId === txn.id}
          onToggle={() => onToggle(txn.id)}
        />
      </div>
    </div>
  )
})

// ═══════════════════════════════════════
// Empty State
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// Main List
// ═══════════════════════════════════════
export default function TransactionsList({
  items,
  catMap,
  expandedId,
  onToggle,
  onEdit,
  onDelete,
  onAdd,
  listHeight,
  listWidth,
  listRef,
  listContainerRef,
  getItemSize,
  virtualData,
  totalTransactions,
  currentMonth,
}) {
  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={totalTransactions === 0 ? '📭' : '🔍'}
        title={
          totalTransactions === 0
            ? currentMonth === null
              ? 'لا توجد معاملات بعد'
              : 'لا توجد معاملات في هذا الشهر'
            : 'لا توجد نتائج تطابق الفلتر'
        }
        subtitle={
          totalTransactions === 0
            ? currentMonth === null
              ? 'ابدأ بإضافة أول معاملة'
              : 'جرّب شهراً آخر أو اعرض كل الفترات'
            : 'جرب تغيير الفلاتر أو البحث بكلمة مختلفة'
        }
        action={totalTransactions === 0 ? onAdd : undefined}
        actionLabel="إضافة أول معاملة"
        variant="default"
      />
    )
  }

  return (
    <div ref={listContainerRef} className={styles.listContainer}>
      {listWidth > 0 && (
        <VirtualList
          ref={listRef}
          height={listHeight}
          itemCount={items.length}
          itemSize={getItemSize}
          width={listWidth}
          itemData={virtualData}
          overscanCount={5}
          className={styles.virtualList}
        >
          {VirtualTransactionRow}
        </VirtualList>
      )}
    </div>
  )
}
