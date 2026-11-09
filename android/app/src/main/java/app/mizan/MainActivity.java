package app.mizan;

import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;

public class MainActivity extends BridgeActivity {
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN || keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
            // ✅ نرسل الحدث مرة واحدة فقط عند أول ضغطة (نتجاهل الـ repeat)
            if (event.getRepeatCount() == 0) {
                JSObject data = new JSObject();
                data.put("keyCode", keyCode);
                bridge.triggerWindowJSEvent("volumeButtonPress", data.toString());
            }
            // نستهلك الحدث — الصوت لا يتغير والتطبيق مفتوح (design choice)
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        // ✅ نستهلك الـ UP برضه عشان نضمن عدم ظهور volume bar على بعض الأجهزة
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN || keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
            return true;
        }
        return super.onKeyUp(keyCode, event);
    }
}
