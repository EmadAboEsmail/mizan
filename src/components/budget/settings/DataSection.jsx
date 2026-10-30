import { useState, useRef } from 'react'
import {
  getBudgetBackup,
  restoreBudgetBackup,
  deleteAllBudgetData,
  exportBudgetCsv,
  importBudgetCsv,
} from '@/services/budgetService.js'
import { useToast } from '@/contexts/ToastContext'
import { useBudget } from '@/contexts/BudgetContext'
import Modal from '@/components/ui/Modal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './DataSection.module.scss'

function DataSection() {
  const { reload, importLegacyBudget } = useBudget()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [confirmType, setConfirmType] = useState(null)
  const [pendingRestore, setPendingRestore] = useState(null)
  const [legacyStatus, setLegacyStatus] = useState(null)

  // CSV import state
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [clearExisting, setClearExisting] = useState(false)

  const jsonFileRef = useRef(null)
  const csvFileRef = useRef(null)

  // ═══════════════════════════════════════
  // JSON Export
  // ═══════════════════════════════════════
  const handleExportJson = async () => {
    try {
      setLoading(true)
      const data = await getBudgetBackup()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      triggerDownload(blob, `budget-backup-${todayStr()}.json`)
      showToast('تم تصدير النسخة الاحتياطية')
    } catch (err) {
      showToast('فشل التصدير')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════
  // CSV Export
  // ═══════════════════════════════════════
  const handleExportCsv = async () => {
    try {
      setLoading(true)
      const blob = await exportBudgetCsv()
      triggerDownload(blob, `budget-transactions-${todayStr()}.csv`)
      showToast('تم تصدير CSV')
    } catch (err) {
      showToast(err.message || 'فشل التصدير')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════
  // JSON Import
  // ═══════════════════════════════════════
  const handleJsonFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        setPendingRestore(data)
        setConfirmType('restore')
      } catch (err) {
        showToast('ملف JSON غير صالح')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return
    try {
      setLoading(true)
      const result = await restoreBudgetBackup(pendingRestore)
      showToast(
        `تم الاستيراد: ${result.transactions} معاملة، ${result.categories} تصنيف`
      )
      await reload()
      setConfirmType(null)
      setPendingRestore(null)
    } catch (err) {
      showToast(err.message || 'فشل الاستيراد')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════
  // CSV Import
  // ═══════════════════════════════════════
  const handleCsvFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    e.target.value = ''
  }

  const handleConfirmCsvImport = async () => {
    if (!csvFile) return
    try {
      setLoading(true)
      const result = await importBudgetCsv(csvFile, clearExisting)
      showToast(
        `تم استيراد ${result.imported} معاملة${result.created_categories > 0
          ? ` (${result.created_categories} تصنيف جديد)`
          : ''
        }${result.skipped > 0 ? ` — تخطي ${result.skipped}` : ''}`
      )
      await reload()
      setCsvModalOpen(false)
      setCsvFile(null)
      setClearExisting(false)
    } catch (err) {
      showToast(err.message || 'فشل استيراد CSV')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════
  // Legacy Import (FastAPI old data)
  // ═══════════════════════════════════════
  const handleLegacyImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      setLoading(true)
      setLegacyStatus(null)

      try {
        const text = await file.text()
        const legacy = JSON.parse(text)
        const res = await importLegacyBudget(legacy)

        let msg = `✅ تم: ${res.categories} تصنيف، ${res.transactions} معاملة، ${res.limits} حد`
        if (res.failed > 0) msg += ` — ⚠️ ${res.failed} فشل`

        setLegacyStatus({
          type: res.failed > 0 ? 'error' : 'success',
          text: msg,
        })
        showToast('تم استيراد بيانات الميزانية القديمة!')
      } catch (err) {
        console.error('[Legacy Budget Import] Failed:', err)
        setLegacyStatus({
          type: 'error',
          text: `⚠️ فشل: ${err.message || 'خطأ غير متوقع'}`,
        })
        showToast('فشل الاستيراد')
      } finally {
        setLoading(false)
      }
    }

    input.click()
  }

  // ═══════════════════════════════════════
  // Delete
  // ═══════════════════════════════════════
  const handleConfirmDelete = async () => {
    if (!confirmType) return
    try {
      setLoading(true)
      const keepCategories = confirmType === 'transactions'
      await deleteAllBudgetData(keepCategories)
      showToast(
        keepCategories ? 'تم مسح كل المعاملات' : 'تم مسح كل البيانات'
      )
      await reload()
      setConfirmType(null)
    } catch (err) {
      showToast('فشل المسح')
    } finally {
      setLoading(false)
    }
  }

  const confirmMessages = {
    transactions: {
      title: 'مسح كل المعاملات؟',
      message: 'سيتم حذف كل المعاملات مع الإبقاء على التصنيفات.',
    },
    all: {
      title: 'مسح كل البيانات؟',
      message: 'سيتم حذف كل التصنيفات والمعاملات نهائيًا. لا يمكن التراجع!',
    },
    restore: {
      title: 'استبدال البيانات بالنسخة الاحتياطية؟',
      message: 'سيتم حذف البيانات الحالية واستبدالها بالنسخة المستوردة.',
    },
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>النسخ الاحتياطي والبيانات</h3>
      </div>

      {/* ═══════════════════════════════════════
          Legacy Import (أولاً — الأهم)
      ═══════════════════════════════════════ */}
      <div className={styles.legacySection}>
        <div className={styles.groupLabel}>📦 استيراد البيانات القديمة</div>
        <div className={styles.legacyCard}>
          <div className={styles.legacyIcon}>📂</div>
          <div className={styles.legacyContent}>
            <span className={styles.legacyTitle}>من FastAPI القديم</span>
            <p className={styles.legacyDesc}>
              استيراد التصنيفات والمعاملات والحدود من ملف{' '}
              <code>zekr-legacy-backup.json</code>
            </p>
          </div>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleLegacyImport}
            disabled={loading}
          >
            اختيار ملف
          </button>
        </div>
        {legacyStatus && (
          <div
            className={`${styles.statusMessage} ${legacyStatus.type === 'success'
                ? styles.statusSuccess
                : styles.statusError
              }`}
          >
            {legacyStatus.text}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          JSON Backup
      ═══════════════════════════════════════ */}
      <div className={styles.groupLabel}>📦 نسخة كاملة (JSON)</div>
      <div className={styles.backupGrid}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>📥</div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>تصدير JSON</span>
            <p className={styles.cardDesc}>
              تصنيفات + معاملات كاملة (لاستعادة كاملة)
            </p>
          </div>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExportJson}
            disabled={loading}
          >
            تصدير
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>📤</div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>استيراد JSON</span>
            <p className={styles.cardDesc}>
              استبدال كل البيانات بنسخة محفوظة
            </p>
          </div>
          <input
            ref={jsonFileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleJsonFileChange}
          />
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => jsonFileRef.current?.click()}
            disabled={loading}
          >
            استيراد
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          CSV Export/Import
      ═══════════════════════════════════════ */}
      <div className={styles.groupLabel}>📊 معاملات (CSV — Excel)</div>
      <div className={styles.backupGrid}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>📋</div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>تصدير CSV</span>
            <p className={styles.cardDesc}>
              يفتح في Excel (تاريخ، نوع، مبلغ، تصنيف)
            </p>
          </div>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExportCsv}
            disabled={loading}
          >
            تصدير
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>📎</div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>استيراد CSV</span>
            <p className={styles.cardDesc}>
              إضافة أو استبدال من ملف CSV
            </p>
          </div>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setCsvModalOpen(true)}
            disabled={loading}
          >
            استيراد
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          Danger Zone
      ═══════════════════════════════════════ */}
      <div className={styles.dangerZone}>
        <h4 className={styles.dangerTitle}>⚠️ منطقة الخطر</h4>
        <div className={styles.dangerRow}>
          <div>
            <span className={styles.dangerRowTitle}>مسح كل المعاملات</span>
            <p className={styles.dangerRowDesc}>
              حذف كل المعاملات مع الإبقاء على التصنيفات
            </p>
          </div>
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={() => setConfirmType('transactions')}
            disabled={loading}
          >
            مسح
          </button>
        </div>
        <div className={styles.dangerRow}>
          <div>
            <span className={styles.dangerRowTitle}>مسح كل البيانات</span>
            <p className={styles.dangerRowDesc}>
              حذف كل التصنيفات والمعاملات نهائيًا
            </p>
          </div>
          <button
            type="button"
            className={`${styles.dangerBtn} ${styles.dangerStrong}`}
            onClick={() => setConfirmType('all')}
            disabled={loading}
          >
            مسح شامل
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          Confirm Modals
      ═══════════════════════════════════════ */}
      <ConfirmModal
        isOpen={confirmType !== null}
        onClose={() => {
          setConfirmType(null)
          setPendingRestore(null)
        }}
        onConfirm={
          confirmType === 'restore' ? handleConfirmRestore : handleConfirmDelete
        }
        title={confirmMessages[confirmType]?.title ?? ''}
        message={confirmMessages[confirmType]?.message ?? ''}
        confirmLabel={loading ? 'جاري التنفيذ...' : 'نعم، متابعة'}
        cancelLabel="إلغاء"
        danger={confirmType !== 'restore'}
      />

      {/* ═══════════════════════════════════════
          CSV Import Modal
      ═══════════════════════════════════════ */}
      <Modal
        isOpen={csvModalOpen}
        onClose={() => {
          setCsvModalOpen(false)
          setCsvFile(null)
          setClearExisting(false)
        }}
        title="استيراد من CSV"
        variant="sheet"
      >
        <div className={styles.csvModal}>
          <div className={styles.csvField}>
            <label className={styles.csvLabel}>ملف CSV</label>
            <input
              ref={csvFileRef}
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className={styles.fileInput}
            />
            {csvFile && (
              <span className={styles.fileName}>✓ {csvFile.name}</span>
            )}
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className={styles.checkbox}
            />
            <span>
              مسح كل المعاملات الموجودة قبل الاستيراد
              <small>(يمنع التكرار)</small>
            </span>
          </label>

          <div className={styles.hint}>
            <strong>الأعمدة المطلوبة:</strong>
            <code>date, type, amount, category</code>
            <br />
            <strong>اختيارية:</strong>
            <code>category_icon, category_color, details, description</code>
          </div>

          <div className={styles.modalButtons}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setCsvModalOpen(false)
                setCsvFile(null)
                setClearExisting(false)
              }}
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleConfirmCsvImport}
              disabled={!csvFile || loading}
            >
              {loading ? 'جاري الاستيراد...' : 'استيراد'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default DataSection
