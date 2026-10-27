#!/usr/bin/env bash
set -e

echo "🔧 استبدال var(--bp-*) في @media بقيم ثابتة..."

# القيم القياسية
# bp-sm = 640px
# bp-md = 768px
# bp-lg = 1024px

find src -name "*.scss" -exec sed -i \
  -e 's/var(--bp-sm)/640px/g' \
  -e 's/var(--bp-md)/768px/g' \
  -e 's/var(--bp-lg)/1024px/g' \
  {} \;

echo "✅ تم"
echo ""
echo "🔍 التأكد:"
grep -rn 'var(--bp-' src --include="*.scss" || echo "✨ لا يوجد var(--bp-*) متبقي"
