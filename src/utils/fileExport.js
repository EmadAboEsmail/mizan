import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function exportJsonFile(filename, data) {
  const dataString = JSON.stringify(data, null, 2);

  if (Capacitor.isNativePlatform()) {
    try {
      // حفظ الملف في مجلد الكاش المؤقت
      const result = await Filesystem.writeFile({
        path: filename,
        data: dataString,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      // فتح قائمة المشاركة ليتمكن المستخدم من حفظه أو إرساله
      await Share.share({
        title: 'حفظ النسخة الاحتياطية',
        url: result.uri,
        dialogTitle: 'اختر مكان حفظ الملف',
      });
    } catch (e) {
      console.error('Export failed:', e);
      throw new Error('فشل في حفظ أو مشاركة الملف');
    }
  } else {
    // Fallback for Web Browser
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
