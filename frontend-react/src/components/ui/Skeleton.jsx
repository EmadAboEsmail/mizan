import styles from './Skeleton.module.scss'

export default function Skeleton({
  width = '100%',
  height = '20px',
  radius = 'var(--radius-sm)',
  className = '',
}) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  )
}
