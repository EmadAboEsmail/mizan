import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import Modal from '@/components/ui/Modal.jsx'
import styles from './TransactionsFilters.module.scss'

export default function TransactionsFilters({ filterType, onTypeChange, filterCategory, onCategoryChange, categories, search, onSearchChange }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const active = Number(filterType !== 'all') + Number(Boolean(filterCategory))
  const visibleCategories = filterType === 'all' ? categories : categories.filter(({ type }) => type === filterType)
  const clearFilters = () => {
    onTypeChange('all')
    onCategoryChange('')
  }

  return (
    <div className={styles.filters}>
      <div className={styles.toolbar}>
        <label className={styles.searchBox}>
          <Search size={17} aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} aria-label="بحث في المعاملات" placeholder="ابحث في المعاملات" />
        </label>
        <button className={styles.control} type="button" aria-haspopup="dialog" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
          <SlidersHorizontal size={17} aria-hidden="true" /> فلاتر {active > 0 && <span className={styles.count}>{active.toLocaleString('ar-EG')}</span>}
        </button>
      </div>
      <Modal title="فلاتر المعاملات" isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} variant="sheet">
        <div className={styles.fields}>
          <label htmlFor="txn-filter-type">نوع المعاملة</label>
          <select id="txn-filter-type" value={filterType} onChange={(event) => {
            const type = event.target.value
            onTypeChange(type)
            if (filterCategory && type !== 'all' && !categories.some((category) => category.id === filterCategory && category.type === type)) onCategoryChange('')
          }}>
            <option value="all">الكل</option><option value="expense">مصروف</option><option value="income">دخل</option>
          </select>
          <label htmlFor="txn-filter-category">التصنيف</label>
          <select id="txn-filter-category" value={filterCategory} onChange={(event) => onCategoryChange(event.target.value)}>
            <option value="">كل التصنيفات</option>
            {visibleCategories.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
          </select>
          <div className={styles.dialogActions}>
            <button className={styles.control} type="button" disabled={!active} onClick={clearFilters}>مسح الفلاتر</button>
            <button className={styles.control} type="button" onClick={() => setDrawerOpen(false)}>عرض النتائج</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
