import { useState } from 'react'
import { ArrowLeftRight, Plus, Trash2, Pencil } from 'lucide-react'
import {
  useWalletsQuery,
  useWalletTransfersQuery,
  useCreateWalletMutation,
  useUpdateWalletMutation,
  useDeleteWalletMutation,
  useCreateWalletTransferMutation,
  useDeleteWalletTransferMutation,
} from '@/queries/budget'
import { useCurrency } from '@/hooks/useCurrency.js'
import { usePrivacyMode, maskText } from '@/hooks/usePrivacyMode.js'
import styles from './WalletsSection.module.scss'

const WALLET_ICONS = ['💵', '🏦', '📱', '💳', '🪙', '💼']

export default function WalletsSection() {
  const { data: wallets = [] } = useWalletsQuery()
  const { data: transfers = [] } = useWalletTransfersQuery()
  const createWallet = useCreateWalletMutation()
  const updateWallet = useUpdateWalletMutation()
  const deleteWallet = useDeleteWalletMutation()
  const createTransfer = useCreateWalletTransferMutation()
  const deleteTransfer = useDeleteWalletTransferMutation()
  const { symbol } = useCurrency()
  const { isPrivate } = usePrivacyMode()

  const [mode, setMode] = useState(null) // null | 'add' | 'edit' | 'transfer'
  const [editId, setEditId] = useState(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('💵')
  const [initBalance, setInitBalance] = useState('')

  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferNote, setTransferNote] = useState('')

  const fmt = (n) =>
    isPrivate
      ? maskText(symbol)
      : `${Number(n || 0).toLocaleString('en', { maximumFractionDigits: 2 })} ${symbol}`

  const openAdd = () => {
    setMode('add')
    setEditId(null)
    setName('')
    setIcon('💳')
    setInitBalance('')
  }

  const openEdit = (w) => {
    setMode('edit')
    setEditId(w.id)
    setName(w.name)
    setIcon(w.icon || '💳')
    setInitBalance(String(w.initial_balance || 0))
  }

  const openTransfer = () => {
    setMode('transfer')
    setFromId(wallets[0]?.id || '')
    setToId(wallets[1]?.id || wallets[0]?.id || '')
    setTransferAmount('')
    setTransferNote('')
  }

  const handleSaveWallet = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const payload = {
      name: name.trim(),
      icon,
      initial_balance: parseFloat(initBalance) || 0,
    }
    if (mode === 'edit' && editId) {
      await updateWallet.mutateAsync({ id: editId, data: payload })
    } else {
      await createWallet.mutateAsync(payload)
    }
    setMode(null)
  }

  const handleSaveTransfer = async (e) => {
    e.preventDefault()
    await createTransfer.mutateAsync({
      from_wallet_id: fromId,
      to_wallet_id: toId,
      amount: parseFloat(transferAmount) || 0,
      note: transferNote,
    })
    setMode(null)
  }

  return (
    <section className={styles.cardSection}>
      <h3 className={styles.sectionTitle}>
        المحافظ والحسابات ({wallets.length})
      </h3>
      <div className={styles.wrap}>
        <p className={styles.hint}>
          تتبّع رصيد الكاش والحساب البنكي والمحفظة الإلكترونية، وحوّل بينها بسهولة.
        </p>

        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryBtn} onClick={openAdd}>
            <Plus size={15} strokeWidth={2.4} />
            <span>محفظة جديدة</span>
          </button>
          {wallets.length >= 2 && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={openTransfer}
            >
              <ArrowLeftRight size={15} strokeWidth={2.2} />
              <span>تحويل بين محفظتين</span>
            </button>
          )}
        </div>

        {(mode === 'add' || mode === 'edit') && (
          <form className={styles.formBox} onSubmit={handleSaveWallet}>
            <div className={styles.iconPills}>
              {WALLET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className={`${styles.iconPill} ${
                    icon === ic ? styles.iconPillActive : ''
                  }`}
                  onClick={() => setIcon(ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
            <input
              type="text"
              className={styles.input}
              placeholder="اسم المحفظة (مثال: فودافون كاش)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="number"
              step="any"
              className={styles.input}
              placeholder={`الرصيد الافتتاحي (${symbol})`}
              value={initBalance}
              onChange={(e) => setInitBalance(e.target.value)}
            />
            <div className={styles.formBtns}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setMode(null)}
              >
                إلغاء
              </button>
              <button type="submit" className={styles.saveBtn}>
                {mode === 'edit' ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>
        )}

        {mode === 'transfer' && (
          <form className={styles.formBox} onSubmit={handleSaveTransfer}>
            <div className={styles.twoCols}>
              <label className={styles.selectWrap}>
                <span>من</span>
                <select
                  className={styles.select}
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.selectWrap}>
                <span>إلى</span>
                <select
                  className={styles.select}
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <input
              type="number"
              step="any"
              min="0.01"
              className={styles.input}
              placeholder={`مبلغ التحويل (${symbol})`}
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              required
            />
            <input
              type="text"
              className={styles.input}
              placeholder="ملاحظة اختيارية (مثال: سحب ATM)"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
            />
            <div className={styles.formBtns}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setMode(null)}
              >
                إلغاء
              </button>
              <button type="submit" className={styles.saveBtn}>
                تأكيد التحويل
              </button>
            </div>
          </form>
        )}

        <div className={styles.walletList}>
          {wallets.map((w) => (
            <div key={w.id} className={styles.walletRow}>
              <div className={styles.walletInfo}>
                <span className={styles.walletEmoji} aria-hidden="true">
                  {w.icon}
                </span>
                <div>
                  <span className={styles.walletName}>{w.name}</span>
                  <span className={styles.walletBalance}>{fmt(w.balance)}</span>
                </div>
              </div>
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => openEdit(w)}
                  aria-label={`تعديل ${w.name}`}
                >
                  <Pencil size={14} />
                </button>
                {wallets.length > 1 && (
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.dangerBtn}`}
                    onClick={() => deleteWallet.mutate(w.id)}
                    aria-label={`حذف ${w.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {transfers.length > 0 && (
          <div className={styles.transfersBox}>
            <span className={styles.subTitle}>آخر التحويلات</span>
            {transfers.slice(0, 5).map((t) => (
              <div key={t.id} className={styles.transferRow}>
                <span className={styles.transferText}>
                  {t.from_icon} {t.from_name} ← {t.to_icon} {t.to_name} ·{' '}
                  <strong>{fmt(t.amount)}</strong>
                </span>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => deleteTransfer.mutate(t.id)}
                  aria-label="حذف التحويل"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
