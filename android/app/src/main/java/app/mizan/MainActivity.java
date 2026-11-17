package app.mizan;

import android.os.Bundle;
import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;

public class MainActivity extends BridgeActivity {

    // يُفعَّل فقط داخل شاشة السبحة حتى تبقى أزرار الصوت طبيعية في باقي التطبيق
    private volatile boolean interceptVolumeKeys = false;

    public void setInterceptVolumeKeys(boolean enabled) {
        this.interceptVolumeKeys = enabled;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(MizanNativePlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event != null && interceptVolumeKeys) {
            int keyCode = event.getKeyCode();
            if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN || keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
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
