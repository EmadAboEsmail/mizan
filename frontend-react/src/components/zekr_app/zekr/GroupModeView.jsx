import { useState, useEffect } from 'react'
import GroupSelect from './GroupSelect.jsx'
import ZekrDisplay from './ZekrDisplay.jsx'
import ActionButtons from './ActionButtons.jsx'
import FocusMode from '@/components/zekr_app/zekr/FocusMode.jsx' // ✅ استيراد وضع التركيز
import styles from './GroupModeView.module.scss'

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

function GroupModeView({
  groups = [],
  onAddClick,
  onResetClick,
  onSetTarget,
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [localCount, setLocalCount] = useState(0)
  const [showTransition, setShowTransition] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false) // ✅ حالة وضع التركيز للمجموعات

  // 1. اختيار أول مجموعة تلقائياً إن وُجدت
  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id)
    }
  }, [groups, selectedGroupId])

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)
  const items = selectedGroup?.items ?? []
  const currentItem = items[currentIndex]

  // حماية الفهرس لو حُذفت عناصر
  useEffect(() => {
    if (items.length > 0 && currentIndex >= items.length) {
      setCurrentIndex(0)
      setLocalCount(0)
    }
  }, [items.length, currentIndex])

  // هدف الذكر داخل المجموعة
  const currentTarget = currentItem
    ? currentItem.target ?? currentItem.default_target ?? null
    : null

  // الخروج من وضع التركيز تلقائياً عند إتمام المجموعة كاملة
  useEffect(() => {
    if (isFocusMode && isComplete) {
      const timer = setTimeout(() => setIsFocusMode(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isFocusMode, isComplete])

  // الانتقال للذكر التالي
  const goToNext = () => {
    setShowTransition(false)
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setLocalCount(0)
    } else {
      setIsComplete(true)
    }
  }

  // الرجوع للذكر السابق
  const goToPrev = () => {
    if (currentIndex > 0) {
      setShowTransition(false)
      setCurrentIndex((prev) => prev - 1)
      setLocalCount(0)
    }
  }

  // إعادة البدء
  const restartGroup = () => {
    setIsComplete(false)
    setCurrentIndex(0)
    setLocalCount(0)
  }

  // تغيير المجموعة
  const handleGroupChange = (newGroupId) => {
    setSelectedGroupId(newGroupId)
    setCurrentIndex(0)
    setLocalCount(0)
    setShowTransition(false)
    setIsComplete(false)
    setIsFocusMode(false)
  }

  // مراقبة الوصول للهدف
  useEffect(() => {
    if (!currentItem || !currentTarget) return
    if (localCount < currentTarget) return
    if (showTransition || isComplete) return

    const isLast = currentIndex === items.length - 1

    if (isLast) {
      setIsComplete(true)
      const timer = setTimeout(() => {
        restartGroup()
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setShowTransition(true)
      const timer = setTimeout(() => {
        goToNext()
      }, 2000)
      return () => clearTimeout(timer)
    }
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
    if (!currentItem || !selectedGroup) return
    onSetTarget(selectedGroup.id, currentItem.id, currentTarget)
  }

  if (groups.length === 0) {
    return (
      <div className={styles.emptyView}>
        <div className={styles.emptyIcon}>📂</div>
        <h3>لا توجد مجموعات أذكار بعد</h3>
        <p>قم بإنشاء مجموعتك الأولى من تبويب الإعدادات لتبدأ التسبيح التلقائي.</p>
      </div>
    )
  }

  // محتوى المجموعة التفاعلي (مشترك بين العرض العادي ووضع التركيز)
  const renderGroupContent = () => {
    if (items.length === 0) {
      return (
        <div className={styles.emptyGroupCard}>
          <p>هذه المجموعة لا تحتوي على أذكار حتى الآن.</p>
          <span>أضف أذكاراً إليها من صفحة الإعدادات.</span>
        </div>
      )
    }

    if (isComplete) {
      return (
        <div className={styles.completeCard} onClick={restartGroup} title="اضغط للبدء من جديد">
          <div className={styles.celebrateIcon}>🎉</div>
          <h2 className={styles.completeTitle}>تقبل الله! أتممت الورد</h2>
          <p className={styles.groupName}>{selectedGroup?.name}</p>
          <button type="button" className={styles.restartBtn} onClick={restartGroup}>
            إعادة المجموعة الآن ↺
          </button>
        </div>
      )
    }

    if (showTransition) {
      return (
        <div className={styles.transitionCard} onClick={goToNext} title="اضغط للمتابعة فوراً">
          <div className={styles.doneIcon}>✓</div>
          <h2 className={styles.transitionTitle}>أحسنت! أتممت الذكر</h2>
          <p className={styles.nextPreview}>
            التالي: <strong>{items[currentIndex + 1]?.text ?? ''}</strong>
          </p>
          <span className={styles.skipPrompt}>اضغط في أي مكان للمتابعة فوراً ⏭</span>
        </div>
      )
    }

    return (
      <div className={styles.content}>
        {/* شريط التقدم المجزأ للورد */}
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

        {/* أزرار التنقل تظهر خارج وضع التركيز */}
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
              الذكر {currentIndex + 1} من {items.length}
            </span>

            <button
              type="button"
              className={styles.navBtn}
              onClick={goToNext}
              disabled={currentIndex === items.length - 1}
              title="تخطي للذكر التالي"
            >
              <span>تخطي</span>
              <ArrowLeftIcon />
            </button>
          </div>
        )}

        {/* عرض الذكر والعداد */}
        <ZekrDisplay
          zekrText={currentItem.text}
          count={localCount}
          target={currentTarget}
          onClickCount={handleSetTarget}
          isComplete={!!currentTarget && localCount >= currentTarget}
          isFocusMode={isFocusMode}
        />

        {!currentTarget && (
          <div className={styles.openTargetAlert}>
            <span>هذا الذكر بدون هدف محدد. اضغط "تخطي" عند الانتهاء منه.</span>
          </div>
        )}

        {/* أزرار التسبيح */}
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
          isFocusMode={isFocusMode}
          showReset={!isFocusMode}
        />

        {/* زر تفعيل وضع التركيز للمجموعة */}
        {!isFocusMode && items.length > 0 && (
          <button
            type="button"
            className={styles.focusBtn}
            onClick={() => setIsFocusMode(true)}
            title="الانتقال لوضع التركيز بدون مشتتات"
          >
            🌙 وضع التركيز
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={styles.view}>
      {/* قائمة اختيار المجموعة تختفي أثناء وضع التركيز لمنع التشتيت */}
      {!isFocusMode && (
        <div className={styles.selectWrapper}>
          <GroupSelect
            groups={groups}
            value={selectedGroupId}
            onChange={handleGroupChange}
          />
        </div>
      )}

      {/* التبديل بين وضع التركيز والعرض العادي */}
      {isFocusMode ? (
        <FocusMode
          onCount={handleAddClick}
          onClose={() => setIsFocusMode(false)}>
          {renderGroupContent()}
        </FocusMode>
      ) : (
        renderGroupContent()
      )}
    </div>
  )
}

export default GroupModeView
