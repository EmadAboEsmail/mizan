import { useState, useCallback, useRef, useEffect } from 'react'
import { ToastContext } from '@/contexts/toastContext.js'
import styles from './Toast.module.scss'


export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counterRef = useRef(0)
  const timeoutsRef = useRef(new Set())

  const showToast = useCallback((message, type = 'success') => {
    counterRef.current += 1
    const id = counterRef.current

    setToasts((prev) => [...prev, { id, message, type }])

    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      timeoutsRef.current.delete(timeoutId)
    }, 3000)
    timeoutsRef.current.add(timeoutId)
  }, [])

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

      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

