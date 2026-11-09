# Plan

_Approved 2026-11-08 20:22_

إصلاح جذري لـ useVibrationEnabled.js: استخدام useSyncExternalStore بدلاً من useState+useEffect لضمان تحديث فوري، وتغيير القيمة الافتراضية من true إلى false (مطفأ) لمنع الارتباك. ثم بناء APK جديد بالأوامر الصحيحة.

## Files

- src/hooks/useVibrationEnabled.js
- src/components/zekr/settings/AppearanceSection.jsx

## Steps

1. إعادة كتابة src/hooks/useVibrationEnabled.js: استخدام useSyncExternalStore بدلاً من useState+useEffect، تغيير القيمة الافتراضية إلى false (مطفأ) بدلاً من true، وقراءة localStorage بشكل خالص.
2. تحديث src/components/zekr/settings/AppearanceSection.jsx: إضافة console.log في handleToggleVibration للتصحيح (اختياري).
3. اختبار في المتصفح: فتح الإعدادات ← الزر رمادي ← الضغط ← أخضر ← التنقل للتسبيح ← العودة والإعدادات لا تزال خضراء.
4. بناء APK جديد: npm run build:android && npx cap sync android ← بناء APK من Android Studio.
