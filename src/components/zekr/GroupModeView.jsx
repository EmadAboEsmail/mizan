import { useState, useEffect } from 'react'
import GroupSelect from './GroupSelect.jsx'
import ZekrDisplay from './ZekrDisplay.jsx'
import ActionButtons from './ActionButtons.jsx'
import FocusMode from '@/components/zekr/FocusMode.jsx'
import styles from './GroupModeView.module.scss'

const ArrowRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

function getVibrationEnabled() {
  try {
    return localStorage.getItem('zekr:vibration') !== 'off'
  } catch {
    return true
  }
}

function vibrate(ms = 12) {
  if (!getVibrationEnabled()) return
  if (!('vibrate' in navigator)) return
  try {
    navigator.vibrate(ms)
  } catch { }
}

function GroupModeView({
  groups = [],
  selectedGroupId,
  onGroupChange,
  onAddClick,
  onResetClick,
  onSetTarget,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [localCount, setLocalCount] = useState(0)
  const [showTransition, setShowTransition] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)
  const items = selectedGroup?.items ?? []
  const currentItem = items[currentIndex]

  const completedCount = showTransition ? currentIndex + 1 : currentIndex

  // حماية الفهرس
  useEffect(() => {
    if (items.length > 0 && currentIndex >= items.length) {
      setCurrentIndex(0)
      setLocalCount(0)
      setShowTransition(false)
    }
  }, [items.length, currentIndex])

  const currentTarget = currentItem
    ? currentItem.target ?? currentItem.default_target ?? null
    : null

  // الخروج من وضع التركيز عند الاكتمال
  useEffect(() => {
    if (isFocusMode && isComplete) {
      const timer = setTimeout(() => setIsFocusMode(false), 3200)
      return () => clearTimeout(timer)
    }
  }, [isFocusMode, isComplete])

  const goToNext = () => {
    setShowTransition(false)
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setLocalCount(0)
    } else {
      setIsComplete(true)
      vibrate([20, 40, 20])
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setShowTransition(false)
      setCurrentIndex((prev) => prev - 1)
      setLocalCount(0)
    }
  }

  const restartGroup = () => {
    setIsComplete(false)
    setCurrentIndex(0)
    setLocalCount(0)
    setShowTransition(false)
  }

  const handleGroupChange = (newGroupId) => {
    onGroupChange(newGroupId)
    setCurrentIndex(0)
    setLocalCount(0)
    setShowTransition(false)
    setIsComplete(false)
    setIsFocusMode(false)
  }

  // ═══════════════════════════════════════
  // Effect 1: كشف اكتمال الهدف
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!currentItem || !currentTarget) return
    if (localCount < currentTarget) return
    if (showTransition || isComplete) return

    vibrate([15, 30, 15])

    const isLast = currentIndex === items.length - 1
    if (isLast) {
      setIsComplete(true)
    } else {
      setShowTransition(true)
    }
  }, [
    localCount,
    currentTarget,
    currentIndex,
    items.length,
    showTransition,
    isComplete,
    currentItem,
  ])

  // ═══════════════════════════════════════
  // Effect 2: انتقال تلقائي من Transition
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!showTransition) return
    const timer = setTimeout(() => {
      setShowTransition(false)
      if (currentIndex < items.length - 1) {
        setCurrentIndex((prev) => prev + 1)
        setLocalCount(0)
      } else {
        setIsComplete(true)
        vibrate([20, 40, 20])
      }
    }, 2200)
    return () => clearTimeout(timer)
  }, [showTransition, currentIndex, items.length])

  // ═══════════════════════════════════════
  // Effect 3: إعادة تلقائية بعد الاكتمال
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!isComplete) return
    const timer = setTimeout(() => {
      setIsComplete(false)
      setCurrentIndex(0)
      setLocalCount(0)
      setShowTransition(false)
    }, 3500)
    return () => clearTimeout(timer)
  }, [isComplete])

  const handleAddClick = () => {
    if (!currentItem) return
    if (currentTarget && localCount >= currentTarget) return
    vibrate(10)
    setLocalCount((prev) => prev + 1)
    onAddClick(currentItem.zekr_id)
  }

  const handleReset = () => {
    if (!currentItem) return
    setLocalCount(0)
    onResetClick(currentItem.zekr_id)
  }

  const handleSetTarget = () => {
    if (!currentItem || !selectedGroup) return
    onSetTarget(selectedGroup.id, currentItem.id, currentTarget)
  }

  if (groups.length === 0) {
    return (
      <div className={styles.emptyView}>
        <div className={styles.emptyIcon}>📂</div>
        <h3 className={styles.emptyTitle}>لا توجد مجموعات أذكار بعد</h3>
        <p className={styles.emptyText}>
          قم بإنشاء مجموعتك الأولى من تبويب الإعدادات لتبدأ الورد.
        </p>
      </div>
    )
  }

  const renderGroupContent = () => {
    if (items.length === 0) {
      return (
        <div className={styles.emptyGroupCard}>
          <div className={styles.emptyIcon}>📿</div>
          <p className={styles.emptyText}>
            هذه المجموعة لا تحتوي على أذكار حتى الآن.
          </p>
          <span className={styles.emptyHint}>
            أضف أذكاراً إليها من صفحة الإعدادات.
          </span>
        </div>
      )
    }

    if (isComplete) {
      return (
        <div
          className={styles.completeCard}
          onClick={restartGroup}
          title="اضغط للبدء من جديد"
        >
          <div className={styles.celebrateIcon}>🎉</div>
          <h2 className={styles.completeTitle}>تقبل الله!</h2>
          <p className={styles.completeSub}>أتممت الورد كاملاً</p>
          <p className={styles.groupName}>{selectedGroup?.name}</p>
          <button
            type="button"
            className={styles.restartBtn}
            onClick={(e) => {
              e.stopPropagation()
              restartGroup()
            }}
          >
            إعادة من جديد ↺
          </button>
        </div>
      )
    }

    if (showTransition) {
      const nextItem = items[currentIndex + 1]
      return (
        <div className={styles.transitionCard}>
          <div className={styles.doneIcon}>
            <CheckIcon />
          </div>
          <h2 className={styles.transitionTitle}>أحسنت!</h2>
          {nextItem ? (
            <>
              <p className={styles.transitionNext}>التالي:</p>
              <p className={styles.nextPreview}>{nextItem.text}</p>
              <button
                type="button"
                className={styles.skipBtn}
                onClick={goToNext}
              >
                متابعة الآن
                <ArrowLeftIcon />
              </button>
            </>
          ) : (
            <p className={styles.transitionNext}>جاري إنهاء الورد...</p>
          )}
        </div>
      )
    }

    return (
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <span className={styles.completionCounter}>
            <span className={styles.counterDone}>{completedCount}</span>
            <span className={styles.counterSlash}>/</span>
            <span className={styles.counterTotal}>{items.length}</span>
            <span className={styles.counterLabel}>مكتملة</span>
          </span>
        </div>

        <div className={styles.storyProgress} aria-label="تقدم المجموعة">
          {items.map((_, idx) => (
            <div
              key={idx}
              className={`${styles.progressBar} ${idx < currentIndex
                  ? styles.barCompleted
                  : idx === currentIndex
                    ? styles.barActive
                    : ''
                }`}
            />
          ))}
        </div>

        {!isFocusMode && (
          <div className={styles.navBar}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={goToPrev}
              disabled={currentIndex === 0}
              title="الذكر السابق"
            >
              <ArrowRightIcon />
              <span>السابق</span>
            </button>

            <span className={styles.stepIndicator}>
              {currentIndex + 1} من {items.length}
            </span>

            <button
              type="button"
              className={styles.navBtn}
              onClick={goToNext}
              disabled={currentIndex === items.length - 1 && !!currentTarget}
              title="تخطي للذكر التالي"
            >
              <span>تخطي</span>
              <ArrowLeftIcon />
            </button>
          </div>
        )}

        <ZekrDisplay
          zekrText={currentItem.text}
          count={localCount}
          target={currentTarget}
          onClickCount={handleSetTarget}
          isComplete={!!currentTarget && localCount >= currentTarget}
          isFocusMode={isFocusMode}
        />

        {!currentTarget && !isFocusMode && (
          <div className={styles.openTargetAlert}>
            <span>هذا الذكر بدون هدف محدد. اضغط "تخطي" عند الانتهاء.</span>
          </div>
        )}

        <ActionButtons
          zekrText={currentItem.text}
          onReset={handleReset}
          onClick={handleAddClick}
          count={localCount}
          progress={
            currentTarget
              ? Math.min((localCount / currentTarget) * 100, 100)
              : 0
          }
          isComplete={!!currentTarget && localCount >= currentTarget}
          isFocusMode={isFocusMode}
          showReset={!isFocusMode}
        />

        {!isFocusMode && items.length > 0 && (
          <button
            type="button"
            className={styles.focusBtn}
            onClick={() => setIsFocusMode(true)}
            title="الانتقال لوضع التركيز"
          >
            🌙 وضع التركيز
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={styles.view}>
      {!isFocusMode && (
        <div className={styles.selectWrapper}>
          <GroupSelect
            groups={groups}
            value={selectedGroupId}
            onChange={handleGroupChange}
          />
        </div>
      )}

      {isFocusMode ? (
        <FocusMode
          onCount={handleAddClick}
          onClose={() => setIsFocusMode(false)}
        >
          {renderGroupContent()}
        </FocusMode>
      ) : (
        renderGroupContent()
      )}
    </div>
  )
}

export default GroupModeView
