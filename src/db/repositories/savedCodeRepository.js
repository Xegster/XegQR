import * as store from '../store';
import generateId from '../../utils/generateId';
import { buildPayload } from '../../utils/qrPayloads';
import * as widgetSync from '../../services/widgetSync';

/**
 * savedCodeRepository — the only place that knows how a saved code record is
 * shaped. Screens and stores go through here so id/timestamp handling and the
 * payload rebuild live in one spot.
 *
 * A saved code keeps both the rendered `payload` and the `values` it came from.
 * The payload alone would be enough to redraw the code, but not to reopen it in
 * the editor with the WiFi password back in its own field — and reopening a
 * saved code to tweak it is the main reason to save one.
 *
 * Updates and deletes also notify widgetSync, so a home-screen tile follows a
 * rename or shows "Code removed" whichever screen or store made the change.
 */

export async function list() {
  return store.allCodes();
}

export async function get(id) {
  return store.getCode(id);
}

export async function create({ name, type, values, style }) {
  const now = Date.now();
  const record = {
    id: generateId('qr'),
    name: name?.trim() || defaultName(type, values),
    type,
    payload: buildPayload(type, values),
    values: values ?? {},
    style: style ?? {},
    createdOn: now,
    updatedOn: now,
  };
  await store.putCode(record);
  return record;
}

export async function update(id, changes) {
  const existing = await store.getCode(id);
  if (!existing) return null;

  const merged = {
    ...existing,
    ...changes,
    values: changes.values ?? existing.values,
    style: changes.style ?? existing.style,
    updatedOn: Date.now(),
  };
  // No `name` means unchanged; a blank one means "choose one for me", the same
  // fallback create() uses. Never store an empty name: the SQLite column is
  // NOT NULL, so an undefined name failed the whole save.
  merged.name =
    changes.name === undefined
      ? existing.name
      : String(changes.name ?? '').trim() || defaultName(merged.type, merged.values);
  // Keep the payload in step with whatever the values now say.
  merged.payload = buildPayload(merged.type, merged.values);

  await store.putCode(merged);
  notifyWidgets(widgetSync.codeUpdated(merged));
  return merged;
}

export async function duplicate(id) {
  const existing = await store.getCode(id);
  if (!existing) return null;
  return create({
    name: `${existing.name} copy`,
    type: existing.type,
    values: existing.values,
    style: existing.style,
  });
}

export async function remove(id) {
  await store.deleteCode(id);
  notifyWidgets(widgetSync.codeDeleted(id));
}

/** Widget refreshes are fire-and-forget: a tile failing to redraw must not fail a save. */
function notifyWidgets(promise) {
  promise.catch((e) => console.warn('[widgets] sync failed:', e?.message));
}

/**
 * A readable fallback name, taken from whichever field carries the code's
 * identity — otherwise every unnamed WiFi code is called "Wi-Fi".
 */
function defaultName(type, values) {
  const v = values ?? {};
  const candidates = [v.ssid, v.url, v.to, v.title, v.handle, v.phone, v.address, v.text];
  const found = candidates.find((c) => String(c ?? '').trim());
  if (found) return String(found).trim().slice(0, 60);
  return `${type} code`;
}
