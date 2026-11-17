package app.mizan;

import android.app.Activity;
import android.content.Context;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MizanNative")
public class MizanNativePlugin extends Plugin {

    private Vibrator vibrator;

    @Override
    public void load() {
        Context context = getContext();
        if (context == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vm = (VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            if (vm != null) {
                vibrator = vm.getDefaultVibrator();
            }
        } else {
            vibrator = getLegacyVibrator(context);
        }
    }

    @SuppressWarnings("deprecation")
    private Vibrator getLegacyVibrator(Context context) {
        return (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
    }

    @PluginMethod
    public void haptic(PluginCall call) {
        String type = call.getString("type", "light");
        if (type == null) type = "light";

        try {
            performVibration(type);
            call.resolve();
        } catch (Exception ex) {
            call.reject("Haptic failed: " + ex.getMessage(), ex);
        }
    }

    @PluginMethod
    public void setVolumeIntercept(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        boolean active = enabled != null && enabled;

        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).setInterceptVolumeKeys(active);
        }
        call.resolve();
    }

    @PluginMethod
    public void setImmersiveMode(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        boolean active = enabled != null && enabled;

        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).setImmersiveMode(active);
        }
        call.resolve();
    }

    @PluginMethod
    public void setSystemBarTheme(PluginCall call) {
        Boolean dark = call.getBoolean("dark", false);
        boolean isDark = dark != null && dark;

        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).setSystemBarTheme(isDark);
        }
        call.resolve();
    }

    private void performVibration(String type) {
        if (vibrator == null || !vibrator.hasVibrator()) return;

        boolean isCelebration = "success".equals(type) || "heavy".equals(type);
        boolean isMedium = "medium".equals(type);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            boolean hasAmp = vibrator.hasAmplitudeControl();
            VibrationEffect effect;

            if (isCelebration) {
                long[] timings = new long[] { 0, 55, 65, 95 };
                if (hasAmp) {
                    int[] amplitudes = new int[] { 0, 220, 0, 255 };
                    effect = VibrationEffect.createWaveform(timings, amplitudes, -1);
                } else {
                    effect = VibrationEffect.createWaveform(timings, -1);
                }
            } else if (isMedium) {
                int amp = hasAmp ? 225 : VibrationEffect.DEFAULT_AMPLITUDE;
                effect = VibrationEffect.createOneShot(60, amp);
            } else {
                // نبضة واضحة وسريعة تناسب جميع محركات الاهتزاز (LRA و ERM)
                int amp = hasAmp ? 190 : VibrationEffect.DEFAULT_AMPLITUDE;
                effect = VibrationEffect.createOneShot(45, amp);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // USAGE_MEDIA يعمل حتى عند إيقاف اهتزاز لوحة المفاتيح أو تفعيل الوضع الصامت
                VibrationAttributes attrs = VibrationAttributes.createForUsage(
                    VibrationAttributes.USAGE_MEDIA
                );
                vibrator.vibrate(effect, attrs);
            } else {
                vibrateWithAudioAttributes(effect);
            }
        } else {
            vibratePreO(isCelebration, isMedium);
        }
    }

    @SuppressWarnings("deprecation")
    private void vibrateWithAudioAttributes(VibrationEffect effect) {
        AudioAttributes audioAttrs = new AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_GAME)
            .build();
        vibrator.vibrate(effect, audioAttrs);
    }

    @SuppressWarnings("deprecation")
    private void vibratePreO(boolean isCelebration, boolean isMedium) {
        if (isCelebration) {
            vibrator.vibrate(new long[] { 0, 55, 65, 95 }, -1);
        } else {
            vibrator.vibrate(isMedium ? 60 : 45);
        }
    }
}
