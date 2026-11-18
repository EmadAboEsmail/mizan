import { useState, useRef } from 'react'
import {
  useExportBudgetJsonMutation,
  useExportUnifiedMizanMutation,
  useExportBudgetCsvMutation,
  useExportBudgetXlsxMutation,
  useRestoreBudgetBackupMutation,
  useRestoreUnifiedMizanMutation,
  useRestoreLatestAutoBackupMutation,
  useImportBudgetCsvMutation,
  useImportLegacyBudgetMutation,
  useDeleteAllBudgetDataMutation,
} from '@/queries/budget'
import { useBudgetUI, getCurrentMonth } from '@/contexts/BudgetContext'
import { getLastAutoBackupMeta } from '@/services/mizanBackupService.js'
import { downloadOrShareBlob } from '@/utils/fileExport.js'
import { useToast } from '@/hooks/useToast.js'
import Modal from '@/components/ui/Modal.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './DataSection.module.scss'

const FREQ_OPTIONS = [
  { id: 'daily', label: 'يومي' },
  { id: 'weekly', label: 'أسبوعي' },
  { id: 'monthly', label: 'شهري' },
]

function DataSection() {
  const { showToast } = useToast()
  const { currentMonth } = useBudgetUI()

  // ─── Mutations ───
  const exportJsonMutation = useExportBudgetJsonMutation()
  const exportUnifiedMutation = useExportUnifiedMizanMutation()
  const exportCsvMutation = useExportBudgetCsvMutation()
  const exportXlsxMutation = useExportBudgetXlsxMutation()
  const restoreBackupMutation = useRestoreBudgetBackupMutation()
  const restoreUnifiedMutation = useRestoreUnifiedMizanMutation()
  const restoreAutoMutation = useRestoreLatestAutoBackupMutation()
  const importCsvMutation = useImportBudgetCsvMutation()
  const importLegacyMutation = useImportLegacyBudgetMutation()
  const deleteAllMutation = useDeleteAllBudgetDataMutation()

  const loading =
    exportJsonMutation.isPending ||
    exportUnifiedMutation.isPending ||
    exportCsvMutation.isPending ||
    exportXlsxMutation.isPending ||
    restoreBackupMutation.isPending ||
    restoreUnifiedMutation.isPending ||
    restoreAutoMutation.isPending ||
    importCsvMutation.isPending ||
    importLegacyMutation.isPending ||
    deleteAllMutation.isPending

  const activeMonth = currentMonth || getCurrentMonth()
  const [exportScope, setExportScope] = useState('all') // 'all' | 'month'
  const scopedMonth = exportScope === 'month' ? activeMonth : null
  const lastAuto = getLastAutoBackupMeta()

  // ─── Auto Backup Settings ───
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(
    () => localStorage.getItem('auto_backup_enabled') === 'true'
  )
  const [autoBackupFrequency, setAutoBackupFrequency] = useState(
    () => localStorage.getItem('auto_backup_frequency') || 'daily'
  )

  const toggleAutoBackup = (checked) => {
    setAutoBackupEnabled(checked)
    localStorage.setItem('auto_backup_enabled', String(checked))
    window.dispatchEvent(new Event('mizan:auto-backup-change'))
    showToast(
      checked
        ? 'تم تفعيل النسخ الاحتياطي التلقائي'
        : 'تم إيقاف النسخ الاحتياطي التلقائي'
    )
  }

  const changeFrequency = (freq) => {
    setAutoBackupFrequency(freq)
    localStorage.setItem('auto_backup_frequency', freq)
    window.dispatchEvent(new Event('mizan:auto-backup-change'))
    showToast('تم تحديث فترة النسخ الاحتياطي')
  }

  // ─── UI State ───
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
  const handleExportUnified = async () => {
    try {
      const data = await exportUnifiedMutation.mutateAsync()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      await downloadOrShareBlob(blob, `mizan-full-backup-${todayStr()}.json`, {
        mimeType: 'application/json;charset=utf-8',
        title: 'نسخة مِيزان الشاملة',
      })
      showToast('تم تصدير نسخة مِيزان الشاملة (ذِكر + الميزانية)')
    } catch {
      showToast('فشل التصدير', 'error')
    }
  }

  const handleRestoreAuto = async () => {
    try {
      await restoreAutoMutation.mutateAsync()
      showToast('تمت استعادة آخر نسخة تلقائية بنجاح')
    } catch (err) {
      showToast(err?.message || 'لا توجد نسخة تلقائية بعد', 'error')
    }
  }

  const handleExportJson = async () => {
    try {
      const data = await exportJsonMutation.mutateAsync()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      await downloadOrShareBlob(blob, `budget-backup-${todayStr()}.json`, {
        mimeType: 'application/json;charset=utf-8',
        title: 'نسخة احتياطية — ميزان',
      })
      showToast('تم تصدير النسخة الاحتياطية')
    } catch {
      showToast('فشل التصدير', 'error')
    }
  }

  // ═══════════════════════════════════════
  // CSV & Excel Export (الشهر المحدد أو كل الفترات)
  // ═══════════════════════════════════════
  const handleExportCsv = async () => {
    try {
      const blob = await exportCsvMutation.mutateAsync(scopedMonth)
      const suffix = scopedMonth || todayStr()
      await downloadOrShareBlob(blob, `budget-transactions-${suffix}.csv`, {
        mimeType: 'text/csv;charset=utf-16le',
        title: 'معاملات ميزان (CSV)',
      })
      showToast('تم تصدير CSV بدعم كامل للعربية')
    } catch (err) {
      showToast(err?.message || 'فشل التصدير', 'error')
    }
  }

  const handleExportXlsx = async () => {
    try {
      const blob = await exportXlsxMutation.mutateAsync(scopedMonth)
      const suffix = scopedMonth || todayStr()
      await downloadOrShareBlob(
        blob,
        `budget-transactions-${suffix}.xlsx`,
        {
          mimeType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          title: 'معاملات ميزان (Excel)',
        }
      )
      showToast('تم تصدير ملف Excel بنجاح')
    } catch (err) {
      showToast(err?.message || 'فشل تصدير Excel', 'error')
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
      } catch {
        showToast('ملف JSON غير صالح')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return
    try {
      if (
        pendingRestore?.app === 'mizan' ||
        (pendingRestore?.zekr && pendingRestore?.budget)
      ) {
        await restoreUnifiedMutation.mutateAsync(pendingRestore)
        showToast('تمت استعادة نسخة مِيزان الشاملة بنجاح')
      } else {
        const result = await restoreBackupMutation.mutateAsync(pendingRestore)
        showToast(
          `تم الاستيراد: ${result.transactions} معاملة، ${result.categories} تصنيف`
        )
      }
      setConfirmType(null)
      setPendingRestore(null)
    } catch (err) {
      showToast(err?.message || 'فشل الاستيراد')
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
      const result = await importCsvMutation.mutateAsync({
        file: csvFile,
        clearExisting,
      })
      showToast(
        `تم استيراد ${result.imported} معاملة${
          result.created_categories > 0
            ? ` (${result.created_categories} تصنيف جديد)`
            : ''
        }${result.skipped > 0 ? ` — تخطي ${result.skipped}` : ''}`
      )
      setCsvModalOpen(false)
      setCsvFile(null)
      setClearExisting(false)
    } catch (err) {
      showToast(err?.message || 'فشل استيراد CSV')
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

      setLegacyStatus(null)

      try {
        const text = await file.text()
        const legacy = JSON.parse(text)
        const res = await importLegacyMutation.mutateAsync(legacy)

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
          text: `⚠️ فشل: ${err?.message || 'خطأ غير متوقع'}`,
        })
        showToast('فشل الاستيراد')
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
      const keepCategories = confirmType === 'transactions'
      await deleteAllMutation.mutateAsync(keepCategories)
      showToast(
        keepCategories ? 'تم مسح كل المعاملات' : 'تم مسح كل البيانات'
      )
      setConfirmType(null)
    } catch {
      showToast('فشل المسح')
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
          Backup Settings
      ═══════════════════════════════════════ */}
      <div className={styles.groupLabel}>⚙️ الإعدادات</div>
      <div className={styles.card}>
        <div className={styles.cardContent}>
          <span className={styles.cardTitle}>
            النسخ الاحتياطي التلقائي الشامل
          </span>
          <p className={styles.cardDesc}>
            يحفظ بيانات ذِكر والميزانية معاً (يحتفظ بآخر 7 نسخ تلقائياً)
            {lastAuto
              ? ` · آخر نسخة: ${new Date(lastAuto.timestamp).toLocaleDateString(
                  'ar-EG'
                )}`
              : ''}
          </p>
          {lastAuto && (
            <button
              type="button"
              className={styles.actionBtn}
              style={{ marginTop: '6px', alignSelf: 'flex-start' }}
              onClick={handleRestoreAuto}
              disabled={loading}
            >
              استعادة آخر نسخة تلقائية
            </button>
          )}
          {autoBackupEnabled && (
            <div
              className={styles.freqPills}
              role="radiogroup"
              aria-label="فترة النسخ الاحتياطي"
            >
              {FREQ_OPTIONS.map((opt) => {
                const active = autoBackupFrequency === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`${styles.freqPill} ${
                      active ? styles.freqPillActive : ''
                    }`}
                    onClick={() => changeFrequency(opt.id)}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoBackupEnabled}
          aria-label="تفعيل النسخ الاحتياطي التلقائي"
          className={`${styles.switch} ${autoBackupEnabled ? styles.switchOn : ''}`}
          onClick={() => toggleAutoBackup(!autoBackupEnabled)}
        >
          <span className={styles.switchThumb} aria-hidden="true" />
        </button>
      </div>

      {/* ═══════════════════════════════════════
          Legacy Import
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
            className={`${styles.statusMessage} ${
              legacyStatus.type === 'success'
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
          <div className={styles.cardIcon}>⚖️</div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>نسخة مِيزان الشاملة</span>
            <p className={styles.cardDesc}>
              ذِكر + الميزانية + المحافظ + التفضيلات في ملف واحد
            </p>
          </div>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExportUnified}
            disabled={loading}
          >
            تصدير
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>📥</div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>تصدير الميزانية فقط</span>
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
          Excel & CSV Export/Import
      ═══════════════════════════════════════ */}
      <div className={styles.groupLabel}>📊 جداول المعاملات (Excel و CSV)</div>
      <div
        className={styles.freqPills}
        style={{ marginBottom: '8px', alignSelf: 'flex-start' }}
        role="radiogroup"
        aria-label="نطاق التصدير"
      >
        {[
          { id: 'all', label: 'كل الفترات' },
          { id: 'month', label: `شهر ${activeMonth}` },
        ].map((opt) => {
          const active = exportScope === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`${styles.freqPill} ${
                active ? styles.freqPillActive : ''
              }`}
              onClick={() => setExportScope(opt.id)}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      <div className={styles.backupGrid}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>📗</div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>تصدير Excel (.xlsx)</span>
            <p className={styles.cardDesc}>
              ملف Excel منسّق باتجاه عربي RTL جاهز للفتح مباشرة
            </p>
          </div>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExportXlsx}
            disabled={loading}
          >
            تصدير
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>📋</div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>تصدير CSV</span>
            <p className={styles.cardDesc}>
              ترميز Unicode متوافق مع العربية وجميع إصدارات Excel
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
              يدعم الأعمدة العربية والإنجليزية (إضافة أو استبدال)
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
              {importCsvMutation.isPending ? 'جاري الاستيراد...' : 'استيراد'}
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`
}

export default DataSection
