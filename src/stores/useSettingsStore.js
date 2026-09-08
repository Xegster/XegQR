import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CACHE_LIMIT_BYTES, DEFAULT_TOTAL_CACHE_BYTES } from '../services/imageCache';

/**
 * useSettingsStore — app preferences, persisted to AsyncStorage.
 *
 * AsyncStorage rather than the SQLite/IndexedDB store: settings are a handful
 * of scalars read at startup on every screen, and they need to be available
 * before the database has opened. (This is the same split both sibling apps
 * use — AsyncStorage for settings, the real database for records.)
 *
 * Every setter persists immediately. There is no save button anywhere in the
 * app, so an unpersisted change is just a bug waiting for a cold start.
 */

const STORAGE_KEY = 'xegqr:settings';

const DEFAULTS = {
  theme: 'Night',
  defaultErrorCorrection: 'M',
  cacheImages: true,
  perImageLimitBytes: DEFAULT_CACHE_LIMIT_BYTES,
  totalCacheLimitBytes: DEFAULT_TOTAL_CACHE_BYTES,
  lastUsedType: null,
};

async function persist(state) {
  const payload = {
    theme: state.theme,
    defaultErrorCorrection: state.defaultErrorCorrection,
    cacheImages: state.cacheImages,
    perImageLimitBytes: state.perImageLimitBytes,
    totalCacheLimitBytes: state.totalCacheLimitBytes,
    lastUsedType: state.lastUsedType,
  };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // A failed write should not take the UI down with it; the setting still
    // applies for this session.
    console.warn('[settings] persist failed:', e?.message);
  }
}

const useSettingsStore = create((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ ...DEFAULTS, ...JSON.parse(raw), hydrated: true });
      else set({ hydrated: true });
    } catch (e) {
      console.warn('[settings] hydrate failed, using defaults:', e?.message);
      set({ hydrated: true });
    }
  },

  setTheme: (theme) => {
    set({ theme });
    persist(get());
  },

  toggleTheme: () => {
    set({ theme: get().theme === 'Night' ? 'Day' : 'Night' });
    persist(get());
  },

  setDefaultErrorCorrection: (defaultErrorCorrection) => {
    set({ defaultErrorCorrection });
    persist(get());
  },

  setCacheImages: (cacheImages) => {
    set({ cacheImages });
    persist(get());
  },

  setPerImageLimitBytes: (perImageLimitBytes) => {
    set({ perImageLimitBytes });
    persist(get());
  },

  setTotalCacheLimitBytes: (totalCacheLimitBytes) => {
    set({ totalCacheLimitBytes });
    persist(get());
  },

  setLastUsedType: (lastUsedType) => {
    set({ lastUsedType });
    persist(get());
  },

  resetSettings: () => {
    set({ ...DEFAULTS });
    persist(get());
  },
}));

export default useSettingsStore;
