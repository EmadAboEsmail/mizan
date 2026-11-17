import { useState, useCallback, useRef, useEffect } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { ToastContext } from '@/contexts/toastContext.js'
import styles from './Toast.module.scss'

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counterRef = useRef(0)
  const timeoutsRef = useRef(new Map())

  const dismissToast = useCallback((id) => {
    const timer = timeoutsRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timeoutsRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message, type = 'success') => {
      counterRef.current += 1
      const id = counterRef.current

      setToasts((prev) => [...prev.slice(-2), { id, message, type }])

      const timeoutId = setTimeout(() => {
        timeoutsRef.current.delete(id)
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 2800)
      timeoutsRef.current.set(id, timeoutId)
    },
    []
  )

  useEffect(() => {
    const pending = timeoutsRef.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className={styles.toastContainer} aria-live="polite">
        {toasts.map((toast) => {
          const IconComp = TOAST_ICONS[toast.type] || Info
          return (
            <div
              key={toast.id}
              role="status"
              onClick={() => dismissToast(toast.id)}
              className={`${styles.toast} ${styles[toast.type] || styles.info}`}
            >
              <span className={styles.icon} aria-hidden="true">
                <IconComp size={18} strokeWidth={2.2} />
              </span>
              <span className={styles.message}>{toast.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
