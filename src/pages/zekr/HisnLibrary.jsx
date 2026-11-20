import { getReadingDetails } from '@/data/hisn/readingDetails.js'
import Modal from '@/components/ui/Modal.jsx'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAddHisnEntryMutation, useGroupsQuery, useInstallPresetGroupMutation } from '@/queries/zekr'
import { countableWirds } from '@/data/hisn/countableWirds.js'
import { useState } from 'react'
import chapters from '@/data/hisn/chapters.json'
import styles from './HisnLibrary.module.scss'

const normalize = (value) => value.normalize('NFD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').trim()
const index = chapters.map((chapter) => ({
  ...chapter,
  search: normalize([chapter.title, ...chapter.entries.flatMap(({ text, reference }) => [text, reference])].join(' ')),
}))

const libraryPath = '/zekr/hisn'
const chapterPath = (id) => `${libraryPath}/${id}`
const preview = (text) => text.length > 115 ? `${text.slice(0, 112)}…` : text

export default function HisnLibrary() {
  const { chapterId, entryId } = useParams()
  const [params, setParams] = useSearchParams()
  const [selection, setSelection] = useState(null)
  const query = params.get('q') ?? ''
  const needle = normalize(query)
  const chapter = chapterId === undefined ? null : index.find(({ id }) => String(id) === chapterId)
  const position = entryId === undefined ? null : Number(entryId) - 1
  const entry = position === null ? null : chapter?.entries[position]
  const results = chapterId === undefined ? index.filter(({ search }) => search.includes(needle)) : []
  const searchSuffix = query ? `?${new URLSearchParams({ q: query })}` : ''
  const rootLink = `${libraryPath}${searchSuffix}`
  const chapterLink = chapter ? `${chapterPath(chapter.id)}${searchSuffix}` : rootLink

  if ((chapterId !== undefined && !chapter) || (entryId !== undefined && !entry)) {
    return <section className={styles.library}><h2>الصفحة غير موجودة</h2><Link to={rootLink}>فهرس الحصن</Link></section>
  }

  if (entry) {
    const curated = getReadingDetails(chapter.title, entry)
    const reading = curated ?? { ...entry, target: null }
    return (
      <section className={styles.library} aria-labelledby="hisn-entry-title">
        <Link className={styles.backLink} to={chapterLink}>↩ {chapter.title}</Link>
        <h2 id="hisn-entry-title">الذكر {String(position + 1).toLocaleString('ar-EG')}</h2>
        <p className={styles.reading}>{reading.text}</p>
        {!curated && <p className={styles.note}>النص من النسخة الرقمية وقد يتضمن شرحًا أو صيغة بديلة.</p>}
        <div className={styles.reference}><h3>المرجع</h3><p>{reading.reference}</p>
          {curated && <details><summary>النقل في الحصن وطريقة القراءة</summary><p>{entry.reference}</p>
            <p>{curated.target ? `${curated.target.toLocaleString('ar-EG')} مرة` : 'دون هدف محدد في التطبيق'}</p></details>}
        </div>
        <div className={styles.readingActions}>
          <button type="button" className={styles.entryAction} onClick={() => setSelection({ ...reading, curated: Boolean(curated) })}>أضف إلى مجموعة</button>
          {position + 1 < chapter.entries.length && <Link className={styles.backLink} to={`${chapterPath(chapter.id)}/${position + 2}${searchSuffix}`}>الذكر التالي ←</Link>}
        </div>
        {selection && <AddToGroup entry={selection} onClose={() => setSelection(null)} />}
      </section>
    )
  }

  if (chapter) return (
    <section className={styles.library} aria-labelledby="hisn-chapter-title">
      <Link className={styles.backLink} to={rootLink}>↩ فهرس الحصن</Link>
      <h2 id="hisn-chapter-title">{chapter.title}</h2>
      <p className={styles.note}>{chapter.entries.length.toLocaleString('ar-EG')} مدخل</p>
      <ol className={styles.flatList}>
        {chapter.entries.map(({ text, reference }, i) => (
          <li key={i}><Link className={styles.listRow} to={`${chapterPath(chapter.id)}/${i + 1}${searchSuffix}`}>
            <span><strong>{preview(text)}</strong><small>{preview(reference)}</small></span><span aria-hidden="true">‹</span>
          </Link></li>
        ))}
      </ol>
      {countableWirds[chapter.title] && <WirdInstall pack={countableWirds[chapter.title]} />}
    </section>
  )

  return (
    <section className={styles.library} aria-labelledby="hisn-title">
      <h2 id="hisn-title">حصن المسلم</h2>
      <p className={styles.note}>مكتبة للقراءة دون إنترنت.</p>
      <label htmlFor="hisn-search">ابحث في الأبواب والنصوص والمراجع</label>
      <input id="hisn-search" type="search" value={query} onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })} placeholder="مثال: الصباح أو النوم" />
      <p role="status" className={styles.note}>{results.length.toLocaleString('ar-EG')} باب</p>
      {!results.length && <p>لا توجد نتائج. جرّب كلمة أقصر.</p>}
      <ul className={styles.flatList}>
        {results.map(({ id, title, entries }) => {
          const match = needle && !normalize(title).includes(needle) ? entries.findIndex(({ text, reference }) => normalize(`${text} ${reference}`).includes(needle)) : -1
          return <li key={id}><Link className={styles.listRow} to={`${chapterPath(id)}${match >= 0 ? `/${match + 1}` : ''}${searchSuffix}`}>
            <span><strong>{title}</strong><small>{match >= 0 ? preview(entries[match].text) : `${entries.length.toLocaleString('ar-EG')} مدخل`}</small></span><span aria-hidden="true">‹</span>
          </Link></li>
        })}
      </ul>
    </section>
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
