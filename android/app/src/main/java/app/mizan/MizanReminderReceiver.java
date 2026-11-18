package app.mizan;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * منبّه يومي محلي يعمل بدون إنترنت لتذكيرات الصباح والمساء والمصروفات،
 * ويعيد جدولة نفسه تلقائياً بعد كل إشعار وبعد إعادة تشغيل الجهاز.
 */
public class MizanReminderReceiver extends BroadcastReceiver {

    public static final String ACTION_FIRE = "app.mizan.ACTION_FIRE_REMINDER";
    private static final String PREFS_NAME = "mizan_reminders_prefs";
    private static final String KEY_ITEMS = "items_json";
    private static final String CHANNEL_ID = "mizan_daily_reminders";

    private static final String EXTRA_ID = "rem_id";
    private static final String EXTRA_TITLE = "rem_title";
    private static final String EXTRA_BODY = "rem_body";
    private static final String EXTRA_ROUTE = "rem_route";
    private static final String EXTRA_TIME = "rem_time";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;
        String action = intent.getAction();
        if (
            Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
        ) {
            rescheduleSaved(context);
            MizanWidgetProvider.refreshAllWidgets(context);
            return;
        }

        if (ACTION_FIRE.equals(action)) {
            String id = intent.getStringExtra(EXTRA_ID);
            String title = intent.getStringExtra(EXTRA_TITLE);
            String body = intent.getStringExtra(EXTRA_BODY);
            String route = intent.getStringExtra(EXTRA_ROUTE);
            String time = intent.getStringExtra(EXTRA_TIME);

            showNotification(context, id, title, body, route);

            // إعادة الجدولة لليوم التالي في نفس الساعة
            if (id != null && time != null) {
                scheduleOne(context, id, time, title, body, route, true);
            }
        }
    }

    public static void saveAndSchedule(Context context, JSONArray items) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(
            PREFS_NAME,
            Context.MODE_PRIVATE
        );

        // إلغاء المنبهات المعروفة أولاً
        cancelOne(context, "morning");
        cancelOne(context, "evening");
        cancelOne(context, "budget");

        if (items == null) {
            prefs.edit().remove(KEY_ITEMS).apply();
            return;
        }

        prefs.edit().putString(KEY_ITEMS, items.toString()).apply();
        ensureChannel(context);

        for (int i = 0; i < items.length(); i++) {
            JSONObject obj = items.optJSONObject(i);
            if (obj == null) continue;
            String id = obj.optString("id", "");
            boolean enabled = obj.optBoolean("enabled", false);
            String time = obj.optString("time", "07:00");
            String title = obj.optString("title", "مِيزان");
            String body = obj.optString("body", "");
            String route = obj.optString("route", "/");

            if (!id.isEmpty() && enabled) {
                scheduleOne(context, id, time, title, body, route, false);
            }
        }
    }

    public static void rescheduleSaved(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(
            PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String raw = prefs.getString(KEY_ITEMS, null);
        if (raw == null || raw.isEmpty()) return;
        try {
            JSONArray arr = new JSONArray(raw);
            saveAndSchedule(context, arr);
        } catch (Exception ignored) {}
    }

    private static int requestCodeFor(String id) {
        if ("morning".equals(id)) return 4101;
        if ("evening".equals(id)) return 4102;
        if ("budget".equals(id)) return 4103;
        return 4100 + Math.abs(id.hashCode() % 500);
    }

    private static void cancelOne(Context context, String id) {
        AlarmManager am = (AlarmManager) context.getSystemService(
            Context.ALARM_SERVICE
        );
        if (am == null) return;
        Intent intent = new Intent(context, MizanReminderReceiver.class);
        intent.setAction(ACTION_FIRE);
        PendingIntent pi = PendingIntent.getBroadcast(
            context,
            requestCodeFor(id),
            intent,
            PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
        );
        if (pi != null) {
            am.cancel(pi);
            pi.cancel();
        }
    }

    private static void scheduleOne(
        Context context,
        String id,
        String time,
        String title,
        String body,
        String route,
        boolean forceTomorrow
    ) {
        AlarmManager am = (AlarmManager) context.getSystemService(
            Context.ALARM_SERVICE
        );
        if (am == null) return;

        int hour = 7;
        int minute = 0;
        try {
            String[] parts = time.split(":");
            hour = Integer.parseInt(parts[0]);
            minute = Integer.parseInt(parts[1]);
        } catch (Exception ignored) {}

        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);

        if (forceTomorrow || cal.getTimeInMillis() <= System.currentTimeMillis() + 5000L) {
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }

        Intent intent = new Intent(context, MizanReminderReceiver.class);
        intent.setAction(ACTION_FIRE);
        intent.putExtra(EXTRA_ID, id);
        intent.putExtra(EXTRA_TITLE, title);
        intent.putExtra(EXTRA_BODY, body);
        intent.putExtra(EXTRA_ROUTE, route);
        intent.putExtra(EXTRA_TIME, time);

        PendingIntent pi = PendingIntent.getBroadcast(
            context,
            requestCodeFor(id),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        try {
            am.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                cal.getTimeInMillis(),
                pi
            );
        } catch (Exception ignored) {
            am.set(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
        }
    }

    private static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(
            Context.NOTIFICATION_SERVICE
        );
        if (nm == null) return;
        NotificationChannel ch = new NotificationChannel(
            CHANNEL_ID,
            "تذكيرات مِيزان اليومية",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        ch.setDescription("تذكيرات أذكار الصباح والمساء وتسجيل المصروفات");
        nm.createNotificationChannel(ch);
    }

    private static void showNotification(
        Context context,
        String id,
        String title,
        String body,
        String route
    ) {
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return;
        }

        ensureChannel(context);

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        openIntent.putExtra(MainActivity.EXTRA_MIZAN_ROUTE, route != null ? route : "/");

        int reqCode = requestCodeFor(id != null ? id : "default");
        PendingIntent contentPi = PendingIntent.getActivity(
            context,
            reqCode + 500,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(
            context,
            CHANNEL_ID
        )
            .setSmallIcon(R.drawable.ic_stat_tasbih)
            .setContentTitle(title != null ? title : "مِيزان")
            .setContentText(body != null ? body : "")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(contentPi);

        try {
            NotificationManagerCompat.from(context).notify(reqCode, builder.build());
        } catch (SecurityException ignored) {}
    }
}
