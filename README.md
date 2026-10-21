✅ آه، ممكن — بل ومستحسن

الـ README الواحد ينفع للكل، بشرط إنه يبقى مكتوب بأسلوب "platform" مش "app واحد". الفكرة إن الملف يبقى للـ منصة ككل + قسم لكل تطبيق.

---

📋 الفرق بين النهجين

النهج مناسب لـ المشكلة
README واحد للمنصة (توصيتي) مشروع صغير/متوسط، 1-5 تطبيقات يطول شوية لو التطبيقات كتير
README رئيسي + README فرعي لكل تطبيق مشروع كبير، فريق متعدد تعقيد إضافي، مش محتاجينه دلوقتي

دلوقتي: عندنا 1 تطبيق شغال + 2 قيد التطوير = README واحد كافي تمامًا.

---

🎯 الملف الكامل — منصة "مساحتي الرقمية"

```markdown
# 🌐 مساحتي الرقمية — My Digital Space

> منصة عربية تجمع تطبيقات وأدوات تفاعلية، مصنوعة بشغف وتجربة مستخدم مدروسة

---

## 📱 التطبيقات

| # | التطبيق | الحالة | النوع |
|---|---------|--------|-------|
| 1 | 📿 **ذِكر** | ✅ **متاح** | إسلامي / عبادات |
| 2 | 🔢 **ترتيب الفقاعات** | 🚧 قيد التطوير | خوارزميات / تعليمي |
| 3 | 📊 **ترتيب الاختيار** | 🚧 قيد التطوير | خوارزميات / تعليمي |

**آخر تحديث:** أكتوبر 2026

---

## 📿 ذِكر — Zekr

### الوصف
> سبحة إلكترونية ذكية لمتابعة وإحصاء أذكارك اليومية

تطبيق ويب عربي حديث يساعدك على المداومة على الأذكار والأوراد اليومية، مع تتبع دقيق لتقدمك وإحصائيات مفصلة، بواجهة نظيفة تدعم الوضع الفاتح والداكن.

### ✨ الميزات

#### السبحة الذكية
- **وضعان للتسبيح:**
  - **تسبيح حر** — اختر ذكراً من قائمتك وسبّح بأي عدد
  - **المجموعات** — تنقل تلقائي بين أذكار مجموعة (مثل: أذكار الصباح)
- **أهداف مخصصة** لكل ذكر (33، 100، 1000، أو أي رقم)
- **حلقة تقدم بصرية** حول زر التسبيح
- **وضع التركيز** — شاشة OLED سوداء، ملء الشاشة، منع انطفاء الشاشة، اهتزاز خفيف
- **اختصارات لوحة المفاتيح:**
  - `Space` — تسبيح
  - `F` — وضع التركيز
  - `R` — تصفير العداد
- **نسخ نص الذكر** بضغطة واحدة

#### الإحصائيات
- **4 فترات:** يومي (آخر 7 أيام) • أسبوعي • شهري • سنوي
- **رسوم بيانية تفاعلية** مع tooltips، hover، keyboard navigation
- **فلاتر ذكية** — بحث، تصفية حسب ذكر
- **Streak Tracking** 🔥 — سلسلة الأيام المتتالية + رقم قياسي
- **مقارنة بالفترة السابقة** 📈 — نسبة الزيادة/النقصان
- **أفضل/أسوأ فترة** — محسوبة تلقائياً
- **تصدير CSV** — يدعم العربية في Excel/Google Sheets
- **حفظ الحالة في URL** — refresh و back لا يفقدان حالتك

#### الإعدادات
- **Accordion + Sticky Nav** — تنقل سريع
- **إدارة الأذكار** — إضافة، تعديل، حذف مع بحث
- **إدارة المجموعات** — إنشاء، تعديل، ترتيب الأذكار
- **النسخ الاحتياطي** — تصدير/استيراد JSON مع حماية من التكرار
- **إدارة البيانات** — تصفير أعداد، مسح إحصائيات، حذف شامل

#### تجربة المستخدم
- تصميم عربي RTL كامل
- Dark mode لكل الشاشات
- Responsive (موبايل، تابلت، ديسكتوب)
- Accessibility (aria-live، aria-label، keyboard nav)
- Skeleton Loading + Empty States ذكية
- Toast Notifications
- Back button handling (المودالز تقفل بدل الخروج)

### 🎯 سيناريوهات الاستخدام
1. **جديد؟** افتح "ذِكر" → من الإعدادات، أضف أذكارك الأولى
2. **أنشئ مجموعات** — أذكار الصباح، بعد الصلاة، إلخ
3. **ابدأ التسبيح** — مع أهداف أو بدون
4. **تابع تقدمك** — إحصائيات، streak، مقارنات
5. **احفظ بياناتك** — تصدير CSV أو نسخة احتياطية JSON

---

## 🚧 ترتيب الفقاعات — Bubble Sort (قيد التطوير)

### الوصف
> محاكاة بصرية تفاعلية لشرح خطوات خوارزمية Bubble Sort خطوة بخطوة

### الميزات المخططة
- 🎨 عرض بصري للأرقام كأعمدة متحركة
- ⏯️ تحكم كامل: تشغيل، إيقاف، خطوة بخطوة
- 🎚️ سرعة قابلة للتعديل
- 📊 عدّاد للمقارنات والتبديلات
- 💡 شرح مصاحب لكل خطوة

### الحالة
- [ ] تصميم الواجهة
- [ ] منطق الخوارزمية
- [ ] التصور البصري
- [ ] التحكم والسرعة
- [ ] الشرح التفاعلي

**متوقع:** قريباً

---

## 🚧 ترتيب الاختيار — Selection Sort (قيد التطوير)

### الوصف
> تصور بصري لمفهوم خوارزمية Selection Sort وكيفية إيجاد العنصر الأصغر

### الميزات المخططة
- 🎨 عرض بصري مع تمييز العنصر الأدنى
- ⏯️ تحكم كامل: تشغيل، إيقاف، خطوة بخطوة
- 🎚️ سرعة قابلة للتعديل
- 📊 عدّاد للمقارنات والتبديلات
- 💡 شرح مصاحب لكل خطوة

### الحالة
- [ ] تصميم الواجهة
- [ ] منطق الخوارزمية
- [ ] التصور البصري
- [ ] التحكم والسرعة
- [ ] الشرح التفاعلي

**متوقع:** قريباً

---

## 🛠️ البنية التقنية المشتركة

### Frontend
- **React 18** — مكتبة UI
- **Vite** — bundler سريع
- **React Router 6** — Routing و URL state
- **Context API** — إدارة الحالة (`ZekrDataContext`, `ThemeContext`, `ToastContext`)
- **SCSS Modules** — styling معزول
- **Custom Hooks:**
  - `useAnimatedNumber` — counter animations
  - `useModalBackButton` — back button integration
- **Utils:** `csv.js` — تصدير CSV مع BOM للعربية

### Backend
- **FastAPI** — إطار Python حديث
- **SQLAlchemy** — ORM
- **SQLite** — قاعدة بيانات محلية
- **CORS** — مفعّل للـ dev

> ⚠️ **ملاحظة:** الـ backend مشترك بين كل التطبيقات. كل تطبيق له endpoints تحت prefix خاص (مثلاً `/api/*` لتطبيق ذِكر).

---

## 📂 هيكل المشروع

```

├── src/
│   ├── App.jsx                      # Routes رئيسية لكل التطبيقات
│   ├── main.jsx                     # Entry point + Providers
│   ├── api/
│   │   └── client.js                # طبقة API موحدة
│   ├── components/
│   │   ├── AppCard.jsx              # بطاقة تطبيق (مشتركة)
│   │   ├── home/                    # مكونات Home
│   │   ├── ui/                      # UI عامة (Modal, ThemeToggle, إلخ)
│   │   └── zekr_app/                # كل مكونات تطبيق ذِكر
│   │       ├── settings/
│   │       ├── stats/
│   │       └── zekr/
│   ├── context/
│   │   ├── ZekrDataContext.jsx      # حالة تطبيق ذِكر
│   │   ├── ThemeContext.jsx         # مشترك
│   │   └── ToastContext.jsx         # مشترك
│   ├── hooks/
│   │   ├── useAnimatedNumber.js     # مشترك
│   │   └── useModalBackButton.js    # مشترك
│   ├── pages/
│   │   ├── Home.jsx                 # صفحة البداية (كل التطبيقات)
│   │   ├── ZekrLayout.jsx
│   │   ├── ZekrSabh.jsx
│   │   ├── ZekrStats.jsx
│   │   └── ZekrSettings.jsx
│   ├── styles/                      # مشترك
│   └── utils/
│       └── csv.js
│
├── backend/
│   ├── main.py                      # FastAPI app
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   └── dependencies.py
│
└── README.md                        # ← الملف ده

```

**عند إضافة تطبيق جديد:**
- `src/components/<app_name>/` — مكوناته
- `src/pages/<AppName>*.jsx` — صفحاته
- `src/context/<AppName>Context.jsx` — حالته (لو يحتاج)
- `backend/routers/<app_name>.py` — endpoints الخاصة (اختياري: تقسيم الـ routers)

---

## 🚀 التشغيل

### المتطلبات
- **Node.js** 18+ و npm
- **Python** 3.10+

### 1. Backend (FastAPI)

```bash
cd backend

# بيئة افتراضية
python -m venv venv
source venv/bin/activate  # Linux/Mac
# أو
venv\Scripts\activate     # Windows

# تثبيت المكتبات
pip install fastapi uvicorn sqlalchemy

# تشغيل
uvicorn main:app --reload --port 8000
```

· API: http://localhost:8000
· Docs: http://localhost:8000/docs

2. Frontend (React + Vite)

```bash
npm install
npm run dev
```

· التطبيق: http://localhost:5173

---

🔌 API Endpoints

🏠 عام (Platform)

Method Endpoint الوصف
GET / Health check

📿 ذِكر

Method Endpoint الوصف
GET /api/adhkar كل الأذكار
POST /api/adhkar إضافة ذكر
PUT /api/adhkar/{id} تعديل ذكر
DELETE /api/adhkar/{id} حذف ذكر
GET /api/counts كل العدادات
POST /api/clicks تسجيل تسبيحة
DELETE /api/clicks/{zekr_id} تصفير عدد ذكر
GET /api/targets كل الأهداف
POST /api/targets تعيين هدف
GET /api/groups كل المجموعات
POST /api/groups إنشاء مجموعة
PUT /api/groups/{id} تعديل مجموعة
DELETE /api/groups/{id} حذف مجموعة
POST /api/groups/{id}/items إضافة ذكر للمجموعة
PUT /api/groups/{id}/items/{item_id} تعديل عنصر
DELETE /api/groups/{id}/items/{item_id} حذف عنصر
GET /api/stats?period=day&zekr_id=&compare=true إحصائيات
GET /api/stats/streak السلسلة المتتالية
GET /api/backup تصدير نسخة احتياطية
POST /api/backup استيراد نسخة احتياطية
DELETE /api/counts مسح كل العدادات
DELETE /api/targets مسح كل الأهداف
DELETE /api/clicks مسح كل الضغطات
DELETE /api/data/all مسح شامل

🔢 ترتيب الفقاعات (قيد التطوير)

لم يتم تعريف endpoints بعد.

📊 ترتيب الاختيار (قيد التطوير)

لم يتم تعريف endpoints بعد.

---

🎨 نظام التصميم المشترك

الألوان

· Primary: #059669 (light) / #34d399 (dark)
· Danger: #ef4444 / #f87171
· Success: #16a34a / #4ade80
· Background Light: #f8fafc
· Background Dark: #090d16

Typography

· Arabic UI — خطوط النظام
· Code — SF Mono, Consolas

Animations

· Durations: 150ms (micro) → 300ms (standard) → 700ms (transitions)
· Easing: cubic-bezier(0.16, 1, 0.3, 1)

---

🧪 الاختبار

يدوياً

· كل flows أساسية مغطاة
· Console نظيف من warnings/errors
· متوافق مع Chrome, Firefox, Safari (آخر إصدارين)

حالة المشروع

· ⏳ Unit tests — قيد الإضافة
· ⏳ E2E tests — قيد الإضافة

---

🚧 خارطة الطريق

عام

☐ PWA Support — offline mode + installable
☐ i18n — دعم إنجليزي (اختياري)
☐ Theme system — ألوان إضافية

ذِكر

☐ Batching API calls — تقليل استهلاك البطارية
☐ Achievements — شارات وإنجازات
☐ أذكار مقترحة — "ذكر اليوم"
☐ ورد يومي — تتبع الورد الكامل
☐ إشعارات تذكير — Push notifications
☐ مشاركة المجموعات — كملفات JSON
☐ تصدير PDF — تقارير مطبوعة

ترتيب الفقاعات

☐ إطلاق كامل

ترتيب الاختيار

☐ إطلاق كامل

---

🤝 المساهمة

إضافة تطبيق جديد

1. أنشئ مجلد src/components/<app_name>/
2. أنشئ صفحات src/pages/<AppName>*.jsx
3. أضف الـ route في src/App.jsx
4. أضف التطبيق في src/pages/Home.jsx (APPS array) مع available: true
5. (لو يحتاج backend) أضف router في backend/
6. حدّث الـ README ده — أضف قسم للتطبيق

أسلوب الـ Commits

نستخدم Conventional Commits:

· feat: ميزة جديدة
· fix: إصلاح bug
· docs: توثيق
· style: تنسيق
· refactor: إعادة هيكلة
· perf: تحسين أداء
· test: اختبارات

---

📄 الترخيص

هذا المشروع مفتوح المصدر — راجع LICENSE للتفاصيل.

---

🤍 دعاء

"صدقة جارية • لا تنسونا من صالح دعائكم"

صُنع بإتقان وشغف 🤍

---

© 2026 — مساحتي الرقمية

```

---

## 📊 الفرق عن الـ README السابق

| قبل (Zekr-only) | بعد (Platform) |
|-----------------|----------------|
| عنوان "ذِكر" | عنوان "مساحتي الرقمية" |
| يبدأ بميزات Zekr | يبدأ بجدول التطبيقات |
| Zekr هو كل شيء | Zekr قسم + قسمين "قيد التطوير" |
| API كله لـ Zekr | API مقسم: Platform / Zekr / Coming |
| مفيش roadmap للتطبيقات الجديدة | قسم لكل تطبيق مع حالة التنفيذ |
| مفيش إرشاد لإضافة تطبيق | قسم "إضافة تطبيق جديد" واضح |

---

## 💡 ملاحظات

### 1. **سهل التوسع**
لما تخلص bubble-sort، مجرد:
- تغيّر 🚧 لـ ✅ في الجدول
- تحوّل قسمه من "قيد التطوير" لـ "متاح" بميزات حقيقية
- تضيف الـ API endpoints

### 2. **لما التطبيقات تكبر** (5+ تطبيقات)
نقدر نتحول لـ:
```

docs/
├── apps/
│   ├── zekr/README.md
│   ├── bubble-sort/README.md
│   └── selection-sort/README.md
└── README.md (main, links to per-app)

```

لكن دلوقتي **مش محتاجين** — README واحد أنضف وأسهل صيانة.

### 3. **الـ "قيد التطوير" مش عيب**
- بيوضح للمستخدم فيه إيه جاي (شفافية)
- بيدّي دافع ليك تخلصهم
- بيمنع المستخدم من السؤال "فين تطبيقات تانية؟"

---

## 👈 خد القرار:

- ✅ **"استبدل الـ README"** → امسح القديم وحط ده
- 🔀 **"عايز الدمج"** → دمج المحتوى في الملف الحالي (لو عدّلت عليه)
- 🤔 **"عايز تعديل"** → قولي إيه (مثلاً: شيل قسم معين، أضف تفاصيل)

🚀
