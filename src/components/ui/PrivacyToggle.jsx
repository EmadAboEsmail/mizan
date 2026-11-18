import { Eye, EyeOff } from 'lucide-react'
import { usePrivacyMode } from '@/hooks/usePrivacyMode.js'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import styles from './PrivacyToggle.module.scss'

export default function PrivacyToggle({ size = 'md' }) {
  const { isPrivate, togglePrivacy } = usePrivacyMode()

  return (
    <button
      type="button"
      className={`${styles.btn} ${size === 'sm' ? styles.sm : ''} ${
        isPrivate ? styles.active : ''
      }`}
      onClick={() => {
        triggerHapticFeedback('light')
        togglePrivacy()
      }}
      aria-pressed={isPrivate}
      aria-label={isPrivate ? 'إظهار المبالغ المالية' : 'إخفاء المبالغ المالية'}
      title={isPrivate ? 'إظهار المبالغ' : 'وضع الخصوصية — إخفاء المبالغ'}
    >
      {isPrivate ? (
        <EyeOff size={size === 'sm' ? 15 : 17} strokeWidth={2.1} aria-hidden="true" />
      ) : (
        <Eye size={size === 'sm' ? 15 : 17} strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  )
}
