import { useState, useRef } from 'react'
import { useZekrData } from '@/contexts/ZekrDataContext'
import { useToast } from '@/contexts/ToastContext'
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
    confirmMessage: 'سيتم تصفير عدد جميع الأذكار الحالية. لا يمكن التراجع عن هذا الإجراء.',
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
    confirmMessage: 'سيتم مسح كافة الرسوم البيانية وسجلات الأيام السابقة نهائياً.',
    icon: '📊',
  },
]

const DANGER_OPTION = {
  id: 'all',
  title: 'مسح شامل لكل البيانات',
  desc: 'إعادة ضبط المصنع: مسح الأعداد الحالية، الأهداف، والإحصائيات نهائياً.',
  btnLabel: 'مسح شامل',
  confirmTitle: 'تحذير: مسح كل البيانات نهائياً؟',
  confirmMessage: 'سيتم حذف كل شيء بلا استثناء (الأعداد، الأهداف، وسجل التسبيح). لا يمكن التراجع أبداً!',
  icon: '⚠️',
}

function DataSection() {
  const {
    handleDeleteAllCounts,
    handleDeleteAllTargets,
    handleDeleteAllClicks,
    handleDeleteAll,
    handleExportBackup,
    handleImportBackup,
    importLegacy, // ⬅️ مهم — ضيفها هنا
  } = useZekrData()

  const { showToast } = useToast()

  const [confirmType, setConfirmType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const [pendingFileContent, setPendingFileContent] = useState(null)
  const [legacyStatus, setLegacyStatus] = useState(null) // ⬅️ جديد

  const fileInputRef = useRef(null)

  const actionHandlers = {
    counts: handleDeleteAllCounts,
    targets: handleDeleteAllTargets,
    clicks: handleDeleteAllClicks,
    all: handleDeleteAll,
  }

  const currentConfirmData =
    confirmType === 'all'
      ? DANGER_OPTION
      : RESET_OPTIONS.find((opt) => opt.id === confirmType)

  const handleConfirm = async () => {
    if (!confirmType || !actionHandlers[confirmType]) return

    setLoading(true)
    try {
      await actionHandlers[confirmType]()
      setConfirmType(null)
      showToast('تمت العملية بنجاح')
    } catch (err) {
      console.error('فشل تنفيذ عملية المسح:', err)
      showToast('فشلت العملية، يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
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

    setLoading(true)
    setImportStatus(null)
    try {
      const result = await handleImportBackup(pendingFileContent)
      setImportStatus({
        type: 'success',
        text: `تم استرجاع البيانات بنجاح (${result.count} ذكر ومجموعاتها).`,
      })
      showToast('تم استيراد النسخة الاحتياطية بنجاح!')
      setPendingFileContent(null)
    } catch (err) {
      setImportStatus({
        type: 'error',
        text: err.message || 'فشل استيراد النسخة الاحتياطية، تأكد من صحة الملف.',
      })
      setPendingFileContent(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExportClick = async () => {
    try {
      await handleExportBackup()
      showToast('تم تصدير النسخة الاحتياطية بنجاح!')
    } catch (err) {
      // الـ context already shows a toast on error
    }
  }

  // ⬅️ دالة استيراد zekr.db القديم
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
        const res = await importLegacy(legacy)

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
          text: `⚠️ فشل: ${err.message || 'خطأ غير متوقع'}`,
        })
        showToast('فشل الاستيراد')
      } finally {
        setLoading(false)
      }
    }

    input.click()
  }

  return (
    <SettingsSection id="data" title="إدارة البيانات والذاكرة">
      <div className={styles.container}>
        {/* 1. النسخ الاحتياطي */}
        <div className={styles.backupSection}>
          <h4 className={styles.subSectionTitle}>النسخ الاحتياطي السحابي والمحلي</h4>

          <div className={styles.backupGrid}>
            <div className={styles.backupCard}>
              <div className={styles.backupHeader}>
                <span className={styles.backupIcon}>📥</span>
                <div>
                  <span className={styles.backupTitle}>تصدير نسخة احتياطية</span>
                  <p className={styles.backupDesc}>
                    حفظ ملف JSON يحوي كل أذكارك، أهدافك، ومجموعاتك لنقلها لأي جهاز.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={handleExportClick}
              >
                تنزيل الملف
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
              >
                اختيار ملف
              </button>
            </div>
          </div>

          {importStatus && (
            <div
              className={`${styles.statusMessage} ${importStatus.type === 'success'
                ? styles.statusSuccess
                : styles.statusError
                }`}
            >
              {importStatus.type === 'success' ? '✓ ' : '⚠️ '}
              {importStatus.text}
            </div>
          )}
        </div>

        {/* 2. 🆕 استيراد البيانات القديمة */}
        <div className={styles.legacySection}>
          <h4 className={styles.subSectionTitle}>📦 استيراد البيانات القديمة</h4>
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
              className={`${styles.statusMessage} ${legacyStatus.type === 'success'
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
        confirmLabel={loading ? 'جاري المسح...' : 'نعم، امسح'}
        cancelLabel="إلغاء"
        danger
      />

      <ConfirmModal
        isOpen={pendingFileContent !== null}
        onClose={() => setPendingFileContent(null)}
        onConfirm={handleConfirmImport}
        title="استيراد النسخة الاحتياطية؟"
        message="سيتم إضافة الأذكار والمجموعات الموجودة بالملف إلى تطبيقك. هل تريد المتابعة؟"
        confirmLabel={loading ? 'جاري الاستيراد...' : 'نعم، استورد الآن'}
        cancelLabel="إلغاء"
      />
    </SettingsSection>
  )
}

export default DataSection
