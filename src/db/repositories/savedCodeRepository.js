import * as store from '../store';
import generateId from '../../utils/generateId';
import { buildPayload } from '../../utils/qrPayloads';

/**
 * savedCodeRepository — the only place that knows how a saved code record is
 * shaped. Screens and stores go through here so id/timestamp handling and the
 * payload rebuild live in one spot.
 *
 * A saved code keeps both the rendered `payload` and the `values` it came from.
 * The payload alone would be enough to redraw the code, but not to reopen it in
 * the editor with the WiFi password back in its own field — and reopening a
 * saved code to tweak it is the main reason to save one.
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
  // Keep the payload in step with whatever the values now say.
  merged.payload = buildPayload(merged.type, merged.values);

  await store.putCode(merged);
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
