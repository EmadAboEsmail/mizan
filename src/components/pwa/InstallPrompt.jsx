import { useState, useEffect } from 'react'
import styles from './InstallPrompt.module.scss'

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // ✅ متخزّن في localStorage — لا يظهر تاني لو المستخدم اختار "لاحقًا"
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed === 'true') return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // ✅ إخفاء البانر لما يتثبت
    const installedHandler = () => {
      setShowPrompt(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('تم التثبيت')
    }
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className={styles.banner} role="region" aria-label="تثبيت التطبيق">
      <div className={styles.icon}>📱</div>
      <div className={styles.content}>
        <span className={styles.title}>ثبّت التطبيق</span>
        <span className={styles.desc}>افتحه بسرعة من الشاشة الرئيسية</span>
      </div>
      <button
        type="button"
        className={styles.installBtn}
        onClick={handleInstall}
      >
        تثبيت
      </button>
      <button
        type="button"
        className={styles.dismissBtn}
        onClick={handleDismiss}
        aria-label="إغلاق"
      >
        ✕
      </button>
    </div>
  )
}

export default InstallPrompt
