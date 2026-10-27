#!/usr/bin/env bash
# collect_files.sh - يجمع محتويات ملفات/مجلدات في ملف واحد

set -euo pipefail

# ---------- الإعدادات الافتراضية ----------
OUTPUT_FILE="collected_output.txt"
SEPARATOR="================================================================================"
MAX_SIZE_KB=500      # تجاهل الملفات الأكبر من هذا الحجم (KB)
declare -a INPUT_PATHS=()

# ---------- دوال مساعدة ----------
usage() {
    cat <<EOF
الاستخدام:
  $0 [-o output_file] [-s max_size_kb] [paths...]
  $0              # وضع تفاعلي (يقرأ المسارات سطرًا سطرًا)

الخيارات:
  -o FILE    اسم ملف الخروج (افتراضي: $OUTPUT_FILE)
  -s KB      تجاهل الملفات الأكبر من KB كيلوبايت (افتراضي: $MAX_SIZE_KB)
  -h         عرض هذه المساعدة

مثال:
  $0 -o all_code.txt src/main.jsx src/hooks/ src/pages/budget/BudgetLayout.jsx
EOF
}

# التحقق من أن الملف نصي وقابل للقراءة
# التحقق من أن الملف نصي وقابل للقراءة
is_text_file() {
    local file="$1"
    [[ -f "$file" && -r "$file" ]] || return 1

    # تجاهل الملفات الفارغة تمامًا (اختياري، شيلها لو عايز تجمعهم)
    [[ -s "$file" ]] || return 1

    # الطريقة 1: استخدام file --mime
    local mime
    mime=$(file --mime --brief "$file" 2>/dev/null || echo "")

    # لو الـ mime فيه text/ أو json/javascript/xml → نصي
    if [[ "$mime" == text/* ]] || \
       [[ "$mime" == *json* ]] || \
       [[ "$mime" == *javascript* ]] || \
       [[ "$mime" == *xml* ]] || \
       [[ "$mime" == *"charset=us-ascii"* ]] || \
       [[ "$mime" == *"charset=utf-8"* ]]; then
        return 0
    fi

    # الطريقة 2 (احتياطية): لو أول 512 بايت مفيهمش بايتات null → غالبًا نصي
    if ! head -c 512 "$file" 2>/dev/null | grep -qP '\x00'; then
        return 0
    fi

    return 1
}
# استبعاد مجلدات غير مرغوبة
should_skip_dir() {
    local name="$1"
    case "$name" in
        node_modules|.git|dist|build|.next|coverage|.cache|vendor|__pycache__)
            return 0 ;;
    esac
    return 1
}

# إضافة ملف إلى المخرجات
append_file() {
    local file="$1"
    local size_kb
    size_kb=$(du -k "$file" | cut -f1)

    if (( size_kb > MAX_SIZE_KB )); then
        echo "⏭️  تخطي (كبير جدًا: ${size_kb}KB): $file" >&2
        return
    fi

    if ! is_text_file "$file"; then
        echo "⏭️  تخطي (ليس نصًا): $file" >&2
        return
    fi

    {
        echo ""
        echo "$SEPARATOR"
        echo "📄 FILE: $file"
        echo "📦 SIZE: ${size_kb}KB"
        echo "$SEPARATOR"
        echo ""
        cat "$file"
        echo ""
    } >> "$OUTPUT_FILE"

    echo "✅ أُضيف: $file" >&2
}

# معالجة مسار (ملف أو مجلد)
process_path() {
    local path="$1"
    path="${path#✅ }"     # إزالة علامة ✅ لو موجودة
    path="${path%%←*}"     # إزالة التعليقات بعد ←
    path="${path%%#*}"     # إزالة التعليقات بعد #
    path=$(echo "$path" | xargs)  # trim

    [[ -z "$path" ]] && return

    if [[ -f "$path" ]]; then
        append_file "$path"
    elif [[ -d "$path" ]]; then
        while IFS= read -r -d '' f; do
            append_file "$f"
        done < <(find "$path" -type d \( -name node_modules -o -name .git -o -name dist -o -name build \) -prune -o -type f -print0)
    else
        echo "❌ مسار غير موجود: $path" >&2
    fi
}

# ---------- تحليل المعاملات ----------
while getopts ":o:s:h" opt; do
    case "$opt" in
        o) OUTPUT_FILE="$OPTARG" ;;
        s) MAX_SIZE_KB="$OPTARG" ;;
        h) usage; exit 0 ;;
        *) usage; exit 1 ;;
    esac
done
shift $((OPTIND - 1))

INPUT_PATHS=("$@")

# ---------- الوضع التفاعلي ----------
if [[ ${#INPUT_PATHS[@]} -eq 0 ]]; then
    echo "📥 أدخل المسارات (سطر لكل مسار). اكتب END للإنهاء:"
    while IFS= read -r line; do
        [[ "$line" == "END" ]] && break
        [[ -z "${line// }" ]] && continue
        INPUT_PATHS+=("$line")
    done
fi

if [[ ${#INPUT_PATHS[@]} -eq 0 ]]; then
    echo "⚠️  لا توجد مسارات للمعالجة." >&2
    exit 1
fi

# ---------- التنفيذ ----------
: > "$OUTPUT_FILE"   # تفريغ الملف
echo "📝 المخرجات: $OUTPUT_FILE"
echo "📋 عدد المسارات: ${#INPUT_PATHS[@]}"
echo "----------------------------------------"

for p in "${INPUT_PATHS[@]}"; do
    process_path "$p"
done

echo "----------------------------------------"
echo "✅ انتهى. حجم الملف: $(du -h "$OUTPUT_FILE" | cut -f1)"
