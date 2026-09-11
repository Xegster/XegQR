import { create } from 'zustand';
import * as savedCodes from '../db/repositories/savedCodeRepository';
import * as templates from '../db/repositories/templateRepository';
import * as imageCache from '../services/imageCache';
import { initStorage } from '../db/store';

/**
 * useLibraryStore — the user's saved codes and cached logo images.
 *
 * Reads go through this store so screens share one in-memory copy; writes go
 * to the database first and then update that copy, which keeps the list on
 * screen honest about what is actually persisted.
 */

const useLibraryStore = create((set, get) => ({
  codes: [],
  templates: [],
  images: [],
  usage: { count: 0, bytes: 0 },
  loading: false,
  ready: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      await initStorage();
      const [codes, templateList, images, usage] = await Promise.all([
        savedCodes.list(),
        templates.list(),
        imageCache.listCachedImages(),
        imageCache.cacheUsage(),
      ]);
      set({ codes, templates: templateList, images, usage, loading: false, ready: true });
    } catch (e) {
      // Storage being unavailable (a locked-down browser, private mode) must
      // not block generating codes — only saving them.
      set({ loading: false, ready: true, error: e?.message ?? 'Storage unavailable' });
    }
  },

  saveCode: async ({ name, type, values, style }) => {
    const record = await savedCodes.create({ name, type, values, style });
    set({ codes: [record, ...get().codes] });
    return record;
  },

  updateCode: async (id, changes) => {
    const updated = await savedCodes.update(id, changes);
    if (!updated) return null;
    set({
      codes: [updated, ...get().codes.filter((c) => c.id !== id)],
    });
    return updated;
  },

  duplicateCode: async (id) => {
    const copy = await savedCodes.duplicate(id);
    if (copy) set({ codes: [copy, ...get().codes] });
    return copy;
  },

  deleteCode: async (id) => {
    await savedCodes.remove(id);
    set({ codes: get().codes.filter((c) => c.id !== id) });
  },

  saveTemplate: async ({ name, type, style }) => {
    const record = await templates.create({ name, type, style });
    set({ templates: [record, ...get().templates] });
    return record;
  },

  deleteTemplate: async (id) => {
    await templates.remove(id);
    set({ templates: get().templates.filter((t) => t.id !== id) });
  },

  cacheImage: async (asset, options) => {
    const result = await imageCache.cacheImage(asset, options);
    if (result.cached) {
      const [images, usage] = await Promise.all([
        imageCache.listCachedImages(),
        imageCache.cacheUsage(),
      ]);
      set({ images, usage });
    }
    return result;
  },

  deleteImage: async (id) => {
    await imageCache.removeCachedImage(id);
    const [images, usage] = await Promise.all([
      imageCache.listCachedImages(),
      imageCache.cacheUsage(),
    ]);
    set({ images, usage });
  },
}));

export default useLibraryStore;
