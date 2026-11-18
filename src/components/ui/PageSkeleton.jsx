import Skeleton from './Skeleton.jsx'
import styles from './PageSkeleton.module.scss'

export default function PageSkeleton({ variant = 'generic' }) {
  return (
    <div
      className={styles.wrapper}
      role="status"
      aria-live="polite"
      aria-label="جاري التحميل"
    >
      <div className={styles.topBar}>
        <Skeleton width="38px" height="38px" borderRadius="999px" />
        <Skeleton width="128px" height="22px" borderRadius="10px" />
        <Skeleton width="38px" height="38px" borderRadius="999px" />
      </div>

      <div className={styles.body}>
        {variant === 'zekr' ? (
          <>
            <Skeleton width="100%" height="44px" borderRadius="999px" />
            <div className={styles.chipsRow}>
              <Skeleton width="96px" height="38px" borderRadius="999px" />
              <Skeleton width="112px" height="38px" borderRadius="999px" />
              <Skeleton width="88px" height="38px" borderRadius="999px" />
            </div>
            <Skeleton width="100%" height="118px" borderRadius="22px" />
            <div className={styles.circleCenter}>
              <Skeleton width="210px" height="210px" borderRadius="999px" />
            </div>
          </>
        ) : (
          <>
            <Skeleton width="100%" height="116px" borderRadius="22px" />
            <div className={styles.chipsRow}>
              <Skeleton width="76px" height="34px" borderRadius="999px" />
              <Skeleton width="84px" height="34px" borderRadius="999px" />
              <Skeleton width="72px" height="34px" borderRadius="999px" />
            </div>
            <div className={styles.listStack}>
              <Skeleton width="100%" height="66px" borderRadius="16px" />
              <Skeleton width="100%" height="66px" borderRadius="16px" />
              <Skeleton width="100%" height="66px" borderRadius="16px" />
              <Skeleton width="100%" height="66px" borderRadius="16px" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
