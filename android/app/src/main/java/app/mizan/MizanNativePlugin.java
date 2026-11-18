package app.mizan;

import android.app.Activity;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;
import android.os.Vibrator;
import java.util.concurrent.atomic.AtomicBoolean;
import com.getcapacitor.Bridge;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "MizanNative",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { "android.permission.POST_NOTIFICATIONS" }
        )
    }
)
public class MizanNativePlugin extends Plugin {

    private Vibrator vibrator;
    private boolean askedNotificationPermission = false;

    @Override
    public void load() {
        Context context = getContext();
        if (context != null) {
            vibrator = MizanHaptics.getVibrator(context);
        }

        PocketTasbihService.setListener(
            new PocketTasbihService.PocketListener() {
                @Override
                public void onPocketTick(String zekrId, int count) {
                    Bridge b = getBridge();
                    if (b == null) return;
                    JSObject payload = new JSObject();
                    payload.put("zekrId", zekrId);
                    payload.put("count", count);
                    b.triggerWindowJSEvent("pocketTasbihTick", payload.toString());
                }

                @Override
                public void onPocketStateChanged(boolean running) {
                    Bridge b = getBridge();
                    if (b == null) return;
                    JSObject payload = new JSObject();
                    payload.put("running", running);
                    b.triggerWindowJSEvent("pocketTasbihState", payload.toString());
                }
            }
        );
    }

    @Override
    protected void handleOnDestroy() {
        PocketTasbihService.setListener(null);
        super.handleOnDestroy();
    }

    // ═══════════════════════════════════════
    // Haptics & Volume
    // ═══════════════════════════════════════
    @PluginMethod
    public void haptic(PluginCall call) {
        String type = call.getString("type", "light");
        if (type == null) type = "light";

        try {
            MizanHaptics.perform(vibrator, type, false);
            call.resolve();
        } catch (Exception ex) {
            call.reject("Haptic failed: " + ex.getMessage(), ex);
        }
    }

    @PluginMethod
    public void setVolumeIntercept(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).setInterceptVolumeKeys(Boolean.TRUE.equals(enabled));
        }
        call.resolve();
    }

    // ═══════════════════════════════════════
    // Display & Immersive Focus Mode
    // ═══════════════════════════════════════
    @PluginMethod
    public void setImmersiveMode(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).setImmersiveMode(Boolean.TRUE.equals(enabled));
        }
        call.resolve();
    }

    @PluginMethod
    public void setScreenDim(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).setScreenDim(Boolean.TRUE.equals(enabled));
        }
        call.resolve();
    }

    @PluginMethod
    public void setSystemBarTheme(PluginCall call) {
        Boolean dark = call.getBoolean("dark", false);
        Boolean amoled = call.getBoolean("amoled", false);
        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).setSystemBarTheme(
                Boolean.TRUE.equals(dark),
                Boolean.TRUE.equals(amoled)
            );
        }
        call.resolve();
    }

    // ═══════════════════════════════════════
    // Screen-Off / Lock-Screen Pocket Tasbih
    // ═══════════════════════════════════════
    @PluginMethod
    public void startPocketMode(PluginCall call) {
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            !askedNotificationPermission &&
            getPermissionState("notifications") != PermissionState.GRANTED
        ) {
            askedNotificationPermission = true;
            requestPermissionForAlias("notifications", call, "onNotificationPermResult");
            return;
        }
        launchPocketService(call);
    }

    @PermissionCallback
    private void onNotificationPermResult(PluginCall call) {
        if (call == null) return;
        // نبدأ الخدمة حتى لو رفض المستخدم الإذن (يعمل الاهتزاز والعد في كلتا الحالتين)
        launchPocketService(call);
    }

    private void launchPocketService(PluginCall call) {
        Context context = getContext();
        if (context == null) {
            call.reject("Context unavailable");
            return;
        }

        String zekrId = call.getString("zekrId", "");
        String zekrText = call.getString("zekrText", "التسبيح");
        Integer count = call.getInt("count", 0);
        Integer target = call.getInt("target", 0);
        Boolean vibrate = call.getBoolean("vibrate", true);

        if (zekrId == null || zekrId.isEmpty()) {
            call.reject("zekrId required");
            return;
        }

        try {
            Intent intent = new Intent(context, PocketTasbihService.class);
            intent.setAction(PocketTasbihService.ACTION_START);
            intent.putExtra(PocketTasbihService.EXTRA_ZEKR_ID, zekrId);
            intent.putExtra(
                PocketTasbihService.EXTRA_ZEKR_TEXT,
                zekrText != null ? zekrText : "التسبيح"
            );
            intent.putExtra(PocketTasbihService.EXTRA_COUNT, count != null ? count : 0);
            intent.putExtra(PocketTasbihService.EXTRA_TARGET, target != null ? target : 0);
            intent.putExtra(
                PocketTasbihService.EXTRA_VIBRATE,
                vibrate == null || vibrate
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }

            JSObject res = new JSObject();
            res.put("running", true);
            call.resolve(res);
        } catch (Exception ex) {
            call.reject("Failed to start pocket mode: " + ex.getMessage(), ex);
        }
    }

    @PluginMethod
    public void updatePocketMode(PluginCall call) {
        Context context = getContext();
        if (context == null || !PocketTasbihService.isRunning()) {
            call.resolve();
            return;
        }

        try {
            Intent intent = new Intent(context, PocketTasbihService.class);
            intent.setAction(PocketTasbihService.ACTION_UPDATE);

            String zekrId = call.getString("zekrId");
            String zekrText = call.getString("zekrText");
            Integer count = call.getInt("count");
            Integer target = call.getInt("target");
            Boolean vibrate = call.getBoolean("vibrate");

            if (zekrId != null) {
                intent.putExtra(PocketTasbihService.EXTRA_ZEKR_ID, zekrId);
            }
            if (zekrText != null) {
                intent.putExtra(PocketTasbihService.EXTRA_ZEKR_TEXT, zekrText);
            }
            if (count != null) {
                intent.putExtra(PocketTasbihService.EXTRA_COUNT, count);
            }
            if (target != null) {
                intent.putExtra(PocketTasbihService.EXTRA_TARGET, target);
            }
            if (vibrate != null) {
                intent.putExtra(PocketTasbihService.EXTRA_VIBRATE, vibrate);
            }

            context.startService(intent);
            call.resolve();
        } catch (Exception ex) {
            call.resolve();
        }
    }

    @PluginMethod
    public void stopPocketMode(PluginCall call) {
        Context context = getContext();
        if (context != null && PocketTasbihService.isRunning()) {
            try {
                Intent intent = new Intent(context, PocketTasbihService.class);
                intent.setAction(PocketTasbihService.ACTION_STOP);
                context.startService(intent);
            } catch (Exception ignored) {
                context.stopService(new Intent(context, PocketTasbihService.class));
            }
        }
        JSObject res = new JSObject();
        res.put("running", false);
        call.resolve(res);
    }

    @PluginMethod
    public void getPocketStatus(PluginCall call) {
        JSObject res = new JSObject();
        res.put("running", PocketTasbihService.isRunning());
        res.put("zekrId", PocketTasbihService.getCurrentZekrId());
        res.put("count", PocketTasbihService.getCurrentCount());
        call.resolve(res);
    }

    @PluginMethod
    public void drainPocketClicks(PluginCall call) {
        Context context = getContext();
        JSArray items = PocketTasbihService.drainQueuedClicks(context);
        JSObject res = new JSObject();
        res.put("items", items);
        call.resolve(res);
    }

    // ═══════════════════════════════════════
    // Biometric Authentication (API 28+)
    // ═══════════════════════════════════════
    @SuppressWarnings("deprecation")
    @PluginMethod
    public void canAuthenticateBiometric(PluginCall call) {
        boolean available = false;
        Context context = getContext();
        if (context != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                BiometricManager bm = context.getSystemService(
                    BiometricManager.class
                );
                if (bm != null) {
                    available =
                        bm.canAuthenticate() == BiometricManager.BIOMETRIC_SUCCESS;
                }
            } catch (Exception ignored) {}
        }
        JSObject res = new JSObject();
        res.put("available", available);
        call.resolve(res);
    }

    @PluginMethod
    public void authenticateBiometric(final PluginCall call) {
        final Context context = getContext();
        Activity activity = getActivity();
        if (
            context == null ||
            activity == null ||
            Build.VERSION.SDK_INT < Build.VERSION_CODES.P
        ) {
            JSObject res = new JSObject();
            res.put("authenticated", false);
            call.resolve(res);
            return;
        }

        final String title = call.getString("title", "قفل الميزانية");
        final String subtitle = call.getString(
            "subtitle",
            "أكّد هويتك بالبصمة للمتابعة"
        );

        final AtomicBoolean done = new AtomicBoolean(false);
        activity.runOnUiThread(() -> {
            try {
                CancellationSignal signal = new CancellationSignal();
                BiometricPrompt prompt = new BiometricPrompt.Builder(context)
                    .setTitle(title != null ? title : "قفل الميزانية")
                    .setSubtitle(subtitle != null ? subtitle : "")
                    .setNegativeButton(
                        "استخدام الرمز",
                        context.getMainExecutor(),
                        (DialogInterface dialog, int which) -> {
                            if (done.compareAndSet(false, true)) {
                                JSObject out = new JSObject();
                                out.put("authenticated", false);
                                call.resolve(out);
                            }
                        }
                    )
                    .build();

                prompt.authenticate(
                    signal,
                    context.getMainExecutor(),
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationSucceeded(
                            BiometricPrompt.AuthenticationResult result
                        ) {
                            if (done.compareAndSet(false, true)) {
                                JSObject out = new JSObject();
                                out.put("authenticated", true);
                                call.resolve(out);
                            }
                        }

                        @Override
                        public void onAuthenticationError(
                            int errorCode,
                            CharSequence errString
                        ) {
                            if (done.compareAndSet(false, true)) {
                                JSObject out = new JSObject();
                                out.put("authenticated", false);
                                call.resolve(out);
                            }
                        }
                    }
                );
            } catch (Exception ex) {
                if (done.compareAndSet(false, true)) {
                    JSObject out = new JSObject();
                    out.put("authenticated", false);
                    call.resolve(out);
                }
            }
        });
    }

    // ═══════════════════════════════════════
    // Offline Daily Reminders (AlarmManager)
    // ═══════════════════════════════════════
    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject res = new JSObject();
            res.put("granted", true);
            call.resolve(res);
            return;
        }
        if (getPermissionState("notifications") == PermissionState.GRANTED) {
            JSObject res = new JSObject();
            res.put("granted", true);
            call.resolve(res);
            return;
        }
        requestPermissionForAlias(
            "notifications",
            call,
            "onExplicitNotifPermResult"
        );
    }

    @PermissionCallback
    private void onExplicitNotifPermResult(PluginCall call) {
        if (call == null) return;
        JSObject res = new JSObject();
        res.put(
            "granted",
            getPermissionState("notifications") == PermissionState.GRANTED
        );
        call.resolve(res);
    }

    @PluginMethod
    public void syncReminders(PluginCall call) {
        Context context = getContext();
        JSArray items = call.getArray("items");
        if (context != null) {
            MizanReminderReceiver.saveAndSchedule(context, items);
        }
        call.resolve();
    }

    // ═══════════════════════════════════════
    // Home Screen Widget & Launch Shortcuts
    // ═══════════════════════════════════════
    @PluginMethod
    public void updateWidget(PluginCall call) {
        Context context = getContext();
        if (context != null) {
            Integer todayZekr = call.getInt("todayZekr", 0);
            Integer streak = call.getInt("streak", 0);
            Double todayExp = call.getDouble("todayExpense", 0.0);
            String currency = call.getString("currency", "ج.م");
            Boolean isPrivate = call.getBoolean("isPrivate", false);
            String defaultZekrId = call.getString("defaultZekrId", "");
            String defaultZekrText = call.getString(
                "defaultZekrText",
                "سُبْحَانَ اللَّهِ"
            );

            MizanWidgetProvider.saveStateAndRefresh(
                context,
                todayZekr != null ? todayZekr : 0,
                streak != null ? streak : 0,
                todayExp != null ? todayExp.floatValue() : 0f,
                currency,
                Boolean.TRUE.equals(isPrivate),
                defaultZekrId,
                defaultZekrText
            );
        }
        call.resolve();
    }

    @PluginMethod
    public void consumeLaunchRoute(PluginCall call) {
        String route = null;
        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            route = ((MainActivity) activity).consumePendingRoute();
        }
        JSObject res = new JSObject();
        res.put("route", route);
        call.resolve(res);
    }
}
