# Plan

_Approved 2026-11-09 19:33_

إصلاح مشاكل الهزاز (Vibration) وأزرار الصوت في تطبيق أندرويد.

## Files

- src/utils/haptics.js
- src/pages/zekr/Sabh.jsx

## Steps

1. تعديل `src/utils/haptics.js` لاستخدام `Haptics.vibrate` بدلاً من `Impact` وإضافة `console.log` للتشخيص.
2. تحديث `handleVolumeButton` في `src/pages/zekr/Sabh.jsx` للتعامل بمرونة مع بيانات الحدث الواردة.
3. دفع التعديلات لإعادة البناء عبر GitHub Actions.
