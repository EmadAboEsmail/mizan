import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Download, X } from 'lucide-react'
import styles from './InstallPrompt.module.scss'

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // لا نعرض إشعار تثبيت الويب داخل تطبيق APK الأصلي
    if (Capacitor.isNativePlatform()) return

    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed === 'true') return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

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
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    try {
      localStorage.setItem('pwa-prompt-dismissed', 'true')
    } catch {
      // تجاهل
    }
  }

  if (!showPrompt) return null

  return (
    <div className={styles.banner} role="region" aria-label="تثبيت التطبيق">
      <div className={styles.icon} aria-hidden="true">
        <Download size={20} strokeWidth={2.1} />
      </div>
      <div className={styles.content}>
        <span className={styles.title}>ثبّت مِيزان</span>
        <span className={styles.desc}>افتحه فوراً بدون إنترنت من شاشتك</span>
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
        <X size={16} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  )
}

export default InstallPrompt
