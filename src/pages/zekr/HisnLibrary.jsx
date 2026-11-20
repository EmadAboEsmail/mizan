import { getReadingDetails } from '@/data/hisn/readingDetails.js'
import Modal from '@/components/ui/Modal.jsx'
import { Link } from 'react-router-dom'
import { useAddHisnEntryMutation, useGroupsQuery, useInstallPresetGroupMutation } from '@/queries/zekr'
import { countableWirds } from '@/data/hisn/countableWirds.js'
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
  const [selection, setSelection] = useState(null)
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
          <Entry entry={entries[0]} chapter={title} onAdd={setSelection} />
        </article>
      ) : (
        <details key={`${hasQuery}-${id}`} className={styles.chapter} open={hasQuery || undefined}>
          <summary>{title} <small>مجموعة · {entries.length.toLocaleString('ar-EG')} مدخل</small></summary>
          {countableWirds[title] && <WirdInstall pack={countableWirds[title]} />}
          <ol>{entries.map((entry, count) => <li key={count}><Entry entry={entry} chapter={title} onAdd={setSelection} /></li>)}</ol>
        </details>
      ))}
      {selection && <AddToGroup entry={selection} onClose={() => setSelection(null)} />}
    </section>
  )
}

function Entry({ entry, chapter, onAdd }) {
  const curated = getReadingDetails(chapter, entry)
  const reading = curated ?? { ...entry, target: null }
  const { text, reference } = reading
  return (
    <div className={styles.entry}>
      {text.length > 200 ? <details><summary>{text.slice(0, 105)}… اقرأ النص كاملًا</summary><p>{text}</p></details> : <p>{text}</p>}
      {curated ? <details><summary>المرجع وطريقة القراءة</summary><small>{reference}{curated.target ? ` · ${curated.target.toLocaleString('ar-EG')} مرة` : ' · دون هدف محدد في التطبيق'}</small><small>نقل الحصن: {entry.reference}</small></details> : <small>المرجع: {reference}</small>}
      <button type="button" className={styles.entryAction} onClick={() => onAdd({ ...reading, curated: Boolean(curated) })}>أضف إلى مجموعة</button>
    </div>
  )
}

function AddToGroup({ entry, onClose }) {
  const { data: groups = [], isPending } = useGroupsQuery()
  const [groupId, setGroupId] = useState('')
  const [groupName, setGroupName] = useState('')
  const [target, setTarget] = useState(() => entry.target == null ? '' : String(entry.target))
  const creating = groupId === '__new__'
  const ready = creating ? Boolean(groupName.trim()) : Boolean(groupId)
  const [saved, setSaved] = useState(null)
  const { mutateAsync, isPending: saving, error } = useAddHisnEntryMutation()
  const save = async (event) => {
    event.preventDefault()
    if (!ready || saving || saved) return
    try {
      setSaved(await mutateAsync({ groupId: creating ? null : groupId, groupName: creating ? groupName : null, text: entry.text, reference: entry.reference, target: target ? Number(target) : null }))
    } catch { /* error is displayed below */ }
  }
  return (
    <Modal isOpen onClose={() => { if (!saving) onClose() }} title="أضف ذكرًا إلى مجموعة">
      <form className={styles.addForm} onSubmit={save}>
        <details><summary>عرض النص الذي سيتم حفظه</summary><p className={styles.fullText}>{entry.text}</p></details>
        <p className={styles.note}>{entry.curated ? 'سيُحفظ النص منفصلًا عن المرجع.' : 'سيُحفظ نص المدخل الرقمي كما هو، وقد يتضمن شرحًا أو صيغة بديلة.'} تقدر تعدّل هدف العد أو تسيبه فارغًا.</p>
        <label htmlFor="hisn-group">المجموعة</label>
        <select id="hisn-group" required value={groupId} onChange={(event) => setGroupId(event.target.value)} disabled={saving || Boolean(saved)}>
          <option value="">{isPending ? 'جاري التحميل…' : 'اختر مجموعة'}</option>
          {!isPending && <option value="__new__">+ أنشئ مجموعة جديدة</option>}
          {groups.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </select>
        {creating && <>
          <label htmlFor="hisn-new-group">اسم المجموعة الجديدة</label>
          <input id="hisn-new-group" required maxLength={80} value={groupName} onChange={(event) => setGroupName(event.target.value)} disabled={saving || Boolean(saved)} />
        </>}
        <label htmlFor="hisn-target">هدف عدّ اختياري</label>
        <input id="hisn-target" type="number" min="1" step="1" inputMode="numeric" value={target} onChange={(event) => setTarget(event.target.value)} disabled={saving || Boolean(saved)} />
        {error && <p role="alert">{error.message}</p>}
        {saved ? <p role="status">تمت الإضافة. <Link to={`/zekr/sabh?${new URLSearchParams({ mode: 'group', group: saved.groupId })}`}>افتح المجموعة</Link></p> : <button type="submit" className={styles.entryAction} disabled={!ready || saving}>{saving ? 'جاري الإضافة…' : 'أضف الذكر'}</button>}
      </form>
    </Modal>
  )
}

function WirdInstall({ pack }) {
  const { data: groups = [], isPending } = useGroupsQuery()
  const installed = groups.find(({ name }) => name === pack.name)
  const { mutate, isPending: installing, error } = useInstallPresetGroupMutation()
  return (
    <section className={styles.install} aria-label={pack.name}>
      <strong>مختارات قابلة للعدّ</strong>
      <p>{pack.description}</p>
      <ul>{pack.items.map(({ text, target, virtue }) => (
        <li key={text}>{text} · {target.toLocaleString('ar-EG')} مرة <small>{virtue}</small></li>
      ))}</ul>
      {installed ? (
        <Link to={`/zekr/sabh?${new URLSearchParams({ mode: 'group', group: installed.id })}`}>افتح الورد في السبحة</Link>
      ) : (
        <button type="button" disabled={installing || isPending} onClick={() => mutate(pack)}>
          {installing ? 'جاري الإضافة…' : 'أضف المختارات إلى أورادي'}
        </button>
      )}
      {error && !installed && <p role="alert">{error.message || 'تعذّرت إضافة الورد'}</p>}
    </section>
  )
}
