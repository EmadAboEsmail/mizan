import { Link, useSearchParams } from 'react-router-dom'
import { SettingsAccordionProvider } from '@/components/zekr/settings/SettingsAccordionContext.jsx'
import AdhkarSection from '@/components/zekr/settings/AdhkarSection.jsx'
import GroupsSection from '@/components/zekr/settings/GroupsSection.jsx'
import styles from './ManageAdhkar.module.scss'

export default function ManageAdhkar() {
  const [params] = useSearchParams()
  const groups = params.get('tab') === 'groups'
  return (
    <SettingsAccordionProvider>
      <div className={styles.page}>
        <nav className={styles.tabs} aria-label="أقسام الإدارة">
          <Link to="/zekr/manage" aria-current={!groups ? 'page' : undefined}>الأذكار</Link>
          <Link to="/zekr/manage?tab=groups" aria-current={groups ? 'page' : undefined}>المجموعات</Link>
        </nav>
        {groups ? <GroupsSection standalone /> : <AdhkarSection standalone />}
      </div>
    </SettingsAccordionProvider>
  )
}
