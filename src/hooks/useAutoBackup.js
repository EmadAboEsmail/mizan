import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import { getBudgetBackup } from '@/services/budgetService.js'

const INTERVALS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
}

async function runAutoBackup() {
  const data = await getBudgetBackup()
  const content = JSON.stringify(data)
  const fileName = `auto-backup-${new Date().toISOString().split('T')[0]}.json`

  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: `backups/${fileName}`,
      data: content,
      directory: Directory.Data,
      recursive: true,
    })
  } else {
    localStorage.setItem('auto_backup_data', content)
  }

  localStorage.setItem('last_auto_backup_date', Date.now().toString())
}

export const useAutoBackup = (enabled, frequency = 'daily') => {
  const { mutate } = useMutation({
    mutationFn: runAutoBackup,
    onError: (err) => {
      console.error('Auto backup failed:', err)
    },
  })

  useEffect(() => {
    if (!enabled) return

    const lastBackup = localStorage.getItem('last_auto_backup_date')
    const interval = INTERVALS[frequency] || INTERVALS.daily

    if (lastBackup && Date.now() - parseInt(lastBackup, 10) < interval) return

    mutate()
  }, [enabled, frequency, mutate])
}
