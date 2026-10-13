import styles from './ZekrDisplay.module.scss'

function ZekrDisplay({ zekrText, count, target, onClickCount, isComplete }) {
  return (
    <div className={styles.display}>
      <div className={styles.text}>{zekrText}</div>
      <div className={`${styles.count} ${isComplete ? styles.complete : ''}`} onClick={onClickCount}>
        {target ? `${count} / ${target}` : count}
      </div>
    </div>
  )
}

export default ZekrDisplay
