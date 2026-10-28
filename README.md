🎨 Mizan — الحزمة النهائية الشخصية

جاهز! كل الملفات مخصصة لاسمك. نفّذ الأوامر بالترتيب.

---

1️⃣ README.md (استبدل الملف بالكامل)

```markdown
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

[المميزات](#-المميزات) · [التقنيات](#-التقنيات) · [التثبيت](#-التثبيت-والتشغيل) · [English](#english-summary)

</div>

---

## 📖 نبذة عن المشروع

**ميزان** منصة عربية تجمع بين أداتين أساسيتين لحياة متوازنة:

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
- Lazy Loading لكل الشاشات (تحميل فوري)

### 📿 ذِكر
- عدّاد سبحة بحلقة تقدم SVG ناعمة
- **وضع التركيز** (Full Screen) — بدون مشتتات
- 5 أذكار افتراضية + إمكانية إضافة أذكارك
- **مجموعات أذكار** (ورد الصباح، بعد الصلاة...)
- إحصائيات تفصيلية + **سلسلة الأيام** (Streak)
- اهتزاز خفيف عند كل تسبيح
- تخزين محلي آمن

### 💰 الميزانية
- إضافة/تعديل/حذف معاملات بسرعة
- تصنيفات قابلة للتخصيص (لون + أيقونة)
- **حدود ميزانية شهرية** لكل تصنيف
- تقارير بصرية (Donut + Bar Chart)
- مقارنة شهرية + تحليلات ذكية
- تصدير/استيراد **JSON** و **CSV**

### ⚡ تقنية
- Lazy Loading (بدون تحميل مسبق لكل شيء)
- يعمل بدون إنترنت (Service Worker)
- بيانات محلية مشفرة في SQLite (Capacitor)
- حجم الحزمة: **~92KB gzipped**

---

## 🛠️ التقنيات

<table>
<tr>
<th>Frontend</th>
<th>Mobile</th>
<th>Build</th>
<th>State</th>
</tr>
<tr>
<td>

- React 19
- React Router 7
- react-window
- Sass

</td>
<td>

- Capacitor 8
- Capacitor SQLite
- StatusBar

</td>
<td>

- Vite 8
- vite-plugin-pwa
- ESLint

</td>
<td>

- React Context
- useReducer
- localStorage

</td>
</tr>
</table>

---

## 🎨 الهوية البصرية

| Element | Light | Dark |
|---------|-------|------|
| Background | `#FAF6F0` | `#131210` |
| Surface | `#FFFFFF` | `#1C1A17` |
| Ink | `#1C1815` | `#F5F0E8` |
| Zekr Accent | `#2D6A4F` | `#4A9A75` |
| Budget Accent | `#C68B3C` | `#E5A552` |
| Display Font | Alexandria | Alexandria |
| Body Font | Readex Pro | Readex Pro |

> كل الألوان والمسافات معرّفة كـ **CSS Variables** في `src/styles/_tokens.scss` — مصدر الحقيقة الوحيد.

---

## 🚀 التثبيت والتشغيل

### المتطلبات
- **Node.js** 20+ ([تحميل](https://nodejs.org))
- **npm** أو **pnpm**

### خطوات سريعة

```bash
# 1. استنسخ المشروع
git clone https://github.com/emad-aboesmail/mizan.git
cd mizan

# 2. ثبّت الاعتماديات
npm install

# 3. شغّل وضع التطوير
npm run dev
```

افتح http://localhost:5173 في المتصفح.

أوامر متاحة

```bash
npm run dev      # وضع التطوير
npm run build    # بناء للإنتاج
npm run preview  # معاينة نسخة الإنتاج
npm run lint     # فحص الكود
```

بناء تطبيق أندرويد

```bash
# 1. بناء ملفات الويب
npm run build

# 2. مزامنة مع مشروع أندرويد
npx cap sync android

# 3. بناء APK (Debug)
cd android && ./gradlew assembleDebug

# 4. أو فتح المشروع في Android Studio
npx cap open android
```

---

📁 هيكل المشروع

```
mizan/
├── src/
│   ├── components/
│   │   ├── budget/          # 💰 مكونات الميزانية
│   │   │   ├── transactions/    # ← مقسمة لملفات صغيرة
│   │   │   ├── charts/
│   │   │   ├── limits/
│   │   │   └── settings/
│   │   ├── zekr_app/        # 📿 مكونات ذِكر
│   │   │   ├── zekr/
│   │   │   ├── stats/
│   │   │   └── settings/
│   │   ├── ui/              # 🧩 مكونات مشتركة
│   │   └── pwa/             # 📱 تثبيت التطبيق
│   ├── context/             # React Contexts
│   ├── hooks/               # Custom hooks
│   ├── pages/               # الشاشات الرئيسية
│   │   ├── home/
│   │   ├── zekr/
│   │   └── budget/
│   ├── styles/
│   │   ├── _tokens.scss     # 🎨 المصدر الوحيد
│   │   ├── _global.scss
│   │   └── main.scss
│   ├── ui/                  # 🆕 مكتبة مكونات جديدة
│   └── utils/               # أدوات مساعدة
├── android/                 # مشروع أندرويد
└── public/                  # ملفات ثابتة + أيقونات PWA
```

---

🤝 المساهمة

نرحب بمساهماتك! اقرأ CONTRIBUTING.md للتفاصيل.

خطوات سريعة:

1. Fork المشروع
2. أنشئ فرع لميزتك (git checkout -b feature/amazing-feature)
3. Commit التغييرات (git commit -m 'feat: add amazing feature')
4. Push للفرع (git push origin feature/amazing-feature)
5. افتح Pull Request

---

📄 الترخيص

هذا المشروع مرخص تحت MIT License.

© 2025 Emad Abo Esmail · @emad-aboesmail

---

🙏 شكر وتقدير

· الخطوط: Alexandria · Readex Pro — Google Fonts
· الأيقونات: SVG مخصصة (بدون مكتبات خارجية)

---

English Summary

Mizan is an Arabic-first PWA combining two essential daily tools:

📿 Zekr 💰 Budget
Smart tasbih counter with statistics, groups, focus mode, and daily streaks Simple budget tracking with categories, monthly limits, and visual reports

Stack: React 19 · Vite 8 · Capacitor 8 · Sass · React Router 7
Bundle: ~92KB gzipped · Lazy loaded · Offline-first · Full RTL

```bash
git clone https://github.com/emad-aboesmail/mizan.git
cd mizan && npm install && npm run dev
```

---

<div align="center">

صُنع بشغف 🤍 بواسطة عماد أبو إسماعيل

⬆ العودة للأعلى

</div>
