import { useState, useEffect } from 'react'
import { FolderOpen, Sparkles, RotateCcw, Moon } from 'lucide-react'
import GroupSelect from './GroupSelect.jsx'
import ZekrDisplay from './ZekrDisplay.jsx'
import ActionButtons from './ActionButtons.jsx'
import FocusMode from '@/components/zekr/sabh/FocusMode.jsx'
import { TasbihIcon } from '@/components/ui/BrandIcons.jsx'
import { useVibrationEnabled } from '@/hooks/useVibrationEnabled.js'
import { useVolumeButton } from '@/hooks/useVolumeButton.js'
import { triggerHapticFeedback } from '@/utils/haptics.js'
import { readWirdProgress, writeWirdProgress } from '@/utils/wirdProgress.js'
import styles from './GroupModeView.module.scss'

const EMPTY_ITEMS = []

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

function vibrate(enabled, type = 'light') {
  if (!enabled) return
  triggerHapticFeedback(type)
}

function GroupModeView({
  groups = [],
  selectedGroupId,
  onGroupChange,
  onAddClick,
  onResetClick,
  onSetTarget,
  isModalOpen = false,
}) {
  const selectedGroup = groups.find(
    (g) => String(g.id) === String(selectedGroupId)
  )
  const items = selectedGroup?.items ?? EMPTY_ITEMS
  const effectiveGroupId = selectedGroup?.id ?? selectedGroupId

  const [currentIndex, setCurrentIndex] = useState(
    () => readWirdProgress(effectiveGroupId, items)?.index ?? 0
  )
  const [localCount, setLocalCount] = useState(
    () => readWirdProgress(effectiveGroupId, items)?.count ?? 0
  )
  const [showTransition, setShowTransition] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const vibrationEnabled = useVibrationEnabled()

  // استعادة التقدم تلقائياً عند تغيير المجموعة أو تحميل عناصرها
  const [trackedGroupId, setTrackedGroupId] = useState(effectiveGroupId)
  const [trackedItems, setTrackedItems] = useState(items)
  if (effectiveGroupId !== trackedGroupId || items !== trackedItems) {
    setTrackedGroupId(effectiveGroupId)
    setTrackedItems(items)
    const saved = readWirdProgress(effectiveGroupId, items)
    setCurrentIndex(saved?.index ?? 0)
    setLocalCount(saved?.count ?? 0)
    setShowTransition(false)
    setIsComplete(false)
  }

  // حفظ التقدم تلقائياً عند أي خطوة
  useEffect(() => {
    if (!effectiveGroupId) return
    if (isComplete) {
      writeWirdProgress(effectiveGroupId, items, 0, 0)
      return
    }
    const saveIdx = showTransition
      ? Math.min(currentIndex + 1, Math.max(0, items.length - 1))
      : currentIndex
    const saveCnt = showTransition ? 0 : localCount
    writeWirdProgress(effectiveGroupId, items, saveIdx, saveCnt)
  }, [effectiveGroupId, currentIndex, localCount, showTransition, isComplete, items])

  const currentItem = items[currentIndex] ?? items[0] ?? null
  const completedCount = showTransition ? currentIndex + 1 : currentIndex

  const currentTarget = currentItem
    ? currentItem.target ?? currentItem.default_target ?? null
    : null

  const stepProgressPct =
    currentTarget && currentTarget > 0
      ? Math.min(100, Math.round((localCount / currentTarget) * 100))
      : localCount > 0
        ? 100
        : 0

  useEffect(() => {
    if (isFocusMode && isComplete) {
      const timer = setTimeout(() => setIsFocusMode(false), 3200)
      return () => clearTimeout(timer)
    }
  }, [isFocusMode, isComplete])

  const goToStep = (idx) => {
    if (idx < 0 || idx >= items.length || idx === currentIndex) return
    vibrate(vibrationEnabled, 'light')
    setShowTransition(false)
    setCurrentIndex(idx)
    setLocalCount(0)
  }

  const goToNext = () => {
    setShowTransition(false)
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setLocalCount(0)
    } else {
      setIsComplete(true)
      vibrate(vibrationEnabled, 'medium')
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
    writeWirdProgress(effectiveGroupId, items, 0, 0)
    setIsComplete(false)
    setCurrentIndex(0)
    setLocalCount(0)
    setShowTransition(false)
  }

  const handleGroupChange = (newGroupId) => {
    onGroupChange(newGroupId)
    setIsFocusMode(false)
  }

  useEffect(() => {
    if (!showTransition) return
    const timer = setTimeout(() => {
      setShowTransition(false)
      if (currentIndex < items.length - 1) {
        setCurrentIndex((prev) => prev + 1)
        setLocalCount(0)
      } else {
        setIsComplete(true)
        vibrate(vibrationEnabled, 'medium')
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [showTransition, currentIndex, items.length, vibrationEnabled])

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
    if (!currentItem || showTransition || isComplete) return
    if (currentTarget && localCount >= currentTarget) return

    const newCount = localCount + 1
    const reachesTarget = !!currentTarget && newCount >= currentTarget

    vibrate(vibrationEnabled, reachesTarget ? 'success' : 'light')
    setLocalCount(newCount)
    onAddClick(currentItem.zekr_id)

    if (reachesTarget) {
      const isLast = currentIndex === items.length - 1
      if (isLast) {
        setIsComplete(true)
      } else {
        setShowTransition(true)
      }
    }
  }

  useVolumeButton(
    () => {
      if (showTransition) {
        goToNext()
        return
      }
      handleAddClick()
    },
    !!currentItem && !isComplete && !isModalOpen
  )

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
        <div className={styles.emptyIcon} aria-hidden="true">
          <FolderOpen size={26} strokeWidth={1.9} />
        </div>
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
          <div className={styles.emptyIcon} aria-hidden="true">
            <TasbihIcon size={26} />
          </div>
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
          <div className={styles.celebrateIcon} aria-hidden="true">
            <Sparkles size={32} strokeWidth={2} />
          </div>
          <h2 className={styles.completeTitle}>تقبّل الله طاعتك</h2>
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
            <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" />
            <span>إعادة من جديد</span>
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

    const canSwipePrev = currentIndex > 0
    const canSwipeNext = currentIndex < items.length - 1

    return (
      <div className={`${styles.content} ${currentItem.text.length > 180 ? styles.longReading : ''}`}>
        <div className={styles.headerRow}>
          <span className={styles.completionCounter}>
            <span className={styles.counterDone}>{completedCount}</span>
            <span className={styles.counterSlash}>/</span>
            <span className={styles.counterTotal}>{items.length}</span>
            <span className={styles.counterLabel}>مكتملة</span>
          </span>

          {!isFocusMode && (currentIndex > 0 || localCount > 0) && (
            <button
              type="button"
              className={styles.restartMiniBtn}
              onClick={restartGroup}
              title="البدء من أول الورد"
            >
              <RotateCcw size={12} strokeWidth={2.3} aria-hidden="true" />
              <span>من الأول</span>
            </button>
          )}
        </div>

        {/* شريط خطوات تفاعلي يعرض اكتمال كل ذكر وتقدّم الذكر الحالي */}
        <div
          className={styles.storyProgress}
          role="group"
          aria-label="خطوات المجموعة"
        >
          {items.map((item, idx) => {
            const isPast = idx < currentIndex
            const isCurrent = idx === currentIndex
            return (
              <button
                key={item.id ?? idx}
                type="button"
                className={`${styles.progressBar} ${
                  isPast
                    ? styles.barCompleted
                    : isCurrent
                      ? styles.barActive
                      : ''
                }`}
                onClick={() => goToStep(idx)}
                aria-label={`الذكر ${idx + 1} من ${items.length}`}
                aria-current={isCurrent ? 'step' : undefined}
                title={item.text}
              >
                {isCurrent && (
                  <span
                    className={styles.barFill}
                    style={{ width: `${stepProgressPct}%` }}
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
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
              <span>{currentIndex === items.length - 1 ? 'إنهاء' : 'التالي'}</span>
              <ArrowLeftIcon />
            </button>
          </div>
        )}

        <ZekrDisplay
          key={currentItem.id ?? currentIndex}
          zekrText={currentItem.text}
          virtue={currentItem.virtue}
          count={localCount}
          target={currentTarget}
          onClickCount={handleSetTarget}
          canSwipePrev={canSwipePrev}
          canSwipeNext={canSwipeNext}
          onSwipePrev={canSwipePrev ? goToPrev : undefined}
          onSwipeNext={canSwipeNext ? goToNext : undefined}
          isComplete={!!currentTarget && localCount >= currentTarget}
          isFocusMode={isFocusMode}
        />

        {!currentTarget && !isFocusMode && (
          <div className={styles.openTargetAlert}>
            <span>هذا الذكر بدون هدف محدد. اضغط &quot;تخطي&quot; عند الانتهاء.</span>
          </div>
        )}

        <ActionButtons
          onReset={handleReset}
          onClick={handleAddClick}
          count={localCount}
          target={currentTarget}
          progress={
            currentTarget
              ? Math.min((localCount / currentTarget) * 100, 100)
              : 0
          }
          isComplete={!!currentTarget && localCount >= currentTarget}
          isFocusMode={isFocusMode}
          showReset={!isFocusMode}
          extraAction={
            !isFocusMode && items.length > 0 ? (
              <button
                type="button"
                className={styles.focusBtn}
                onClick={() => setIsFocusMode(true)}
                title="وضع التركيز"
              >
                <Moon size={15} strokeWidth={2.1} aria-hidden="true" />
                <span>وضع التركيز</span>
              </button>
            ) : null
          }
        />
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
