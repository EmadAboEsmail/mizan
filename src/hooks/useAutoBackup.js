import { useEffect } from 'react';
import { getBudgetBackup } from '@/services/budgetService.js';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const useAutoBackup = (enabled, frequency = 'daily') => {
  useEffect(() => {
    if (!enabled) return;

    const performBackup = async () => {
      const lastBackup = localStorage.getItem('last_auto_backup_date');
      const now = Date.now();
      
      const intervals = {
        daily: 24 * 60 * 60 * 1000,
        weekly: 7 * 24 * 60 * 60 * 1000,
        monthly: 30 * 24 * 60 * 60 * 1000,
      };

      const interval = intervals[frequency] || intervals.daily;

      if (lastBackup && now - parseInt(lastBackup) < interval) return;

      try {
        const data = await getBudgetBackup();
        const content = JSON.stringify(data);
        const fileName = `auto-backup-${new Date().toISOString().split('T')[0]}.json`;

        if (Capacitor.isNativePlatform()) {
          await Filesystem.writeFile({
            path: `backups/${fileName}`,
            data: content,
            directory: Directory.Data,
            recursive: true,
          });
        } else {
          localStorage.setItem('auto_backup_data', content);
        }

        localStorage.setItem('last_auto_backup_date', now.toString());
      } catch (err) {
        console.error('Auto backup failed:', err);
      }
    };

    performBackup();
  }, [enabled, frequency]);
};
