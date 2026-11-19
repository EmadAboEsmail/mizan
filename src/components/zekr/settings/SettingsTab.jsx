import { SettingsAccordionProvider } from './SettingsAccordionContext'
import SettingsSectionNav from './SettingsSectionNav'
import SettingsSection from './SettingsSection'
import AppearanceSection from './AppearanceSection'
import { Link } from 'react-router-dom'
import DataSection from './DataSection'
import AboutSection from './AboutSection'
import RemindersCard from '@/components/common/RemindersCard.jsx'
import styles from './SettingsTab.module.scss'

function SettingsTab() {
  return (
    <SettingsAccordionProvider>
      <div className={styles.settingsContainer}>
        <SettingsSectionNav exclude={['groups', 'adhkar']} />

        <div className={styles.sectionsList}>
          <AppearanceSection />
          <SettingsSection id="reminders" title="التذكيرات اليومية">
            <RemindersCard />
          </SettingsSection>
          <Link to="/zekr/manage">إدارة الأذكار والمجموعات</Link>
          <DataSection />
          <AboutSection />
        </div>
      </div>
    </SettingsAccordionProvider>
  )
}

export default SettingsTab
