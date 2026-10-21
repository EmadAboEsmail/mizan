import CategoriesSection from '@/components/budget/settings/CategoriesSection.jsx'
import DataSection from '@/components/budget/settings/DataSection.jsx'
import AboutSection from '@/components/budget/settings/AboutSection.jsx'
import styles from './BudgetSettings.module.scss'

function BudgetSettings() {
  return (
    <div className={styles.container}>
      <CategoriesSection />
      <DataSection />
      <AboutSection />
    </div>
  )
}

export default BudgetSettings
