import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { usePrivacyMode, maskText } from '@/hooks/usePrivacyMode.js'
import { useCurrency } from '@/hooks/useCurrency.js'
import { formatAmount } from './lib/transactionsHelpers.js'
import styles from './TransactionsSummary.module.scss'

export default function TransactionsSummary({ summary, insights, isAllMonths }) {
  const { isPrivate } = usePrivacyMode()
  const { symbol } = useCurrency()
  if (!summary) return null

  const incomeChange = insights?.comparison?.income_change_percent
  const expenseChange = insights?.comparison?.expense_change_percent
  const net = Number(summary.net || 0)
  const netPositive = net >= 0
  const txnCount = summary.transaction_count || 0
  const money = (val) => (isPrivate ? maskText('') : formatAmount(val))

  return (
    <section className={styles.heroCard} aria-label="ملخص الرصيد">
      {/* الصف العلوي: صافي الرصيد */}
      <div className={styles.netRow}>
        <div className={styles.netMain}>
          <span className={styles.netLabel}>
            {isAllMonths ? 'صافي كل الفترات' : 'صافي الرصيد'}
          </span>
          <div
            className={`${styles.netValue} ${
              net > 0
                ? styles.valPositive
                : net < 0
                  ? styles.valNegative
                  : ''
            }`}
          >
            <span className={styles.netNumber}>
              {isPrivate
                ? maskText('')
                : `${net > 0 ? '+' : net < 0 ? '−' : ''}${formatAmount(
                    Math.abs(net)
                  )}`}
            </span>
            <span className={styles.currency}>{symbol}</span>
          </div>
        </div>

        {txnCount > 0 && (
          <span className={styles.countBadge}>
            {txnCount.toLocaleString('en')}{' '}
            {txnCount === 1 ? 'معاملة' : 'معاملات'}
          </span>
        )}
      </div>

      {/* الصف السفلي: الدخل والمصروف جنباً إلى جنب حتى على أصغر شاشة */}
      <div className={styles.splitRow}>
        <div className={styles.metric}>
          <span
            className={`${styles.metricIcon} ${styles.iconIncome}`}
            aria-hidden="true"
          >
            <ArrowDownLeft size={15} strokeWidth={2.4} />
          </span>
          <div className={styles.metricBody}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>الدخل</span>
              {incomeChange !== undefined && incomeChange !== 0 && (
                <span
                  className={`${styles.delta} ${
                    incomeChange > 0 ? styles.deltaGood : styles.deltaBad
                  }`}
                >
                  {incomeChange > 0 ? '↑' : '↓'}
                  {Math.abs(incomeChange).toFixed(0)}%
                </span>
              )}
            </div>
            <span className={`${styles.metricValue} ${styles.valPositive}`}>
              {money(summary.total_income)}
            </span>
          </div>
        </div>

        <span className={styles.vDivider} aria-hidden="true" />

        <div className={styles.metric}>
          <span
            className={`${styles.metricIcon} ${styles.iconExpense}`}
            aria-hidden="true"
          >
            <ArrowUpRight size={15} strokeWidth={2.4} />
          </span>
          <div className={styles.metricBody}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>المصروف</span>
              {expenseChange !== undefined && expenseChange !== 0 && (
                <span
                  className={`${styles.delta} ${
                    expenseChange > 0 ? styles.deltaBad : styles.deltaGood
                  }`}
                >
                  {expenseChange > 0 ? '↑' : '↓'}
                  {Math.abs(expenseChange).toFixed(0)}%
                </span>
              )}
            </div>
            <span
              className={`${styles.metricValue} ${
                summary.total_expense > 0 ? styles.valNegative : ''
              }`}
            >
              {money(summary.total_expense)}
            </span>
          </div>
        </div>
      </div>

      <span
        className={`${styles.accentBar} ${
          netPositive ? styles.barPositive : styles.barNegative
        }`}
        aria-hidden="true"
      />
    </section>
  )
}
