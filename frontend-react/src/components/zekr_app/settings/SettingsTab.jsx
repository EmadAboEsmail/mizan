import AppearanceSection from './AppearanceSection.jsx'
import GroupsSection from './GroupsSection.jsx'
import AdhkarSection from './AdhkarSection.jsx'
import DataSection from './DataSection.jsx'
import AboutSection from './AboutSection.jsx'
import styles from './SettingsTab.module.scss'

// أيقونة الترس للرأس
const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

function SettingsTab({
  // بيانات الأذكار وإجراءاتها
  adhkar = [],
  onAddAdhkar,
  onUpdateAdhkar,
  onDeleteAdhkar,

  // بيانات المجموعات وإجراءاتها (تدعم الاسمين لضمان عدم حدوث الخطأ نهائياً)
  groups = [],
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddGroupItem,
  onAddItem,
  onUpdateGroupItem,
  onUpdateItem,
  onDeleteGroupItem,
  onDeleteItem,

  // إجراءات مسح البيانات
  onDeleteCounts,
  onDeleteTargets,
  onDeleteClicks,
  onExportBackup,
  onImportBackup, onDeleteAll,
}) {
  // دمج آمن للدوال لضمان أخذ الدالة المتاحة سواء جاءت باسم onAddGroupItem أو onAddItem
  const handleAddItem = onAddGroupItem || onAddItem
  const handleUpdateItem = onUpdateGroupItem || onUpdateItem
  const handleDeleteItem = onDeleteGroupItem || onDeleteItem

  return (
    <div className={styles.settingsContainer}>
      {/* رأس تبويب الإعدادات */}
      <div className={styles.pageHeader}>
        <div className={styles.headerIconWrapper}>
          <SettingsIcon />
        </div>
        <div className={styles.headerTextGroup}>
          <h2 className={styles.pageTitle}>الإعدادات</h2>
          <p className={styles.pageSubtitle}>
            خصّص مظهر التطبيق، رتّب أذكارك ومجموعاتك، وتحكّم في بياناتك
          </p>
        </div>
      </div>

      {/* قائمة أقسام الإعدادات */}
      <div className={styles.sectionsList}>
        {/* 1. تخصيص المظهر (ثيم فاتح / داكن) */}
        <AppearanceSection />

        {/* 2. إدارة المجموعات */}
        <GroupsSection
          groups={groups}
          onAdd={onAddGroup}
          onUpdate={onUpdateGroup}
          onDelete={onDeleteGroup}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          allAdhkar={adhkar}
        />

        {/* 3. إدارة قائمة الأذكار */}
        <AdhkarSection
          adhkar={adhkar}
          onAdd={onAddAdhkar}
          onUpdate={onUpdateAdhkar}
          onDelete={onDeleteAdhkar}
        />

        {/* 4. إدارة البيانات والذاكرة */}
        <DataSection
          onDeleteCounts={onDeleteCounts}
          onDeleteTargets={onDeleteTargets}
          onDeleteClicks={onDeleteClicks}
          onDeleteAll={onDeleteAll}
          onExportBackup={onExportBackup}
          onImportBackup={onImportBackup}
        />

        {/* 5. عن التطبيق */}
        <AboutSection />
      </div>
    </div>
  )
}

export default SettingsTab
