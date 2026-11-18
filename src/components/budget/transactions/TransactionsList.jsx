import { useState, useMemo } from 'react'
import { ReceiptText, SearchX } from 'lucide-react'
import TransactionRow from './TransactionRow.jsx'
import EmptyState from '@/components/ui/EmptyState.jsx'
import { usePrivacyMode, maskText } from '@/hooks/usePrivacyMode.js'
import {
  formatAmount,
  formatDayHeader,
  groupTransactionsByDay,
} from './lib/transactionsHelpers.js'
import styles from './TransactionsList.module.scss'

const PAGE_SIZE = 60

export default function TransactionsList({
  transactions,
  catMap,
  onAdd,
  onEdit,
  onDuplicate,
  onDelete,
  expandedId,
  onToggle,
  totalTransactions,
  currentMonth,
}) {
  const { isPrivate } = usePrivacyMode()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // إعادة ضبط العدد المعروض عند تغيير الشهر (أثناء الرسم)
  const [prevMonth, setPrevMonth] = useState(currentMonth)
  if (currentMonth !== prevMonth) {
    setPrevMonth(currentMonth)
    setVisibleCount(PAGE_SIZE)
  }

  const visibleTxns = useMemo(
    () => (transactions ? transactions.slice(0, visibleCount) : []),
    [transactions, visibleCount]
  )

  const dayGroups = useMemo(
    () => groupTransactionsByDay(visibleTxns),
    [visibleTxns]
  )

  if (!transactions || transactions.length === 0) {
    const isEmpty = totalTransactions === 0
    return (
      <EmptyState
        accent="budget"
        icon={
          isEmpty ? (
            <ReceiptText size={26} strokeWidth={1.8} />
          ) : (
            <SearchX size={26} strokeWidth={1.8} />
          )
        }
        title={
          isEmpty
            ? currentMonth === null
              ? 'لا توجد معاملات بعد'
              : 'لا توجد معاملات في هذا الشهر'
            : 'لا توجد نتائج مطابقة'
        }
        subtitle={
          isEmpty
            ? currentMonth === null
              ? 'سجّل أول دخل أو مصروف لتبدأ متابعة ميزانيتك.'
              : 'أضف معاملة جديدة أو تصفّح شهراً آخر من الأعلى.'
            : 'جرّب تعديل كلمة البحث أو اختيار تصنيف مختلف.'
        }
        action={isEmpty ? onAdd : undefined}
        actionLabel="إضافة معاملة"
      />
    )
  }

  const remaining = transactions.length - visibleTxns.length

  return (
    <div className={styles.groups}>
      {dayGroups.map((group) => {
        const isPos = group.total > 0
        const isNeg = group.total < 0
        return (
          <section key={group.date} className={styles.dayGroup}>
            <div className={styles.dayHeader}>
              <span className={styles.dayLabel}>
                {formatDayHeader(group.date)}
              </span>
              <span
                className={`${styles.dayTotal} ${
                  isPos
                    ? styles.dayPositive
                    : isNeg
                      ? styles.dayNegative
                      : ''
                }`}
              >
                {isPrivate
                  ? maskText('')
                  : `${isPos ? '+' : isNeg ? '−' : ''}${formatAmount(
                      Math.abs(group.total)
                    )}`}
              </span>
            </div>

            <div className={styles.dayCard}>
              {group.txns.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  txn={txn}
                  category={catMap[txn.category_id]}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  isExpanded={expandedId === txn.id}
                  onToggle={() => onToggle(txn.id)}
                />
              ))}
            </div>
          </section>
        )
      })}

      {remaining > 0 && (
        <button
          type="button"
          className={styles.loadMoreBtn}
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
        >
          عرض المزيد ({remaining.toLocaleString('en')} متبقية)
        </button>
      )}
    </div>
  )
}
