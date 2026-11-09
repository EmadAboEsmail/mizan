# Plan

_Approved 2026-11-09 19:09_

تعديل آليات استيراد وتصدير البيانات لتتوافق مع بيئة الأندرويد (Capacitor) بدلاً من متصفح الويب التقليدي.

## Files

- src/components/budget/settings/DataSection.jsx

## Steps

1. تحديث دالة triggerDownload لتستخدم Capacitor Share/Filesystem عند اكتشاف بيئة الأندرويد، للسماح بحفظ الملفات في مجلد التنزيلات العام.
2. إضافة خيار استيراد/تصدير إضافي لبيانات الذكر (Zekr) في واجهة DataSection أو إنشاء مكون مشابه في src/components/zekr/settings.
3. تعديل logic الاستيراد ليعتمد على FileReader لقراءة الملفات المرفوعة من الأندرويد عبر Capacitor.
