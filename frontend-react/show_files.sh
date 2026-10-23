#!/usr/bin/env bash
# show-files.sh — سكريبت تفاعلي: يطلب الامتداد ثم يعرض محتوى الملفات مع المسار والعدد.

set -u

# --- دالة طلب قيمة مع إعادة المحاولة ---
read_required() {
    local prompt="$1"
    local default="${2:-}"
    local val
    while true; do
        if [[ -n "$default" ]]; then
            read -r -p "$prompt [$default]: " val
            [[ -z "${val// }" ]] && { echo "$default"; return; }
        else
            read -r -p "$prompt: " val
        fi
        if [[ -n "${val// }" ]]; then
            echo "$val"
            return
        fi
        echo "⚠️  القيمة مطلوبة، جرّب تاني." >&2
    done
}

echo "==============================================="
echo "   عرض محتوى ملفات نوع معين (Interactive)   "
echo "==============================================="
echo

# --- 1) الامتداد ---
ext_input=$(read_required "📄 اكتب امتداد الملف (مثال: txt أو py أو md)")
EXT="${ext_input#.}"      # إزالة النقطة لو موجودة
EXT="${EXT##*/}"          # أمان إضافي

# --- 2) المجلد ---
folder_input=$(read_required "📁 المجلد اللي هتبحث فيه (سيبه فاضي = الحالي)" "$(pwd)")

# فك ~ لو موجودة
folder_input="${folder_input/#\~/$HOME}"

if [[ ! -d "$folder_input" ]]; then
    echo "❌ المجلد غير موجود: $folder_input" >&2
    exit 1
fi
FOLDER=$(cd "$folder_input" && pwd)

# --- 3) recursive؟ ---
read -r -p "🔁 تبحث في المجلدات الفرعية؟ (y/n) [n]: " recurse_ans
RECURSE=0
[[ "$recurse_ans" =~ ^(y|yes|نعم|ن)$ ]] && RECURSE=1

# --- 4) حفظ الناتج؟ ---
read -r -p "💾 تحفظ الناتج في ملف؟ (y/n) [n]: " save_ans
OUTPUT=""
if [[ "$save_ans" =~ ^(y|yes|نعم|ن)$ ]]; then
    OUTPUT=$(read_required "   اسم ملف الحفظ (مثال: combined.txt)")
fi

echo
echo "🔍 ببحث عن ملفات *.$EXT داخل: $FOLDER$( ((RECURSE==1)) && echo ' (مع المجلدات الفرعية)') ..."
echo

# --- 5) جمع الملفات (آمن مع المسافات والعربية) ---
if (( RECURSE == 1 )); then
    mapfile -d '' FILES < <(find "$FOLDER" -type f -name "*.$EXT" -print0 | sort -z)
else
    mapfile -d '' FILES < <(find "$FOLDER" -maxdepth 1 -type f -name "*.$EXT" -print0 | sort -z)
fi

TOTAL=${#FILES[@]}

if (( TOTAL == 0 )); then
    echo "⚠️  مفيش ملفات بامتداد .$EXT في المسار المحدد." >&2
    exit 0
fi

# --- 6) دالة توليد التقرير ---
generate_report() {
    local count=0

    for f in "${FILES[@]}"; do
        count=$((count + 1))

        local header="===== [$count/$TOTAL] $f ====="
        local line
        line=$(printf '=%.0s' $(seq 1 ${#header}))

        echo "$line"
        echo "$header"
        echo "$line"

        if [[ -f "$f" ]]; then
            cat "$f"
        else
            echo "[خطأ: الملف غير موجود]"
        fi
        echo
    done

    local footer="===== الإجمالي: $count ملف ====="
    local line
    line=$(printf '=%.0s' $(seq 1 ${#footer}))
    echo "$line"
    echo "$footer"
    echo "$line"
}

# --- 7) التنفيذ ---
if [[ -n "$OUTPUT" ]]; then
    generate_report > "$OUTPUT"
    echo "✅ تم حفظ الناتج في: $(realpath "$OUTPUT" 2>/dev/null || echo "$OUTPUT")"
    echo "📊 عدد الملفات: $TOTAL"
else
    generate_report
    echo
    echo "📊 عدد الملفات: $TOTAL"
fi
