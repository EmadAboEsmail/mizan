
<div align="center">

<img src="./public/icons/icon-192.png" alt="شعار مِيزان" width="96" height="96" />

# مِيزان · Mizan

**سكينة الذكر ووضوح المال — في مساحة رقمية واحدة هادئة تعمل دون اتصال**

*A calm, offline-first Arabic companion uniting daily Dhikr & personal finance*

[![Build Android APK](https://github.com/EmadAboEsmail/mizan/actions/workflows/build-apk.yml/badge.svg)](https://github.com/EmadAboEsmail/mizan/actions/workflows/build-apk.yml)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?style=flat-square&logo=capacitor&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-v5_Local--First-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Android](https://img.shields.io/badge/Android-7.0%2B_(API_24)-3DDC84?style=flat-square&logo=android&logoColor=111)
![PWA](https://img.shields.io/badge/PWA-Offline_Ready-2D6A4F?style=flat-square&logo=pwa&logoColor=white)

[نبذة](#-نبذة) · [المميزات](#-المميزات) · [تكامل أندرويد](#-تكامل-أندرويد-الأصلي) · [التشغيل والبناء](#-التشغيل-والبناء) · [المعمارية](#-المعمارية) · [قاعدة البيانات](#-قاعدة-البيانات-sqlite-v5) · [الاختبارات](#-الجودة-والاختبارات) · [English](#-english-overview)

</div>

---

## 📖 نبذة

**مِيزان** تطبيق عربي أصيل (`RTL`) يعمل كتطبيق **أندرويد أصلي (`APK`)** عبر Capacitor وكتطبيق ويب تقدّمي (**`PWA`**) قابل للتثبيت على جميع الأجهزة، ويجمع ركنين من توازن اليوم في تجربة واحدة دافئة وخالية من التشتيت:

| 📿 ذِكر | 💰 الميزانية |
| :--- | :--- |
| سبحة ذكية وأوراد يومية مضبوطة التشكيل مع فضل كل ذكر، ووضع تركيز OLED، وتسبيح في الجيب والشاشة مغلقة، وهدف يومي، وسلسلة مداومة وإحصائيات تفصيلية. | إدارة شخصية متكاملة للدخل والمصروف مع محافظ وحسابات متعددة، ومعاملات متكررة تلقائية، وحدود إنفاق شهرية، و10 عملات، وقفل بالبصمة/PIN، وتقارير وتصدير Excel عربي. |

### الفلسفة الأساسية: `Local-First` وخصوصية كاملة
- **لا خوادم ولا حسابات ولا تتبّع:** جميع البيانات محفوظة محلياً على جهازك داخل قاعدة بيانات `SQLite`.
- **يعمل دون إنترنت 100%:** بما في ذلك الخطوط العربية المضمّنة (`Amiri` · `Alexandria` · `Readex Pro`)، التذكيرات اليومية، الودجت، وتصدير الملفات.
- **بياناتك ملكك دائماً:** نسخ احتياطي شامل بضغطة واحدة، ونسخ تلقائي ذكي، وتصدير/استيراد `Excel (.xlsx)` و `CSV` و `JSON`.

---

## ✨ المميزات

### ⚖️ التجربة المشتركة والرئيسية
- **بطاقة «توازن اليوم»:** ملخص حي يجمع تسبيحات اليوم وسلسلة المداومة ونسبة الهدف اليومي بجانب صرف اليوم والمتبقي من حد الشهر، مع زر إضافة مصروف سريع.
- **التاريخ الهجري والتحية الزمنية** مع بطاقة متابعة لآخر ذكر نشط.
- **ثلاثة أوضاع للمظهر:** `فاتح دافئ` · `داكن دافئ` · `AMOLED` (أسود نقي `#000000` لتوفير البطارية وإراحة العين ليلاً) مع مزامنة تلقائية لألوان شريطَي النظام في أندرويد.
- **وضع الخصوصية الفوري:** إخفاء جميع الأرصدة والمبالغ والإجماليات بضغطة واحدة (وينعكس تلقائياً على ودجت الشاشة الرئيسية).
- **حاجز أخطاء (`ErrorBoundary`)** يحمي واجهة التطبيق ويبقي البيانات آمنة في جميع الحالات.

### 📿 ذِكر — السبحة والأوراد
- **عدّاد تفاعلي بحلقة تقدّم** مع اهتزاز لمسي متدرّج (خفيف مع كل تسبيحة، واحتفالي عند إتمام الهدف) قابل للتخصيص.
- **تنقّل بالسحب الأفقي (`Swipe`)** بين الأذكار والأوراد بسلاسة طبيعية.
- **خط النسخ المصحفي (`أميري`)** المضمّن محلياً لإبراز التشكيل بوضوح، مع خيار الخط العصري والتحكم بحجم القراءة.
- **عرض «فضل الذكر»** بهدوء أسفل النص، مع إمكانية إضافة فضل مخصّص لأي ذكر.
- **مكتبة أوراد جاهزة بضغطة واحدة:** *أذكار ما بعد الصلاة* · *أذكار الصباح* · *أذكار المساء* · *أذكار النوم* — مضبوطة التشكيل والعدد والفضل، بالإضافة لإنشاء مجموعات مخصّصة وإعادة ترتيب الأذكار.
- **وضع التركيز الغامر (`Focus Mode`) + قفل الجيب (`OLED Lock`):** ملء كامل للشاشة مع منع انطفائها (`Wake Lock`) وخفض الإضاءة لأدنى مستوى لمنع اللمس غير المقصود.
- **التسبيح بأزرار الصوت + وضع الجيب والشاشة مغلقة (`Pocket Mode`):** مواصلة التسبيح عبر أزرار الصوت حتى بعد قفل شاشة الهاتف مع مزامنة ذرّية كاملة إلى SQLite.
- **هدف التسبيح اليومي + الإحصائيات:** أهداف يومية مرنة (`100` · `300` · `500` · `1,000`)، سلسلة المداومة (`Streak`)، خريطة النشاط الحرارية (`Heatmap`)، رسوم بيانية تفاعلية باللمس، مقارنة بالفترة السابقة، وتصدير **Excel (`.xlsx`)** و **CSV**.

### 💰 الميزانية — وضوح المال الشخصي
- **إضافة سريعة للمعاملات:** شريحة سفلية تدعم **الجمع الفوري داخل حقل المبلغ** (مثل `50+35`)، شرائح مبالغ سريعة، ترتيب التصنيفات الأكثر استخداماً أولاً، واختيار سريع للتاريخ والمحفظة.
- **تفاعل سلس مع السجل:** تجميع يومي بصافي كل يوم، سحب أفقي للتعديل أو الحذف السريع، **تراجع فوري (`Undo`)** بعد الحذف، وزر **«تكرار اليوم»** لنسخ أي معاملة بضغطة واحدة.
- **المحافظ والحسابات (`Wallets`):** محافظ جاهزة افتراضياً (*كاش* · *حساب بنكي* · *محفظة إلكترونية*) مع إضافة/تعديل المحافظ، حساب الرصيد الحي لكل محفظة، و**التحويل المباشر بين محفظتين**.
- **المعاملات المتكررة (`Recurring`):** جدولة الراتب، الإيجار، الفواتير، والاشتراكات (`يومياً` · `أسبوعياً` · `شهرياً` · `سنوياً`) مع تسجيل تلقائي عند حلول الاستحقاق أو تطبيق فوري وإيقاف مؤقت.
- **دعم 10 عملات:** `ج.م` · `ر.س` · `د.إ` · `د.ك` · `ر.ق` · `د.أ` · `د.م` · `$` · `€` · `£`.
- **الحدود الشهرية للتصنيفات:** شريط تقدّم وتنبيهات تلقائية عند الاقتراب من الحد (80%) أو تجاوزه، مع زر **«نسخ حدود الشهر السابق»** بضغطة واحدة.
- **قفل الميزانية (`PIN` + بصمة الإصبع):** رمز من 4 أرقام يُتحقق منه ببصمة رقمية مع قيمة عشوائية (`SHA-256 + Salt` عند توفر WebCrypto). القفل يحمي واجهة الميزانية فقط ولا يشفّر قاعدة البيانات أو ملفات JSON مع قفل تلقائي عند انتقال التطبيق للخلفية، وفتح سريع بالبصمة على أندرويد.
- **التقارير والتحليلات:** مخطط دائري (`Donut`) لتوزيع المصروفات، اتجاه الدخل والمصروف عبر الأشهر، ومؤشرات ذكية (المتوسط اليومي، أعلى فئة إنفاق، معدل الادخار، ومقارنة شهرية).
- **تصدير واستيراد متوافق 100% مع العربية:** تصدير **Excel (`.xlsx`)** باتجاه `RTL` أصلي وتصدير **CSV** بترميز Unicode يفتح في Microsoft Excel و Google Sheets دون أي تشويه للأحرف العربية، مع اختيار تصدير **شهر محدد** أو **كل الفترات**.

### 🗄️ النسخ الاحتياطي الشامل والذكي
- **نسخة مِيزان الشاملة (`mizan-full-backup`):** ملف JSON واحد يجمع الأذكار والمجموعات والإحصائيات والتصنيفات والمحافظ والتحويلات والمعاملات المتكررة والحدود والتفضيلات، مع توافق كامل لاستيراد النسخ الفردية أو القديمة.
- **نسخ تلقائي مجدول (`يومي` · `أسبوعي` · `شهري`):** يُحفظ في ذاكرة التطبيق مع تنظيف تلقائي للنسخ الأقدم (**يحتفظ بآخر 7 نسخ فقط**) وزر **«استعادة آخر نسخة تلقائية»** بضغطة واحدة.

---

## 📱 تكامل أندرويد الأصلي

يحتوي المشروع على طبقة أندرويد أصلية مخصّصة (`app.mizan`) مبنية مباشرة فوق Android SDK دون الاعتماد على إضافات خارجية غير مستقرة:

| المكوّن الأصلي | الوظيفة |
| :--- | :--- |
| **`MizanWidgetProvider`** | **ودجت الشاشة الرئيسية** (قابل لتغيير الحجم، عربي RTL) يعرض ذِكر اليوم وأيام المداومة وصرف اليوم (مع إخفاء تلقائي عند تفعيل الخصوصية أو القفل)، وزرَّي **`+ سبّح`** (عدّ فوري + اهتزاز + مزامنة SQLite) و**`+ مصروف`**. |
| **`PocketTasbihService`** | خدمة أمامية (`ForegroundService` + `MediaSession` + `WakeLock`) لالتقاط ضغطات أزرار الصوت للتسبيح والشاشة مقفلة مع حفظ ذرّي في طابور مشترك. |
| **`MizanReminderReceiver`** | منبّهات يومية محلية دون إنترنت (`AlarmManager`) لأذكار الصباح والمساء وتذكير المصروفات، مع إعادة جدولة تلقائية بعد إعادة تشغيل الجهاز (`BOOT_COMPLETED`). |
| **App Shortcuts (`shortcuts.xml`)** | اختصارات سريعة عند الضغط المطوّل على أيقونة التطبيق: **مصروف سريع** · **السبحة** · **التقارير**. |
| **`MizanNativePlugin`** | جسر Capacitor الأصلي للبصمة (`BiometricPrompt`)، الاهتزاز، وضع ملء الشاشة الغامر، خفض الإضاءة، ألوان شريطَي النظام، التذكيرات، الودجت، والروابط العميقة. |
| **`MizanHaptics`** | محرّك اهتزاز موحّد متوافق مع Android 7 حتى Android 16 (بما في ذلك الاهتزاز أثناء قفل الشاشة). |
| **R8 / ProGuard + Backup Rules** | تصغير وضغط نسخة الإصدار (`minifyEnabled` + `shrinkResources`) مع قواعد حماية دقيقة لـ Capacitor و SQLite وقواعد نسخ احتياطي آمنة (`backup_rules.xml` و `data_extraction_rules.xml`). |

---

## 🛠️ التقنيات المستخدمة

| الطبقة | التقنيات |
| :--- | :--- |
| **الواجهة والتوجيه** | React 19 · React Router 7 (`HashRouter` على أندرويد / `BrowserRouter` على الويب) · Lucide Icons |
| **إدارة البيانات والكاش** | TanStack Query v5 (تحديثات تفاؤلية `Optimistic Updates` + مفاتيح هرمية + إبطال انتقائي) |
| **التصميم والخطوط** | Sass (`SCSS Modules`) · Design Tokens · خطوط مضمّنة محلياً (`Amiri`, `Alexandria`, `Readex Pro`) |
| **قاعدة البيانات** | SQLite عبر `@capacitor-community/sqlite` (أصلي على أندرويد، و `jeep-sqlite` + `sql.js` WASM على الويب) |
| **أندرويد و PWA** | Capacitor 8 · Java Android SDK (`minSdk 24` / `targetSdk 36`) · Vite 8 · `vite-plugin-pwa` (Workbox) |
| **الجودة والـ CI** | Vitest 4 · ESLint 10 (+ `@tanstack/eslint-plugin-query`) · GitHub Actions |

---

## 🚀 التشغيل والبناء

### المتطلبات
- **Node.js** `22+` (استخدم `nvm use` لتحميل الإصدار المعتمد في المشروع).
- لبناء أندرويد محلياً: **JDK 21** + **Android SDK (API 36)**.

### التشغيل المحلي (الويب / PWA)

```bash
git clone https://github.com/EmadAboEsmail/mizan.git
cd mizan
npm ci
npm run dev
```

### الأوامر المتاحة

| الأمر | الوصف |
| :--- | :--- |
| `npm run dev` | تشغيل خادم التطوير المحلي مع التحديث الفوري |
| `npm run build` | بناء نسخة الإنتاج للويب و PWA في مجلد `dist/` |
| `npm run build:android` | بناء نسخة مهيّأة لأندرويد (`VITE_TARGET=android` بمسارات نسبية) |
| `npm run preview` | معاينة نسخة الإنتاج محلياً |
| `npm run lint` | فحص الكود عبر ESLint |
| `npm test` | تشغيل جميع الاختبارات عبر Vitest |
| `npm run test:watch` | تشغيل الاختبارات في الوضع التفاعلي المستمر |

### بناء تطبيق الأندرويد (`APK`)

#### 1. تلقائياً عبر GitHub Actions
عند الدفع أو من تبويب **Actions → Build Android APK → Run workflow** يتم تشغيل الفحص (`lint`) والاختبارات (`test`) ثم بناء ملف `APK` ورفعه ضمن **Artifacts** باسم `mizan-debug-apk`.

#### 2. يدوياً على جهازك

يتطلب البناء **JDK 21** و**Android SDK Platform 36**. استخدم نسخة Debug للاختبار فقط؛ تحتاج نسخة النشر إلى مفتاح توقيع الإصدار. عند التحديث فوق نسخة مثبتة، يجب أن تتطابق شهادة التوقيع. خذ نسخة احتياطية قبل إزالة أي نسخة موجودة.

```bash
# 1) بناء الواجهة لبيئة أندرويد ومزامنة Capacitor
npm run build:android
npx cap sync android

# 2) بناء نسخة تجريبية (Debug APK)
cd android && bash gradlew :app:testDebugUnitTest :app:assembleDebug
# الناتج: android/app/build/outputs/apk/debug/app-debug.apk

# أو بناء نسخة إصدار مضغوطة ومصغّرة عبر R8 (Release APK)
bash gradlew assembleRelease
```

#### 3. فحص سريع قبل توزيع الـAPK

- ثبّت النسخة على جهاز أو محاكي، وافتح قسمي الذكر والميزانية في وضع الطيران.
- اختبر التحديث فوق نسخة قديمة موقّعة بالمفتاح نفسه، وتأكد من بقاء المعاملات والأذكار بعد ترقية SQLite.
- فعّل PIN ثم أرسل التطبيق إلى الخلفية. بعد الرجوع، تأكد من أن إعدادات الذكر لا تسمح بتصدير أو استعادة نسخة شاملة قبل فتح الميزانية.
- على جهاز فعلي، اختبر التذكيرات والودجت وأزرار الصوت في وضع الجيب والشاشة مقفلة؛ نجاح البناء لا يختبر هذا السلوك.

---

## 🏗️ المعمارية

### تدفّق البيانات

```text
┌───────────────────────────────── React 19 UI ─────────────────────────────────┐
│  pages/* (Home · Zekr · Budget)  ──►  components/*  +  SCSS Design Tokens     │
└──────────────────────┬────────────────────────────────────┬───────────────────┘
                       │                                    │
        ┌──────────────▼──────────────┐      ┌──────────────▼──────────────┐
        │   queries/* (TanStack v5)   │      │    hooks/* & contexts/*     │
        │  Optimistic CRUD & Caching  │      │ Theme · Currency · PIN Lock │
        └──────────────┬──────────────┘      │ Privacy · Reminders · Sync  │
                       │                     └──────────────┬──────────────┘
        ┌──────────────▼──────────────┐                     │
        │         services/*          │                     │ Capacitor Bridge
        │ zekrService · budgetService │                     │
        │ mizanBackup · clickBuffer   │      ┌──────────────▼──────────────┐
        │ Calculators · CSV/XLSX RTL  │      │   android/.../app/mizan/*   │
        └──────────────┬──────────────┘      │ PocketService · Widget ·    │
                       │ SQL / Transactions  │ Reminders · Biometric · UI  │
        ┌──────────────▼──────────────┐      └─────────────────────────────┘
        │     db/* (SQLite v5)        │
        │ Android Native / Web WASM   │
        └─────────────────────────────┘
```

### هيكل المشروع

```text
mizan/
├── android/app/src/main/
│   ├── java/app/mizan/        # MainActivity · MizanNativePlugin · PocketTasbihService
│   │                          # MizanWidgetProvider · MizanReminderReceiver · MizanHaptics
│   └── res/                   # layout/widget_mizan · xml/{shortcuts,mizan_widget_info,
│                              # backup_rules,data_extraction_rules} · adaptive icons
├── public/
│   ├── assets/                # ملف sql-wasm.wasm لتشغيل SQLite على الويب
│   └── icons/                 # أيقونات مِيزان الموحّدة و PWA (maskable / apple-touch)
└── src/
    ├── main.jsx · App.jsx     # تهيئة SQLite + ErrorBoundary + التوجيه والمزامنة العامة
    ├── db/                    # adapter · schema (v5) · migrations (index.js) · seed
    ├── data/                  # adhkarPresets (قوالب الأوراد الجاهزة بالتشكيل والفضل)
    ├── services/              # zekrService · statsCalculator · clickBuffer
    │                          # budgetService · budgetCalculator · mizanBackupService
    ├── queries/               # queryKeys · zekr/* · budget/* (TanStack Query v5)
    ├── contexts/              # ThemeContext · ToastProvider · BudgetContext · ZekrDataContext
    ├── hooks/                 # useCurrency · useBudgetLock · usePrivacyMode · useReminders
    │                          # useDailyZekrGoal · usePocketTasbih · useAutoBackup · useNativeSync
    ├── components/
    │   ├── ui/                # BrandIcons · TopAppBar · BottomNav · Modal · DatePickerSheet
    │   │                      # ConfirmModal · PromptModal · EmptyState · ErrorBoundary
    │   ├── common/            # RemindersCard (بطاقة التذكيرات اليومية المشتركة)
    │   ├── zekr/              # sabh · stats · settings
    │   ├── budget/            # transactions · limits · charts · insights · settings · BudgetLockGate
    │   └── pwa/               # InstallPrompt
    ├── pages/                 # home · zekr · budget
    ├── styles/                # _tokens · _mixins · _global · main
    └── utils/                 # csv (UTF-16LE CSV + OOXML RTL .xlsx) · fileExport · haptics · numbers
```

---

## 🗄️ قاعدة البيانات (`SQLite v5`)

تُنشأ قاعدة البيانات محلياً وتُرقّى تلقائياً عبر نظام هجرات آمن (`v1 → v5`) دون المساس ببيانات المستخدم السابقة:

| الجدول | الوظيفة | أبرز الأعمدة والقيود |
| :--- | :--- | :--- |
| `adhkar` | نصوص الأذكار وأفضالها | `id`, `text`, `default_target`, `virtue`, `sort_order` |
| `counts` | العدّاد التراكمي لكل ذكر | `zekr_id (PK, FK CASCADE)`, `count` |
| `targets` | الأهداف المخصّصة للأذكار | `zekr_id (PK, FK CASCADE)`, `target` |
| `clicks_hourly` | سجل التسبيحات المجمّع بالساعة | `PRIMARY KEY (zekr_id, hour)`, `count` + فهارس زمنية |
| `groups` | مجموعات الأوراد اليومية | `id`, `name`, `description`, `created_at` |
| `group_items` | عناصر كل ورد وترتيبها | `group_id (FK CASCADE)`, `zekr_id`, `position`, `target` |
| `categories` | تصنيفات الدخل والمصروف | `id`, `name`, `type (income\|expense)`, `icon`, `color`, `sort_order` |
| `wallets` | المحافظ والحسابات المالية | `id`, `name`, `icon`, `color`, `initial_balance`, `sort_order` |
| `transactions` | المعاملات المالية | `amount`, `type`, `category_id`, `wallet_id`, `date (YYYY-MM-DD)`, `details` |
| `wallet_transfers` | التحويلات بين المحافظ | `from_wallet_id`, `to_wallet_id`, `amount`, `date`, `note` |
| `recurring_transactions` | المعاملات الدورية المتكررة | `title`, `amount`, `type`, `frequency`, `next_due_date`, `auto_apply`, `active` |
| `limits` | حدود الميزانية الشهرية | `UNIQUE (category_id, month)`, `amount` |
| `meta` | معلومات النظام والهجرة | `schema_version`, `seeded_at` |

> **أداء الكتابة:** تُجمَّع ضغطات السبحة في الذاكرة عبر `clickBuffer` وتُكتب في SQLite كدفعة واحدة كل 60 ثانية أو فوراً عند انتقال التطبيق للخلفية، لضمان استجابة لحظية بلا أي تأخير.

---

## 🧪 الجودة والاختبارات

يضم المشروع حزم اختبارات آلية عبر **Vitest** مع قاعدة بيانات `sql.js` حقيقية في الذاكرة:

- `src/queries/queries.test.js` — تكامل TanStack Query مع SQLite، التحديثات التفاؤلية، إبطال الكاش، وتنبيهات الحدود الشهرية.
- `src/services/v4Features.test.js` — اختبارات شاملة لميزات الإصدار الرابع (الأوراد الجاهزة، فضل الذكر، إعادة الترتيب، المحافظ والتحويلات، المعاملات المتكررة، نسخ الحدود، العملات، النسخ الاحتياطي الشامل والتلقائي، وقفل PIN).
- `src/services/pocketClicks.test.js` — مزامنة تسبيحات قفل الشاشة والودجت مع العدّادات والإحصائيات.
- `src/utils/csv.test.js` — ترميز وفك ترميز ملفات CSV العربية (UTF-16LE / UTF-8 / Windows-1256) وبناء ملفات Excel `.xlsx` باتجاه RTL.
- `src/hooks/useVolumeButton.test.js` — سلوك اختصارات أزرار الصوت.

```bash
npm run lint && npm test
```

---

## 🤝 المساهمة

المساهمات والاقتراحات مرحّب بها دائماً:

1. أنشئ فرعاً جديداً للميزة أو الإصلاح (`git checkout -b feat/your-feature`).
2. التزم بالاستيراد عبر `@/`، واستخدام متغيرات التصميم من `src/styles/_tokens.scss`، والخصائص المنطقية الداعمة لـ `RTL` (`margin-inline`, `inset-inline`).
3. تأكّد من نجاح الفحص والاختبارات والبناء قبل فتح طلب الدمج:
   ```bash
   npm run lint && npm test && npm run build && npm run build:android
   ```
4. افتح **Pull Request** بوصف واضح للتغييرات.

---

## 📄 الترخيص

مرخّص بموجب رخصة **MIT** — © [Emad Abo Esmail](https://github.com/EmadAboEsmail).

---

<div dir="ltr">

## 🌍 English Overview

**Mizan (مِيزان)** is a calm, privacy-first, **100% offline-capable** Arabic (`RTL`) application built for **Android (`APK`)** and the **Web (`PWA`)** using **React 19**, **TanStack Query v5**, **Vite 8**, **Capacitor 8**, and **SQLite v5**.

### Highlights
- **Zekr (Dhikr & Tasbih):** Tactile tasbih counter with swipe navigation, bundled offline *Amiri* Naskh typography, authentic one-tap preset wird packs (Morning, Evening, After Prayer, Sleep) with virtues, custom groups, daily tasbih goals, immersive OLED Focus Mode, **screen-off Pocket Tasbih** via hardware volume buttons, streaks, activity heatmap, and RTL `.xlsx` / CSV stats export.
- **Budget (Personal Finance):** Fast expense & income logging with inline expression evaluation (`50+35`), swipe actions & undo delete, one-tap duplicate, **multi-wallet balances & transfers** (Cash, Bank, E-Wallet), **automated recurring transactions**, **10 currencies**, monthly category limits with one-tap previous-month copy, **4-digit salted SHA-256 PIN + native Biometric lock**, privacy masking mode, visual reports, and month-scoped or full-history RTL `.xlsx` & Unicode CSV import/export.
- **Native Android Integration:** Resizable RTL **Home Screen Widget** with direct `+ Tasbih` (haptics + SQLite queue sync) and `+ Expense` actions, launcher **App Shortcuts**, offline daily `AlarmManager` reminders with boot persistence, 3 themes (Warm Light, Warm Dark, True AMOLED), unified full-app backup with auto-pruned rolling snapshots (last 7), and R8/ProGuard-optimized release builds.

### Quick Start

```bash
git clone https://github.com/EmadAboEsmail/mizan.git
cd mizan
npm ci
npm run dev            # Start dev server
npm test               # Run Vitest suite
npm run build:android  # Build for Capacitor Android
npx cap sync android   # Sync web assets to Android project
```

</div>

---

<div align="center">

صُنع بعناية وهدوء 🤍 بواسطة **عماد أبو إسماعيل**

</div>

