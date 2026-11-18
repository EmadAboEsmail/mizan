import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Fingerprint, Delete, ArrowRight } from 'lucide-react'
import { useBudgetLock } from '@/hooks/useBudgetLock.js'
import {
  isNativeBiometricAvailable,
  authenticateNativeBiometric,
  triggerHapticFeedback,
} from '@/utils/haptics.js'
import styles from './BudgetLockGate.module.scss'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del']

export default function BudgetLockGate({ children }) {
  const navigate = useNavigate()
  const { isLocked, biometricEnabled, verifyPin, unlockViaBiometric } =
    useBudgetLock()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [canBio, setCanBio] = useState(false)

  const handleBiometric = useCallback(async () => {
    const ok = await authenticateNativeBiometric(
      'فتح الميزانية',
      'أكّد هويتك بالبصمة لعرض بياناتك المالية'
    )
    if (ok) {
      triggerHapticFeedback('success')
      setPin('')
      setError(false)
      unlockViaBiometric()
    }
  }, [unlockViaBiometric])

  useEffect(() => {
    if (!isLocked || !biometricEnabled) return
    let active = true
    isNativeBiometricAvailable().then((avail) => {
      if (!active) return
      setCanBio(avail)
      if (avail) handleBiometric()
    })
    return () => {
      active = false
    }
  }, [isLocked, biometricEnabled, handleBiometric])

  if (!isLocked) return children

  const handleDigit = async (digit) => {
    if (pin.length >= 4) return
    triggerHapticFeedback('light')
    const next = `${pin}${digit}`
    setPin(next)
    setError(false)

    if (next.length === 4) {
      const ok = await verifyPin(next)
      if (ok) {
        triggerHapticFeedback('success')
        setPin('')
      } else {
        triggerHapticFeedback('heavy')
        setError(true)
        setTimeout(() => setPin(''), 260)
      }
    }
  }

  const handleDelete = () => {
    if (!pin.length) return
    triggerHapticFeedback('light')
    setPin((p) => p.slice(0, -1))
    setError(false)
  }

  return (
    <div className={styles.screen}>
      <button
        type="button"
        className={styles.backBtn}
        onClick={() => navigate('/')}
        aria-label="العودة للرئيسية"
      >
        <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
        <span>الرئيسية</span>
      </button>

      <div className={styles.panel}>
        <div className={styles.lockBadge} aria-hidden="true">
          <Lock size={24} strokeWidth={2.2} />
        </div>
        <h1 className={styles.title}>الميزانية مقفلة</h1>
        <p className={styles.subtitle}>
          {error ? 'رمز غير صحيح، حاول مرة أخرى' : 'أدخل رمز القفل المكوّن من 4 أرقام'}
        </p>

        <div
          className={`${styles.dots} ${error ? styles.dotsShake : ''}`}
          aria-label={`تم إدخال ${pin.length} من 4 أرقام`}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`${styles.dot} ${i < pin.length ? styles.dotFilled : ''} ${
                error ? styles.dotError : ''
              }`}
            />
          ))}
        </div>

        <div className={styles.keypad} dir="ltr">
          {KEYS.map((k) => {
            if (k === 'bio') {
              return canBio && biometricEnabled ? (
                <button
                  key={k}
                  type="button"
                  className={`${styles.key} ${styles.keyAction}`}
                  onClick={handleBiometric}
                  aria-label="فتح بالبصمة"
                >
                  <Fingerprint size={22} strokeWidth={2} />
                </button>
              ) : (
                <span key={k} className={styles.keySpacer} aria-hidden="true" />
              )
            }
            if (k === 'del') {
              return (
                <button
                  key={k}
                  type="button"
                  className={`${styles.key} ${styles.keyAction}`}
                  onClick={handleDelete}
                  disabled={!pin.length}
                  aria-label="مسح آخر رقم"
                >
                  <Delete size={20} strokeWidth={2} />
                </button>
              )
            }
            return (
              <button
                key={k}
                type="button"
                className={styles.key}
                onClick={() => handleDigit(k)}
              >
                {k}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
