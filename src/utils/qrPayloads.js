/**
 * qrPayloads — every QR content type XegQR can encode, plus the field schema
 * that drives the generator UI.
 *
 * Why this file exists: no QR *rendering* library supplies typed payloads. Every
 * encoder surveyed (qrcode / node-qrcode, qr-code-styling, react-native-qrcode-styled,
 * ZXing, libqrencode, endroid, goqr.me, QR Code Monkey) takes a finished string
 * and draws it. The "solution types" that commercial platforms (QR Tiger,
 * Uniqode, QRickit) charge for are string templating — so they live here, and
 * the app gets their whole catalogue with no backend and no per-scan fee.
 *
 * Each entry in QR_TYPES carries a `fields` schema. The generator screen renders
 * that schema generically, so adding a new QR type is a data change here rather
 * than a new screen. Field `type` values consumed by the form renderer:
 *   text | multiline | number | password | select | switch | date | datetime
 *
 * Escaping rules differ per format and are genuinely load-bearing — an
 * unescaped ';' in a WiFi password silently produces a QR code that joins the
 * wrong network — so each family gets its own escaper below.
 */

// ---------------------------------------------------------------------------
// Escapers
// ---------------------------------------------------------------------------

// WIFI: and MECARD: share the "escape the delimiters" rule from the original
// NTT DoCoMo spec: backslash, semicolon, comma, colon and double-quote.
function escapeWifi(value) {
  return String(value ?? '').replace(/([\\;,:"])/g, '\\$1');
}

const escapeMeCard = escapeWifi;

// vCard / iCalendar (RFC 6350 / RFC 5545): backslash, newline, comma, semicolon.
function escapeVCard(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

const escapeICal = escapeVCard;

/** RFC 5545 UTC timestamp: 20260908T143000Z. Accepts a Date or ISO-ish string. */
export function toICalDate(value, allDay = false) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getUTCFullYear();
  const mo = pad(d.getUTCMonth() + 1);
  const da = pad(d.getUTCDate());
  if (allDay) return `${y}${mo}${da}`;
  return `${y}${mo}${da}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/**
 * Strip everything but digits and a leading +, which is what tel:/sms: want.
 *
 * The one special case is a parenthesised zero in an international number
 * ("+44 (0)20 7946 0958"): that is the national trunk prefix, and it must be
 * dropped, not kept — dialling +44020… does not connect. The rule is applied
 * only to a bracketed 0 on a +-prefixed number, because in North American
 * formatting parentheses wrap the area code, which must survive.
 */
export function normalizePhone(value) {
  const raw = String(value ?? '').trim();
  const isInternational = raw.startsWith('+');
  const withoutTrunk = isInternational ? raw.replace(/\(\s*0\s*\)/g, '') : raw;
  return (isInternational ? '+' : '') + withoutTrunk.replace(/[^\d]/g, '');
}

function q(value) {
  return encodeURIComponent(String(value ?? ''));
}

/** Drop empty values so builders never emit `?subject=&body=` style noise. */
function queryString(params) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(([k, v]) => `${k}=${q(v)}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/** Add https:// when the user typed a bare domain. */
export function ensureProtocol(value, fallback = 'https://') {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return raw;
  return fallback + raw;
}

// ---------------------------------------------------------------------------
// Builders — one per QR content type
// ---------------------------------------------------------------------------

export function buildText(v) {
  return String(v.text ?? '');
}

export function buildUrl(v) {
  return ensureProtocol(v.url);
}

export function buildWifi(v) {
  const auth = v.encryption || 'WPA';
  const parts = [`T:${auth}`, `S:${escapeWifi(v.ssid)}`];
  if (auth !== 'nopass') parts.push(`P:${escapeWifi(v.password)}`);
  if (v.hidden) parts.push('H:true');
  return `WIFI:${parts.join(';')};;`;
}

export function buildVCard(v) {
  const name = [v.lastName, v.firstName, '', v.prefix, v.suffix].map(escapeVCard).join(';');
  const full = [v.prefix, v.firstName, v.lastName, v.suffix].filter(Boolean).join(' ').trim();
  const address = [
    '',
    '',
    escapeVCard(v.street),
    escapeVCard(v.city),
    escapeVCard(v.region),
    escapeVCard(v.postalCode),
    escapeVCard(v.country),
  ].join(';');

  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${name}`];
  if (full) lines.push(`FN:${escapeVCard(full)}`);
  if (v.organization) lines.push(`ORG:${escapeVCard(v.organization)}`);
  if (v.title) lines.push(`TITLE:${escapeVCard(v.title)}`);
  if (v.phoneWork) lines.push(`TEL;TYPE=WORK,VOICE:${normalizePhone(v.phoneWork)}`);
  if (v.phoneMobile) lines.push(`TEL;TYPE=CELL:${normalizePhone(v.phoneMobile)}`);
  if (v.phoneHome) lines.push(`TEL;TYPE=HOME,VOICE:${normalizePhone(v.phoneHome)}`);
  if (v.fax) lines.push(`TEL;TYPE=FAX:${normalizePhone(v.fax)}`);
  if (v.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(v.email)}`);
  if (v.website) lines.push(`URL:${escapeVCard(ensureProtocol(v.website))}`);
  if (address.replace(/;/g, '')) lines.push(`ADR;TYPE=WORK:${address}`);
  if (v.birthday) lines.push(`BDAY:${escapeVCard(v.birthday)}`);
  if (v.note) lines.push(`NOTE:${escapeVCard(v.note)}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

// MeCard is the compact alternative to vCard — notably the format Android's
// native camera has always handled most reliably.
export function buildMeCard(v) {
  const parts = [];
  const name = [v.lastName, v.firstName].filter(Boolean).map(escapeMeCard).join(',');
  if (name) parts.push(`N:${name}`);
  if (v.reading) parts.push(`SOUND:${escapeMeCard(v.reading)}`);
  if (v.phone) parts.push(`TEL:${normalizePhone(v.phone)}`);
  if (v.videophone) parts.push(`TEL-AV:${normalizePhone(v.videophone)}`);
  if (v.email) parts.push(`EMAIL:${escapeMeCard(v.email)}`);
  if (v.note) parts.push(`NOTE:${escapeMeCard(v.note)}`);
  if (v.birthday) parts.push(`BDAY:${escapeMeCard(v.birthday)}`);
  if (v.address) parts.push(`ADR:${escapeMeCard(v.address)}`);
  if (v.website) parts.push(`URL:${escapeMeCard(ensureProtocol(v.website))}`);
  if (v.nickname) parts.push(`NICKNAME:${escapeMeCard(v.nickname)}`);
  return `MECARD:${parts.join(';')};;`;
}

export function buildEmail(v) {
  const to = String(v.to ?? '').trim();
  return `mailto:${to}${queryString({ cc: v.cc, bcc: v.bcc, subject: v.subject, body: v.body })}`;
}

export function buildSms(v) {
  const number = normalizePhone(v.phone);
  const body = String(v.message ?? '');
  // SMSTO: is the widely-supported form; the message follows a second colon.
  return body ? `SMSTO:${number}:${body}` : `SMSTO:${number}`;
}

export function buildPhone(v) {
  return `tel:${normalizePhone(v.phone)}`;
}

export function buildFacetime(v) {
  const target = String(v.target ?? '').trim();
  return `${v.audioOnly ? 'facetime-audio' : 'facetime'}:${target}`;
}

export function buildGeo(v) {
  const lat = String(v.latitude ?? '').trim();
  const lon = String(v.longitude ?? '').trim();
  if (v.query) return `geo:${lat},${lon}${queryString({ q: v.query })}`;
  const alt = String(v.altitude ?? '').trim();
  return alt ? `geo:${lat},${lon},${alt}` : `geo:${lat},${lon}`;
}

export function buildEvent(v) {
  const allDay = !!v.allDay;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//XegQR//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${escapeICal(v.title)}`,
  ];
  const start = toICalDate(v.start, allDay);
  const end = toICalDate(v.end, allDay);
  if (start) lines.push(allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`);
  if (end) lines.push(allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`);
  if (v.location) lines.push(`LOCATION:${escapeICal(v.location)}`);
  if (v.description) lines.push(`DESCRIPTION:${escapeICal(v.description)}`);
  if (v.url) lines.push(`URL:${escapeICal(ensureProtocol(v.url))}`);
  if (v.organizer) lines.push(`ORGANIZER:mailto:${escapeICal(v.organizer)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\n');
}

// BIP-21 style URIs. The scheme differs per chain but the query shape matches,
// which is why one builder covers all of them.
export function buildCrypto(v) {
  const scheme = v.currency || 'bitcoin';
  const address = String(v.address ?? '').trim();
  return `${scheme}:${address}${queryString({
    amount: v.amount,
    label: v.label,
    message: v.message,
  })}`;
}

export function buildWhatsApp(v) {
  const number = normalizePhone(v.phone).replace('+', '');
  return `https://wa.me/${number}${queryString({ text: v.message })}`;
}

export function buildTelegram(v) {
  const handle = String(v.username ?? '').replace('@', '').trim();
  return `https://t.me/${handle}${queryString({ text: v.message })}`;
}

export function buildZoom(v) {
  const id = String(v.meetingId ?? '').replace(/\s/g, '');
  return `https://zoom.us/j/${id}${queryString({ pwd: v.password })}`;
}

export function buildPaypal(v) {
  const user = String(v.username ?? '').replace('@', '').trim();
  const amount = String(v.amount ?? '').trim();
  const currency = String(v.currency ?? '').trim();
  let url = `https://paypal.me/${user}`;
  if (amount) url += `/${amount}${currency ? currency.toUpperCase() : ''}`;
  return url;
}

/**
 * EPC069-12 "GiroCode" — the European standard for scan-to-pay bank transfers.
 * Field order is fixed and positional; the spec requires exactly these lines.
 */
export function buildEpcPayment(v) {
  const amount = String(v.amount ?? '').trim();
  return [
    'BCD',
    '002',
    '1',
    'SCT',
    String(v.bic ?? '').trim(),
    String(v.name ?? '').trim(),
    String(v.iban ?? '').replace(/\s/g, '').trim(),
    amount ? `EUR${amount}` : '',
    String(v.purposeCode ?? '').trim(),
    String(v.reference ?? '').trim(),
    String(v.remittance ?? '').trim(),
    String(v.note ?? '').trim(),
  ].join('\n');
}

/** Bookmark — MEBKM, the other DoCoMo format most scanners still understand. */
export function buildBookmark(v) {
  return `MEBKM:TITLE:${escapeMeCard(v.title)};URL:${escapeMeCard(ensureProtocol(v.url))};;`;
}

export function buildAppStore(v) {
  const store = v.store || 'play';
  const id = String(v.appId ?? '').trim();
  if (store === 'play') return `https://play.google.com/store/apps/details?id=${id}`;
  if (store === 'apple') return `https://apps.apple.com/app/id${id.replace(/^id/, '')}`;
  // 'both' routes through a single link that each platform resolves itself.
  return ensureProtocol(v.fallbackUrl || id);
}

const SOCIAL_BASES = {
  instagram: 'https://instagram.com/',
  x: 'https://x.com/',
  facebook: 'https://facebook.com/',
  linkedin: 'https://linkedin.com/in/',
  tiktok: 'https://tiktok.com/@',
  youtube: 'https://youtube.com/@',
  github: 'https://github.com/',
  snapchat: 'https://snapchat.com/add/',
  pinterest: 'https://pinterest.com/',
  reddit: 'https://reddit.com/user/',
  discord: 'https://discord.gg/',
  twitch: 'https://twitch.tv/',
};

export function buildSocial(v) {
  const base = SOCIAL_BASES[v.network] ?? SOCIAL_BASES.instagram;
  const handle = String(v.handle ?? '').replace('@', '').trim();
  return `${base}${handle}`;
}

/**
 * otpauth:// — the TOTP enrolment format every authenticator app scans.
 * Included because it is a genuine QR content type users expect, and it costs
 * nothing to support; the secret never leaves the device.
 */
export function buildOtp(v) {
  const label = [v.issuer, v.account].filter(Boolean).map(q).join(':');
  return `otpauth://${v.otpType || 'totp'}/${label}${queryString({
    secret: String(v.secret ?? '').replace(/\s/g, '').toUpperCase(),
    issuer: v.issuer,
    algorithm: v.algorithm,
    digits: v.digits,
    period: v.otpType === 'hotp' ? undefined : v.period,
    counter: v.otpType === 'hotp' ? v.counter : undefined,
  })}`;
}

// ---------------------------------------------------------------------------
// Type catalogue — drives the home grid and the generic generator form
// ---------------------------------------------------------------------------

export const QR_TYPES = [
  {
    id: 'url',
    label: 'Website',
    blurb: 'Open a link',
    icon: 'link',
    gradient: 'violet',
    build: buildUrl,
    fields: [
      { key: 'url', label: 'URL', type: 'text', placeholder: 'example.com', required: true, keyboard: 'url' },
    ],
  },
  {
    id: 'text',
    label: 'Plain text',
    blurb: 'Any message',
    icon: 'text',
    gradient: 'slate',
    build: buildText,
    fields: [
      { key: 'text', label: 'Text', type: 'multiline', placeholder: 'Anything you like', required: true },
    ],
  },
  {
    id: 'wifi',
    label: 'Wi-Fi',
    blurb: 'Join a network',
    icon: 'wifi',
    gradient: 'cyan',
    build: buildWifi,
    fields: [
      { key: 'ssid', label: 'Network name (SSID)', type: 'text', required: true },
      {
        key: 'encryption',
        label: 'Security',
        type: 'select',
        default: 'WPA',
        options: [
          { value: 'WPA', label: 'WPA/WPA2/WPA3' },
          { value: 'WEP', label: 'WEP' },
          { value: 'nopass', label: 'None (open)' },
        ],
      },
      { key: 'password', label: 'Password', type: 'password', dependsOn: { key: 'encryption', not: 'nopass' } },
      { key: 'hidden', label: 'Hidden network', type: 'switch', default: false },
    ],
  },
  {
    id: 'vcard',
    label: 'Contact card',
    blurb: 'Full vCard',
    icon: 'contact',
    gradient: 'emerald',
    build: buildVCard,
    fields: [
      { key: 'firstName', label: 'First name', type: 'text' },
      { key: 'lastName', label: 'Last name', type: 'text' },
      { key: 'organization', label: 'Organisation', type: 'text' },
      { key: 'title', label: 'Job title', type: 'text' },
      { key: 'phoneMobile', label: 'Mobile', type: 'text', keyboard: 'phone-pad' },
      { key: 'phoneWork', label: 'Work phone', type: 'text', keyboard: 'phone-pad' },
      { key: 'phoneHome', label: 'Home phone', type: 'text', keyboard: 'phone-pad' },
      { key: 'email', label: 'Email', type: 'text', keyboard: 'email' },
      { key: 'website', label: 'Website', type: 'text', keyboard: 'url' },
      { key: 'street', label: 'Street', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'region', label: 'State / region', type: 'text' },
      { key: 'postalCode', label: 'Post code', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'birthday', label: 'Birthday (YYYY-MM-DD)', type: 'text' },
      { key: 'note', label: 'Note', type: 'multiline' },
    ],
  },
  {
    id: 'mecard',
    label: 'MeCard',
    blurb: 'Compact contact',
    icon: 'contact',
    gradient: 'emerald',
    build: buildMeCard,
    fields: [
      { key: 'firstName', label: 'First name', type: 'text' },
      { key: 'lastName', label: 'Last name', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text', keyboard: 'phone-pad' },
      { key: 'email', label: 'Email', type: 'text', keyboard: 'email' },
      { key: 'website', label: 'Website', type: 'text', keyboard: 'url' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'birthday', label: 'Birthday (YYYYMMDD)', type: 'text' },
      { key: 'nickname', label: 'Nickname', type: 'text' },
      { key: 'note', label: 'Note', type: 'multiline' },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    blurb: 'Pre-filled message',
    icon: 'mail',
    gradient: 'indigo',
    build: buildEmail,
    fields: [
      { key: 'to', label: 'To', type: 'text', required: true, keyboard: 'email' },
      { key: 'cc', label: 'Cc', type: 'text', keyboard: 'email' },
      { key: 'bcc', label: 'Bcc', type: 'text', keyboard: 'email' },
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'body', label: 'Message', type: 'multiline' },
    ],
  },
  {
    id: 'sms',
    label: 'SMS',
    blurb: 'Pre-filled text',
    icon: 'message',
    gradient: 'amber',
    build: buildSms,
    fields: [
      { key: 'phone', label: 'Phone number', type: 'text', required: true, keyboard: 'phone-pad' },
      { key: 'message', label: 'Message', type: 'multiline' },
    ],
  },
  {
    id: 'phone',
    label: 'Phone call',
    blurb: 'Dial a number',
    icon: 'phone',
    gradient: 'amber',
    build: buildPhone,
    fields: [
      { key: 'phone', label: 'Phone number', type: 'text', required: true, keyboard: 'phone-pad' },
    ],
  },
  {
    id: 'geo',
    label: 'Location',
    blurb: 'Map coordinates',
    icon: 'pin',
    gradient: 'rose',
    build: buildGeo,
    fields: [
      { key: 'latitude', label: 'Latitude', type: 'text', required: true, keyboard: 'numeric' },
      { key: 'longitude', label: 'Longitude', type: 'text', required: true, keyboard: 'numeric' },
      { key: 'altitude', label: 'Altitude (m)', type: 'text', keyboard: 'numeric' },
      { key: 'query', label: 'Place label', type: 'text', hint: 'Shown instead of raw coordinates in some map apps' },
    ],
  },
  {
    id: 'event',
    label: 'Calendar event',
    blurb: 'Add to calendar',
    icon: 'calendar',
    gradient: 'rose',
    build: buildEvent,
    fields: [
      { key: 'title', label: 'Event title', type: 'text', required: true },
      { key: 'allDay', label: 'All-day event', type: 'switch', default: false },
      { key: 'start', label: 'Starts', type: 'datetime', required: true },
      { key: 'end', label: 'Ends', type: 'datetime' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'url', label: 'Link', type: 'text', keyboard: 'url' },
      { key: 'organizer', label: 'Organiser email', type: 'text', keyboard: 'email' },
      { key: 'description', label: 'Description', type: 'multiline' },
    ],
  },
  {
    id: 'crypto',
    label: 'Crypto',
    blurb: 'Wallet address',
    icon: 'coin',
    gradient: 'amber',
    build: buildCrypto,
    fields: [
      {
        key: 'currency',
        label: 'Currency',
        type: 'select',
        default: 'bitcoin',
        options: [
          { value: 'bitcoin', label: 'Bitcoin' },
          { value: 'ethereum', label: 'Ethereum' },
          { value: 'litecoin', label: 'Litecoin' },
          { value: 'dogecoin', label: 'Dogecoin' },
          { value: 'monero', label: 'Monero' },
          { value: 'bitcoincash', label: 'Bitcoin Cash' },
        ],
      },
      { key: 'address', label: 'Wallet address', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'text', keyboard: 'numeric' },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'message', label: 'Message', type: 'text' },
    ],
  },
  {
    id: 'epc',
    label: 'Bank transfer',
    blurb: 'SEPA GiroCode',
    icon: 'bank',
    gradient: 'emerald',
    build: buildEpcPayment,
    fields: [
      { key: 'name', label: 'Recipient name', type: 'text', required: true },
      { key: 'iban', label: 'IBAN', type: 'text', required: true },
      { key: 'bic', label: 'BIC / SWIFT', type: 'text' },
      { key: 'amount', label: 'Amount (EUR)', type: 'text', keyboard: 'numeric' },
      { key: 'remittance', label: 'Reference text', type: 'text' },
      { key: 'purposeCode', label: 'Purpose code', type: 'text' },
    ],
  },
  {
    id: 'paypal',
    label: 'PayPal',
    blurb: 'Request money',
    icon: 'coin',
    gradient: 'indigo',
    build: buildPaypal,
    fields: [
      { key: 'username', label: 'PayPal.me username', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'text', keyboard: 'numeric' },
      { key: 'currency', label: 'Currency code', type: 'text', placeholder: 'USD' },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    blurb: 'Start a chat',
    icon: 'message',
    gradient: 'emerald',
    build: buildWhatsApp,
    fields: [
      { key: 'phone', label: 'Phone (with country code)', type: 'text', required: true, keyboard: 'phone-pad' },
      { key: 'message', label: 'Pre-filled message', type: 'multiline' },
    ],
  },
  {
    id: 'telegram',
    label: 'Telegram',
    blurb: 'Open a profile',
    icon: 'message',
    gradient: 'cyan',
    build: buildTelegram,
    fields: [
      { key: 'username', label: 'Username', type: 'text', required: true, placeholder: '@handle' },
      { key: 'message', label: 'Pre-filled message', type: 'multiline' },
    ],
  },
  {
    id: 'zoom',
    label: 'Zoom',
    blurb: 'Join a meeting',
    icon: 'video',
    gradient: 'indigo',
    build: buildZoom,
    fields: [
      { key: 'meetingId', label: 'Meeting ID', type: 'text', required: true, keyboard: 'numeric' },
      { key: 'password', label: 'Passcode', type: 'text' },
    ],
  },
  {
    id: 'social',
    label: 'Social profile',
    blurb: 'Follow me',
    icon: 'social',
    gradient: 'magenta',
    build: buildSocial,
    fields: [
      {
        key: 'network',
        label: 'Network',
        type: 'select',
        default: 'instagram',
        options: Object.keys(SOCIAL_BASES).map((k) => ({
          value: k,
          label: k === 'x' ? 'X (Twitter)' : k.charAt(0).toUpperCase() + k.slice(1),
        })),
      },
      { key: 'handle', label: 'Handle / username', type: 'text', required: true },
    ],
  },
  {
    id: 'appstore',
    label: 'App download',
    blurb: 'Store listing',
    icon: 'app',
    gradient: 'violet',
    build: buildAppStore,
    fields: [
      {
        key: 'store',
        label: 'Store',
        type: 'select',
        default: 'play',
        options: [
          { value: 'play', label: 'Google Play' },
          { value: 'apple', label: 'Apple App Store' },
          { value: 'both', label: 'Custom smart link' },
        ],
      },
      { key: 'appId', label: 'App ID / package name', type: 'text', required: true, dependsOn: { key: 'store', not: 'both' } },
      { key: 'fallbackUrl', label: 'Smart link URL', type: 'text', keyboard: 'url', dependsOn: { key: 'store', is: 'both' } },
    ],
  },
  {
    id: 'bookmark',
    label: 'Bookmark',
    blurb: 'Titled link',
    icon: 'bookmark',
    gradient: 'slate',
    build: buildBookmark,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'url', label: 'URL', type: 'text', required: true, keyboard: 'url' },
    ],
  },
  {
    id: 'facetime',
    label: 'FaceTime',
    blurb: 'Apple call',
    icon: 'video',
    gradient: 'cyan',
    build: buildFacetime,
    fields: [
      { key: 'target', label: 'Phone or Apple ID', type: 'text', required: true },
      { key: 'audioOnly', label: 'Audio only', type: 'switch', default: false },
    ],
  },
  {
    id: 'otp',
    label: 'Authenticator',
    blurb: '2FA enrolment',
    icon: 'shield',
    gradient: 'magenta',
    build: buildOtp,
    fields: [
      { key: 'issuer', label: 'Service name', type: 'text', required: true, placeholder: 'Example Inc' },
      { key: 'account', label: 'Account', type: 'text', required: true, placeholder: 'you@example.com' },
      { key: 'secret', label: 'Secret (Base32)', type: 'password', required: true },
      {
        key: 'otpType',
        label: 'Type',
        type: 'select',
        default: 'totp',
        options: [
          { value: 'totp', label: 'Time-based (TOTP)' },
          { value: 'hotp', label: 'Counter-based (HOTP)' },
        ],
      },
      {
        key: 'algorithm',
        label: 'Algorithm',
        type: 'select',
        default: 'SHA1',
        options: [
          { value: 'SHA1', label: 'SHA1' },
          { value: 'SHA256', label: 'SHA256' },
          { value: 'SHA512', label: 'SHA512' },
        ],
      },
      { key: 'digits', label: 'Digits', type: 'select', default: '6', options: [
        { value: '6', label: '6' },
        { value: '8', label: '8' },
      ] },
      { key: 'period', label: 'Period (seconds)', type: 'text', default: '30', keyboard: 'numeric', dependsOn: { key: 'otpType', is: 'totp' } },
      { key: 'counter', label: 'Counter', type: 'text', default: '0', keyboard: 'numeric', dependsOn: { key: 'otpType', is: 'hotp' } },
    ],
  },
];

export const QR_TYPE_MAP = QR_TYPES.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {});

export function getQrType(id) {
  return QR_TYPE_MAP[id] ?? null;
}

/** Seed a form's value object from a type's field defaults. */
export function defaultValuesFor(typeId) {
  const type = getQrType(typeId);
  if (!type) return {};
  return type.fields.reduce((acc, f) => {
    if (f.default !== undefined) acc[f.key] = f.default;
    else if (f.type === 'switch') acc[f.key] = false;
    else acc[f.key] = '';
    return acc;
  }, {});
}

/** A field is shown only when its `dependsOn` guard passes. */
export function isFieldVisible(field, values) {
  const dep = field.dependsOn;
  if (!dep) return true;
  const current = values?.[dep.key];
  if (dep.is !== undefined) return current === dep.is;
  if (dep.not !== undefined) return current !== dep.not;
  return true;
}

/** Names of required fields that are visible but empty. */
export function missingRequiredFields(typeId, values) {
  const type = getQrType(typeId);
  if (!type) return [];
  return type.fields
    .filter((f) => f.required && isFieldVisible(f, values))
    .filter((f) => String(values?.[f.key] ?? '').trim() === '')
    .map((f) => f.label);
}

/** Turn a type id + form values into the string that gets encoded. */
export function buildPayload(typeId, values) {
  const type = getQrType(typeId);
  if (!type) return '';
  try {
    return type.build(values ?? {});
  } catch {
    return '';
  }
}
