import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useModalBackButton } from '@/hooks/useModalBackButton'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import styles from './Modal.module.scss'

let openModalsCount = 0
let originalOverflow = ''
let originalOverscroll = ''

const DISMISS_DISTANCE_PX = 92
const DISMISS_VELOCITY_PX_MS = 0.58

function lockBodyScroll() {
  openModalsCount++
  if (openModalsCount === 1) {
    originalOverflow = document.body.style.overflow
    originalOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'contain'
  }
}

function unlockBodyScroll() {
  openModalsCount = Math.max(0, openModalsCount - 1)
  if (openModalsCount === 0) {
    document.body.style.overflow = originalOverflow
    document.body.style.overscrollBehavior = originalOverscroll
  }
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
  variant = 'center',
  disableBackButton = false,
  hideCloseButton = false,
}) {
  useModalBackButton(isOpen && !disableBackButton, onClose)

  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ active: false, startY: 0, startTime: 0, lastY: 0 })

  // إعادة ضبط السحب عند تغيّر حالة الفتح
  const [prevOpen, setPrevOpen] = useState(isOpen)
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    setDragY(0)
    setIsDragging(false)
  }

  useEffect(() => {
    if (!isOpen) return
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [isOpen])

  if (!isOpen) return null

  const isSheet = variant === 'sheet'

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleDragStart = (e) => {
    if (!isSheet) return
    if (typeof window !== 'undefined' && window.innerWidth >= 640) return
    // لا نبدأ السحب فوق زر الإغلاق
    if (e.target?.closest?.('button')) return

    const y = e.touches ? e.touches[0].clientY : e.clientY
    dragRef.current = {
      active: true,
      startY: y,
      startTime: performance.now(),
      lastY: y,
    }
    setIsDragging(true)
  }

  const handleDragMove = (e) => {
    if (!dragRef.current.active) return
    const y = e.touches ? e.touches[0].clientY : e.clientY
    dragRef.current.lastY = y
    const delta = Math.max(0, y - dragRef.current.startY)
    setDragY(delta)
  }

  const handleDragEnd = () => {
    if (!dragRef.current.active) return
    const { startY, startTime, lastY } = dragRef.current
    dragRef.current.active = false

    const delta = Math.max(0, lastY - startY)
    const elapsed = Math.max(1, performance.now() - startTime)
    const velocity = delta / elapsed

    setIsDragging(false)

    if (delta >= DISMISS_DISTANCE_PX || (delta > 30 && velocity >= DISMISS_VELOCITY_PX_MS)) {
      triggerHapticFeedback('light')
      setDragY(0)
      onClose()
      return
    }
    setDragY(0)
  }

  const sheetStyle =
    isSheet && (isDragging || dragY > 0)
      ? {
          transform: `translateY(${dragY}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }
      : undefined

  return (
    <div
      className={`${styles.overlay} ${styles[variant]}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'نافذة'}
    >
      <div
        className={`${styles.modal} ${styles[variant]}`}
        style={sheetStyle}
      >
        {isSheet && (
          <div
            className={styles.dragZone}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onTouchCancel={handleDragEnd}
            aria-hidden="true"
          >
            <div
              className={`${styles.grabber} ${
                isDragging ? styles.grabberActive : ''
              }`}
            />
          </div>
        )}

        {(title || !hideCloseButton) && (
          <div
            className={styles.header}
            onTouchStart={isSheet ? handleDragStart : undefined}
            onTouchMove={isSheet ? handleDragMove : undefined}
            onTouchEnd={isSheet ? handleDragEnd : undefined}
            onTouchCancel={isSheet ? handleDragEnd : undefined}
          >
            {title ? <h3 className={styles.title}>{title}</h3> : <span />}
            {!hideCloseButton && (
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="إغلاق"
                title="إغلاق"
              >
                <X size={18} strokeWidth={2.3} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}

export default Modal
