import { useState } from 'react'
import SettingsSection from './SettingsSection.jsx'
import ConfirmModal from '@/components/ui/ConfirmModal.jsx'
import styles from './DataSection.module.scss'

function DataSection({ onDeleteCounts, onDeleteTargets, onDeleteClicks, onDeleteAll }) {
  const [confirm, setConfirm] = useState(null)  // null | 'counts' | 'targets' | 'clicks' | 'all'
  const [loading, setLoading] = useState(false)

  const openConfirm = (type) => setConfirm(type)
  const closeConfirm = () => setConfirm(null)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      if (confirm === 'counts') await onDeleteCounts()
      else if (confirm === 'targets') await onDeleteTargets()
      else if (confirm === 'clicks') await onDeleteClicks()
      else if (confirm === 'all') await onDeleteAll()

      closeConfirm()
    } catch (err) {
      console.error('فشل المسح:', err)
    } finally {
      setLoading(false)
    }
  }

  const CONFIRM_DATA = {
    counts: {
      title: 'مسح كل الأعداد؟',
      message: 'سيتم تصفير عدد كل الأذكار. لا يمكن التراجع.',
    },
    targets: {
      title: 'مسح كل الأهداف؟',
      message: 'سيتم حذف كل الأهداف المعدّلة والرجوع للافتراضي.',
    },
    clicks: {
      title: 'مسح كل الإحصائيات؟',
      message: 'سيتم حذف كل سجل الضغطات. لا يمكن التراجع.',
    },
    all: {
      title: 'مسح كل البيانات؟',
      message: 'سيتم مسح كل الأعداد والأهداف والإحصائيات. لا يمكن التراجع!',
    },
  }

  return (
    <SettingsSection title="البيانات">
      <button className={styles.btn} onClick={() => openConfirm('counts')}>
        مسح الأعداد الحالية
      </button>
      <button className={styles.btn} onClick={() => openConfirm('targets')}>
        مسح الأهداف المعدّلة
      </button>
      <button className={styles.btn} onClick={() => openConfirm('clicks')}>
        مسح الإحصائيات
      </button>
      <button
        className={`${styles.btn} ${styles.danger}`}
        onClick={() => openConfirm('all')}
      >
        مسح كل البيانات
      </button>

      <ConfirmModal
        isOpen={confirm !== null}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        title={confirm ? CONFIRM_DATA[confirm].title : ''}
        message={confirm ? CONFIRM_DATA[confirm].message : ''}
        confirmLabel={loading ? 'جاري...' : 'نعم، امسح'}
        cancelLabel="إلغاء"
        danger
      />
    </SettingsSection>
  )
}

export default DataSection
