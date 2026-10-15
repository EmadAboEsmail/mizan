import { useState, useEffect } from 'react'
import GroupSelect from './GroupSelect.jsx'
import ZekrDisplay from './ZekrDisplay.jsx'
import ActionButtons from './ActionButtons.jsx'
import styles from './GroupModeView.module.scss'

function GroupModeView({
  groups,
  targets,
  onAddClick,
  onResetClick,
  onSetTarget,
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [localCount, setLocalCount] = useState(0) // عداد محلي للذكر الحالي
  const [showTransition, setShowTransition] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)
  const items = selectedGroup?.items ?? []
  const currentItem = items[currentIndex]

  // الهدف المطلوب
  const currentTarget = currentItem
    ? targets[currentItem.zekr_id] ??
    currentItem.target ??
    currentItem.default_target ??
    null
    : null

  // معالجة تغيير المجموعة
  const handleGroupChange = (newGroupId) => {
    setSelectedGroupId(newGroupId)
    setCurrentIndex(0)
    setLocalCount(0)
    setShowTransition(false)
    setIsComplete(false)
  }

  // مراقبة انتهاء الذكر الحالي
  useEffect(() => {
    if (!currentItem || !currentTarget) return
    if (localCount < currentTarget) return
    if (showTransition || isComplete) return

    const isLast = currentIndex === items.length - 1

    if (isLast) {
      setIsComplete(true)
      const timer = setTimeout(() => {
        setIsComplete(false)
        setCurrentIndex(0)
        setLocalCount(0)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setShowTransition(true)
      const timer = setTimeout(() => {
        setShowTransition(false)
        setCurrentIndex((prev) => prev + 1)
        setLocalCount(0)
      }, 2000)
      return () => clearTimeout(timer)
    }
    // فصلنا localCount و currentTarget لكي لا يُلغى المؤقت بدون داعٍ
  }, [localCount, currentTarget, currentIndex, items.length])

  const handleAddClick = () => {
    if (!currentItem) return
    if (currentTarget && localCount >= currentTarget) return
    setLocalCount((prev) => prev + 1)
    onAddClick(currentItem.zekr_id)
  }

  const handleReset = () => {
    if (!currentItem) return
    setLocalCount(0)
    onResetClick(currentItem.zekr_id)
  }

  const handleSetTarget = () => {
    if (!currentItem) return
    onSetTarget(currentItem.zekr_id, currentTarget)
  }

  if (!selectedGroup) {
    return (
      <div className={styles.view}>
        <GroupSelect
          groups={groups}
          value={selectedGroupId}
          onChange={handleGroupChange}
        />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={styles.view}>
        <GroupSelect
          groups={groups}
          value={selectedGroupId}
          onChange={handleGroupChange}
        />
        <p className={styles.empty}>هذه المجموعة لا تحتوي على أذكار بعد.</p>
      </div>
    )
  }

  return (
    <div className={styles.view}>
      <GroupSelect
        groups={groups}
        value={selectedGroupId}
        onChange={handleGroupChange}
      />

      {isComplete ? (
        <div className={styles.complete}>
          <div className={styles.completeIcon}>🎉</div>
          <h2 className={styles.completeTitle}>أتممت المجموعة!</h2>
          <p className={styles.completeText}>{selectedGroup.name}</p>
          <p className={styles.completeHint}>ستعود للتكرار...</p>
        </div>
      ) : showTransition ? (
        <div className={styles.transition}>
          <div className={styles.transitionIcon}>✓</div>
          <h2 className={styles.transitionTitle}>خلصت!</h2>
          <p className={styles.transitionText}>
            التالي: {items[currentIndex + 1]?.text ?? ''}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.progress}>
            الذكر {currentIndex + 1} من {items.length}
          </div>

          <ZekrDisplay
            zekrText={currentItem.text}
            count={localCount}
            target={currentTarget}
            onClickCount={handleSetTarget}
            isComplete={!!currentTarget && localCount >= currentTarget}
          />

          <ActionButtons
            zekrText={currentItem.text}
            onReset={handleReset}
            onClick={handleAddClick}
            progress={
              currentTarget
                ? Math.min((localCount / currentTarget) * 100, 100)
                : 0
            }
            isComplete={!!currentTarget && localCount >= currentTarget}
          />
        </>
      )}
    </div>
  )
}

export default GroupModeView
