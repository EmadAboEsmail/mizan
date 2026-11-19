import { useMemo, useState } from 'react'
import chapters from '@/data/hisn/chapters.json'
import styles from './HisnLibrary.module.scss'

const normalize = (value) => value.normalize('NFD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').trim()
const index = chapters.map((chapter) => ({
  ...chapter,
  search: normalize([chapter.title, ...chapter.entries.flatMap(({ text, reference }) => [text, reference])].join(' ')),
}))

export default function HisnLibrary() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => index.filter(({ search }) => search.includes(normalize(query))), [query])
  const hasQuery = Boolean(normalize(query))

  return (
    <section className={styles.library} aria-labelledby="hisn-title">
      <h2 id="hisn-title">حصن المسلم</h2>
      <p className={styles.note}>مكتبة للقراءة دون إنترنت. النص والمراجع من النسخة الرقمية، وقد يتضمن المدخل شرحًا أو صيغة بديلة.</p>
      <label htmlFor="hisn-search">ابحث في الأبواب والنصوص والمراجع</label>
      <input id="hisn-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="مثال: الصباح أو النوم" />
      <p role="status" className={styles.note}>{results.length.toLocaleString('ar-EG')} باب</p>
      {!results.length && <p>لا توجد نتائج. جرّب كلمة أقصر.</p>}
      {results.map(({ id, title, entries }) => entries.length === 1 ? (
        <article key={id} className={styles.chapter}>
          <h3>{title} <small>ذكر مستقل</small></h3>
          <Entry entry={entries[0]} />
        </article>
      ) : (
        <details key={`${hasQuery}-${id}`} className={styles.chapter} open={hasQuery || undefined}>
          <summary>{title} <small>مجموعة · {entries.length.toLocaleString('ar-EG')} مدخل</small></summary>
          <ol>{entries.map((entry, count) => <li key={count}><Entry entry={entry} /></li>)}</ol>
        </details>
      ))}
    </section>
  )
}

function Entry({ entry }) {
  return <div className={styles.entry}><p>{entry.text}</p><small>المرجع: {entry.reference}</small></div>
}
