import { Alert } from 'react-native';
import { isWeb } from './platform';

/**
 * crossPlatformAlert — Alert.alert that also works on the web build.
 *
 * React Native Web's Alert is a no-op, so on web a confirmation dialog would
 * silently never appear and the destructive branch would simply never run.
 * Falling back to window.confirm keeps "Delete this code?" behaving the same
 * in both builds. (Same helper both sibling apps carry, for the same reason.)
 */

export function alert(title, message) {
  if (isWeb) {
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/**
 * Ask before doing something destructive.
 * `onConfirm` runs only on a yes; `onCancel` is optional.
 */
export function confirm(title, message, onConfirm, { confirmLabel = 'OK', destructive = false, onCancel } = {}) {
  if (isWeb) {
    const ok = typeof window !== 'undefined' && window.confirm(message ? `${title}\n\n${message}` : title);
    if (ok) onConfirm?.();
    else onCancel?.();
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel', onPress: onCancel },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
