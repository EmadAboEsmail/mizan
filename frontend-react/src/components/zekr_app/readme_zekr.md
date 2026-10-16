تمام، ده الـ README.md كامل بتنسيق موحّد:

---

```markdown
# 📿 ذِكر — تطبيق السبحة الإلكترونية

> تطبيق ويب متكامل للسبحة الإلكترونية، مع أذكار مخصصة، مجموعات، إحصائيات، وإعدادات كاملة.
> جزء من مشروع "تطبيقاتي" — بوابة تحتوي على تطبيقات ويب صغيرة.

---

## 📖 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [البنية الكلية](#البنية-الكلية)
3. [التقنيات المستخدمة](#التقنيات-المستخدمة)
4. [الميزات](#الميزات)
5. [API Endpoints](#api-endpoints)
6. [قاعدة البيانات](#قاعدة-البيانات)
7. [التشغيل](#التشغيل)
8. [التقنيات والمفاهيم المستفادة](#التقنيات-والمفاهيم-المستفادة)
9. [أهداف التطوير المستقبلية](#أهداف-التطوير-المستقبلية)
10. [حالة التطوير](#حالة-التطوير)
11. [الخلاصة](#الخلاصة)

---

## 🎯 نظرة عامة

**ذِكر** تطبيق يسمح للمستخدم بـ:

- التسبيح بذكر واحد (عدّاد بسيط).
- التسبيح بمجموعة (مثل: أذكار بعد الصلاة — 33 سبحان الله، 33 الحمد لله، 33 الله أكبر).
- متابعة الإحصائيات (يومي/أسبوعي/شهري/سنوي).
- إدارة الأذكار (إضافة/تعديل/حذف).
- إدارة المجموعات (إنشاء، ترتيب، تعديل).
- تخصيص الهدف لكل ذكر.
- اختيار الثيم (فاتح/داكن).

---

## 🏗️ البنية الكلية

```

my_app/  (تطبيقاتي)
│
├── backend-fastapi/              ← FastAPI (النسخة النشطة)
│   ├── main.py                   ← نقطة البداية + كل الـ routes
│   ├── database.py               ← إعداد SQLAlchemy (Engine/Session/Base)
│   ├── models.py                 ← جداول DB (ORM Models)
│   ├── schemas.py                ← Pydantic (request/response)
│   ├── dependencies.py           ← get_db
│   ├── seed.py                   ← تحميل الأذكار الأولية
│   ├── requirements.txt
│   └── zekr.db                   ← قاعدة البيانات (SQLite)
│
├── backend/                      ← Express (مرجعي فقط)
│
├── frontend-react/               ← React + Vite
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js         ← كل دوال الـ API
│   │   ├── context/
│   │   │   └── ThemeContext.jsx
│   │   ├── components/
│   │   │   ├── ui/               ← Modal, PromptModal, ConfirmModal
│   │   │   ├── zekr_app/
│   │   │   │   ├── zekr/         ← Tabs, ZekrDisplay, AdhkarSelect, ActionButtons, SabhModeTabs, GroupModeView, GroupSelect
│   │   │   │   ├── stats/        ← StatsTab, BarChart, PeriodTabs, ZekrFilter
│   │   │   │   └── settings/     ← SettingsTab, AppearanceSection, AdhkarSection, GroupsSection, GroupFormModal, GroupEditorModal, DataSection, AboutSection
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── Zekr.jsx
│   │   └── styles/
│   │       ├── _variables.scss
│   │       ├── _mixins.scss
│   │       ├── _global.scss
│   │       └── main.scss
│   └── vite.config.js
│
└── pages/                        ← Vanilla JS (نسخة قديمة، مرجعية)

```

---

## 🛠️ التقنيات المستخدمة

### Backend

- Python 3.14
- FastAPI — Framework حديث للـ APIs
- SQLAlchemy 2.1 — ORM
- SQLite — قاعدة بيانات
- Uvicorn — ASGI server
- Pydantic 2.14 — Validation

### Frontend

- React 18+
- Vite — Build tool
- React Router — التنقل
- SCSS Modules — Styling معزول
- Fetch API

### الأدوات

- Git — Version control (محلي)
- Termux — بيئة التطوير (Android)
- VS Code — Editor

---

## 🎯 الميزات

### 1. السبحة (Sabh)

#### الوضع العادي

- اختيار ذكر من قائمة منسدلة مخصصة.
- عدّاد تصاعدي.
- شريط تقدم دائري (`conic-gradient`) على زر "سبح".
- إشارة بصرية عند الوصول للهدف (حلقة خضراء).
- تعديل الهدف لكل ذكر.
- زر "مسح" مع Modal تأكيد.
- اختصار Space للتسبيح.
- Optimistic Update — تحديث فوري للواجهة.

#### وضع المجموعة

- اختيار مجموعة (مثل: أذكار بعد الصلاة).
- عرض "الذكر X من Y".
- انتقال تلقائي بعد إتمام كل ذكر.
- شاشة "خلصت!" مع الذكر التالي.
- شاشة "🎉 أتممت المجموعة!" في النهاية.
- baseline ذكي — كل ذكر يبدأ من 0.

### 2. الإحصائيات (Stats)

- فترات: يومي / أسبوعي / شهري / سنوي.
- فلتر: كل الأذكار / ذكر معين.
- رسم بياني (أعمدة CSS).
- تفاصيل كل ذكر (Breakdown).
- إجمالي الفترة.

### 3. الإعدادات (Settings)

#### المظهر

- تبديل الثيم (فاتح/داكن).

#### المجموعات

- إنشاء مجموعة.
- تعديل اسم ووصف المجموعة.
- حذف مجموعة.
- إدارة أذكار المجموعة (Modal):
  - إضافة أذكار.
  - حذف أذكار.
  - تعديل هدف كل ذكر.
  - إعادة ترتيب (↑ ↓).

#### الأذكار

- إضافة ذكر جديد.
- تعديل نص وهدف ذكر.
- حذف ذكر (مع بياناته).

#### البيانات

- مسح كل الأعداد.
- مسح كل الأهداف.
- مسح كل الإحصائيات.
- مسح كل شيء.

#### عن التطبيق

- الاسم والإصدار والوصف.

### 4. عام

- ثيم فاتح + داكن (محفوظ في localStorage).
- RTL كامل.
- متجاوب (موبايل/تابلت/كمبيوتر).
- نظام Modals موحّد:
  - `Modal` — الأساسي.
  - `PromptModal` — لإدخال قيمة.
  - `ConfirmModal` — للتأكيد.
  - `AdhkarFormModal` — للأذكار.
  - `GroupFormModal` — للمجموعات.
  - `GroupEditorModal` — لإدارة أذكار المجموعة.

### 5. صفحة Home (البوابة)

- كروت التطبيقات.
- Badge "قريبًا" للتطبيقات المستقبلية.
- Animations.

---

## 📡 API Endpoints

### الأذكار

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/api/adhkar` | كل الأذكار |
| POST | `/api/adhkar` | إضافة ذكر |
| PUT | `/api/adhkar/{id}` | تعديل ذكر |
| DELETE | `/api/adhkar/{id}` | حذف ذكر |

### الأعداد

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/api/counts` | الأعداد الحالية |
| DELETE | `/api/counts` | مسح كل الأعداد |

### الضغطات

| Method | Path | الوصف |
|--------|------|-------|
| POST | `/api/clicks` | تسجيل ضغطة |
| DELETE | `/api/clicks/{id}` | تصفير ذكر |
| DELETE | `/api/clicks` | مسح كل السجل |

### الأهداف

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/api/targets` | الأهداف المعدّلة |
| POST | `/api/targets` | تعديل هدف |
| DELETE | `/api/targets` | مسح كل الأهداف |

### الإحصائيات

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/api/stats?period=day&zekr_id=...` | إحصائيات مجمّعة |

### المجموعات

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/api/groups` | كل المجموعات |
| GET | `/api/groups/{id}` | مجموعة + أذكارها |
| POST | `/api/groups` | إضافة مجموعة |
| PUT | `/api/groups/{id}` | تعديل مجموعة |
| DELETE | `/api/groups/{id}` | حذف مجموعة |
| POST | `/api/groups/{id}/items` | إضافة ذكر |
| PUT | `/api/groups/{id}/items/{item_id}` | تعديل ذكر |
| DELETE | `/api/groups/{id}/items/{item_id}` | حذف ذكر |

### البيانات

| Method | Path | الوصف |
|--------|------|-------|
| DELETE | `/api/data/all` | مسح كل شيء |

---

## 🗄️ قاعدة البيانات

### الجداول

**`adhkar`** — الأذكار

```

id TEXT PRIMARY KEY
text TEXT NOT NULL
default_target INTEGER

```

**`clicks`** — سجل الضغطات (للإحصائيات)

```

id INTEGER PRIMARY KEY AUTOINCREMENT
zekr_id TEXT NOT NULL (FK)
timestamp INTEGER NOT NULL

```

**`counts`** — الأعداد الحالية

```

zekr_id TEXT PRIMARY KEY (FK)
count INTEGER NOT NULL DEFAULT 0

```

**`targets`** — الأهداف المعدّلة

```

zekr_id TEXT PRIMARY KEY (FK)
target INTEGER NOT NULL

```

**`groups`** — المجموعات

```

id TEXT PRIMARY KEY
name TEXT NOT NULL
description TEXT
created_at INTEGER NOT NULL

```

**`group_items`** — أذكار المجموعة

```

id INTEGER PRIMARY KEY AUTOINCREMENT
group_id TEXT NOT NULL (FK)
zekr_id TEXT NOT NULL (FK)
position INTEGER NOT NULL
target INTEGER

```

---

## 🚀 التشغيل

### المتطلبات

- Python 3.10+
- Node.js 18+
- npm

### Backend

```bash
cd backend-fastapi
python -m venv venv
source venv/bin/activate    # على Linux/Mac/Termux
# أو: venv\Scripts\activate  # على Windows
pip install -r requirements.txt
python seed.py              # مرة واحدة لتحميل الأذكار
uvicorn main:app --reload
```

يعمل على: http://localhost:8000
Swagger: http://localhost:8000/docs

Frontend

```bash
cd frontend-react
npm install
npm run dev
```

يعمل على: http://localhost:5173

---

🎓 التقنيات والمفاهيم المستفادة

Backend

· FastAPI + Dependency Injection
· SQLAlchemy ORM
· Pydantic Validation
· Transactions
· Foreign Keys
· CORS

Frontend

· React Hooks (useState, useEffect, useContext, useRef)
· Derived State vs State
· Context API
· Custom Hooks
· React Router
· SCSS Modules
· Optimistic Update

أنماط معمارية

· Single Source of Truth
· Separation of Concerns
· Reusable Components
· API Client abstraction
· Defensive Programming

Git

· init, add, commit, status, log, diff, show
· Branches, Merge, Conflicts
· .gitignore

---

🎯 أهداف التطوير المستقبلية

🎨 تجربة المستخدم

☐ زر "التالي" يدوي في وضع المجموعة (بدون انتظار).
☐ زر "السابق" للرجوع لذكر خلص.
☐ إعادة المجموعة من الصفر (زر Reset).
☐ اهتزاز خفيف عند التسبيح (Vibration API).
☐ صوت عند الوصول للهدف.
☐ إشعار عند إتمام المجموعة.
☐ Dark Mode تلقائي حسب النظام.

📊 الإحصائيات المتقدمة

☐ مقارنة بالفترة السابقة (هذا الأسبوع vs الماضي).
☐ Heatmap (زي GitHub contributions).
☐ تصدير CSV / JSON.
☐ أفضل أوقات التسبيح.

🔧 تحسينات تقنية

☐ حفظ العدّادات لكل مجموعة على حدة (تحسين جذري).
☐ Undo للمسح (Snackbar مع تراجع).
☐ TypeScript.
☐ Testing (Jest + Pytest).
☐ Performance optimization (useCallback, useMemo, React.memo).
☐ Code splitting.
☐ Migration system للـ DB.

🌍 التطبيقات الفرعية

☐ ترتيب الفقاعات (Bubble Sort visualization).
☐ ترتيب الاختيار (Selection Sort).
☐ تطبيقات تعليمية أخرى.

🕌 محتوى إسلامي

☐ أذكار الصباح والمساء.
☐ أدعية متنوعة.
☐ فضل كل ذكر.
☐ إشعارات بأذكار مخصصة.

👤 حساب المستخدم

☐ تسجيل دخول (Auth).
☐ مزامنة بين الأجهزة.
☐ نسخ احتياطي سحابي.

📱 الموبايل و PWA

☐ PWA — تثبيت على الموبايل.
☐ Offline mode.
☐ تطبيق أصلي (React Native / Flutter).

🚀 النشر

☐ Frontend على Vercel / Netlify.
☐ Backend على Railway / Render / Fly.io.
☐ Domain مخصص.
☐ CI/CD pipeline.

🌐国际化

☐ دعم الإنجليزية.
☐ تبديل اللغة.

---

📈 حالة التطوير

المجال الحالة
Backend API ✅ 95%
السبحة (عادي) ✅ 100%
السبحة (مجموعة) ✅ 90%
الإحصائيات ✅ 85%
الإعدادات ✅ 95%
صفحة Home ✅ 90%
الإجمالي ~90%

المتبقي:

· تحسينات UX.
· PWA.
· النشر.
· Testing.

---

🎬 الخلاصة

ذِكر تطبيق كامل، مبني من الصفر بـ:

· Backend احترافي (FastAPI + SQLAlchemy).
· Frontend حديث (React + Vite).
· قاعدة بيانات منظمة (SQLite).
· تصميم متجاوب مع RTL.
· ميزات متقدمة (مجموعات، إحصائيات، إعدادات).

كان رحلة تعلم ممتازة في:

· تطوير الـ Backend.
· تطوير الـ Frontend.
· تصميم قواعد البيانات.
· أنماط معمارية.
· Git.

"رحلة الألف ميل تبدأ بخطوة" — استمر ✨

```

---

## 🚦 خطوتك

1. **انسخ الملف** واحفظه في `~/my_app/README.md`.
2. **شوفه في VS Code** (اضغط `Ctrl+Shift+V` للمعاينة).
3. **Commit:**
   ```bash
   cd ~/my_app
   git add README.md
   git commit -m "Add comprehensive README"
```

قولي لو في حاجة ناقصة أو محتاجة تعديل. 🚀
