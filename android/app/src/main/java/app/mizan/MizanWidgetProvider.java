package app.mizan;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Vibrator;
import android.widget.RemoteViews;
import java.text.NumberFormat;
import java.util.Calendar;
import java.util.Locale;

/**
 * ودجت الشاشة الرئيسية لتطبيق «مِيزان»:
 * يعرض ذِكر اليوم وصرف اليوم (مع احترام وضع الخصوصية) مع زر «+ سبّح» مباشر وزر «+ مصروف».
 */
public class MizanWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_WIDGET_TASBIH =
        "app.mizan.ACTION_WIDGET_TASBIH";
    private static final String PREFS = "mizan_widget_prefs";

    private static final String KEY_DAY = "day_stamp";
    private static final String KEY_TODAY_ZEKR = "today_zekr";
    private static final String KEY_STREAK = "streak";
    private static final String KEY_TODAY_EXPENSE = "today_expense";
    private static final String KEY_CURRENCY = "currency";
    private static final String KEY_PRIVATE = "is_private";
    private static final String KEY_ZEKR_ID = "default_zekr_id";
    private static final String KEY_ZEKR_TEXT = "default_zekr_text";

    private static String todayStamp() {
        Calendar c = Calendar.getInstance();
        return (
            c.get(Calendar.YEAR) +
            "-" +
            (c.get(Calendar.MONTH) + 1) +
            "-" +
            c.get(Calendar.DAY_OF_MONTH)
        );
    }

    @Override
    public void onUpdate(
        Context context,
        AppWidgetManager appWidgetManager,
        int[] appWidgetIds
    ) {
        if (context == null || appWidgetManager == null || appWidgetIds == null) {
            return;
        }
        for (int id : appWidgetIds) {
            appWidgetManager.updateAppWidget(id, buildRemoteViews(context));
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (
            context != null &&
            intent != null &&
            ACTION_WIDGET_TASBIH.equals(intent.getAction())
        ) {
            handleDirectTasbih(context);
        }
    }

    private void handleDirectTasbih(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(
            PREFS,
            Context.MODE_PRIVATE
        );
        String today = todayStamp();
        String savedDay = prefs.getString(KEY_DAY, "");
        int baseCount = today.equals(savedDay)
            ? prefs.getInt(KEY_TODAY_ZEKR, 0)
            : 0;
        float baseExp = today.equals(savedDay)
            ? prefs.getFloat(KEY_TODAY_EXPENSE, 0f)
            : 0f;

        String zekrId = prefs.getString(KEY_ZEKR_ID, "");
        if (zekrId == null || zekrId.isEmpty()) {
            // إذا لم يُفتح التطبيق من قبل نفتح السبحة مباشرة
            Intent open = new Intent(context, MainActivity.class);
            open.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP
            );
            open.putExtra(MainActivity.EXTRA_MIZAN_ROUTE, "/zekr/sabh");
            context.startActivity(open);
            return;
        }

        int nextCount = baseCount + 1;
        prefs
            .edit()
            .putString(KEY_DAY, today)
            .putInt(KEY_TODAY_ZEKR, nextCount)
            .putFloat(KEY_TODAY_EXPENSE, baseExp)
            .apply();

        // حفظ التسبيحة في طابور SQLite المشترك + اهتزاز لمسي فوري
        long hour = System.currentTimeMillis() / 3600000L;
        PocketTasbihService.enqueueClick(context, zekrId, hour);

        try {
            Vibrator vib = MizanHaptics.getVibrator(context);
            MizanHaptics.perform(vib, "light", true);
        } catch (Exception ignored) {}

        refreshAllWidgets(context);
    }

    public static void saveStateAndRefresh(
        Context context,
        int todayZekr,
        int streak,
        float todayExpense,
        String currency,
        boolean isPrivate,
        String defaultZekrId,
        String defaultZekrText
    ) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(
            PREFS,
            Context.MODE_PRIVATE
        );
        prefs
            .edit()
            .putString(KEY_DAY, todayStamp())
            .putInt(KEY_TODAY_ZEKR, Math.max(0, todayZekr))
            .putInt(KEY_STREAK, Math.max(0, streak))
            .putFloat(KEY_TODAY_EXPENSE, Math.max(0f, todayExpense))
            .putString(KEY_CURRENCY, currency != null ? currency : "ج.م")
            .putBoolean(KEY_PRIVATE, isPrivate)
            .putString(KEY_ZEKR_ID, defaultZekrId != null ? defaultZekrId : "")
            .putString(
                KEY_ZEKR_TEXT,
                defaultZekrText != null ? defaultZekrText : "سُبْحَانَ اللَّهِ"
            )
            .apply();

        refreshAllWidgets(context);
    }

    public static void refreshAllWidgets(Context context) {
        if (context == null) return;
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(context);
            if (mgr == null) return;
            ComponentName cn = new ComponentName(
                context,
                MizanWidgetProvider.class
            );
            int[] ids = mgr.getAppWidgetIds(cn);
            if (ids != null && ids.length > 0) {
                RemoteViews views = buildRemoteViews(context);
                for (int id : ids) {
                    mgr.updateAppWidget(id, views);
                }
            }
        } catch (Exception ignored) {}
    }

    private static RemoteViews buildRemoteViews(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(
            PREFS,
            Context.MODE_PRIVATE
        );
        String today = todayStamp();
        boolean isToday = today.equals(prefs.getString(KEY_DAY, ""));

        int todayZekr = isToday ? prefs.getInt(KEY_TODAY_ZEKR, 0) : 0;
        int streak = prefs.getInt(KEY_STREAK, 0);
        float todayExpense = isToday ? prefs.getFloat(KEY_TODAY_EXPENSE, 0f) : 0f;
        String currency = prefs.getString(KEY_CURRENCY, "ج.م");
        boolean isPrivate = prefs.getBoolean(KEY_PRIVATE, false);

        NumberFormat nf = NumberFormat.getIntegerInstance(Locale.US);
        String zekrStr = nf.format(todayZekr);
        String expStr = isPrivate
            ? "•••• " + currency
            : nf.format(Math.round(todayExpense)) + " " + currency;
        String streakStr = streak > 0
            ? nf.format(streak) + " يوم مداومة"
            : "توازن اليوم";

        RemoteViews rv = new RemoteViews(
            context.getPackageName(),
            R.layout.widget_mizan
        );
        rv.setTextViewText(R.id.widget_streak, streakStr);
        rv.setTextViewText(R.id.widget_zekr_count, zekrStr);
        rv.setTextViewText(R.id.widget_expense_value, expStr);

        // فتح الرئيسية عند الضغط على العنوان
        rv.setOnClickPendingIntent(
            R.id.widget_header,
            routePendingIntent(context, 5100, "/")
        );

        // زر + سبّح المباشر (يزيد العداد فوراً بدون فتح التطبيق)
        Intent tasbihIntent = new Intent(context, MizanWidgetProvider.class);
        tasbihIntent.setAction(ACTION_WIDGET_TASBIH);
        PendingIntent tasbihPi = PendingIntent.getBroadcast(
            context,
            5101,
            tasbihIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        rv.setOnClickPendingIntent(R.id.widget_btn_tasbih, tasbihPi);

        // فتح شاشة السبحة عند الضغط على بطاقة الذكر
        rv.setOnClickPendingIntent(
            R.id.widget_zekr_box,
            routePendingIntent(context, 5102, "/zekr/sabh")
        );

        // زر + مصروف السريع
        rv.setOnClickPendingIntent(
            R.id.widget_btn_expense,
            routePendingIntent(context, 5103, "/budget/transactions?add=1")
        );

        // فتح سجل المعاملات عند الضغط على بطاقة الصرف
        rv.setOnClickPendingIntent(
            R.id.widget_expense_box,
            routePendingIntent(context, 5104, "/budget/transactions")
        );

        return rv;
    }

    private static PendingIntent routePendingIntent(
        Context context,
        int reqCode,
        String route
    ) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        intent.putExtra(MainActivity.EXTRA_MIZAN_ROUTE, route);
        return PendingIntent.getActivity(
            context,
            reqCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
