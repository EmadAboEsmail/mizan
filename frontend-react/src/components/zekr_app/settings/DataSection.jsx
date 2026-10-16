import { useState } from 'react'
import SettingsSection from './SettingsSection.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './DataSection.module.scss'

// تعريف البيانات خارج المكوّن لمنع إعادة إنشائها مع كل Render
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

function DataSection({ onDeleteCounts, onDeleteTargets, onDeleteClicks, onDeleteAll }) {
  const [confirmType, setConfirmType] = useState(null)
  const [loading, setLoading] = useState(false)

  // ربط المعرفات بدوال المسح بشكل مباشر ونظيف
  const actionHandlers = {
    counts: onDeleteCounts,
    targets: onDeleteTargets,
    clicks: onDeleteClicks,
    all: onDeleteAll,
  }

  // استخراج تفاصيل التأكيد للنوع المحدد حالياً
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

  return (
    <SettingsSection title="إدارة البيانات والذاكرة">
      <div className={styles.container}>

        {/* العمليات الجزئية المنفصلة */}
        <div className={styles.optionsList}>
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

        {/* منطقة الخطر (إعادة ضبط شاملة) */}
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

      {/* نافذة التأكيد الموحدة */}
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
    </SettingsSection>
  )
}

export default DataSection
