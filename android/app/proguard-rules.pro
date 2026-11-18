# ═══════════════════════════════════════════════════════════════
# ProGuard / R8 rules — Mizan (Capacitor 8 + SQLite + Native Services)
# ═══════════════════════════════════════════════════════════════

# الحفاظ على معلومات الأسطر والتعليقات التوضيحية لانعكاس إضافات Capacitor
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,SourceFile,LineNumberTable

# إبقاء جميع أصناف مِيزان المحلية (Plugin, Activity, Service, Widget, Reminders)
-keep class app.mizan.** { *; }

# إبقاء Capacitor Core وجميع الإضافات المسجّلة عبر الانعكاس
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
    @com.getcapacitor.annotation.PermissionCallback *;
}

# إبقاء @capacitor-community/sqlite و SQLCipher الاختياري
-keep class com.getcapacitor.community.database.sqlite.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-keep class net.sqlcipher.** { *; }
-keep class net.zetetic.** { *; }
-dontwarn net.sqlcipher.**
-dontwarn net.zetetic.**

# إبقاء جسور JavaScript داخل Android WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void openFileChooser(...);
}
