cd ~/mizan

# التحقق أولاً
if [ ! -f "resources/icon.png" ]; then
  echo "❌ resources/icon.png غير موجود"
  exit 1
fi

echo "🎨 Generating icons from resources/icon.png"
echo "================================================"

# أحجام الأيقونات لكل كثافة
for density in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
  folder="${density%%:*}"
  size="${density##*:}"
  
  target_dir="android/app/src/main/res/mipmap-${folder}"
  mkdir -p "$target_dir"
  
  # أيقونة عادية
  convert resources/icon.png \
    -resize ${size}x${size} \
    -strip \
    "$target_dir/ic_launcher.png"
  
  # أيقونة دائرية
  convert resources/icon.png \
    -resize ${size}x${size} \
    \( +clone -alpha extract -fill black -colorize 100 -fill white \
       -draw "circle $((size/2)),$((size/2)) $((size/2)),0" \) \
    -alpha off -compose CopyOpacity -composite \
    -strip \
    "$target_dir/ic_launcher_round.png"
  
  echo "  ✅ $folder ($size×$size)"
done

echo ""
echo "🎨 Generating adaptive foreground icons..."

# Adaptive foreground لكل كثافة
# الحجم = 108dp، الرمز = 66dp، الحافة = 21dp كل جهة
for density in mdpi:108 hdpi:162 xhdpi:216 xxhdpi:324 xxxhdpi:432; do
  folder="${density%%:*}"
  size="${density##*:}"
  inner=$((size * 66 / 108))
  
  target_dir="android/app/src/main/res/mipmap-${folder}"
  
  convert resources/icon.png \
    -resize ${inner}x${inner} \
    -gravity center \
    -background none \
    -extent ${size}x${size} \
    -strip \
    "$target_dir/ic_launcher_foreground.png"
  
  echo "  ✅ $folder foreground ($size×$size)"
done

echo ""
echo "================================================"
echo "✨ Done!"
