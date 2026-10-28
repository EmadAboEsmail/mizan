import { SearchIcon } from './transactionsIcons.jsx'
import styles from './TransactionsFilters.module.scss'

export default function TransactionsFilters({
  filterType,
  onTypeChange,
  filterCategory,
  onCategoryChange,
  categories,
  search,
  onSearchChange,
}) {
  return (
    <div className={styles.filters}>
      <div className={styles.typeFilter}>
        <button
          type="button"
          className={filterType === 'all' ? styles.filterActive : ''}
          onClick={() => onTypeChange('all')}
        >
          الكل
        </button>
        <button
          type="button"
          className={filterType === 'expense' ? styles.filterActive : ''}
          onClick={() => onTypeChange('expense')}
        >
          💸 مصروف
        </button>
        <button
          type="button"
          className={filterType === 'income' ? styles.filterActive : ''}
          onClick={() => onTypeChange('income')}
        >
          💰 دخل
        </button>
      </div>

      <div className={styles.filterRow}>
        <select
          className={styles.select}
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="فلترة حسب التصنيف"
        >
          <option value="">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon || '📦'} {c.name}
            </option>
          ))}
        </select>

        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="بحث في التفاصيل..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="بحث في المعاملات"
          />
        </div>
      </div>
    </div>
  )
}
