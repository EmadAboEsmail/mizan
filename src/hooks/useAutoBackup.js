import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { performUnifiedAutoBackup } from '@/services/mizanBackupService.js'

const INTERVALS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
}

export const useAutoBackup = (enabled, frequency = 'daily') => {
  const { mutate } = useMutation({
    mutationFn: performUnifiedAutoBackup,
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
