import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

function uint8ToBase64(bytes) {
  const CHUNK = 0x8000
  const parts = []
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK)))
  }
  return btoa(parts.join(''))
}

/**
 * يحفظ أو يشارك أي ملف (Blob أو Uint8Array) بدقة بايت-ببايت دون إفساد ترميز العربية أو BOM.
 */
export async function downloadOrShareBlob(
  blobOrBytes,
  filename,
  { mimeType = 'application/octet-stream', title = 'تصدير مِيزان' } = {}
) {
  const bytes =
    blobOrBytes instanceof Uint8Array
      ? blobOrBytes
      : new Uint8Array(await blobOrBytes.arrayBuffer())

  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = uint8ToBase64(bytes)
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      })

      try {
        await Share.share({
          title,
          files: [savedFile.uri],
          dialogTitle: 'حفظ أو مشاركة الملف',
        })
      } catch {
        await Share.share({
          title,
          url: savedFile.uri,
          dialogTitle: 'حفظ أو مشاركة الملف',
        })
      }
      return
    } catch (err) {
      // تجاهل إلغاء المستخدم لنافذة المشاركة
      const msg = String(err?.message || '').toLowerCase()
      if (msg.includes('cancel') || msg.includes('dismiss')) return
      console.error('[Export] Native share failed:', err)
      throw new Error('فشل في حفظ أو مشاركة الملف', { cause: err })
    }
  }

  const blob =
    blobOrBytes instanceof Blob
      ? blobOrBytes
      : new Blob([bytes], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportJsonFile(filename, data) {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(data, null, 2))
  await downloadOrShareBlob(jsonBytes, filename, {
    mimeType: 'application/json;charset=utf-8',
    title: 'حفظ النسخة الاحتياطية',
  })
}
