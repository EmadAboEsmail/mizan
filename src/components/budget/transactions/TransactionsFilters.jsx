import { useState } from 'react'
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'
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
  const hasAdvancedFilter = !!(filterCategory || search.trim())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isExpanded = drawerOpen || hasAdvancedFilter

  const visibleCategories =
    filterType === 'all'
      ? categories
      : categories.filter((c) => c.type === filterType)

  const handleClearAll = () => {
    onCategoryChange('')
    onSearchChange('')
    setDrawerOpen(false)
  }

  return (
    <div className={styles.filters}>
      {/* الصف الرئيسي المدمج: نوع المعاملة + زر البحث والتصنيف */}
      <div className={styles.topRow}>
        <div className={styles.typeFilter} role="tablist" aria-label="نوع المعاملة">
          <button
            type="button"
            role="tab"
            aria-selected={filterType === 'all'}
            className={filterType === 'all' ? styles.filterActive : ''}
            onClick={() => onTypeChange('all')}
          >
            الكل
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterType === 'expense'}
            className={`${filterType === 'expense' ? styles.filterActive : ''} ${
              filterType === 'expense' ? styles.activeExpense : ''
            }`}
            onClick={() => onTypeChange('expense')}
          >
            <ArrowUpRight size={14} strokeWidth={2.3} aria-hidden="true" />
            <span>مصروف</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterType === 'income'}
            className={`${filterType === 'income' ? styles.filterActive : ''} ${
              filterType === 'income' ? styles.activeIncome : ''
            }`}
            onClick={() => onTypeChange('income')}
          >
            <ArrowDownLeft size={14} strokeWidth={2.3} aria-hidden="true" />
            <span>دخل</span>
          </button>
        </div>

        <button
          type="button"
          className={`${styles.toggleBtn} ${
            isExpanded ? styles.toggleBtnOpen : ''
          } ${hasAdvancedFilter ? styles.toggleBtnActive : ''}`}
          onClick={() => setDrawerOpen((v) => !v)}
          aria-expanded={isExpanded}
          aria-label="البحث وفلترة التصنيفات"
          title="البحث وفلترة التصنيفات"
        >
          <SlidersHorizontal size={17} strokeWidth={2.1} aria-hidden="true" />
          {hasAdvancedFilter && (
            <span className={styles.activeDot} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* الدرج القابل للطي: البحث + شرائح التصنيفات */}
      {isExpanded && (
        <div className={styles.drawer}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon} aria-hidden="true">
              <Search size={16} strokeWidth={2.1} />
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="ابحث في الوصف أو التفاصيل..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="بحث في المعاملات"
            />
            {search && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => onSearchChange('')}
                aria-label="مسح البحث"
              >
                <X size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
            )}
          </div>

          {visibleCategories.length > 0 && (
            <div
              className={styles.catStrip}
              role="listbox"
              aria-label="فلترة حسب التصنيف"
            >
              <button
                type="button"
                role="option"
                aria-selected={!filterCategory}
                className={`${styles.catChip} ${
                  !filterCategory ? styles.catChipActive : ''
                }`}
                onClick={() => onCategoryChange('')}
              >
                كل التصنيفات
              </button>
              {visibleCategories.map((c) => {
                const active = filterCategory === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`${styles.catChip} ${
                      active ? styles.catChipActive : ''
                    }`}
                    onClick={() => onCategoryChange(active ? '' : c.id)}
                  >
                    {c.icon && <span aria-hidden="true">{c.icon}</span>}
                    <span>{c.name}</span>
                  </button>
                )
              })}
            </div>
          )}

          {hasAdvancedFilter && (
            <button
              type="button"
              className={styles.resetFiltersBtn}
              onClick={handleClearAll}
            >
              <X size={13} strokeWidth={2.4} aria-hidden="true" />
              <span>مسح الفلاتر</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
