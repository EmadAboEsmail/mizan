import styles from './CategoryIcon.module.scss'

function CategoryIcon({ category, size = 36 }) {
  const style = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${Math.round(size * 0.55)}px`,
    backgroundColor: category?.color
      ? `${category.color}20`
      : 'rgba(0, 0, 0, 0.04)',
    borderColor: category?.color ? `${category.color}40` : 'transparent',
  }

  return (
    <div className={styles.wrapper} style={style} aria-hidden="true">
      {category?.icon || '📦'}
    </div>
  )
}

export default CategoryIcon
