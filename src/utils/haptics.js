import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const triggerHapticFeedback = async (type = 'light') => {
  if (Capacitor.isNativePlatform()) {
    try {
      if (type === 'light') {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (type === 'medium') {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (type === 'heavy') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
    } catch (e) {
      console.error('Haptics failed', e);
    }
  } else {
    // fallback for browser
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  }
};
