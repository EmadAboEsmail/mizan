
<div align="center">

# ميزان · Mizan

**مساحتك الرقمية الهادئة — أذكار وميزانية في تطبيق واحد**

*Your calm digital space — Zekr & Budget in one app*

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?style=flat-square&logo=capacitor&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-local--first-003B57?style=flat-square&logo=sqlite&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

[نبذة](#-نبذة) · [المميزات](#-المميزات) · [التشغيل](#-التشغيل-السريع) · [المعمارية](#-المعمارية) · [قاعدة البيانات](#-قاعدة-البيانات) · [خطة التطوير](#-خطة-التطوير-الاحترافي) · [English](#english-summary)

</div>

---

## 📖 نبذة

**ميزان** تطبيق عربي (RTL) يعمل كـ **PWA** وكتطبيق **أندرويد** عبر Capacitor، ويجمع أداتين يوميتين:

| 📿 ذِكر | 💰 الميزانية |
|---|---|
| سبحة إلكترونية بأذكار قابلة للتخصيص، ومجموعات (ورد الصباح…)، ووضع تركيز، وإحصائيات وسلسلة أيام. | تتبّع الدخل والمصروف بتصنيفات مخصّصة، وحدود شهرية لكل تصنيف، وتقارير ومقارنات شهرية. |

**المبدأ الأساسي: Local-first.** كل البيانات تُخزَّن على جهاز المستخدم في SQLite، ولا يوجد خادم ولا حساب ولا اتصال بالإنترنت مطلوب للعمل.

---

## ✨ المميزات

### 📿 ذِكر
- عدّاد بحلقة تقدّم، واهتزاز خفيف عند كل تسبيحة (قابل للإيقاف).
- **وضع التركيز** بملء الشاشة مع منع إطفاء الشاشة (Wake Lock).
- أذكار افتراضية + إضافة/تعديل/حذف أذكارك، وهدف لكل ذكر.
- **مجموعات أذكار** بترتيب وأهداف خاصة لكل عنصر.
- إحصائيات (يوم/أسبوع/شهر/سنة) مع مقارنة بالفترة السابقة، و**سلسلة الأيام**.
- تجميع الضغطات في الذاكرة وحفظها دفعة واحدة كل 60 ثانية وعند ذهاب التطبيق للخلفية.

### 💰 الميزانية
- معاملات (دخل/مصروف) مع بحث وتصفية بالشهر والنوع والتصنيف وقائمة افتراضية (virtualized).
- تصنيفات بلون وأيقونة، وحدود شهرية مع تنبيه عند الاقتراب من الحد أو تجاوزه.
- تقارير: Donut حسب التصنيف، وأعمدة شهرية، ومؤشرات (متوسط يومي، أعلى يوم، معدل الادخار…).
- تصدير/استيراد **JSON** و**CSV** واستيراد نسخ قديمة.

### 🎨 عام
- هوية «الدفتر» الدافئة، وضع ليلي، RTL كامل، يعمل على الجوال والتابلت والحاسوب.
- تحميل كسول للصفحات، وتثبيت كـ PWA، ودعم المساحات الآمنة (safe-area) في الأندرويد.

---

## 🛠️ التقنيات

| الطبقة | الأدوات |
|---|---|
| الواجهة | React 19 · React Router 7 · Sass (CSS Modules) · lucide-react · react-window |
| البناء | Vite 8 · vite-plugin-pwa (Workbox) |
| التخزين | SQLite عبر `@capacitor-community/sqlite` (أصلي على أندرويد، و`jeep-sqlite` + `sql.js` WASM على الويب) |
| الأندرويد | Capacitor 8 · Gradle · GitHub Actions لبناء APK |

---

## 🚀 التشغيل السريع

**المتطلبات:** Node.js 20+ (يُنصح بـ 22).

```bash
git clone https://github.com/EmadAboEsmail/mizan.git
cd mizan
npm install
npm run dev          # http://localhost:3000
```

| الأمر | الوظيفة |
|---|---|
| `npm run dev` | وضع التطوير (المنفذ 3000 ثابت `strictPort`) |
| `npm run build` | بناء الإنتاج في `dist/` |
| `npm run preview` | معاينة نسخة الإنتاج |
| `npm run lint` | فحص الكود بـ ESLint |

### بناء تطبيق الأندرويد

**عبر GitHub Actions (الأسهل):** تبويب *Actions* ← *Build Android APK* ← *Run workflow* ← حمّل الـ APK من *Artifacts*.

**يدويًا:**

```bash
VITE_TARGET=android npm run build   # base نسبي + HashRouter
npx cap sync android
cd android && ./gradlew assembleDebug
# الناتج: android/app/build/outputs/apk/debug/app-debug.apk
```

> `VITE_TARGET=android` يبدّل الراوتر إلى `HashRouter` ويجعل `base` نسبيًا (`./`). راجع ملاحظة الـ workflow في [خطة التطوير](#مرحلة-0--تثبيت-الأساس-أسبوع-1).

---

## 🏗️ المعمارية

### نظرة عامة على تدفق البيانات

```
┌────────────────────────── UI (React) ──────────────────────────┐
│  pages/*  ──►  components/*  ──►  hooks / contexts (useBudget,  │
│                                    useZekrData, useToast …)     │
└───────────────────────────────┬─────────────────────────────────┘
                                │ استدعاء دوال async
┌───────────────────────────────▼─────────────────────────────────┐
│ services/*      منطق التطبيق والتحقق والحسابات                    │
│   budgetService · budgetCalculator · zekrService ·               │
│   statsCalculator · clickBuffer (تجميع الضغطات في الذاكرة)         │
└───────────────────────────────┬─────────────────────────────────┘
                                │ SQL (query / run / transaction)
┌───────────────────────────────▼─────────────────────────────────┐
│ db/*   adapter (اتصال SQLite) · schema · seed · migrations        │
│        أندرويد: SQLite أصلي │ ويب: jeep-sqlite + sql.js (WASM)    │
└──────────────────────────────────────────────────────────────────┘
```

### الطبقات ومسؤولياتها

| الطبقة | المسار | المسؤولية | لا يجوز لها |
|---|---|---|---|
| الصفحات | `src/pages` | تركيب المكوّنات وربط الراوتر | تحتوي SQL أو منطق أعمال |
| المكوّنات | `src/components` | عرض وتفاعل | استدعاء `db` مباشرة |
| الحالة | `src/contexts`, `src/hooks` | تخزين الحالة المعروضة وتنسيق الاستدعاءات | حسابات مالية/إحصائية |
| الخدمات | `src/services` | قواعد العمل والتحقق والتجميع | معرفة بالـ React |
| البيانات | `src/db` | الاتصال والمخطط والهجرة والـ seed | معرفة بالواجهة |

### المسارات (Routes)

| المسار | الشاشة |
|---|---|
| `/` | الرئيسية (اختيار التطبيق، متابعة، إحصاءات سريعة) |
| `/zekr/sabh` | السبحة (عادي / مجموعات / تركيز) — يدعم `?zekr=&mode=group&group=` |
| `/zekr/stats` · `/zekr/settings` | إحصائيات الأذكار · إعداداتها |
| `/budget/transactions` · `/budget/reports` · `/budget/settings` | المعاملات · التقارير · الإعدادات والحدود |

### التهيئة (Bootstrap)

`main.jsx`: تهيئة `jeep-sqlite` (ويب فقط) ← `initDB()` (اتصال + هجرة + seed) ← `initClickBuffer()` ← رسم الشجرة:
`Theme → Toast → ZekrData → Budget → Router → App`.

### هيكل المجلدات

```
src/
├── App.jsx · main.jsx
├── components/
│   ├── budget/        charts · insights · limits · settings · transactions (+ lib) · icons
│   ├── zekr/          sabh (شاشة السبحة) · settings · stats
│   ├── pwa/           InstallPrompt
│   └── ui/            Modal · ConfirmModal · PromptModal · EmptyState · ThemeToggle · BottomNav
├── contexts/          Theme · Toast · ZekrData · Budget
├── hooks/             useAnimatedNumber · useModalBackButton
├── pages/             home · zekr · budget
├── services/          budgetService · budgetCalculator · zekrService · statsCalculator · clickBuffer
├── db/                adapter · schema · seed · index (التهيئة والهجرة)
├── styles/            _tokens · _mixins · _global · main
└── utils/             csv · numbers (تطبيع الأرقام العربية)
```

---

## 🗄️ قاعدة البيانات

SQLite باسم `mizan`، إصدار المخطط الحالي **3** (جدول `meta` يحفظ `schema_version`).

| الجدول | الغرض | ملاحظات |
|---|---|---|
| `adhkar` | الأذكار | `id` نصي (`zekr_xxxx`) · `default_target` |
| `counts` | العدّاد الحالي لكل ذكر | `ON DELETE CASCADE` |
| `targets` | هدف مخصّص لكل ذكر | |
| `clicks_hourly` | عدد الضغطات لكل (ذكر، ساعة) | PK مركّب `(zekr_id, hour)`، `hour = ⌊ms / 3600000⌋` (UTC) |
| `groups` · `group_items` | مجموعات الأذكار وعناصرها | ترتيب بـ `position` |
| `categories` | تصنيفات الميزانية | `type ∈ {income, expense}` |
| `transactions` | المعاملات | `amount REAL` · `date` نص `YYYY-MM-DD` |
| `limits` | الحد الشهري لكل تصنيف | فهرس فريد `(category_id, month)` |
| `meta` | `schema_version`, `seeded_at` | |

**اتفاقيات:** المعرّفات نصية ببادئة النوع · التواريخ كنص ISO · المبالغ تُقرَّب لمنزلتين · كل تعديل جماعي (استيراد/استعادة) يجب أن يمرّ عبر `transaction([...])`.

---

## 🧭 اتفاقيات الكود

- **الاستيراد المطلق** عبر `@/` (مثال: `@/services/budgetService.js`) للمسارات خارج المجلد نفسه.
- **ملف SCSS Module لكل مكوّن** بجانبه، والألوان والمسافات من `_tokens.scss` فقط (لا قيم ثابتة).
- **RTL أولًا:** استخدم الخصائص المنطقية (`inset-inline-*`, `margin-inline-*`).
- **الأرقام العربية:** مرّر أي إدخال رقمي عبر `normalizeDigits` / `parseNumber` من `utils/numbers.js`.
- **الخدمات:** ترمي `Error` برسائل عربية مفهومة للمستخدم، والواجهة تعرضها بـ Toast.
- **أسماء الملفات:** المكوّنات `PascalCase.jsx`، والدوال المساعدة `camelCase.js`.

---

## 🩹 استكشاف الأخطاء

| العَرَض | السبب والحل |
|---|---|
| شاشة «فشل تهيئة التطبيق» على الويب | تأكد من وجود `public/assets/sql-wasm.wasm`، وأن المتصفح يدعم IndexedDB |
| عدّاد الإحصائيات لا يعكس آخر تسبيحات | تُحفظ كل 60 ثانية وعند الخلفية؛ الواجهة تضيف المعلّق تلقائيًا |
| الأندرويد يعرض صفحة بيضاء عند إعادة التحميل | ابنِ بـ `VITE_TARGET=android` ليُستخدم `HashRouter` |
| الخطوط لا تظهر دون إنترنت | تُحمَّل حاليًا من Google Fonts؛ انظر المرحلة 3 |

---

# 🚀 خطة التطوير الاحترافي

> **الهدف:** الانتقال بميزان من تطبيق يعمل جيدًا إلى منتج **قابل للصيانة والتوسّع** — معمارية واضحة الحدود، وإدارة حالة قابلة للتوقّع، ونظام تصميم موحّد، وجودة مُثبَتة بالاختبارات والـ CI.

## الحالة الراهنة (نقاط انطلاق)

| المحور | الوضع | الخطر |
|---|---|---|
| المعمارية | طبقات واضحة (db/services/contexts) لكن مجمّعة «حسب النوع» لا «حسب الميزة»؛ والخدمات تكتب SQL مباشرة | متوسط |
| الحالة | سياقان ضخمان (`BudgetContext` ≈ 650 سطرًا، `ZekrDataContext` ≈ 440) يُحمَّلان كلاهما عند الإقلاع | متوسط |
| الواجهة | تصميم جميل ورموز (tokens) جيدة، لكن لا توجد مكوّنات أساسية موحّدة؛ الأيقونات إيموجي وSVG مضمّن رغم وجود `lucide-react` | متوسط |
| الجودة | **لا اختبارات**؛ لا CI للفحص؛ بقايا console.log كثيرة | عالٍ |
| الأداء | حفظ قاعدة الويب كاملة بعد **كل** كتابة؛ الخطوط من CDN؛ حدّ 2000 معاملة في التحميل | متوسط |
| الإصدار | APK debug فقط، بدون توقيع أو إصدارات مُرقّمة | متوسط |

---

## مرحلة 0 — تثبيت الأساس (أسبوع 1)

**الهدف:** لا ننتقل لبناء الجديد على أساس مهتز.

- [ ] دمج إصلاحات الإحصائيات وحفظ الضغطات (`statsCalculator`, `initClickBuffer`).
- [ ] دمج استيراد النسخ القديمة الذري (معاملة واحدة).
- [ ] **توحيد الهوية:** اسم واحد («ميزان») في `manifest` و`index.html` و`capacitor.config.json` والـ README.
- [ ] **توحيد معرّف الأندرويد:** `appId` في Capacitor مقابل `applicationId` في `build.gradle` (قرار قبل أول نشر؛ تغييره لاحقًا = تطبيق جديد).
- [ ] **سير العمل `build-apk.yml`:** يبني بـ `npm run build` دون `VITE_TARGET=android`؛ حدّد الاستراتيجية (HashRouter + base نسبي) وطبّقها في الـ workflow.
- [ ] التحقق من أن `copyWasmAndExitPlugin` (ينهي العملية بـ `process.exit`) لا يمنع توليد `sw.js`؛ وإن كان ملف WASM موجودًا في `public/assets` فالأفضل حذف الـ plugin.
- [ ] إضافة `LICENSE` و`CONTRIBUTING.md` (المشار إليهما في الوثائق).

**معيار القبول:** `npm run build && npm run lint` ينجحان نظيفين، وAPK يعمل على جهاز حقيقي بما فيه إعادة تشغيل التطبيق.

---

## مرحلة 1 — المعمارية (أسبوعان)

### 1.1 التنظيم حسب الميزة (Feature-based)

```
src/
├── app/                    # main, App, providers, router, error boundary
├── features/
│   ├── budget/
│   │   ├── components/  pages/  hooks/  services/  repository/  model/
│   │   └── index.js        # الواجهة العامة الوحيدة للميزة
│   └── zekr/               # بنفس البنية
├── shared/
│   ├── ui/                 # نظام التصميم (المرحلة 3)
│   ├── hooks/  lib/        # numbers, csv, ids, dates
│   └── db/                 # adapter, migrations, transaction helper
└── styles/
```

**قواعد الحدود** (تُفرض بـ `eslint-plugin-boundaries` أو `no-restricted-imports`):
- `features/a` **لا** تستورد من `features/b` إلا عبر `index.js` العام.
- `shared` لا تستورد من `features`.
- `components` لا تستورد من `db` مباشرة.

### 1.2 طبقة المستودعات (Repository)
فصل SQL عن قواعد العمل: `budgetRepository` / `zekrRepository` تحوي الاستعلامات فقط، والخدمات تحوي القواعد. فائدتها: اختبار الخدمات بمستودع وهمي، وتبديل التخزين لاحقًا، وإزالة تكرار الاستعلامات (مثل N+1 في `buildGroupResponse` و`computeLimitsWithProgress`).

### 1.3 نظام هجرات حقيقي
استبدال المنطق الحالي (`if (currentVersion === 2 && SCHEMA_VERSION === 3)`) بمصفوفة مرتّبة:

```js
export const migrations = [
  { version: 1, up: (db) => db.execute(SCHEMA_V1) },
  { version: 2, up: ... },
  { version: 3, up: compressClicks },
]
// يُنفَّذ كل ما هو أعلى من النسخة الحالية، كل خطوة داخل transaction، مع تسجيل النسخة بعد النجاح.
```
مع اختبار لكل هجرة على نسخة قديمة (fixtures).

### 1.4 معالجة الأخطاء والتسجيل
- `AppError` بأنواع (`ValidationError`, `NotFoundError`, `StorageError`) ورسالة مستخدم منفصلة عن رسالة المطوّر.
- `ErrorBoundary` على مستوى الراوت، وشاشة بديلة بدل الانهيار الأبيض.
- `logger` رقيق (يعطّل `debug` في الإنتاج) بدل `console.log` المنتشر.

### 1.5 المعرّفات والتواريخ
- `crypto.randomUUID()` بدل `Math.random()` في توليد المعرّفات.
- مكتبة تواريخ صغيرة داخلية (`shared/lib/dates`) تعالج المنطقة الزمنية بدل تكرار `pad2`/`new Date` في أكثر من ملف، وتحسم مسألة `YYYY-MM-DD` محلي مقابل UTC.

**معيار القبول:** لا ملف يتجاوز ~300 سطر؛ لا استيراد يخرق قواعد الحدود؛ كل SQL داخل المستودعات.

---

## مرحلة 2 — الحالة وتدفق البيانات (أسبوعان)

### 2.1 تفكيك السياقات الضخمة
- فصل **البيانات** عن **الإجراءات** (سياقان أو store واحد بـ selectors) حتى لا يُعاد رسم الشجرة كلها عند كل تغيير.
- اعتماد مكتبة حالة خفيفة (**Zustand**) أو `useReducer` + `useSyncExternalStore`، مع `selectors` لكل شاشة.
- **المزوّدات حسب الراوت:** `BudgetProvider` يُركَّب تحت `/budget` فقط، و`ZekrDataProvider` تحت `/zekr`؛ فلا يُحمَّل التطبيقان معًا عند الإقلاع. الصفحة الرئيسية تقرأ ملخصًا خفيفًا عبر استعلام مستقل.

### 2.2 عدّاد التسبيح
مسار النقر (الأكثر استخدامًا) يجب أن يكون **متزامنًا بلا I/O**:
- التحقق من وجود الذكر من الذاكرة، لا من SQL (حاليًا استعلامان لكل ضغطة).
- العدّاد في store محلي، والكتابة للقاعدة دفعة عبر `clickBuffer` فقط.
- حفظ عند: 60 ثانية، `visibilitychange`، `appStateChange`، والخروج من الشاشة.

### 2.3 أنماط الكتابة والتحميل
- نمط موحّد: **optimistic update + rollback + Toast** في دالة مساعدة واحدة بدل تكرارها في كل CRUD.
- تحميل **تدريجي** للمعاملات (ترقيم/تمرير لا نهائي) بدل الحدّ الثابت 2000.
- إلغاء الطلبات القديمة عند تغيير الشهر بسرعة (token/ignore flag) لتفادي سباق النتائج.

### 2.4 النسخ الاحتياطي الموحّد
ملف واحد `mizan-backup-v{N}.json` يضم الأذكار والميزانية ويحمل `schema_version`، مع استعادة ذرية، ونسخ تلقائي دوري إلى مجلد التطبيق، ومشاركة الملف عبر Share Sheet في الأندرويد.

**معيار القبول:** فتح `/` لا يستعلم عن الميزانية ولا الأذكار الكاملة؛ ضغط 20 نقرة/ثانية لا يُسقط الإطارات (تحقّق بـ Performance profile)؛ النسخ/الاستعادة يعيدان نفس البيانات تمامًا.

---

## مرحلة 3 — نظام التصميم وتجربة الواجهة (3 أسابيع)

### 3.1 الأساس (Design Tokens)
`_tokens.scss` ممتاز كبداية. يُستكمل بـ:
- سلّم طباعة كامل (Display / Title / Body / Caption) بأحجام وأوزان وارتفاع أسطر مسمّاة.
- سلّم مسافات وأنصاف أقطار وظلال ومدد حركة ومنحنيات **مسمّاة** — ومنع القيم الحرّة عبر Stylelint.
- ألوان **دلالية** (`--color-success/warning/danger/info`) منفصلة عن ألوان الميزة (`--zekr`, `--budget`)، مع تدرّجات للوضعين الفاتح والداكن واختبار تباين ≥ 4.5:1.

### 3.2 المكوّنات الأساسية (`shared/ui`)
| المكوّن | الحالات المطلوبة |
|---|---|
| `Button` / `IconButton` | primary · secondary · ghost · danger · loading · disabled · أحجام sm/md/lg |
| `Input` / `Field` / `Select` / `Textarea` | label · hint · error · prefix/suffix · `inputMode` · تطبيع الأرقام العربية |
| `Switch` / `Checkbox` / `SegmentedControl` / `Tabs` | بتحكّم كامل بلوحة المفاتيح |
| `Card` / `ListItem` / `Badge` / `Chip` | variants وحالات التفاعل |
| `Modal` / `BottomSheet` / `ConfirmDialog` | فخ التركيز (focus trap)، Escape، سحب للإغلاق في الـ sheet |
| `Toast` | تراكم، أنواع، إجراء «تراجع»، `aria-live` |
| `Skeleton` / `EmptyState` / `ErrorState` | بدل شاشات التحميل المتفرقة |
| `Icon` | غلاف موحّد حول **lucide-react** يحلّ محلّ الإيموجي في التنقل والأزرار |

**صفحة معرض داخلية** `/dev/ui` (تُستبعد من الإنتاج) تعرض كل مكوّن بكل حالاته في الوضعين، لتكون المرجع البصري والتوثيق الحي.

### 3.3 تجربة الاستخدام
- **الصفحة الرئيسية:** إجراء سريع (متابعة آخر ذكر، إضافة معاملة)، وإظهار ملخص اليوم.
- **السبحة:** تحسين منطقة اللمس (كامل الشاشة قابل للنقر في وضع التركيز)، احتفال خفيف عند بلوغ الهدف، `@capacitor/haptics` بدل `navigator.vibrate` في الأندرويد.
- **الميزانية:** إضافة معاملة بخطوتين كحد أقصى (مبلغ ← تصنيف)، تصنيفات سريعة، وتراجع بعد الحذف (Undo Toast) بدل مودال التأكيد حيث يناسب.
- **الحالات الفارغة والخطأ والتحميل** لكل شاشة بصياغة ودودة وإجراء واضح.
- **الأرقام والعملة:** تنسيق موحّد عبر `Intl.NumberFormat('ar-EG')` مع خيار عرض الأرقام الهندية/اللاتينية في الإعدادات.

### 3.4 إمكانية الوصول (A11y) والأداء البصري
- أهداف لمس ≥ 44px، وحلقات تركيز واضحة، وأدوار/تسميات ARIA، وقارئ الشاشة (TalkBack) على المسارات الأساسية.
- احترام `prefers-reduced-motion` و`prefers-color-scheme` (منفَّذ جزئيًا) ودعم تكبير الخط.
- **استضافة الخطوط محليًا** (`@fontsource/alexandria`, `@fontsource/readex-pro` بالأوزان المستخدمة فقط) لتعمل دون إنترنت وتحسّن زمن العرض.
- تعارض ألوان الرسوم البيانية مع عمى الألوان: إضافة أنماط/تسميات لا اللون وحده.

### 3.5 الهوية والأصول
أيقونة تكيّفية (adaptive icon) وشاشة بداية (splash) متسقتان مع الهوية، ولقطات شاشة لمتجر Play.

**معيار القبول:** لا توجد قيمة لون/مسافة حرّة خارج الـ tokens؛ كل شاشة تستخدم مكوّنات `shared/ui` فقط؛ نتيجة Lighthouse (Accessibility) ≥ 95؛ المسارات الأساسية قابلة للاستخدام بقارئ شاشة.

---

## مرحلة 4 — الجودة والاختبارات (تتوازى مع 1–3)

### 4.1 الاختبارات
| المستوى | الأداة | ماذا نغطي |
|---|---|---|
| وحدات | **Vitest** | `budgetCalculator`, `statsCalculator` (السلسلة، الدلاء الزمنية، حالات الحافة)، `numbers`, `csv`, `clickBuffer` |
| خدمات + قاعدة | Vitest + `sql.js` في الذاكرة | CRUD، الاستيراد/الاستعادة الذرية، الهجرات على نسخ قديمة |
| مكوّنات | Testing Library | Modal (Escape/تركيز)، نماذج المعاملة والحد، تطبيع الأرقام |
| طرفية | **Playwright** | تسبيح ← إحصائيات، إضافة معاملة ← ظهورها في التقارير، تصدير/استيراد |

> أخطاء الإحصائيات السابقة (متغيرات غير معرّفة) كانت ستظهر باختبار وحدة واحد وبقاعدة `no-undef` في CI.

### 4.2 التكامل المستمر (CI)
Workflow على كل PR: `npm ci` ← `lint` ← `test` ← `build` ← رفع تقرير التغطية. حماية فرع `main` (لا دمج إلا بنجاح الفحوص). تفعيل Dependabot، وفحص الثغرات (`npm audit`).

### 4.3 الإصدار
- ترقيم دلالي (SemVer) و`CHANGELOG.md` (Conventional Commits).
- سير عمل إصدار: وسم `v*` ← بناء **AAB/APK موقّع** (مفتاح التوقيع في GitHub Secrets) ← إنشاء Release.
- `versionCode/versionName` تُشتقّ من `package.json` تلقائيًا.

### 4.4 المراقبة
`ErrorBoundary` + تسجيل أخطاء محلي قابل للتصدير من الإعدادات («أرسل تقرير مشكلة»)، دون تتبّع خارجي احترامًا لمبدأ الخصوصية.

**معيار القبول:** تغطية ≥ 80% للحاسبات والخدمات، و≥ 60% عمومًا؛ لا PR يُدمج دون CI أخضر.

---

## مرحلة 5 — الأداء والعمل دون اتصال (أسبوع)

- **حفظ قاعدة الويب:** استبدال `saveToStore` بعد كل كتابة بحفظ مؤجَّل (debounce ~500ms) مع حفظ إلزامي عند `pagehide`.
- فهارس إضافية بحسب استعلامات التقارير (مثل `transactions(date, type)`)، واستبدال `LIKE 'YYYY-MM-%'` بنطاق `date >= ? AND date < ?` ليستفيد من الفهرس.
- تجميع استعلامات سلسلة الأشهر في استعلام واحد بـ `GROUP BY substr(date,1,7)`.
- تحليل حجم الحزمة (`rollup-plugin-visualizer`) وميزانية أداء (≤ ~100KB gzipped للمسار الأول).
- التحقق من service worker وتخزين الأصول، واختبار التثبيت والعمل دون اتصال فعليًا.

**معيار القبول:** زمن إقلاع بارد < 2 ثانية على جهاز متوسط؛ فتح الشاشات بلا وميض تحميل ملحوظ.

---

## مرحلة 6 — ميزات المنتج (بعد الاستقرار)

| الأولوية | الميزة | ملاحظة |
|---|---|---|
| عالية | تذكيرات الأذكار والأورد اليومية | `@capacitor/local-notifications` |
| عالية | ودجت أندرويد (العدّاد / ملخص اليوم) | |
| متوسطة | معاملات متكرّرة (إيجار، اشتراكات) | جدول `recurring` + توليد عند الفتح |
| متوسطة | أهداف ادخار وميزانية سنوية | |
| متوسطة | قفل التطبيق بالبصمة/PIN | إعدادات biometric موجودة في إعداد SQLite لكنها معطّلة |
| منخفضة | تعدد اللغات (i18n) | بنية النصوص المركزية أولًا |
| منخفضة | مزامنة اختيارية (مشفّرة طرفيًا) | فقط إن طُلبت، وتبقى local-first |

---

## الجدول الزمني المقترح

| المرحلة | المدة | الاعتماد | المخرَج الرئيسي |
|---|---|---|---|
| 0 — تثبيت الأساس | أسبوع | — | بناء وإصدار سليمان وهوية موحّدة |
| 4 — الجودة (ابتداءً) | يتوازى | 0 | Vitest + CI على الحاسبات |
| 1 — المعمارية | أسبوعان | 0، 4 | `features/` + مستودعات + هجرات |
| 2 — الحالة | أسبوعان | 1 | مزوّدات حسب الراوت + نقر متزامن + نسخ موحّد |
| 3 — التصميم | 3 أسابيع | 1 | `shared/ui` + `/dev/ui` + خطوط محلية |
| 5 — الأداء | أسبوع | 2، 3 | إقلاع < 2ث وحجم محدود |
| 6 — الميزات | مستمر | 0–5 | إصدارات دورية موقّعة |

## مبادئ تحكم كل التغييرات

1. **لا توسّع على أساس مكسور:** إصلاح قبل ميزة.
2. **خطوات صغيرة قابلة للمراجعة:** PR لكل تغيير منطقي واحد، وبناء ناجح في كل خطوة.
3. **الخصوصية افتراضيًا:** لا خادم، لا تتبّع، وبيانات المستخدم قابلة للتصدير دائمًا.
4. **التصميم من الـ tokens:** أي قيمة جديدة تدخل النظام أولًا ثم تُستخدم.
5. **قياس قبل تحسين:** كل عمل أداء يبدأ بقياس ويثبت بقياس.

---

## 🤝 المساهمة

1. أنشئ فرعًا من `main` (`feature/…` أو `fix/…`).
2. شغّل `npm run lint` و`npm run build` قبل الدفع.
3. افتح Pull Request بوصف واضح وخطوات تجربة.
4. التزم بـ [اتفاقيات الكود](#-اتفاقيات-الكود) أعلاه.

## 📄 الترخيص

MIT — © Emad Abo Esmail. *(أضف ملف `LICENSE` إلى جذر المستودع.)*

## 🙏 شكر وتقدير

الخطوط: Alexandria · Readex Pro (Google Fonts).

---

## English Summary

**Mizan** is an Arabic-first, local-first **PWA + Android** app (React 19, Vite 8, Capacitor 8, SQLite) combining:

- 📿 **Zekr** — a smart tasbih counter with custom adhkar, groups, focus mode, statistics and streaks.
- 💰 **Budget** — income/expense tracking with categories, monthly limits, reports, and JSON/CSV import/export.

All data stays on the device (SQLite; WASM `sql.js` on the web). See the **Development Plan** above for the roadmap: feature-based architecture and repositories, scoped state providers, a shared design system with an in-app component gallery, automated tests and CI, performance work, and signed releases.

```bash
git clone https://github.com/EmadAboEsmail/mizan.git
cd mizan && npm install && npm run dev
```

<div align="center">

صُنع بشغف 🤍 بواسطة عماد أبو إسماعيل

</div>

