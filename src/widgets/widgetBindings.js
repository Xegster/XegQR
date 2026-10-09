import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * widgetBindings — which saved code each home-screen tile opens, and how the
 * tile looks.
 *
 * One AsyncStorage record maps Android's widget id to a binding:
 *
 *   widgetId -> {
 *     widgetName, codeId, codeType,
 *     label, customLabel, source, background, textColor, iconMode, iconSvg, radius,
 *     removed, updatedOn,
 *   }
 *
 * The tile renders purely from this record. It never opens SQLite or touches a
 * QR payload, so the headless widget task needs nothing but AsyncStorage —
 * the least fragile arrangement, and the reason the icon is stored as finished
 * SVG markup rather than an icon name.
 *
 * Writes are read-modify-write on a single key, so they are queued: the app and
 * the widget task share one JS context, and two interleaved writes would
 * otherwise drop one of them.
 */

const STORAGE_KEY = 'xegqr:widgetBindings';

let queue = Promise.resolve();

function serialized(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

async function readAll() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    console.warn('[widgets] could not read bindings:', e?.message);
    return {};
  }
}

async function writeAll(bindings) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
}

export async function listBindings() {
  return readAll();
}

export async function getBinding(widgetId) {
  const all = await readAll();
  return all[String(widgetId)] ?? null;
}

export function saveBinding(widgetId, binding) {
  return serialized(async () => {
    const all = await readAll();
    const record = { ...binding, removed: !!binding.removed, updatedOn: Date.now() };
    all[String(widgetId)] = record;
    await writeAll(all);
    return record;
  });
}

export function removeBinding(widgetId) {
  return serialized(async () => {
    const all = await readAll();
    if (!(String(widgetId) in all)) return;
    delete all[String(widgetId)];
    await writeAll(all);
  });
}

/**
 * Run `updater` over every binding and persist the ones it changed. The updater
 * returns the same object to mean "no change". Resolves to the changed
 * `[widgetId, binding]` pairs, so the caller can redraw just those tiles.
 */
export function updateBindings(updater) {
  return serialized(async () => {
    const all = await readAll();
    const changed = [];
    for (const [widgetId, binding] of Object.entries(all)) {
      const next = updater(binding);
      if (next && next !== binding) {
        all[widgetId] = { ...next, updatedOn: Date.now() };
        changed.push([widgetId, all[widgetId]]);
      }
    }
    if (changed.length) await writeAll(all);
    return changed;
  });
}

/**
 * A code was edited. Only the label can follow, and only when the user has not
 * typed their own; style edits are deliberately not copied (the tile took a
 * one-time copy of the code's colours, if any).
 */
export function applyCodeChange(binding, code) {
  if (!code?.name || binding?.codeId !== code.id) return binding;
  if (binding.customLabel || binding.label === code.name) return binding;
  return { ...binding, label: code.name };
}

/** A code was deleted: its tiles switch to the "Code removed" state. */
export function applyCodeRemoval(binding, codeId) {
  if (binding?.codeId !== codeId || binding.removed) return binding;
  return { ...binding, removed: true };
}
