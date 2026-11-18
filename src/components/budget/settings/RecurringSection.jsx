import { useState } from 'react'
import { Plus, Play, Pause, Trash2, CheckCircle2 } from 'lucide-react'
import {
  useRecurringTransactionsQuery,
  useCategoriesQuery,
  useWalletsQuery,
  useCreateRecurringMutation,
  useUpdateRecurringMutation,
  useDeleteRecurringMutation,
  useApplyRecurringNowMutation,
} from '@/queries/budget'
import { useCurrency } from '@/hooks/useCurrency.js'
import { usePrivacyMode, maskText } from '@/hooks/usePrivacyMode.js'
import styles from './RecurringSection.module.scss'

const FREQ_LABELS = {
  daily: 'يومياً',
  weekly: 'أسبوعياً',
  monthly: 'شهرياً',
  yearly: 'سنوياً',
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`
}

export default function RecurringSection() {
  const { data: items = [] } = useRecurringTransactionsQuery()
  const { data: categories = [] } = useCategoriesQuery()
  const { data: wallets = [] } = useWalletsQuery()
  const createRec = useCreateRecurringMutation()
  const updateRec = useUpdateRecurringMutation()
  const deleteRec = useDeleteRecurringMutation()
  const applyNow = useApplyRecurringNowMutation()
  const { symbol } = useCurrency()
  const { isPrivate } = usePrivacyMode()

  const [open, setOpen] = useState(false)
  const [type, setType] = useState('expense')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [walletId, setWalletId] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [nextDue, setNextDue] = useState(todayIso)
  const [autoApply, setAutoApply] = useState(true)

  const filteredCats = categories.filter((c) => c.type === type)

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createRec.mutateAsync({
      title,
      amount: parseFloat(amount) || 0,
      type,
      category_id: categoryId || filteredCats[0]?.id || null,
      wallet_id: walletId || null,
      frequency,
      next_due_date: nextDue,
      auto_apply: autoApply,
    })
    setOpen(false)
    setTitle('')
    setAmount('')
  }

  const fmt = (n) =>
    isPrivate
      ? maskText(symbol)
      : `${Number(n || 0).toLocaleString('en', { maximumFractionDigits: 2 })} ${symbol}`

  return (
    <section className={styles.cardSection}>
      <h3 className={styles.sectionTitle}>
        المعاملات المتكررة ({items.length})
      </h3>
      <div className={styles.wrap}>
        <p className={styles.hint}>
          الراتب، الإيجار، الفواتير، والاشتراكات — تُسجّل تلقائياً عند حلول موعدها.
        </p>

        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setOpen((v) => !v)}
        >
          <Plus size={15} strokeWidth={2.4} />
          <span>{open ? 'إغلاق النموذج' : 'إضافة معاملة متكررة'}</span>
        </button>

        {open && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.typeRow}>
              {[
                { id: 'expense', label: 'مصروف ثابت' },
                { id: 'income', label: 'دخل ثابت' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.typePill} ${
                    type === t.id ? styles.typeActive : ''
                  }`}
                  onClick={() => {
                    setType(t.id)
                    setCategoryId('')
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              className={styles.input}
              placeholder="الاسم (مثال: إيجار المنزل / الراتب الشهري)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className={styles.twoCols}>
              <input
                type="number"
                step="any"
                min="0.01"
                className={styles.input}
                placeholder={`المبلغ (${symbol})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <select
                className={styles.select}
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                {Object.entries(FREQ_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.twoCols}>
              <select
                className={styles.select}
                value={categoryId || filteredCats[0]?.id || ''}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {filteredCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>

              <select
                className={styles.select}
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
              >
                <option value="">بدون محفظة محددة</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.icon} {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.dateRow}>
              <label htmlFor="rec-due">أول استحقاق</label>
              <input
                id="rec-due"
                type="date"
                className={styles.dateInput}
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
              />
            </div>

            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={autoApply}
                onChange={(e) => setAutoApply(e.target.checked)}
              />
              <span>تسجيل تلقائي عند حلول الموعد</span>
            </label>

            <button type="submit" className={styles.saveBtn}>
              حفظ المعاملة المتكررة
            </button>
          </form>
        )}

        {items.length > 0 && (
          <div className={styles.list}>
            {items.map((r) => {
              const active = Boolean(r.active)
              return (
                <div
                  key={r.id}
                  className={`${styles.row} ${!active ? styles.rowPaused : ''}`}
                >
                  <div className={styles.info}>
                    <span className={styles.title}>
                      {r.category_icon || '🔁'} {r.title}
                    </span>
                    <span className={styles.meta}>
                      <strong
                        className={
                          r.type === 'income' ? styles.inc : styles.exp
                        }
                      >
                        {r.type === 'income' ? '+' : '-'}
                        {fmt(r.amount)}
                      </strong>{' '}
                      · {FREQ_LABELS[r.frequency] || 'شهرياً'} · القادم:{' '}
                      {r.next_due_date}
                    </span>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      title="تسجيل الآن"
                      aria-label={`تسجيل ${r.title} الآن`}
                      onClick={() => applyNow.mutate(r.id)}
                    >
                      <CheckCircle2 size={15} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      title={active ? 'إيقاف مؤقت' : 'استئناف'}
                      aria-label={active ? 'إيقاف مؤقت' : 'استئناف'}
                      onClick={() =>
                        updateRec.mutate({
                          id: r.id,
                          patch: { active: !active },
                        })
                      }
                    >
                      {active ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.dangerBtn}`}
                      aria-label={`حذف ${r.title}`}
                      onClick={() => deleteRec.mutate(r.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
