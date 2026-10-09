import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Brightness from 'expo-brightness';
import { isAndroid, isIos } from '../utils/platform';

/**
 * useBrightnessBoost — full screen brightness while `enabled`, put back after.
 *
 * Scanners read a phone screen far more reliably at full brightness, which is
 * the whole point of the full-screen code view.
 *
 * Android: only this app's window is brightened (no permission needed), and
 * restoring hands control back to the system setting rather than writing a
 * remembered value. The override also lapses on its own when the activity
 * closes, which covers a crash or a task kill.
 *
 * iOS: the setting is screen-wide and lasts until the device locks, so the
 * value from before the boost is read and written back.
 *
 * Restores when the app goes to the background (home button, app switcher) and
 * boosts again on return. Web: does nothing.
 */
export default function useBrightnessBoost(enabled) {
  useEffect(() => {
    if (!enabled || !(isAndroid || isIos)) return undefined;

    let unmounted = false;
    let boosted = false;
    let original = null;

    const restore = async () => {
      if (!boosted) return;
      boosted = false;
      try {
        if (isAndroid) await Brightness.restoreSystemBrightnessAsync();
        else if (original !== null) await Brightness.setBrightnessAsync(original);
      } catch (e) {
        console.warn('[brightness] restore failed:', e?.message);
      }
    };

    const boost = async () => {
      if (boosted || unmounted) return;
      try {
        if (isIos) original = await Brightness.getBrightnessAsync();
        if (unmounted) return;
        await Brightness.setBrightnessAsync(1);
        boosted = true;
        // The screen may have closed, or the app gone to the background, while
        // the call was in flight.
        if (unmounted || AppState.currentState === 'background') await restore();
      } catch (e) {
        console.warn('[brightness] boost failed:', e?.message);
      }
    };

    boost();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') boost();
      else if (state === 'background') restore();
    });

    return () => {
      unmounted = true;
      subscription.remove();
      restore();
    };
  }, [enabled]);
}
