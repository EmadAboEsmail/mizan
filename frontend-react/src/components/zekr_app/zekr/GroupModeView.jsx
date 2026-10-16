import { useState, useEffect } from 'react'
import GroupSelect from './GroupSelect.jsx'
import ZekrDisplay from './ZekrDisplay.jsx'
import ActionButtons from './ActionButtons.jsx'
import styles from './GroupModeView.module.scss'

// أيقونات للتنقل
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
  targets = {},
  onAddClick,
  onResetClick,
  onSetTarget,
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [localCount, setLocalCount] = useState(0)
  const [showTransition, setShowTransition] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // 1. اختيار أول مجموعة تلقائياً إن وجدت
  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id)
    }
  }, [groups, selectedGroupId])

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)
  const items = selectedGroup?.items ?? []
  const currentItem = items[currentIndex]

  // حماية الفهرس لو تم حذف عناصر من المجموعة
  useEffect(() => {
    if (items.length > 0 && currentIndex >= items.length) {
      setCurrentIndex(0)
      setLocalCount(0)
    }
  }, [items.length, currentIndex])

  // الهدف المطلوب للذكر الحالي
  const currentTarget = currentItem
    ? targets[currentItem.zekr_id] ??
    currentItem.target ??
    currentItem.default_target ??
    null
    : null

  // معالجة الانتقال للذكر التالي يدوياً أو بعد انتهاء المؤقت
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

  // إعادة البدء من أول ذكر
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
    if (!currentItem) return
    onSetTarget(currentItem.zekr_id, currentTarget)
  }

  // إذا لم تكن هناك مجموعات مضافة في التطبيق
  if (groups.length === 0) {
    return (
      <div className={styles.emptyView}>
        <div className={styles.emptyIcon}>📂</div>
        <h3>لا توجد مجموعات أذكار بعد</h3>
        <p>قم بإنشاء مجموعتك الأولى من تبويب الإعدادات لتبدأ التسبيح التلقائي.</p>
      </div>
    )
  }

  return (
    <div className={styles.view}>
      {/* اختيار المجموعة */}
      <div className={styles.selectWrapper}>
        <GroupSelect
          groups={groups}
          value={selectedGroupId}
          onChange={handleGroupChange}
        />
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyGroupCard}>
          <p>هذه المجموعة لا تحتوي على أذكار حتى الآن.</p>
          <span>أضف أذكاراً إليها من صفحة الإعدادات.</span>
        </div>
      ) : isComplete ? (
        /* شاشة اكتمال المجموعة (مع إمكانية النقر للإعادة فوراً) */
        <div className={styles.completeCard} onClick={restartGroup} title="اضغط للبدء من جديد">
          <div className={styles.celebrateIcon}>🎉</div>
          <h2 className={styles.completeTitle}>تقبل الله! أتممت الورد</h2>
          <p className={styles.groupName}>{selectedGroup?.name}</p>
          <button type="button" className={styles.restartBtn} onClick={restartGroup}>
            إعادة المجموعة الآن ↺
          </button>
        </div>
      ) : showTransition ? (
        /* شاشة الانتقال للذكر التالي (قابلة للنقر للتخطي الفوري) */
        <div className={styles.transitionCard} onClick={goToNext} title="اضغط للمتابعة فوراً">
          <div className={styles.doneIcon}>✓</div>
          <h2 className={styles.transitionTitle}>أحسنت! أتممت الذكر</h2>
          <p className={styles.nextPreview}>
            التالي: <strong>{items[currentIndex + 1]?.text ?? ''}</strong>
          </p>
          <span className={styles.skipPrompt}>اضغط في أي مكان للمتابعة فوراً ⏭</span>
        </div>
      ) : (
        /* واجهة التسبيح في المجموعة */
        <div className={styles.content}>
          {/* شريط التقدم المجزأ (Segmented Progress) */}
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

          {/* شريط التنقل العلوي ومعلومات الذكر */}
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

          {/* عرض الذكر والعداد */}
          <ZekrDisplay
            zekrText={currentItem.text}
            count={localCount}
            target={currentTarget}
            onClickCount={handleSetTarget}
            isComplete={!!currentTarget && localCount >= currentTarget}
          />

          {/* تنبيه إذا كان الذكر مفتوحاً بدون هدف */}
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
          />
        </div>
      )}
    </div>
  )
}

export default GroupModeView
