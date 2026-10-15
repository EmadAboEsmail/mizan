import SettingsSection from './SettingsSection.jsx'
import AppearanceSection from './AppearanceSection.jsx'
import AdhkarSection from './AdhkarSection.jsx'
import GroupsSection from './GroupsSection.jsx'
import DataSection from './DataSection.jsx'
import AboutSection from './AboutSection.jsx'
import styles from './SettingsTab.module.scss'

function SettingsTab({
  adhkar,
  onDeleteCounts,
  onDeleteTargets,
  onDeleteClicks,
  onDeleteAll,
  onAddAdhkar,
  onUpdateAdhkar,
  onDeleteAdhkar,
  groups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddGroupItem,
  onUpdateGroupItem,
  onDeleteGroupItem,
}) {
  return (
    <div className={styles.settings}>
      <AppearanceSection />

      <GroupsSection
        groups={groups}
        onAdd={onAddGroup}
        onUpdate={onUpdateGroup}
        onDelete={onDeleteGroup}
        onAddItem={onAddGroupItem}
        onUpdateItem={onUpdateGroupItem}
        onDeleteItem={onDeleteGroupItem}
        allAdhkar={adhkar}
      />

      <AdhkarSection
        adhkar={adhkar}
        onAdd={onAddAdhkar}
        onUpdate={onUpdateAdhkar}
        onDelete={onDeleteAdhkar}
      />

      <DataSection
        onDeleteCounts={onDeleteCounts}
        onDeleteTargets={onDeleteTargets}
        onDeleteClicks={onDeleteClicks}
        onDeleteAll={onDeleteAll}
      />

      <AboutSection />
    </div>
  )
}

export default SettingsTab
