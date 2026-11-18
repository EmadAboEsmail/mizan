package app.mizan;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;

public class MainActivity extends BridgeActivity {

    private static final int COLOR_LIGHT_BG = Color.parseColor("#FAF6F0");
    private static final int COLOR_DARK_BG = Color.parseColor("#131210");
    private static final int COLOR_FOCUS_BG = Color.parseColor("#070706");

    // يُفعَّل فقط داخل شاشة السبحة حتى تبقى أزرار الصوت طبيعية في باقي التطبيق
    private volatile boolean interceptVolumeKeys = false;
    private volatile boolean immersiveMode = false;
    private volatile boolean darkTheme = false;
    private volatile boolean amoledTheme = false;
    private int defaultCutoutMode = 0;

    public void setInterceptVolumeKeys(boolean enabled) {
        this.interceptVolumeKeys = enabled;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(MizanNativePlugin.class);
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        if (window == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            defaultCutoutMode = window.getAttributes().layoutInDisplayCutoutMode;
        }

        setupWindowInsetsHandler(window);
    }

    private void setupWindowInsetsHandler(Window window) {
        WindowCompat.setDecorFitsSystemWindows(window, false);
        View decorView = window.getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, insets) -> {
            if (immersiveMode) {
                // وضع التركيز: إزالة كل الهوامش العلوية والسفلية وملء الشاشة بالكامل
                v.setPadding(0, 0, 0, 0);
                resetWebSafeAreaCss();
                return WindowInsetsCompat.CONSUMED;
            }

            int barMask =
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout();
            Insets bars = insets.getInsets(barMask);
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            boolean keyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime());

            v.setPadding(
                bars.left,
                bars.top,
                bars.right,
                keyboardVisible ? ime.bottom : bars.bottom
            );
            resetWebSafeAreaCss();

            return new WindowInsetsCompat.Builder(insets)
                .setInsets(barMask, Insets.of(0, 0, 0, 0))
                .build();
        });
    }

    private void resetWebSafeAreaCss() {
        if (bridge == null || bridge.getWebView() == null) return;
        bridge
            .getWebView()
            .post(() -> {
                if (bridge != null && bridge.getWebView() != null) {
                    bridge
                        .getWebView()
                        .evaluateJavascript(
                            "try{" +
                                "var s=document.documentElement.style;" +
                                "s.setProperty('--safe-area-inset-top','0px');" +
                                "s.setProperty('--safe-area-inset-right','0px');" +
                                "s.setProperty('--safe-area-inset-bottom','0px');" +
                                "s.setProperty('--safe-area-inset-left','0px');" +
                                "}catch(e){}",
                            null
                        );
                }
            });
    }

    public void setSystemBarTheme(final boolean dark, final boolean amoled) {
        this.darkTheme = dark;
        this.amoledTheme = amoled;
        runOnUiThread(() -> {
            if (!immersiveMode) {
                applyNormalSystemBars();
            }
        });
    }

    public void setImmersiveMode(final boolean enabled) {
        this.immersiveMode = enabled;
        runOnUiThread(() -> {
            Window window = getWindow();
            if (window == null) return;
            View decorView = window.getDecorView();
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
                window,
                decorView
            );

            if (enabled) {
                WindowCompat.setDecorFitsSystemWindows(window, false);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    WindowManager.LayoutParams lp = window.getAttributes();
                    lp.layoutInDisplayCutoutMode =
                        Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                            ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                            : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                    window.setAttributes(lp);
                }

                setSystemBarColors(window, Color.TRANSPARENT);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    window.setNavigationBarContrastEnforced(false);
                }

                decorView.setBackgroundColor(COLOR_FOCUS_BG);
                decorView.setPadding(0, 0, 0, 0);
                window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

                if (controller != null) {
                    controller.setAppearanceLightStatusBars(false);
                    controller.setAppearanceLightNavigationBars(false);
                    controller.setSystemBarsBehavior(
                        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    );
                    controller.hide(WindowInsetsCompat.Type.systemBars());
                }
            } else {
                window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

                WindowManager.LayoutParams lp = window.getAttributes();
                lp.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    lp.layoutInDisplayCutoutMode = defaultCutoutMode;
                }
                window.setAttributes(lp);

                applyNormalSystemBars();

                if (controller != null) {
                    controller.show(WindowInsetsCompat.Type.systemBars());
                }
            }

            ViewCompat.requestApplyInsets(decorView);
            decorView.post(() -> ViewCompat.requestApplyInsets(decorView));
        });
    }

    public void setScreenDim(final boolean enabled) {
        runOnUiThread(() -> {
            Window window = getWindow();
            if (window == null) return;
            WindowManager.LayoutParams lp = window.getAttributes();
            lp.screenBrightness = enabled
                ? 0.01f
                : WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE;
            window.setAttributes(lp);
        });
    }

    private void applyNormalSystemBars() {
        Window window = getWindow();
        if (window == null) return;
        View decorView = window.getDecorView();

        int bgColor = darkTheme
            ? (amoledTheme ? Color.BLACK : COLOR_DARK_BG)
            : COLOR_LIGHT_BG;
        decorView.setBackgroundColor(bgColor);
        setSystemBarColors(window, bgColor);

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
            window,
            decorView
        );
        if (controller != null) {
            boolean useDarkIcons = !darkTheme;
            controller.setAppearanceLightStatusBars(useDarkIcons);
            controller.setAppearanceLightNavigationBars(useDarkIcons);
        }
    }

    @SuppressWarnings("deprecation")
    private void setSystemBarColors(Window window, int color) {
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(color);
        window.setNavigationBarColor(color);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && immersiveMode) {
            Window window = getWindow();
            if (window == null) return;
            View decorView = window.getDecorView();
            decorView.setPadding(0, 0, 0, 0);
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
                window,
                decorView
            );
            if (controller != null) {
                controller.setSystemBarsBehavior(
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
                controller.hide(WindowInsetsCompat.Type.systemBars());
            }
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event != null) {
            int keyCode = event.getKeyCode();
            boolean isVolume =
                keyCode == KeyEvent.KEYCODE_VOLUME_DOWN ||
                keyCode == KeyEvent.KEYCODE_VOLUME_UP;

            if (isVolume && PocketTasbihService.isRunning()) {
                if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                    PocketTasbihService.triggerFromActivity();
                }
                return true;
            }

            if (isVolume && interceptVolumeKeys) {
                if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                    if (bridge != null) {
                        JSObject data = new JSObject();
                        data.put("keyCode", keyCode);
                        bridge.triggerWindowJSEvent("volumeButtonPress", data.toString());
                    }
                }
                // نستهلك الحدث في DOWN و UP لمنع ظهور شريط الصوت وتغيير مستوى الصوت
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }
}
