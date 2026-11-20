import { countableWirds } from './countableWirds.js'

// Only these explicitly identified entries have structured reading metadata.
// Never infer a recitation target from the digital corpus's sourceCount.
const normalize = (text) => text.normalize('NFD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()

export function getReadingDetails(chapter, entry) {
  const pack = countableWirds[chapter]
  if (!pack) return null
  const key = normalize(entry.text)
  const counted = pack.items.find((item) => normalize(item.text) === key)
  if (counted) return { text: counted.text, reference: counted.virtue, target: counted.target }
  if (key.startsWith('اللهم انت ربي لا اله الا انت خلقتني')) {
    return { text: entry.text, reference: 'سيّد الاستغفار — صحيح البخاري (٦٣٠٦).', target: null }
  }
  if (key.startsWith('اللهم بك اصبحنا وبك امسينا') || key.startsWith('اللهم بك امسينا وبك اصبحنا')) {
    return { text: entry.text, reference: 'دعاء الصباح والمساء — الترمذي (٣٣٩١).', target: null }
  }
  return null
}
