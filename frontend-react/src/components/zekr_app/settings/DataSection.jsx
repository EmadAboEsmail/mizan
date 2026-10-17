import { useState, useRef } from 'react'
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

function DataSection({
  onDeleteCounts,
  onDeleteTargets,
  onDeleteClicks,
  onDeleteAll,
  onExportBackup,
  onImportBackup,
}) {
  const [confirmType, setConfirmType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [importStatus, setImportStatus] = useState(null) // رسائل نجاح أو خطأ
  const [pendingFileContent, setPendingFileContent] = useState(null)

  const fileInputRef = useRef(null)

  const actionHandlers = {
    counts: onDeleteCounts,
    targets: onDeleteTargets,
    clicks: onDeleteClicks,
    all: onDeleteAll,
  }

  const currentConfirmData = confirmType === 'all'
    ? DANGER_OPTION
    : RESET_OPTIONS.find((opt) => opt.id === confirmType)

  const handleConfirm = async () => {
    if (!confirmType || !actionHandlers[confirmType]) return

    setLoading(true)
    try {
      await actionHandlers[confirmType]()
      setConfirmType(null)
    } catch (err) {
      console.error('فشل تنفيذ عملية المسح:', err)
    } finally {
      setLoading(false)
    }
  }

  // عند اختيار المستخدم لملف النسخة الاحتياطية
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setPendingFileContent(event.target.result)
    }
    reader.readAsText(file)

    // تفريغ الحقل لاختياره مجدداً مستقبلاً
    e.target.value = ''
  }

  // تنفيذ استيراد النسخة بعد التأكيد
  const handleConfirmImport = async () => {
    if (!pendingFileContent) return

    setLoading(true)
    setImportStatus(null)
    try {
      const result = await onImportBackup(pendingFileContent)
      setImportStatus({
        type: 'success',
        text: `تم استرجاع البيانات بنجاح (${result.count} ذكر ومجموعاتها).`,
      })
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

  return (
    <SettingsSection title="إدارة البيانات والذاكرة">
      <div className={styles.container}>

        {/* ===================================
            1. قسم النسخ الاحتياطي (Backup & Restore)
        =================================== */}
        <div className={styles.backupSection}>
          <h4 className={styles.subSectionTitle}>النسخ الاحتياطي السحابي والمحلي</h4>

          <div className={styles.backupGrid}>
            {/* بطاقة التصدير */}
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
                onClick={onExportBackup}
              >
                تنزيل الملف
              </button>
            </div>

            {/* بطاقة الاستيراد */}
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

              {/* حقل رفع الملف غير المرئي */}
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

          {/* رسالة حالة الاستيراد */}
          {importStatus && (
            <div
              className={`${styles.statusMessage} ${importStatus.type === 'success' ? styles.statusSuccess : styles.statusError
                }`}
            >
              {importStatus.type === 'success' ? '✓ ' : '⚠️ '}
              {importStatus.text}
            </div>
          )}
        </div>

        {/* ===================================
            2. العمليات الجزئية والتصفير
        =================================== */}
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

        {/* ===================================
            3. منطقة الخطر (إعادة ضبط شاملة)
        =================================== */}
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

      {/* نافذة تأكيد عمليات المسح */}
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

      {/* نافذة تأكيد استيراد ملف النسخة الاحتياطية */}
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
