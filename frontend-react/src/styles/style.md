📄 CSS-VARIABLES-MIGRATION.md

ملف مرجعي شامل — سجله في المشروع (docs/CSS-VARIABLES-MIGRATION.md أو جذره).

---

```markdown
# 🎨 CSS Variables Migration Guide

> **الهدف:** تحويل كل `:global(body.dark)` blocks إلى CSS Variables
> **الفايدة:** كود أنضف + theme switching أسهل + صيانة أبسط
> **الأثر على السرعة:** 5-10% (البطء الحقيقي كان في مكان تاني)

---

## 📋 قبل ما تبدأ — Setup

### 1. إنشاء `src/styles/_css-vars.scss`
(راجع الملف اللي بعته — فيه كل المتغيرات)

### 2. إضافة `@use` في `src/styles/main.scss`
```scss
@use './css-vars';
```

⚠️ لازم يكون أول سطر — قبل أي ملف بيستخدم المتغيرات.

3. تحويل ملف نموذج

src/pages/BudgetTransactions.module.scss — اتحول بالفعل ✅

4. تأكد من الشكل

· افتح /budget/transactions
· بدّل light/dark
· نفس الشكل قبل التحويل = تمام

---

🎨 خريطة الألوان (Quick Reference)

🎯 Backgrounds

Hex / Value Variable ملاحظات
#f8fafc var(--bg-base) Light page bg
#090d16 var(--bg-base) Dark page bg
#ffffff var(--bg-card) Light card bg
#0f172a var(--bg-card) Dark card bg
rgba(0, 0, 0, 0.02) var(--bg-subtle) Very subtle bg
rgba(0, 0, 0, 0.03) var(--bg-subtle) Same
rgba(0, 0, 0, 0.04) var(--bg-subtle-hover) Hover state
rgba(0, 0, 0, 0.05) var(--bg-muted) Muted bg
rgba(255, 255, 255, 0.03) (dark) var(--bg-subtle) Dark subtle
rgba(255, 255, 255, 0.04) (dark) var(--bg-subtle) Dark subtle
rgba(255, 255, 255, 0.05) (dark) var(--bg-muted) Dark muted

📝 Text

Hex / Value Variable
#0f172a var(--text-primary)
#1e293b var(--text-secondary)
#334155 var(--text-secondary)
#475569 var(--text-muted)
#64748b var(--text-muted)
#94a3b8 var(--text-faint)
#f8fafc (dark) var(--text-primary)
#f1f5f9 (dark) var(--text-secondary)
#e2e8f0 (dark) var(--text-secondary)
#cbd5e1 (dark) var(--text-muted)

🌿 Brand Green

Hex / Value Variable
#059669 var(--brand-primary)
#047857 var(--brand-primary-dark)
#10b981 var(--brand-primary-light)
#34d399 (dark) var(--brand-primary)
rgba(5, 150, 105, 0.08) var(--brand-bg-soft)
rgba(5, 150, 105, 0.1) var(--brand-bg-soft)
rgba(5, 150, 105, 0.12) var(--brand-bg-medium)
rgba(5, 150, 105, 0.15) var(--brand-bg-medium)
rgba(5, 150, 105, 0.2) var(--brand-border)
rgba(5, 150, 105, 0.25) var(--brand-border)
#059669 (border) var(--brand-border-strong)
rgba(52, 211, 153, *) (dark) var(--brand-*)

✅ Success (Income)

Hex / Value Variable
#16a34a var(--success)
#22c55e var(--success)
#4ade80 var(--success-light)
rgba(34, 197, 94, *) var(--success-bg-soft) / var(--success-border)
rgba(74, 222, 128, *) (dark) نفس الشيء

❌ Danger (Expense / Delete)

Hex / Value Variable
#dc2626 var(--danger)
#ef4444 var(--danger)
#b91c1c var(--danger-dark)
#f87171 (dark) var(--danger)
rgba(239, 68, 68, *) var(--danger-bg-soft) / var(--danger-border)

🔲 Borders

Hex / Value Variable
rgba(0, 0, 0, 0.06) var(--border-default)
rgba(0, 0, 0, 0.08) var(--border-default)
rgba(0, 0, 0, 0.1) var(--border-strong)
rgba(0, 0, 0, 0.12) var(--border-strong)
rgba(255, 255, 255, 0.06) (dark) var(--border-default)
rgba(255, 255, 255, 0.08) (dark) var(--border-default)
rgba(255, 255, 255, 0.1) (dark) var(--border-strong)

🔘 Border Radius

Value Variable
6px var(--radius-sm)
8px var(--radius-sm)
10px var(--radius-md)
12px var(--radius-md)
14px var(--radius-lg)
16px var(--radius-lg)
18px var(--radius-xl)
20px var(--radius-xl)
24px var(--radius-2xl)
999px var(--radius-full)

⏱️ Transitions

Value Variable
0.15s ease var(--transition-fast)
0.2s ease var(--transition-normal)
0.25s ease var(--transition-normal)
0.3s ease var(--transition-slow)

---

🔄 Patterns (Before / After)

Pattern 1: Card with dark variant

قبل:

```scss
.card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: #0f172a;

  :global(body.dark) & {
    background: #0f172a;
    border-color: rgba(255, 255, 255, 0.06);
    color: #f8fafc;
  }
}
```

بعد:

```scss
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
}
```

النتيجة: -8 أسطر.

---

Pattern 2: Hover state

قبل:

```scss
.item {
  background: rgba(0, 0, 0, 0.02);
  :global(body.dark) & { background: rgba(255, 255, 255, 0.03); }

  &:hover {
    background: rgba(0, 0, 0, 0.03);
    :global(body.dark) & { background: rgba(255, 255, 255, 0.05); }
  }
}
```

بعد:

```scss
.item {
  background: var(--bg-subtle);

  &:hover {
    background: var(--bg-subtle-hover);
  }
}
```

---

Pattern 3: Brand button

قبل:

```scss
.btn {
  background: #059669;
  color: #fff;
  border: none;
  box-shadow: 0 2px 10px rgba(5, 150, 105, 0.25);

  &:hover {
    background: #047857;
  }

  :global(body.dark) & {
    background: #34d399;
    color: #0f172a;
  }
}
```

بعد:

```scss
.btn {
  background: var(--brand-primary);
  color: var(--text-inverse);
  border: none;
  box-shadow: 0 2px 10px var(--brand-bg-medium);

  &:hover {
    background: var(--brand-primary-dark);
  }
}
```

ملاحظة: --text-inverse = #fff في light، #0f172a في dark. بيشتغل صح في الحالتين.

---

Pattern 4: Input / Focus

قبل:

```scss
.input {
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.02);
  color: #0f172a;

  :global(body.dark) & {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: #f8fafc;
  }

  &:focus {
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);

    :global(body.dark) & {
      border-color: #34d399;
      box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.15);
    }
  }
}
```

بعد:

```scss
.input {
  border: 1px solid var(--border-strong);
  background: var(--bg-subtle);
  color: var(--text-primary);

  &:focus {
    border-color: var(--brand-border-strong);
    box-shadow: 0 0 0 3px var(--brand-bg-medium);
  }
}
```

---

Pattern 5: Income vs Expense (dynamic)

قبل:

```scss
.amount {
  &.income {
    color: #16a34a;
    :global(body.dark) & { color: #4ade80; }
  }
  &.expense {
    color: #dc2626;
    :global(body.dark) & { color: #f87171; }
  }
}
```

بعد:

```scss
.amount {
  &.income { color: var(--success); }
  &.expense { color: var(--danger); }
}
```

---

Pattern 6: Focus ring (accessibility)

قبل:

```scss
&:focus-visible {
  outline: 2px solid #059669;
  outline-offset: 4px;
}
```

بعد:

```scss
&:focus-visible {
  outline: 2px solid var(--brand-border-strong);
  outline-offset: 4px;
}
```

---

📁 الملفات — Checklist

🔴 Tier 1: الأساس (افعل أولاً — الأعلى أثرًا)

# الملف الحجم body.dark blocks الحالة
✅ src/pages/BudgetTransactions.module.scss كبير 12 DONE
1 src/pages/BudgetReports.module.scss كبير 15+ ⏳
2 src/pages/BudgetLayout.module.scss كبير 8+ ⏳
3 src/pages/ZekrLayout.module.scss كبير 10+ ⏳
4 src/components/ui/Modal.module.scss متوسط 6+ ⏳
5 src/components/budget/TransactionFormModal.module.scss كبير 10+ ⏳
6 src/components/budget/settings/CategoryFormModal.module.scss كبير 10+ ⏳

بعد هذه الـ 7 ملفات: ~60% من الـ dark mode code اتحول.

---

🟠 Tier 2: المكونات التفاعلية

# الملف الحجم الحالة
7 src/pages/ZekrSabh.module.scss متوسط ⏳
8 src/pages/Home.module.scss متوسط ⏳
9 src/components/AppCard.module.scss متوسط ⏳
10 src/components/zekr_app/zekr/ZekrDisplay.module.scss كبير ⏳
11 src/components/zekr_app/zekr/ActionButtons.module.scss متوسط ⏳
12 src/components/zekr_app/zekr/AdhkarSelect.module.scss كبير ⏳
13 src/components/zekr_app/zekr/GroupSelect.module.scss كبير ⏳
14 src/components/zekr_app/zekr/GroupModeView.module.scss كبير ⏳
15 src/components/zekr_app/zekr/FocusMode.module.scss متوسط ⏳

---

🟡 Tier 3: صفحات الإعدادات

# الملف الحجم الحالة
16 src/components/zekr_app/settings/SettingsSection.module.scss متوسط ⏳
17 src/components/zekr_app/settings/SettingsSectionNav.module.scss متوسط ⏳
18 src/components/zekr_app/settings/SettingsTab.module.scss متوسط ⏳
19 src/components/zekr_app/settings/AppearanceSection.module.scss كبير ⏳
20 src/components/zekr_app/settings/AdhkarSection.module.scss كبير ⏳
21 src/components/zekr_app/settings/GroupsSection.module.scss كبير ⏳
22 src/components/zekr_app/settings/DataSection.module.scss كبير ⏳
23 src/components/zekr_app/settings/AboutSection.module.scss كبير ⏳
24 src/components/zekr_app/settings/AdhkarFormModal.module.scss متوسط ⏳
25 src/components/zekr_app/settings/GroupFormModal.module.scss متوسط ⏳
26 src/components/zekr_app/settings/GroupEditorModal.module.scss كبير ⏳
27 src/components/budget/settings/CategoriesSection.module.scss كبير ⏳
28 src/components/budget/settings/DataSection.module.scss كبير ⏳
29 src/components/budget/settings/AboutSection.module.scss متوسط ⏳

---

🟢 Tier 4: الإحصائيات والرسوم

# الملف الحجم الحالة
30 src/components/zekr_app/stats/StatsTab.module.scss كبير ⏳
31 src/components/zekr_app/stats/BarChart.module.scss كبير ⏳
32 src/components/zekr_app/stats/PeriodTabs.module.scss متوسط ⏳
33 src/components/zekr_app/stats/ZekrFilter.module.scss متوسط ⏳
34 src/components/zekr_app/stats/StreakCard.module.scss كبير ⏳
35 src/components/zekr_app/stats/ComparisonCard.module.scss كبير ⏳
36 src/components/zekr_app/stats/EmptyStats.module.scss صغير ⏳
37 src/components/budget/charts/DonutChart.module.scss كبير ⏳
38 src/components/budget/charts/MonthlyBarChart.module.scss كبير ⏳

---

🔵 Tier 5: صغيرة / نادرة

# الملف الحجم الحالة
39 src/pages/BudgetSettings.module.scss صغير جدًا ⏳
40 src/components/ui/ThemeToggle.module.scss صغير ⏳
41 src/components/ui/ConfirmModal.module.scss صغير ⏳
42 src/components/ui/PromptModal.module.scss صغير ⏳
43 src/components/home/QuickStats.module.scss صغير ⏳
44 src/components/home/ContinueCard.module.scss متوسط ⏳
45 src/components/budget/CategoryIcon.module.scss صغير ⏳
46 src/components/zekr_app/zekr/SabhModeTabs.module.scss متوسط ⏳
47 src/components/zekr_app/zekr/Tabs.module.scss متوسط ⏳
48 src/context/Toast.module.scss صغير ⏳
49 src/components/pwa/InstallPrompt.module.scss صغير ⏳

Total: 49 ملف + 1 منجز = 50

---

🛠️ Method — خطوات التحويل (لكل ملف)

1. افحص الملف

```bash
# عدّ الـ body.dark blocks
grep -c "body.dark" src/pages/FILE.module.scss

# لو 0 → مش محتاج تحويل
# لو > 0 → كمّل
```

2. افتح الملف + احفظ نسخة (git يعملها)

```bash
git status
# أو اعمل commit صغير قبل التحويل
```

3. Search & Replace (في VS Code)

Ctrl+H → اضغط . لتفعيل regex

ثم استبدل بالترتيب:

Group 1: Backgrounds

ابحث استبدل
background:\s*#ffffff; background: var(--bg-card);
background:\s*#f8fafc; background: var(--bg-base);
background-color:\s*#f8fafc; background-color: var(--bg-base);
background:\s*#0f172a; background: var(--bg-card);
background-color:\s*#090d16; background-color: var(--bg-base);
background:\s*rgba\(0,\s*0,\s*0,\s*0\.0[23]\); background: var(--bg-subtle);
background:\s*rgba\(0,\s*0,\s*0,\s*0\.0[45]\); background: var(--bg-muted);

Group 2: Text colors

ابحث استبدل
color:\s*#0f172a; color: var(--text-primary);
color:\s*#1e293b; color: var(--text-secondary);
color:\s*#334155; color: var(--text-secondary);
color:\s*#475569; color: var(--text-muted);
color:\s*#64748b; color: var(--text-muted);
color:\s*#94a3b8; color: var(--text-faint);

Group 3: Brand

ابحث استبدل
#059669 (كل اللي في color/background) var(--brand-primary)
#047857 var(--brand-primary-dark)
rgba\(5,\s*150,\s*105,\s*0\.08\) var(--brand-bg-soft)
rgba\(5,\s*150,\s*105,\s*0\.1\) var(--brand-bg-soft)
rgba\(5,\s*150,\s*105,\s*0\.12\) var(--brand-bg-medium)
rgba\(5,\s*150,\s*105,\s*0\.15\) var(--brand-bg-medium)
rgba\(5,\s*150,\s*105,\s*0\.2\) var(--brand-border)

Group 4: Income / Expense

ابحث استبدل
#16a34a var(--success)
#22c55e var(--success)
#4ade80 var(--success-light)
#dc2626 var(--danger)
#ef4444 var(--danger)
#b91c1c var(--danger-dark)
#f87171 var(--danger)

Group 5: Borders

ابحث استبدل
rgba\(0,\s*0,\s*0,\s*0\.0[68]\) var(--border-default)
rgba\(0,\s*0,\s*0,\s*0\.1[02]\) var(--border-strong)

4. احذف :global(body.dark) & { ... } blocks

ملاحظة: بعد الـ replace، الـ block هيبقى فيه نفس القيم — احذفه بالكامل.

قبل:

```scss
.item {
  background: var(--bg-subtle);
  color: var(--text-primary);

  :global(body.dark) & {
    background: var(--bg-subtle);  // ← نفس القيمة
    color: var(--text-primary);    // ← نفس القيمة
  }
}
```

بعد (احذف الـ block):

```scss
.item {
  background: var(--bg-subtle);
  color: var(--text-primary);
}
```

5. أعد تشغيل Vite (لو مشتغلش)

```bash
# لو لاحظت مشكلة، امسح الـ cache
rm -rf node_modules/.vite
npm run dev
```

6. اختبر

# اختبار المتوقع
1 Light mode نفس الشكل قبل التحويل
2 Dark mode كل شيء صح
3 Hover نفس السلوك
4 Focus outline صحيح
5 Console نظيف

7. Commit

```bash
git add src/pages/FILE.module.scss
git commit -m "refactor(styles): migrate FILE to CSS variables"
```

---

🧪 اختبار شامل (بعد كل Tier)

Tier 1 (بعد 7 ملفات):

☐ /budget/transactions — Light + Dark
☐ /budget/reports — Light + Dark
☐ /zekr/sabh — Light + Dark
☐ Modal (أي واحد) — Light + Dark
☐ Console نظيف
☐ DevTools → Computed → --text-primary بتتحدث مع theme

Tier 2 (بعد 15 ملفات):

☐ /zekr/stats — Light + Dark
☐ /zekr/settings — Light + Dark
☐ / (Home) — Light + Dark
☐ AppCard hover — Light + Dark

Tier 3-5 (نهائي):

☐ كل صفحات التطبيق — Light + Dark
☐ كل المودالز — Light + Dark
☐ Dark mode toggle في كل مكان
☐ مفيش :global(body.dark) في أي ملف (ما عدا _css-vars.scss)

```bash
# التحقق النهائي
grep -r "body.dark" src/ --include="*.scss" | grep -v "css-vars" | grep -v "main.scss"
# → المفروض يطلع 0 نتائج
```

---

🎨 التحويل الشامل (Script — اختياري)

لو تحب تعمل bulk replace بدون VS Code:

```bash
#!/bin/bash
# save as: migrate.sh
# usage: ./migrate.sh src/pages/BudgetReports.module.scss

FILE="$1"
if [ ! -f "$FILE" ]; then
  echo "❌ File not found: $FILE"
  exit 1
fi

# Backup
cp "$FILE" "$FILE.bak"

# Text colors
sed -i 's/color: #0f172a;/color: var(--text-primary);/g' "$FILE"
sed -i 's/color: #1e293b;/color: var(--text-secondary);/g' "$FILE"
sed -i 's/color: #334155;/color: var(--text-secondary);/g' "$FILE"
sed -i 's/color: #475569;/color: var(--text-muted);/g' "$FILE"
sed -i 's/color: #64748b;/color: var(--text-muted);/g' "$FILE"
sed -i 's/color: #94a3b8;/color: var(--text-faint);/g' "$FILE"

# Backgrounds
sed -i 's/background: #ffffff;/background: var(--bg-card);/g' "$FILE"
sed -i 's/background: #f8fafc;/background: var(--bg-base);/g' "$FILE"
sed -i 's/background: #0f172a;/background: var(--bg-card);/g' "$FILE"

# Brand
sed -i 's/#059669/var(--brand-primary)/g' "$FILE"
sed -i 's/#047857/var(--brand-primary-dark)/g' "$FILE"

# Income / Expense
sed -i 's/#16a34a/var(--success)/g' "$FILE"
sed -i 's/#dc2626/var(--danger)/g' "$FILE"

echo "✅ $FILE migrated"
echo "⚠️  Backup: $FILE.bak"
echo "⚠️  Manual step: delete :global(body.dark) blocks"
```

⚠️ ما تعتمدش عليه 100% — راجع الملف بعدين. الـ sed ممكن يغلط لو فيه حالات خاصة.

---

🚨 Rollback Plan

لو حصلت مشكلة في ملف:

```bash
# ارجع للنسخة السابقة
git checkout -- src/pages/FILE.module.scss

# أو من الـ backup
cp src/pages/FILE.module.scss.bak src/pages/FILE.module.scss
```

لو حصلت مشكلة في _css-vars.scss:

· حذف @use './css-vars'; من main.scss
· الملفات المتحولة هتستخدم var(...) — هتظهر فارغة
· الحل: ارجع الملفات بـ git checkout

توصية: اعمل commit بعد كل Tier — أمان للرجوع.

---

📊 القياس — قبل/بعد

قبل (مثال):

```bash
grep -c "body.dark" src/pages/BudgetTransactions.module.scss
# → 12
```

بعد:

```bash
grep -c "body.dark" src/pages/BudgetTransactions.module.scss
# → 0 ✅
```

الإجمالي:

```bash
# قبل
find src -name "*.module.scss" -exec grep -l "body.dark" {} \; | wc -l
# → ~30 ملف

# بعد
# → 0
```

---

🎯 الفوائد المتوقعة

المقياس قبل بعد التوفير
body.dark blocks ~200 0 -100%
أسطر SCSS مكررة ~1500 ~700 -53%
Hex values متكررة ~400 ~30 -93%
وقت تبديل theme ثواني لحظي ✅
إضافة theme جديد ساعات دقائق ⚡
حجم CSS أكبر أصغر -20%
صيانة صعبة سهلة ✅

---

🚀 بعد التحويل — إضافة Themes جديدة

مع _css-vars.scss، ممكن تضيف:

```scss
// src/styles/themes/_blue.scss
body.theme-blue {
  --brand-primary: #0ea5e9;
  --brand-primary-dark: #0284c7;
  --brand-bg-soft: rgba(14, 165, 233, 0.08);
  --brand-bg-medium: rgba(14, 165, 233, 0.12);
  --brand-border: rgba(14, 165, 233, 0.25);
  --brand-border-strong: #0ea5e9;
}
```

ثم في AppearanceSection.jsx:

```jsx
// زر "أزرق" بجانب "فاتح/داكن"
```

مفيش تعديل في أي ملف SCSS تاني. ✨

---

✅ الـ Checklist النهائي

☐ _css-vars.scss موجود + مستورد في main.scss
☐ Tier 1 (7 ملفات) — تم التحويل
☐ Tier 2 (9 ملفات) — تم التحويل
☐ Tier 3 (14 ملف) — تم التحويل
☐ Tier 4 (9 ملفات) — تم التحويل
☐ Tier 5 (11 ملف) — تم التحويل
☐ grep -r "body.dark" src/ --include="*.scss" = 0
☐ كل الصفحات — Light mode يعمل صح
☐ كل الصفحات — Dark mode يعمل صح
☐ Console نظيف
☐ git log → commit لكل Tier
☐ اختبار يدوي شامل على الموبايل + الديسكتوب

---

📅 Timeline مقترح

Tier الملفات الوقت الأولوية
Setup 2 15 د 🔴 إجباري
Tier 1 7 1-2 س 🔴 الآن
Tier 2 9 1-2 س 🟠 هذا الأسبوع
Tier 3 14 2-3 س 🟡 متى تسنح الفرصة
Tier 4 9 1-2 س 🟢 تدريجي
Tier 5 11 1-2 س 🟢 تدريجي

Total: ~7-13 ساعات (على فترات).

التوصية: Tier 1 دلوقتي (1-2 ساعة)، والباقي كل ما نلمس ملف للتحويل معه.

---

🎯 الخلاصة

هذا التحويل:

· ✅ كود أنضف (أهم فايدة)
· ✅ صيانة أسهل
· ✅ themes جديدة ممكنة
· 🟡 أداء +5-10% (البطء الحقيقي اتحل)
· 🟡 مش ضروري 100% — لكن مفيد

ابدأ بـ Tier 1 دلوقتي، والباقي تدريجي. مفيش داعي للاستعجال — التطبيق شغال.

---

آخر تحديث: 2026-10-21
الحالة: مقترح للتنفيذ

```

---

## 📌 كيف تستخدم الملف

### 1. احفظه في المشروع:
```bash
mkdir -p docs
# احفظ الملف كـ docs/CSS-VARIABLES-MIGRATION.md
```

2. لما تحب تحول ملف:

· افتح الملف
· جدول خريطة الألوان (Quick Reference)
· ابحث عن Hex في الملف بـ Ctrl+F
· استبدل حسب الجدول
· احذف :global(body.dark) blocks
· اختبر

3. لما تخلص Tier:

· اتبع الـ checklist
· اعمل commit
· وثّق في git log

---

❓ قرارك النهائي

الملف ده مرجع كامل — لو قررت تأجّل التحويل لما بعد إضافة ميزات جديدة، تمام. الـ CSS Variables نظافة كود مش إصلاح بطء.

رأيي:

· 🟢 أجّل التحويل — ابدأ الميزانية الشهرية (قيمة أعلى)
· 🟠 Tier 1 بس دلوقتي — ساعة شغل، تحسين واضح
· 🔴 التحويل كامل — يوم شغل، مش مستعجل

قولي قرارك. 🚀
