import { Platform } from 'react-native';

/**
 * The single place that decides which of the four supported targets we are
 * running on. Everything else asks this module; nothing else should read
 * Platform.OS or sniff the user agent.
 *
 * "Web" alone is not one target: a phone browser and a desktop browser need
 * different behaviour (touch, no pinned preview), and telling them apart takes
 * more than one signal, which is why that logic lives here once.
 */
export const PLATFORMS = Object.freeze({
  DESKTOP_WEB: 'desktopWeb',
  MOBILE_WEB: 'mobileWeb',
  ANDROID: 'android',
  IOS: 'ios',
});

const MOBILE_UA = /Android|iPhone|iPad|iPod|Mobile/i;

function detectWebPlatform() {
  if (typeof window === 'undefined') return PLATFORMS.DESKTOP_WEB;
  const touchOnly =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const mobileUa = typeof navigator !== 'undefined' && MOBILE_UA.test(navigator.userAgent || '');
  return touchOnly || mobileUa ? PLATFORMS.MOBILE_WEB : PLATFORMS.DESKTOP_WEB;
}

function detect() {
  if (Platform.OS === 'android') return PLATFORMS.ANDROID;
  if (Platform.OS === 'ios') return PLATFORMS.IOS;
  return detectWebPlatform();
}

export const CURRENT_PLATFORM = detect();

export const isDesktopWeb = CURRENT_PLATFORM === PLATFORMS.DESKTOP_WEB;
export const isMobileWeb = CURRENT_PLATFORM === PLATFORMS.MOBILE_WEB;
export const isAndroid = CURRENT_PLATFORM === PLATFORMS.ANDROID;
export const isIos = CURRENT_PLATFORM === PLATFORMS.IOS;

/** Either web target. */
export const isWeb = isDesktopWeb || isMobileWeb;
/** Either installed-app target. */
export const isNativeApp = isAndroid || isIos;
