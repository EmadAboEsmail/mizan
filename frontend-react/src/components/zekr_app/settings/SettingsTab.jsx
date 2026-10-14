import AboutSection from './AboutSection.jsx'
import AppearanceSection from './AppearanceSection.jsx'
import DataSection from './DataSection.jsx'
import styles from './SettingsTab.module.scss'

import AdhkarSection from './AdhkarSection.jsx'


function SettingsTab({
  adhkar,
  onDeleteCounts, onDeleteTargets, onDeleteClicks, onDeleteAll,
  onAddAdhkar, onUpdateAdhkar, onDeleteAdhkar,
}) {
  return (
    <div className={styles.settings}>
      <AppearanceSection />
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
