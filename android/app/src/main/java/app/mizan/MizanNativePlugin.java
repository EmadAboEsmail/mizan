package app.mizan;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Vibrator;
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
        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).setSystemBarTheme(Boolean.TRUE.equals(dark));
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
}
