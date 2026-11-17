package app.mizan;

import android.content.Context;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;

/**
 * أداة موحّدة للاهتزاز اللمسي داخل التطبيق وأثناء قفل الشاشة.
 */
public final class MizanHaptics {

    private MizanHaptics() {}

    public static Vibrator getVibrator(Context context) {
        if (context == null) return null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vm = (VibratorManager) context.getSystemService(
                Context.VIBRATOR_MANAGER_SERVICE
            );
            return vm != null ? vm.getDefaultVibrator() : null;
        }
        return getLegacyVibrator(context);
    }

    @SuppressWarnings("deprecation")
    private static Vibrator getLegacyVibrator(Context context) {
        return (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
    }

    /**
     * @param vibrator     محرك الاهتزاز
     * @param type         "light" | "medium" | "heavy" | "success"
     * @param inBackground true عند التشغيل والشاشة مقفلة لضمان عدم كتم النظام للاهتزاز
     */
    public static void perform(Vibrator vibrator, String type, boolean inBackground) {
        if (vibrator == null || !vibrator.hasVibrator()) return;

        boolean isCelebration = "success".equals(type) || "heavy".equals(type);
        boolean isMedium = "medium".equals(type);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            boolean hasAmp = vibrator.hasAmplitudeControl();
            VibrationEffect effect;

            if (isCelebration) {
                long[] timings = new long[] { 0, 60, 70, 110 };
                if (hasAmp) {
                    int[] amplitudes = new int[] { 0, 230, 0, 255 };
                    effect = VibrationEffect.createWaveform(timings, amplitudes, -1);
                } else {
                    effect = VibrationEffect.createWaveform(timings, -1);
                }
            } else if (isMedium) {
                int amp = hasAmp ? 225 : VibrationEffect.DEFAULT_AMPLITUDE;
                effect = VibrationEffect.createOneShot(60, amp);
            } else {
                int amp = hasAmp ? 195 : VibrationEffect.DEFAULT_AMPLITUDE;
                effect = VibrationEffect.createOneShot(45, amp);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // في الخلفية/قفل الشاشة نستخدم USAGE_ALARM لأن أندرويد 13+ يكتم USAGE_MEDIA عند إطفاء الشاشة
                int usage = inBackground
                    ? VibrationAttributes.USAGE_ALARM
                    : VibrationAttributes.USAGE_MEDIA;
                VibrationAttributes attrs = VibrationAttributes.createForUsage(usage);
                vibrator.vibrate(effect, attrs);
            } else {
                vibrateWithAudioAttributes(vibrator, effect, inBackground);
            }
        } else {
            vibratePreO(vibrator, isCelebration, isMedium);
        }
    }

    @SuppressWarnings("deprecation")
    private static void vibrateWithAudioAttributes(
        Vibrator vibrator,
        VibrationEffect effect,
        boolean inBackground
    ) {
        AudioAttributes audioAttrs = new AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(inBackground ? AudioAttributes.USAGE_ALARM : AudioAttributes.USAGE_GAME)
            .build();
        vibrator.vibrate(effect, audioAttrs);
    }

    @SuppressWarnings("deprecation")
    private static void vibratePreO(
        Vibrator vibrator,
        boolean isCelebration,
        boolean isMedium
    ) {
        if (isCelebration) {
            vibrator.vibrate(new long[] { 0, 60, 70, 110 }, -1);
        } else {
            vibrator.vibrate(isMedium ? 60 : 45);
        }
    }
}
