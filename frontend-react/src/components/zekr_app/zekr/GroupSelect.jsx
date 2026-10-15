import styles from './GroupSelect.module.scss'

function GroupSelect({ groups, value, onChange }) {
  if (groups.length === 0) {
    return (
      <div className={styles.empty}>
        لا توجد مجموعات. أضِف واحدة من الإعدادات.
      </div>
    )
  }

  return (
    <select
      className={styles.select}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        اختر مجموعة
      </option>
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name} ({g.items.length})
        </option>
      ))}
    </select>
  )
}

export default GroupSelect
