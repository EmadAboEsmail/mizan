# دليل المساهمة في ميزان

شكراً لاهتمامك بالمساهمة في **ميزان**! 🙏

## 🐛 الإبلاغ عن مشكلة

قبل فتح issue، تأكد من:
- البحث في الـ issues المفتوحة والمغلقة
- تجربة آخر إصدار (`git pull origin main`)
- مسح الـ cache (`npm install` من جديد)

**في issue جديد، اذكر:**
- وصف واضح للمشكلة
- خطوات إعادة الإنتاج
- المتصفح / الجهاز
- Screenshot (لو أمكن)

## 💡 اقتراح ميزة

افتح issue بعنوان `[Feature]` واشرح:
- المشكلة اللي الميزة هتحلها
- كيف تتخيلها؟
- هل عندك تصميم/مرجع؟

## 🔧 إرسال Pull Request

1. Fork المشروع
2. أنشئ فرع:
   ```bash
   git checkout -b feat/اسم-الميزة
   # أو
   git checkout -b fix/اسم-الباج
```

3. اكتب كود نظيف:
   · استخدم _tokens.scss (مفيش hex مباشر)
   · اتبع نمط الملفات الموجود
   · أضف تعليقات للكود المعقد
4. اكتب commit message واضح:
   · feat: إضافة تصدير PDF للتقرير
   · fix: إصلاح كارت المعاملة على الموبايل
   · docs: تحديث README
   · style: تنسيق كود الميزانية
5. افتح PR مع وصف واضح

📐 معايير الكود

· JSX: function components + hooks
· CSS: SCSS modules + CSS variables
· Naming: camelCase للمتغيرات، PascalCase للمكونات
· Language: عربي للـ UI، إنجليزي للكود
· No direct hex colors — استخدم var(--token)

🎨 التصميم

· الألوان من _tokens.scss فقط
· استخدم var(--space-*) بدل px مباشر
· استخدم var(--radius-*) بدل border-radius ثابت
· Dark mode إجباري لكل component جديد

✅ قبل الإرسال

```bash
npm run lint    # بدون أخطاء
npm run build   # يبني بنجاح
```

---

شكراً لمساهمتك! 🤍

```

---

## 4️⃣ تحقق من `.gitignore`

```bash
cat .gitignore
```

لو ناقص حاجة، أضف:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/
.vite/

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Android
android/app/build/
android/build/
android/.gradle/
android/local.properties
android/key.properties
*.keystore
*.jks

# Testing
coverage/

# Cache
.cache/
.eslintcache
```

