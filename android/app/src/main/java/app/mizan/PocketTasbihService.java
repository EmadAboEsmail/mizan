package app.mizan;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.media.MediaMetadata;
import android.media.VolumeProvider;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.os.Vibrator;
import android.view.KeyEvent;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import java.util.Map;

/**
 * خدمة أمامية خفيفة تتيح التسبيح بأزرار الصوت (أو زر السماعة) والشاشة مقفلة تماماً،
 * مع اهتزاز فوري، إشعار حي على شاشة القفل، وحفظ آمن للضغطات لمزامنتها مع SQLite.
 */
public class PocketTasbihService extends Service {

    public static final String ACTION_START = "app.mizan.pocket.START";
    public static final String ACTION_UPDATE = "app.mizan.pocket.UPDATE";
    public static final String ACTION_STOP = "app.mizan.pocket.STOP";

    public static final String EXTRA_ZEKR_ID = "zekrId";
    public static final String EXTRA_ZEKR_TEXT = "zekrText";
    public static final String EXTRA_COUNT = "count";
    public static final String EXTRA_TARGET = "target";
    public static final String EXTRA_VIBRATE = "vibrate";

    private static final String CHANNEL_ID = "mizan_pocket_tasbih";
    private static final int NOTIFICATION_ID = 7701;
    private static final String QUEUE_PREFS = "mizan_pocket_clicks_queue";
    private static final long MIN_PRESS_INTERVAL_MS = 95L;
    private static final long MAX_WAKELOCK_MS = 4L * 60L * 60L * 1000L; // حد أمان 4 ساعات

    private static final Object QUEUE_LOCK = new Object();
    private static volatile PocketTasbihService activeInstance = null;
    private static volatile PocketListener listener = null;

    public interface PocketListener {
        void onPocketTick(String zekrId, int count);
        void onPocketStateChanged(boolean running);
    }

    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private AudioTrack silentTrack;
    private MediaSession mediaSession;
    private VolumeProvider volumeProvider;

    private volatile String zekrId = "";
    private volatile String zekrText = "التسبيح";
    private volatile int currentCount = 0;
    private volatile int target = 0;
    private volatile boolean vibrateEnabled = true;
    private long lastStepElapsedMs = 0L;

    private final AudioManager.OnAudioFocusChangeListener focusChangeListener = (focusChange) -> {
        try {
            if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                // مكالمة هاتفية أو منبّه: نوقف الجلسة مؤقتاً ليعمل زر الصوت للمكالمة بشكل طبيعي
                if (
                    silentTrack != null &&
                    silentTrack.getPlayState() == AudioTrack.PLAYSTATE_PLAYING
                ) {
                    silentTrack.pause();
                }
                setSessionPlayingState(false);
            } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                if (
                    silentTrack != null &&
                    silentTrack.getPlayState() == AudioTrack.PLAYSTATE_PLAYING
                ) {
                    silentTrack.pause();
                }
            } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                if (
                    silentTrack != null &&
                    silentTrack.getState() == AudioTrack.STATE_INITIALIZED
                ) {
                    silentTrack.play();
                }
                setSessionPlayingState(true);
            }
        } catch (Exception ignored) {}
    };

    // ═══════════════════════════════════════
    // Static Bridge Helpers
    // ═══════════════════════════════════════
    public static void setListener(PocketListener l) {
        listener = l;
    }

    public static boolean isRunning() {
        return activeInstance != null;
    }

    public static String getCurrentZekrId() {
        PocketTasbihService s = activeInstance;
        return s != null ? s.zekrId : "";
    }

    public static int getCurrentCount() {
        PocketTasbihService s = activeInstance;
        return s != null ? s.currentCount : 0;
    }

    public static boolean triggerFromActivity() {
        PocketTasbihService s = activeInstance;
        if (s == null) return false;
        s.recordStep();
        return true;
    }

    public static void enqueueClick(Context context, String zekrId, long hour) {
        if (context == null || zekrId == null || zekrId.isEmpty()) return;
        String key = zekrId + "|" + hour;
        synchronized (QUEUE_LOCK) {
            SharedPreferences prefs = context.getSharedPreferences(
                QUEUE_PREFS,
                Context.MODE_PRIVATE
            );
            int prev = prefs.getInt(key, 0);
            prefs.edit().putInt(key, prev + 1).commit();
        }
    }

    public static JSArray drainQueuedClicks(Context context) {
        JSArray arr = new JSArray();
        if (context == null) return arr;

        synchronized (QUEUE_LOCK) {
            SharedPreferences prefs = context.getSharedPreferences(
                QUEUE_PREFS,
                Context.MODE_PRIVATE
            );
            Map<String, ?> all = prefs.getAll();
            if (all == null || all.isEmpty()) return arr;

            for (Map.Entry<String, ?> entry : all.entrySet()) {
                String k = entry.getKey();
                Object v = entry.getValue();
                if (k == null || !(v instanceof Integer)) continue;
                int count = (Integer) v;
                if (count <= 0) continue;

                int sep = k.lastIndexOf('|');
                if (sep <= 0 || sep >= k.length() - 1) continue;

                String id = k.substring(0, sep);
                try {
                    long hour = Long.parseLong(k.substring(sep + 1));
                    JSObject item = new JSObject();
                    item.put("zekrId", id);
                    item.put("hour", hour);
                    item.put("count", count);
                    arr.put(item);
                } catch (NumberFormatException ignored) {}
            }

            prefs.edit().clear().commit();
        }
        return arr;
    }

    // ═══════════════════════════════════════
    // Service Lifecycle
    // ═══════════════════════════════════════
    @Override
    public void onCreate() {
        super.onCreate();
        vibrator = MizanHaptics.getVibrator(this);
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_STOP.equals(action)) {
            stopPocketService();
            return START_NOT_STICKY;
        }

        if (intent != null) {
            applyIntentExtras(intent);
        }

        if (ACTION_UPDATE.equals(action)) {
            if (activeInstance != null) {
                updateMediaMetadata();
                updateNotification();
            }
            return START_NOT_STICKY;
        }

        // بدء الخدمة الأمامية فوراً (إلزامي خلال 5 ثوانٍ في أندرويد 12–16)
        Notification notification = buildNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            );
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        activeInstance = this;
        acquireWakeLock();
        ensureSilentAudioLoop();
        ensureMediaSession();
        updateMediaMetadata();

        PocketListener l = listener;
        if (l != null) {
            l.onPocketStateChanged(true);
        }

        return START_NOT_STICKY;
    }

    private synchronized void applyIntentExtras(Intent intent) {
        if (intent.hasExtra(EXTRA_ZEKR_ID)) {
            String id = intent.getStringExtra(EXTRA_ZEKR_ID);
            if (id != null) zekrId = id;
        }
        if (intent.hasExtra(EXTRA_ZEKR_TEXT)) {
            String txt = intent.getStringExtra(EXTRA_ZEKR_TEXT);
            if (txt != null && !txt.trim().isEmpty()) {
                zekrText = txt.trim();
            }
        }
        if (intent.hasExtra(EXTRA_COUNT)) {
            currentCount = Math.max(0, intent.getIntExtra(EXTRA_COUNT, currentCount));
        }
        if (intent.hasExtra(EXTRA_TARGET)) {
            target = Math.max(0, intent.getIntExtra(EXTRA_TARGET, target));
        }
        if (intent.hasExtra(EXTRA_VIBRATE)) {
            vibrateEnabled = intent.getBooleanExtra(EXTRA_VIBRATE, vibrateEnabled);
        }
    }

    // ═══════════════════════════════════════
    // Volume / Media Counting Logic
    // ═══════════════════════════════════════
    private synchronized void recordStep() {
        if (zekrId == null || zekrId.isEmpty()) return;

        long now = SystemClock.elapsedRealtime();
        if (now - lastStepElapsedMs < MIN_PRESS_INTERVAL_MS) return;
        lastStepElapsedMs = now;

        currentCount += 1;
        boolean reachesTarget = target > 0 && currentCount == target;

        if (vibrateEnabled) {
            MizanHaptics.perform(vibrator, reachesTarget ? "success" : "light", true);
        }

        long hour = System.currentTimeMillis() / 3_600_000L;
        enqueueClick(getApplicationContext(), zekrId, hour);
        updateMediaMetadata();
        updateNotification();

        PocketListener l = listener;
        if (l != null) {
            l.onPocketTick(zekrId, currentCount);
        }
    }

    // ═══════════════════════════════════════
    // MediaSession + Silent AudioTrack
    // ═══════════════════════════════════════
    private void ensureMediaSession() {
        if (mediaSession != null) return;

        mediaSession = new MediaSession(this, "MizanPocketTasbih");
        mediaSession.setCallback(
            new MediaSession.Callback() {
                @Override
                public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
                    if (mediaButtonIntent != null) {
                        KeyEvent ev = getKeyEventExtra(mediaButtonIntent);
                        if (
                            ev != null &&
                            ev.getAction() == KeyEvent.ACTION_DOWN &&
                            ev.getRepeatCount() == 0
                        ) {
                            recordStep();
                            return true;
                        }
                    }
                    return super.onMediaButtonEvent(mediaButtonIntent);
                }

                @Override
                public void onPlay() {
                    recordStep();
                }

                @Override
                public void onPause() {
                    recordStep();
                }
            }
        );

        volumeProvider = new VolumeProvider(VolumeProvider.VOLUME_CONTROL_RELATIVE, 100, 50) {
            @Override
            public void onAdjustVolume(int direction) {
                if (direction != 0) {
                    // تثبيت القيمة في المنتصف لضمان استمرار عمل زري الرفع والخفض بلا حدود
                    setCurrentVolume(50);
                    recordStep();
                }
            }

            @Override
            public void onSetVolumeTo(int volume) {
                setCurrentVolume(50);
            }
        };

        mediaSession.setPlaybackToRemote(volumeProvider);
        setSessionPlayingState(true);
    }

    private void setSessionPlayingState(boolean playing) {
        if (mediaSession == null) return;
        PlaybackState playbackState = new PlaybackState.Builder()
            .setActions(
                PlaybackState.ACTION_PLAY |
                    PlaybackState.ACTION_PAUSE |
                    PlaybackState.ACTION_PLAY_PAUSE
            )
            .setState(
                playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
                0L,
                playing ? 1.0f : 0.0f,
                SystemClock.elapsedRealtime()
            )
            .build();
        mediaSession.setPlaybackState(playbackState);
        mediaSession.setActive(playing);
    }

    @SuppressWarnings("deprecation")
    private static KeyEvent getKeyEventExtra(Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return intent.getParcelableExtra(Intent.EXTRA_KEY_EVENT, KeyEvent.class);
        }
        return intent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
    }

    private void updateMediaMetadata() {
        if (mediaSession == null) return;
        MediaMetadata metadata = new MediaMetadata.Builder()
            .putString(MediaMetadata.METADATA_KEY_TITLE, truncateText(zekrText, 60))
            .putString(MediaMetadata.METADATA_KEY_ARTIST, buildCountSubtitle())
            .build();
        mediaSession.setMetadata(metadata);
    }

    private void ensureSilentAudioLoop() {
        if (silentTrack != null) {
            try {
                if (
                    silentTrack.getState() == AudioTrack.STATE_INITIALIZED &&
                    silentTrack.getPlayState() != AudioTrack.PLAYSTATE_PLAYING
                ) {
                    silentTrack.play();
                }
            } catch (Exception ignored) {}
            return;
        }

        try {
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();

            requestFocus(attrs);

            final int sampleRate = 8000;
            final int sampleCount = sampleRate; // ثانية صمت واحدة تدور في حلقة بدون استهلاك معالج
            final int bufferBytes = sampleCount * 2;

            AudioFormat format = new AudioFormat.Builder()
                .setSampleRate(sampleRate)
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                .build();

            AudioTrack track = new AudioTrack(
                attrs,
                format,
                bufferBytes,
                AudioTrack.MODE_STATIC,
                AudioManager.AUDIO_SESSION_ID_GENERATE
            );

            if (track.getState() == AudioTrack.STATE_INITIALIZED) {
                short[] silence = new short[sampleCount];
                track.write(silence, 0, sampleCount);
                track.setLoopPoints(0, sampleCount, -1);
                track.play();
                silentTrack = track;
            } else {
                track.release();
            }
        } catch (Exception ignored) {}
    }

    @SuppressWarnings("deprecation")
    private void requestFocus(AudioAttributes attrs) {
        if (audioManager == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(attrs)
                    .setOnAudioFocusChangeListener(focusChangeListener)
                    .build();
                audioManager.requestAudioFocus(focusRequest);
            } else {
                audioManager.requestAudioFocus(
                    focusChangeListener,
                    AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN
                );
            }
        } catch (Exception ignored) {}
    }

    @SuppressWarnings("deprecation")
    private void abandonFocus() {
        if (audioManager == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (focusRequest != null) {
                    audioManager.abandonAudioFocusRequest(focusRequest);
                    focusRequest = null;
                }
            } else {
                audioManager.abandonAudioFocus(focusChangeListener);
            }
        } catch (Exception ignored) {}
    }

    private void acquireWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) return;
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "mizan:PocketTasbih"
                );
                wakeLock.setReferenceCounted(false);
                wakeLock.acquire(MAX_WAKELOCK_MS);
            }
        } catch (Exception ignored) {}
    }

    // ═══════════════════════════════════════
    // Notification (Lock Screen + Status Bar)
    // ═══════════════════════════════════════
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(
            Context.NOTIFICATION_SERVICE
        );
        if (nm == null) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "التسبيح والشاشة مقفلة",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("يعرض عدّاد التسبيح على شاشة القفل أثناء تفعيل وضع الجيب");
        channel.setShowBadge(false);
        channel.enableVibration(false);
        channel.setSound(null, null);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(channel);
    }

    private String buildCountSubtitle() {
        if (target > 0) {
            if (currentCount >= target) {
                return "اكتمل الهدف: " + currentCount + " / " + target + " · زر الصوت للمتابعة";
            }
            return "العدد: " + currentCount + " من " + target + " · سبّح بزر الصوت";
        }
        return "العدد: " + currentCount + " · سبّح بزر الصوت";
    }

    private static String truncateText(String text, int maxLen) {
        if (text == null || text.isEmpty()) return "التسبيح";
        if (text.length() <= maxLen) return text;
        return text.substring(0, maxLen - 1) + "…";
    }

    private Notification buildNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(
            Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP
        );
        PendingIntent openPending = PendingIntent.getActivity(
            this,
            100,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent stopIntent = new Intent(this, PocketTasbihService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPending = PendingIntent.getService(
            this,
            101,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_tasbih)
            .setContentTitle(truncateText(zekrText, 48))
            .setContentText(buildCountSubtitle())
            .setSubText("مِيزان · وضع القفل")
            .setContentIntent(openPending)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .addAction(0, "إيقاف", stopPending);

        if (target > 0) {
            builder.setProgress(target, Math.min(currentCount, target), false);
        }

        return builder.build();
    }

    private void updateNotification() {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(
                Context.NOTIFICATION_SERVICE
            );
            if (nm != null) {
                nm.notify(NOTIFICATION_ID, buildNotification());
            }
        } catch (Exception ignored) {}
    }

    // ═══════════════════════════════════════
    // Clean Teardown
    // ═══════════════════════════════════════
    private void stopPocketService() {
        releaseResources();
        stopForegroundCompat();
        stopSelf();
    }

    @SuppressWarnings("deprecation")
    private void stopForegroundCompat() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
    }

    private void releaseResources() {
        boolean wasActive = (activeInstance == this);
        if (wasActive) {
            activeInstance = null;
        }

        if (mediaSession != null) {
            try {
                mediaSession.setActive(false);
                mediaSession.release();
            } catch (Exception ignored) {}
            mediaSession = null;
            volumeProvider = null;
        }

        if (silentTrack != null) {
            try {
                if (silentTrack.getPlayState() == AudioTrack.PLAYSTATE_PLAYING) {
                    silentTrack.stop();
                }
                silentTrack.release();
            } catch (Exception ignored) {}
            silentTrack = null;
        }

        abandonFocus();

        if (wakeLock != null) {
            try {
                if (wakeLock.isHeld()) {
                    wakeLock.release();
                }
            } catch (Exception ignored) {}
            wakeLock = null;
        }

        if (wasActive) {
            PocketListener l = listener;
            if (l != null) {
                l.onPocketStateChanged(false);
            }
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        stopPocketService();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        releaseResources();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
