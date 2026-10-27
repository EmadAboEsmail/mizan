#!/usr/bin/env bash
set -e

echo "🔍 البحث عن ملفات SCSS فيها متغيرات \$ القديمة..."

# قائمة الاستبدالات — من الأطول للأقصر عشان نتجنب التصادمات
declare -A REPLACEMENTS=(
  # Spacing
  ['$space-1']='var(--space-1)'
  ['$space-2']='var(--space-2)'
  ['$space-3']='var(--space-3)'
  ['$space-4']='var(--space-4)'
  ['$space-5']='var(--space-5)'
  ['$space-6']='var(--space-6)'
  ['$space-8']='var(--space-8)'
  ['$space-10']='var(--space-10)'
  ['$space-12']='var(--space-12)'
  ['$space-16']='var(--space-16)'
  # Radius
  ['$radius-xs']='var(--radius-xs)'
  ['$radius-sm']='var(--radius-sm)'
  ['$radius-md']='var(--radius-md)'
  ['$radius-lg']='var(--radius-lg)'
  ['$radius-xl']='var(--radius-xl)'
  ['$radius-2xl']='var(--radius-2xl)'
  ['$radius-full']='var(--radius-full)'
  ['$border-radius']='var(--border-radius)'
  # Duration
  ['$duration-fast']='var(--duration-fast)'
  ['$duration-base']='var(--duration-base)'
  ['$duration-slow']='var(--duration-slow)'
  # Easing
  ['$ease-out']='var(--ease-out)'
  ['$ease-in-out']='var(--ease-in-out)'
  ['$ease-spring']='var(--ease-spring)'
  # Transition / Gap / Padding
  ['$transition']='var(--transition)'
  ['$gap']='var(--gap)'
  ['$padding']='var(--padding)'
  # Fonts
  ['$font-display']='var(--font-display)'
  ['$font-body']='var(--font-body)'
  ['$font-main']='var(--font-main)'
  # Text sizes
  ['$text-xs']='var(--text-xs)'
  ['$text-sm']='var(--text-sm)'
  ['$text-base']='var(--text-base)'
  ['$text-lg']='var(--text-lg)'
  ['$text-xl']='var(--text-xl)'
  ['$text-2xl']='var(--text-2xl)'
  ['$text-3xl']='var(--text-3xl)'
  ['$text-4xl']='var(--text-4xl)'
  # Old color aliases
  ['$text-light']='var(--text-light)'
  ['$text-dark']='var(--text-dark)'
  ['$text-display-light']='var(--text-display-light)'
  ['$text-display-dark']='var(--text-display-dark)'
  ['$bg-display-light']='var(--bg-display-light)'
  ['$bg-display-dark']='var(--bg-display-dark)'
  ['$bg-btn-light']='var(--bg-btn-light)'
  ['$bg-btn-dark']='var(--bg-btn-dark)'
  ['$bg-btn-hover-light']='var(--bg-btn-hover-light)'
  ['$bg-btn-hover-dark']='var(--bg-btn-hover-dark)'
  ['$bg-container-light']='var(--bg-container-light)'
  ['$bg-container-dark']='var(--bg-container-dark)'
  ['$bg-page-dark']='var(--bg-page-dark)'
  ['$border-light']='var(--border-light)'
  ['$border-dark']='var(--border-dark)'
)

# تطبيق الاستبدالات على كل ملفات scss (فقط src، ليس styles نفسها)
for file in $(find src -type f -name "*.scss" ! -path "src/styles/*"); do
  for key in "${!REPLACEMENTS[@]}"; do
    val="${REPLACEMENTS[$key]}"
    sed -i.bak "s|\\${key}|${val}|g" "$file"
  done
  rm -f "${file}.bak"
  echo "✅ $file"
done

echo ""
echo "🔍 فحص متغيرات \$ المتبقية..."
LEFT=$(grep -rn '\$[a-z]' src --include="*.scss" --exclude-dir=styles 2>/dev/null || true)

if [ -z "$LEFT" ]; then
  echo "✨ لا توجد متغيرات \$ متبقية. التوحيد اكتمل!"
else
  echo "⚠️ متغيرات لم تُستبدل (راجعها يدوياً):"
  echo "$LEFT"
fi
