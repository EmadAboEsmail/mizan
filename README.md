<div align="center">

# ميزان · Mizan

**مساحتك الرقمية الهادئة — أذكار وميزانية في تطبيق واحد**

*Your calm digital space — Zekr & Budget in one app*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?style=flat-square&logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](./LICENSE)
[![Made with 🤍](https://img.shields.io/badge/Made_with-🤍-C68B3C?style=flat-square)](#)

[المميزات](#-المميزات) · [التثبيت](#-التشغيل-السريع) · [English](#english-summary)

</div>

---

## 📖 نبذة عن المشروع

**ميزان** تطبيق ويب تقدمي (PWA) وتطبيق أندرويد، يجمع بين أداتين أساسيتين لحياة متوازنة:

<table>
<tr>
<td width="50%">

### 📿 ذِكر
سبحة إلكترونية ذكية لمتابعة أذكارك اليومية مع إحصائيات دقيقة وتجربة هادئة بلا مشتتات.

</td>
<td width="50%">

### 💰 الميزانية
إدارة مالية بسيطة لتتبع الدخل والمصروف بتقارير بصرية وحدود ذكية لكل تصنيف.

</td>
</tr>
</table>

مبني بهوية بصرية دافئة مستوحاة من **الدفاتر الورقية**، يعمل بدون إنترنت كتطبيق ويب تقدمي (PWA) وعبر تطبيق أندرويد أصلي.

---

## ✨ المميزات

### 🎨 التصميم
- هوية "دفتر" الدافئة — ألوان ترابية وذهبية
- وضع ليلي كامل ومريح للعين
- تصميم عربي (RTL) من الأساس
- يعمل على الموبايل والتابلت والحاسوب
- Lazy Loading لكل الشاشات

### 📿 ذِكر
- عدّاد سبحة بحلقة تقدم SVG ناعمة
- **وضع التركيز** (Full Screen) — بدون مشتتات
- 5 أذكار افتراضية + إمكانية إضافة أذكارك
- **مجموعات أذكار** (ورد الصباح، بعد الصلاة...)
- إحصائيات تفصيلية + **سلسلة الأيام** (Streak)
- اهتزاز خفيف عند كل تسبيح

### 💰 الميزانية
- إضافة/تعديل/حذف معاملات بسرعة
- تصنيفات قابلة للتخصيص (لون + أيقونة)
- **حدود ميزانية شهرية** لكل تصنيف
- تقارير بصرية (Donut + Bar Chart)
- مقارنة شهرية + تحليلات ذكية
- تصدير/استيراد **JSON** و **CSV**

### ⚡ تقنية
- Lazy Loading
- يعمل بدون إنترنت (Service Worker)
- حجم الحزمة: **~92KB gzipped**

---

## 🛠️ التقنيات

- **React 19** · **Vite 8** · **Capacitor 8** · **React Router 7** · **Sass**
- **react-window** (virtual scrolling)
- **vite-plugin-pwa** (PWA support)

---

## 🚀 التشغيل السريع

### المتطلبات
- **Node.js** 20+

### خطوات

```bash
# 1. استنسخ المشروع
git clone https://github.com/EmadAboEsmail/mizan.git
cd mizan

# 2. ثبّت الاعتماديات
npm install

# 3. شغّل وضع التطوير
npm run dev
```

افتح http://localhost:5173.

الأوامر المتاحة

```bash
npm run dev      # وضع التطوير
npm run build    # بناء للإنتاج
npm run preview  # معاينة نسخة الإنتاج
npm run lint     # فحص الكود
```

بناء تطبيق أندرويد (APK)

الطريقة السهلة — GitHub Actions:

1. اذهب إلى تبويب Actions في هذا المستودع
2. اختر Build Android APK → Run workflow
3. انتظر 5-10 دقائق
4. حمّل الـ APK من قسم Artifacts

الطريقة اليدوية (على الكمبيوتر):

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

📁 هيكل المشروع

```
mizan/
├── .github/workflows/      # 🤖 GitHub Actions (بناء APK)
├── src/
│   ├── components/         # مكونات (budget, zekr_app, ui, pwa)
│   ├── context/            # React Contexts
│   ├── hooks/              # Custom hooks
│   ├── pages/              # الشاشات
│   ├── styles/             # _tokens.scss (المصدر الوحيد)
│   └── ui/                 # مكتبة مكونات جديدة
├── android/                # مشروع Capacitor
├── public/                 # أيقونات PWA
├── README.md               # هذا الملف
├── LICENSE
└── CONTRIBUTING.md
```

---

🤝 المساهمة

نرحب بمساهماتك! اقرأ CONTRIBUTING.md.

---

📄 الترخيص

MIT License · © 2025 Emad Abo Esmail

---

🙏 شكر وتقدير

· الخطوط: Alexandria · Readex Pro — Google Fonts

---

English Summary

Mizan is an Arabic-first PWA + Android app combining two essential daily tools:

📿 Zekr 💰 Budget
Smart tasbih counter with statistics, groups, focus mode, and daily streaks Simple budget tracking with categories, monthly limits, and visual reports

Stack: React 19 · Vite 8 · Capacitor 8 · Sass · React Router 7
Bundle: ~92KB gzipped · Lazy loaded · Offline-first · Full RTL

```bash
git clone https://github.com/EmadAboEsmail/mizan.git
cd mizan && npm install && npm run dev
```

---

<div align="center">

صُنع بشغف 🤍 بواسطة عماد أبو إسماعيل

⬆ العودة للأعلى

</div>
