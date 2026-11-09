import { Haptics } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const triggerHapticFeedback = async (type = 'light') => {
  console.log('[Haptics] Triggering:', type, 'Platform:', Capacitor.getPlatform());
  
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.vibrate({ duration: type === 'heavy' ? 100 : 30 });
    } catch (e) {
      console.error('[Haptics] Failed:', e);
    }
  } else {
    if (navigator.vibrate) {
      navigator.vibrate(type === 'heavy' ? 100 : 20);
    }
  }
};
