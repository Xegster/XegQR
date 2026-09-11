import * as store from '../store';
import generateId from '../../utils/generateId';
import { getQrType } from '../../utils/qrPayloads';

/**
 * templateRepository — saved style presets, reusable across any code type.
 *
 * A template keeps only `style` (colours, shapes, logo, frame, encoding) —
 * never a code's `values`, so applying one never touches content someone has
 * already typed into the URL/text/WiFi/etc. fields it's applied over.
 */

export async function list() {
  return store.allTemplates();
}

export async function get(id) {
  return store.getTemplate(id);
}

export async function create({ name, type, style }) {
  const now = Date.now();
  const record = {
    id: generateId('tpl'),
    name: name?.trim() || defaultName(type),
    type: type ?? null,
    style: style ?? {},
    createdOn: now,
    updatedOn: now,
  };
  await store.putTemplate(record);
  return record;
}

export async function remove(id) {
  await store.deleteTemplate(id);
}

function defaultName(type) {
  const label = getQrType(type)?.label;
  return label ? `${label} style` : 'Custom style';
}
