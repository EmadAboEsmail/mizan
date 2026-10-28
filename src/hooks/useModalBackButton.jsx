import { useEffect, useRef } from 'react'

export function useModalBackButton(isOpen, onClose) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    const id = `modal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const currentState = window.history.state || {}

    // ✅ pushState بنفس الـ URL — يخلي back يقفل المودال مش يخرج من الصفحة
    try {
      window.history.pushState(
        { ...currentState, __modalId: id },
        '',
        window.location.href
      )
    } catch (err) {
      console.warn('[useModalBackButton] pushState failed:', err)
      return
    }

    let handled = false

    const onPop = () => {
      if (handled) return
      handled = true
      onCloseRef.current?.()
    }

    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)

      // ✅ لو المستخدم قفل بزر X مش back → امسح الـ marker بأمان
      if (!handled && window.history.state?.__modalId === id) {
        try {
          const newState = { ...window.history.state }
          delete newState.__modalId
          window.history.replaceState(newState, '', window.location.href)
        } catch (err) {
          console.warn('[useModalBackButton] replaceState failed:', err)
        }
      }
    }
  }, [isOpen])
}
