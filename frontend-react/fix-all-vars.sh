#!/usr/bin/env bash
set -e

echo "🔍 البحث عن متغيرات \$ المعرّفة محلياً (لا نستبدلها)..."
LOCAL_DEFS=$(grep -rhoE '^\$[a-zA-Z][a-zA-Z0-9_-]*' src --include="*.scss" --exclude-dir=styles | sort -u)
if [ -n "$LOCAL_DEFS" ]; then
  echo "⚠️ متغيرات معرّفة محلياً — استبعدها يدوياً أو انقلها لـ _tokens:"
  echo "$LOCAL_DEFS"
  echo ""
fi

echo "🔧 استبدال كل \$var → var(--var) في كل ملفات SCSS..."
find src -name "*.scss" ! -path "src/styles/*" -exec sh -c '
  for file do
    sed -i -E "s/\\\$([a-zA-Z][a-zA-Z0-9_-]*)/var(--\1)/g" "$file"
    echo "✅ $file"
  done
' sh {} +

echo ""
echo "🔍 فحص متغيرات \$ المتبقية..."
LEFT=$(grep -rn '\$[a-zA-Z]' src --include="*.scss" --exclude-dir=styles 2>/dev/null || true)
if [ -z "$LEFT" ]; then
  echo "✨ لا توجد متغيرات \$ متبقية."
else
  echo "⚠️ متبقية:"
  echo "$LEFT"
fi
