import { SettingsAccordionProvider } from './SettingsAccordionContext'
import SettingsSectionNav from './SettingsSectionNav'
import SettingsSection from './SettingsSection'
import AppearanceSection from './AppearanceSection'
import GroupsSection from './GroupsSection'
import AdhkarSection from './AdhkarSection'
import DataSection from './DataSection'
import AboutSection from './AboutSection'
import RemindersCard from '@/components/common/RemindersCard.jsx'
import styles from './SettingsTab.module.scss'

function SettingsTab() {
  return (
    <SettingsAccordionProvider>
      <div className={styles.settingsContainer}>
        <SettingsSectionNav />

        <div className={styles.sectionsList}>
          <AppearanceSection />
          <SettingsSection id="reminders" title="التذكيرات اليومية">
            <RemindersCard />
          </SettingsSection>
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
