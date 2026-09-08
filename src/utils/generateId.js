/**
 * generateId — collision-resistant ids for locally stored records.
 *
 * Nothing here syncs to a server, so a timestamp prefix plus randomness is
 * plenty, and the prefix has the useful side effect of making ids sort roughly
 * by creation time in a debugger.
 */
export default function generateId(prefix = '') {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}${prefix ? '_' : ''}${time}${random}`;
}
