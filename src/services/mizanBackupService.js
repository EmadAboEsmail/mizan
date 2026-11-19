import { transaction } from '@/db/adapter.js'
import { flush as flushClicks } from './clickBuffer.js'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { getBackup as getZekrBackup, prepareZekrRestore } from './zekrService.js'
import { getBudgetBackup, prepareBudgetRestore } from './budgetService.js'
import { getCurrencyCode, setCurrencyCode } from '@/hooks/useCurrency.js'
import { getDailyZekrGoal, setDailyZekrGoal } from '@/hooks/useDailyZekrGoal.js'

const MAX_AUTO_BACKUPS = 7
const AUTO_BACKUP_DIR = 'backups'
const WEB_BACKUP_KEY = 'mizan_unified_auto_backup_v2'
const LAST_DATE_KEY = 'last_auto_backup_date'
const LAST_FILE_KEY = 'last_auto_backup_file'

/**
 * تصدير نسخة احتياطية شاملة لكل بيانات «مِيزان» (ذِكر + الميزانية + التفضيلات).
 */
export async function getUnifiedMizanBackup() {
  const [zekr, budget] = await Promise.all([
    getZekrBackup(),
    getBudgetBackup(),
  ])
  return {
    app: 'mizan',
    version: '4.0',
    exported_at: Date.now(),
    preferences: {
      currency: getCurrencyCode(),
      daily_zekr_goal: getDailyZekrGoal(),
      theme: localStorage.getItem('theme') || 'light',
      zekr_font_style: localStorage.getItem('mizan_zekr_font_style') || 'naskh',
      zekr_font_scale: localStorage.getItem('mizan_zekr_font_scale') || 'md',
    },
    zekr,
    budget,
  }
}

/**
 * استعادة نسخة شاملة (أو نسخة قديمة خاصة بالميزانية أو الذكر تلقائياً).
 */
export async function restoreUnifiedMizanBackup(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('ملف النسخة الاحتياطية غير صالح')
  }

  const hasZekr = Object.hasOwn(data, 'zekr')
  const hasBudget = Object.hasOwn(data, 'budget')
  const unified = hasZekr || hasBudget
  const restoredZekr = hasZekr || (!unified && Array.isArray(data.adhkar))
  const restoredBudget = hasBudget || (!unified && (Array.isArray(data.categories) || Array.isArray(data.transactions)))
  if ((!restoredZekr && !restoredBudget) || (unified && !(hasZekr && hasBudget))) {
    throw new Error('لا يحتوي الملف على بيانات صالحة للاستعادة')
  }

  const zekr = restoredZekr ? await prepareZekrRestore(unified ? data.zekr : data) : null
  const budget = restoredBudget ? await prepareBudgetRestore(unified ? data.budget : data) : null
  if (zekr) await flushClicks()
  await transaction([...(zekr?.statements ?? []), ...(budget?.statements ?? [])])

  if (data.preferences && typeof data.preferences === 'object') {
    if (data.preferences.currency) setCurrencyCode(data.preferences.currency)
    if (data.preferences.daily_zekr_goal !== undefined) {
      setDailyZekrGoal(data.preferences.daily_zekr_goal)
    }
  }

  return { ok: true, restoredZekr, restoredBudget }
}

/**
 * تنفيذ النسخ الاحتياطي التلقائي الموحّد مع حذف النسخ الأقدم (الاحتفاظ بآخر 7 نسخ).
 */
export async function performUnifiedAutoBackup() {
  const payload = await getUnifiedMizanBackup()
  const content = JSON.stringify(payload)
  const now = new Date()
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')}`
  const fileName = `mizan-auto-${stamp}.json`

  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: `${AUTO_BACKUP_DIR}/${fileName}`,
      data: content,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true,
    })

    // تنظيف النسخ القديمة (نحتفظ بآخر MAX_AUTO_BACKUPS ملفات فقط)
    try {
      const listing = await Filesystem.readdir({
        path: AUTO_BACKUP_DIR,
        directory: Directory.Data,
      })
      const names = (listing?.files || [])
        .map((f) => (typeof f === 'string' ? f : f.name))
        .filter((n) => n && n.endsWith('.json'))
        .sort()
        .reverse()

      const stale = names.slice(MAX_AUTO_BACKUPS)
      for (const oldName of stale) {
        await Filesystem.deleteFile({
          path: `${AUTO_BACKUP_DIR}/${oldName}`,
          directory: Directory.Data,
        }).catch(() => {})
      }
    } catch {
      // تجاهل أخطاء التنظيف
    }
  } else {
    localStorage.setItem(WEB_BACKUP_KEY, content)
    localStorage.removeItem('auto_backup_data')
  }

  const ts = String(Date.now())
  localStorage.setItem(LAST_DATE_KEY, ts)
  localStorage.setItem(LAST_FILE_KEY, fileName)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mizan:auto-backup-change'))
  }
  return { timestamp: Number(ts), fileName }
}

export function getLastAutoBackupMeta() {
  try {
    const ts = parseInt(localStorage.getItem(LAST_DATE_KEY) || '', 10)
    const fileName = localStorage.getItem(LAST_FILE_KEY) || null
    if (!Number.isFinite(ts) || ts <= 0) return null
    return { timestamp: ts, fileName }
  } catch {
    return null
  }
}

export async function restoreLatestAutoBackup() {
  let raw

  if (Capacitor.isNativePlatform()) {
    const preferred = localStorage.getItem(LAST_FILE_KEY)
    let targetFile = preferred

    if (!targetFile) {
      const listing = await Filesystem.readdir({
        path: AUTO_BACKUP_DIR,
        directory: Directory.Data,
      })
      const names = (listing?.files || [])
        .map((f) => (typeof f === 'string' ? f : f.name))
        .filter((n) => n && n.endsWith('.json'))
        .sort()
        .reverse()
      targetFile = names[0] || null
    }

    if (!targetFile) {
      throw new Error('لا توجد نسخة تلقائية محفوظة بعد')
    }

    const res = await Filesystem.readFile({
      path: `${AUTO_BACKUP_DIR}/${targetFile}`,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    })
    raw = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
  } else {
    raw =
      localStorage.getItem(WEB_BACKUP_KEY) ||
      localStorage.getItem('auto_backup_data')
  }

  if (!raw) {
    throw new Error('لا توجد نسخة تلقائية محفوظة بعد')
  }

  const parsed = JSON.parse(raw)
  return restoreUnifiedMizanBackup(parsed)
}
