import { useBudgetLock } from '@/hooks/useBudgetLock.js'
import { useState, useRef } from 'react'
import {
  useDeleteAllCountsMutation,
  useDeleteAllTargetsMutation,
  useDeleteAllClicksMutation,
  useDeleteAllZekrDataMutation,
  useExportZekrBackupMutation,
  useRestoreZekrBackupMutation,
  useImportLegacyZekrMutation,
} from '@/queries/zekr'
import {
  useExportUnifiedMizanMutation,
  useRestoreUnifiedMizanMutation,
  useRestoreLatestAutoBackupMutation,
} from '@/queries/budget'
import { exportJsonFile } from '@/utils/fileExport.js'
import { getLastAutoBackupMeta } from '@/services/mizanBackupService.js'
import { useToast } from '@/hooks/useToast.js'
import SettingsSection from './SettingsSection.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './DataSection.module.scss'

const RESET_OPTIONS = [
  {
    id: 'counts',
    title: 'تصفير الأعداد الحالية',
    desc: 'إعادة عداد كل ذكر إلى صفر مع الحفاظ على الأهداف وسجل الإحصائيات.',
    btnLabel: 'تصفير',
    confirmTitle: 'تصفير كل الأعداد؟',
    confirmMessage:
      'سيتم تصفير عدد جميع الأذكار الحالية. لا يمكن التراجع عن هذا الإجراء.',
    icon: '↺',
  },
  {
    id: 'targets',
    title: 'استعادة الأهداف الافتراضية',
    desc: 'حذف الأهداف المخصصة التي حددتها للأذكار والعودة للأهداف الافتراضية.',
    btnLabel: 'استعادة',
    confirmTitle: 'مسح كل الأهداف المخصصة؟',
    confirmMessage: 'ستعود جميع الأذكار لأهدافها التلقائية الأصلية.',
    icon: '🎯',
  },
  {
    id: 'clicks',
    title: 'مسح سجل الإحصائيات',
    desc: 'حذف سجل الضغطات والرسوم البيانية وتفاصيل الأيام السابقة بالكامل.',
    btnLabel: 'مسح السجل',
    confirmTitle: 'مسح سجل الإحصائيات؟',
    confirmMessage:
      'سيتم مسح كافة الرسوم البيانية وسجلات الأيام السابقة نهائياً.',
    icon: '📊',
  },
]

const DANGER_OPTION = {
  id: 'all',
  title: 'مسح شامل لكل البيانات',
  desc: 'إعادة ضبط المصنع: مسح الأعداد الحالية، الأهداف، والإحصائيات نهائياً.',
  btnLabel: 'مسح شامل',
  confirmTitle: 'تحذير: مسح كل البيانات نهائياً؟',
  confirmMessage:
    'سيتم حذف كل شيء بلا استثناء (الأعداد، الأهداف، وسجل التسبيح). لا يمكن التراجع أبداً!',
  icon: '⚠️',
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`
}

function DataSection() {
  const { showToast } = useToast()

  // ─── Mutations ───
  const deleteCountsMutation = useDeleteAllCountsMutation()
  const deleteTargetsMutation = useDeleteAllTargetsMutation()
  const deleteClicksMutation = useDeleteAllClicksMutation()
  const deleteAllMutation = useDeleteAllZekrDataMutation()
  const exportBackupMutation = useExportZekrBackupMutation()
  const restoreBackupMutation = useRestoreZekrBackupMutation()
  const importLegacyMutation = useImportLegacyZekrMutation()

  const isResetting =
    deleteCountsMutation.isPending ||
    deleteTargetsMutation.isPending ||
    deleteClicksMutation.isPending ||
    deleteAllMutation.isPending

  const loading =
    isResetting ||
    exportBackupMutation.isPending ||
    restoreBackupMutation.isPending ||
    importLegacyMutation.isPending

  const { isLocked: budgetLocked } = useBudgetLock()
  const requireBudgetUnlock = () => {
    if (budgetLocked) throw new Error('افتح قفل الميزانية أولاً للوصول إلى النسخة الشاملة.')
  }
  const exportUnifiedMutation = useExportUnifiedMizanMutation()
  const restoreUnifiedMutation = useRestoreUnifiedMizanMutation()
  const restoreAutoMutation = useRestoreLatestAutoBackupMutation()
  const busy =
    loading ||
    exportUnifiedMutation.isPending ||
    restoreUnifiedMutation.isPending ||
    restoreAutoMutation.isPending
  const lastAuto = getLastAutoBackupMeta()

  // ─── UI State ───
  const [confirmType, setConfirmType] = useState(null)
  const [importStatus, setImportStatus] = useState(null)
  const [pendingFileContent, setPendingFileContent] = useState(null)
  const [legacyStatus, setLegacyStatus] = useState(null)

  const fileInputRef = useRef(null)

  const actionHandlers = {
    counts: () => deleteCountsMutation.mutateAsync(),
    targets: () => deleteTargetsMutation.mutateAsync(),
    clicks: () => deleteClicksMutation.mutateAsync(),
    all: () => deleteAllMutation.mutateAsync(),
  }

  const currentConfirmData =
    confirmType === 'all'
      ? DANGER_OPTION
      : RESET_OPTIONS.find((opt) => opt.id === confirmType)

  const handleConfirm = async () => {
    if (!confirmType || !actionHandlers[confirmType]) return

    try {
      await actionHandlers[confirmType]()
      setConfirmType(null)
      showToast('تمت العملية بنجاح')
    } catch (err) {
      console.error('فشل تنفيذ عملية المسح:', err)
      showToast('فشلت العملية، يرجى المحاولة مرة أخرى.')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setPendingFileContent(event.target.result)
    }
    reader.readAsText(file)

    e.target.value = ''
  }

  const handleConfirmImport = async () => {
    if (!pendingFileContent) return

    setImportStatus(null)
    try {
      const parsed = JSON.parse(pendingFileContent)
      if (parsed?.app === 'mizan' || (parsed?.zekr && parsed?.budget)) {
        requireBudgetUnlock()
        await restoreUnifiedMutation.mutateAsync(parsed)
        setImportStatus({
          type: 'success',
          text: 'تم استرجاع نسخة مِيزان الشاملة (الأذكار + الميزانية) بنجاح.',
        })
      } else {
        const result = await restoreBackupMutation.mutateAsync(
          pendingFileContent
        )
        setImportStatus({
          type: 'success',
          text: `تم استرجاع البيانات بنجاح (${result.count} ذكر ومجموعاتها).`,
        })
      }
      showToast('تم استيراد النسخة الاحتياطية بنجاح!')
    } catch (err) {
      setImportStatus({
        type: 'error',
        text:
          err?.message || 'فشل استيراد النسخة الاحتياطية، تأكد من صحة الملف.',
      })
    } finally {
      setPendingFileContent(null)
    }
  }

  const handleExportUnifiedClick = async () => {
    try {
      requireBudgetUnlock()
      const data = await exportUnifiedMutation.mutateAsync()
      await exportJsonFile(`mizan-full-backup-${todayStr()}.json`, data)
      showToast('تم تصدير نسخة مِيزان الشاملة (ذِكر + الميزانية)!')
    } catch (err) {
      console.error(err)
      showToast(err?.message || 'فشل تصدير النسخة الشاملة')
    }
  }

  const handleRestoreLatestAuto = async () => {
    try {
      requireBudgetUnlock()
      await restoreAutoMutation.mutateAsync()
      showToast('تمت استعادة آخر نسخة تلقائية بنجاح')
    } catch (err) {
      showToast(err?.message || 'لا توجد نسخة تلقائية بعد')
    }
  }

  const handleExportClick = async () => {
    try {
      const data = await exportBackupMutation.mutateAsync()
      await exportJsonFile(`zekr-backup-${todayStr()}.json`, data)
      showToast('تم تصدير النسخة الاحتياطية بنجاح!')
    } catch (err) {
      console.error(err)
      showToast('فشل تصدير النسخة الاحتياطية')
    }
  }

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

        let msg = `✅ تم: ${res.imported}/${res.total}`
        if (res.adhkar) msg += ` (${res.adhkar} ذكر)`
        if (res.failed > 0) msg += ` — ⚠️ فشل ${res.failed}`

        setLegacyStatus({
          type: res.failed > 0 ? 'error' : 'success',
          text: msg,
        })
        showToast('تم استيراد البيانات القديمة بنجاح!')
      } catch (err) {
        console.error('[Legacy Import] Failed:', err)
        setLegacyStatus({
          type: 'error',
          text: `⚠️ فشل: ${err?.message || 'خطأ غير متوقع'}`,
        })
        showToast('فشل الاستيراد')
      }
    }

    input.click()
  }

  return (
    <SettingsSection id="data" title="إدارة البيانات والذاكرة">
      <div className={styles.container}>
        {/* 1. النسخ الاحتياطي */}
        <div className={styles.backupSection}>
          <h4 className={styles.subSectionTitle}>
            النسخ الاحتياطي السحابي والمحلي
          </h4>

          <div className={styles.backupGrid}>
            <div className={styles.backupCard}>
              <div className={styles.backupHeader}>
                <span className={styles.backupIcon}>⚖️</span>
                <div>
                  <span className={styles.backupTitle}>
                    نسخة مِيزان الشاملة (موصى بها)
                  </span>
                  <p className={styles.backupDesc}>
                    ملف واحد يجمع كل بيانات «ذِكر» و«الميزانية» والتفضيلات معاً.
                    {lastAuto
                      ? ` آخر نسخ تلقائي: ${new Date(
                          lastAuto.timestamp
                        ).toLocaleDateString('ar-EG')}`
                      : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={handleExportUnifiedClick}
                disabled={busy}
              >
                {exportUnifiedMutation.isPending
                  ? 'جاري التصدير...'
                  : 'تصدير مِيزان كاملاً'}
              </button>
              {lastAuto && (
                <button
                  type="button"
                  className={styles.importBtn}
                  style={{ marginTop: '6px' }}
                  onClick={handleRestoreLatestAuto}
                  disabled={busy}
                >
                  استعادة آخر نسخة تلقائية
                </button>
              )}
            </div>

            <div className={styles.backupCard}>
              <div className={styles.backupHeader}>
                <span className={styles.backupIcon}>📥</span>
                <div>
                  <span className={styles.backupTitle}>
                    تصدير الأذكار فقط
                  </span>
                  <p className={styles.backupDesc}>
                    حفظ ملف JSON يحوي كل أذكارك، أهدافك، ومجموعاتك لنقلها لأي
                    جهاز.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={handleExportClick}
                disabled={loading}
              >
                {exportBackupMutation.isPending
                  ? 'جاري التصدير...'
                  : 'تنزيل الملف'}
              </button>
            </div>

            <div className={styles.backupCard}>
              <div className={styles.backupHeader}>
                <span className={styles.backupIcon}>📤</span>
                <div>
                  <span className={styles.backupTitle}>استيراد نسخة سابقة</span>
                  <p className={styles.backupDesc}>
                    استرجاع الأذكار والمجموعات من ملف JSON محفوظ مسبقاً.
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <button
                type="button"
                className={styles.importBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                اختيار ملف
              </button>
            </div>
          </div>

          {importStatus && (
            <div
              className={`${styles.statusMessage} ${
                importStatus.type === 'success'
                  ? styles.statusSuccess
                  : styles.statusError
              }`}
            >
              {importStatus.type === 'success' ? '✓ ' : '⚠️ '}
              {importStatus.text}
            </div>
          )}
        </div>

        {/* 2. استيراد البيانات القديمة */}
        <div className={styles.legacySection}>
          <h4 className={styles.subSectionTitle}>
            📦 استيراد البيانات القديمة
          </h4>
          <p className={styles.legacyDesc}>
            لو عندك نسخة من التطبيق القديم (FastAPI)، اختار ملف{' '}
            <code>zekr-legacy-backup.json</code> لاستيراد الأذكار والإحصائيات
            والمجموعات.
          </p>

          <button
            type="button"
            className={styles.legacyBtn}
            onClick={handleLegacyImport}
            disabled={loading}
          >
            📂 اختيار ملف zekr-legacy-backup.json
          </button>

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

        {/* 3. التصفير */}
        <div className={styles.optionsList}>
          <h4 className={styles.subSectionTitle}>خيارات التصفير السريع</h4>
          {RESET_OPTIONS.map((item) => (
            <div key={item.id} className={styles.row}>
              <div className={styles.rowInfo}>
                <div className={styles.titleLine}>
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.title}>{item.title}</span>
                </div>
                <p className={styles.desc}>{item.desc}</p>
              </div>

              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setConfirmType(item.id)}
                disabled={loading}
              >
                {item.btnLabel}
              </button>
            </div>
          ))}
        </div>

        {/* 4. منطقة الخطر */}
        <div className={styles.dangerZone}>
          <div className={styles.dangerHeader}>
            <span className={styles.dangerIcon}>{DANGER_OPTION.icon}</span>
            <div className={styles.dangerInfo}>
              <span className={styles.dangerTitle}>{DANGER_OPTION.title}</span>
              <p className={styles.dangerDesc}>{DANGER_OPTION.desc}</p>
            </div>
          </div>

          <button
            type="button"
            className={styles.dangerBtn}
            onClick={() => setConfirmType(DANGER_OPTION.id)}
            disabled={loading}
          >
            {DANGER_OPTION.btnLabel}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmType !== null}
        onClose={() => setConfirmType(null)}
        onConfirm={handleConfirm}
        title={currentConfirmData?.confirmTitle ?? ''}
        message={currentConfirmData?.confirmMessage ?? ''}
        confirmLabel={isResetting ? 'جاري المسح...' : 'نعم، امسح'}
        cancelLabel="إلغاء"
        danger
      />

      <ConfirmModal
        isOpen={pendingFileContent !== null}
        onClose={() => setPendingFileContent(null)}
        onConfirm={handleConfirmImport}
        title="استيراد النسخة الاحتياطية؟"
        message="سيتم إضافة الأذكار والمجموعات الموجودة بالملف إلى تطبيقك. هل تريد المتابعة؟"
        confirmLabel={
          restoreBackupMutation.isPending
            ? 'جاري الاستيراد...'
            : 'نعم، استورد الآن'
        }
        cancelLabel="إلغاء"
      />
    </SettingsSection>
  )
}

export default DataSection
