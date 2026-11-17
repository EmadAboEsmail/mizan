import { SettingsAccordionProvider } from './SettingsAccordionContext'
import SettingsSectionNav from './SettingsSectionNav'
import AppearanceSection from './AppearanceSection'
import GroupsSection from './GroupsSection'
import AdhkarSection from './AdhkarSection'
import DataSection from './DataSection'
import AboutSection from './AboutSection'
import styles from './SettingsTab.module.scss'

function SettingsTab() {
  return (
    <SettingsAccordionProvider>
      <div className={styles.settingsContainer}>
        <SettingsSectionNav />

        <div className={styles.sectionsList}>
          <AppearanceSection />
          <GroupsSection />
          <AdhkarSection />
          <DataSection />
          <AboutSection />
        </div>
      </div>
    </SettingsAccordionProvider>
  )
}

export default SettingsTab
