import { formatAmount } from './transactionsHelpers.js'
import styles from './TransactionsSummary.module.scss'

export default function TransactionsSummary({ summary, insights, isAllMonths }) {
  if (!summary) return null

  const incomeChange = insights?.comparison?.income_change_percent
  const expenseChange = insights?.comparison?.expense_change_percent

  return (
    <>
      <div className={styles.summaryCards}>
        <div className={`${styles.summaryCard} ${styles.income}`}>
          <span className={styles.summaryLabel}>
            الدخل
            {incomeChange !== undefined && (
              <span
                className={`${styles.changeBadge} ${incomeChange >= 0 ? styles.up : styles.down
                  }`}
              >
                {incomeChange >= 0 ? '↑' : '↓'}
                {Math.abs(incomeChange).toFixed(0)}%
              </span>
            )}
          </span>
          <span className={styles.summaryValue}>
            {formatAmount(summary.total_income)}
          </span>
        </div>

        <div className={`${styles.summaryCard} ${styles.expense}`}>
          <span className={styles.summaryLabel}>
            المصروف
            {expenseChange !== undefined && (
              <span
                className={`${styles.changeBadge} ${expenseChange > 0 ? styles.down : styles.up
                  }`}
              >
                {expenseChange >= 0 ? '↑' : '↓'}
                {Math.abs(expenseChange).toFixed(0)}%
              </span>
            )}
          </span>
          <span className={styles.summaryValue}>
            {formatAmount(summary.total_expense)}
          </span>
        </div>

        <div
          className={`${styles.summaryCard} ${summary.net >= 0 ? styles.income : styles.expense
            }`}
        >
          <span className={styles.summaryLabel}>الصافي</span>
          <span className={styles.summaryValue}>{formatAmount(summary.net)}</span>
        </div>
      </div>

      {isAllMonths && (
        <p className={styles.allMonthsNote}>
          📊 إجمالي كل الفترات ({summary.transaction_count} معاملة)
        </p>
      )}
    </>
  )
}
