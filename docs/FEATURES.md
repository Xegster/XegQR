# XegQR feature inventory

Every capability the app ships, and which dependency provides it.

The short version: **no library provides typed QR payloads.** Every encoder
surveyed — `qrcode`, `qr-code-styling`, `react-native-qrcode-styled`, ZXing,
libqrencode, `endroid/qr-code`, and the hosted APIs (goqr.me, QRickit, QR Code
Monkey) — takes a finished string and draws it. The "solution types" that
commercial platforms charge for are string templating. XegQR implements them in
[`src/utils/qrPayloads.js`](../src/utils/qrPayloads.js), which is why it can
offer the full catalogue with no backend, no API key, and no per-scan fee.

## Dependencies

| Package | Role |
|---|---|
| `react-native-qrcode-styled` | Primary renderer. SVG-based styled symbols on native and web. |
| `qrcode` (soldair) | Encoder-level facts: module count, version, capacity errors. Also the plain PNG/SVG fallback path. |
| `react-native-svg` | The SVG primitives both of the above draw into; also the frame chrome and the icon set. |
| `expo-camera` | Scanning. Platform-native decoders (ZXing on Android, Vision on iOS), so no separate decode library. |
| `expo-image-picker` | Choosing logo images. |
| `expo-sqlite` / IndexedDB | Local storage — native and web respectively. |
| `expo-linear-gradient` | Bento tile and panel gradients (UI only, not the codes). |

## 1. Content types — 21 types, all built in-app

Provided by: **XegQR's own `qrPayloads.js`**. No dependency supplies any of these.

| Type | Format emitted | Notes |
|---|---|---|
| Website | `https://…` | Adds `https://` to a bare domain |
| Plain text | raw | Any string |
| Wi-Fi | `WIFI:T:…;S:…;P:…;H:…;;` | WPA/WPA2/WPA3, WEP, open; hidden flag; delimiters escaped |
| Contact card | vCard 3.0 | Name, org, title, 4 phone types, email, URL, full address, birthday, note |
| MeCard | `MECARD:…` | Compact contact; the format Android's camera has always handled best |
| Email | `mailto:` | To, cc, bcc, subject, body |
| SMS | `SMSTO:number:message` | Pre-filled message |
| Phone call | `tel:` | Trunk-prefix aware normalising |
| Location | `geo:lat,lon[,alt]` | Optional place label via `?q=` |
| Calendar event | iCalendar `VEVENT` | Timed or all-day, location, organiser, description, URL |
| Crypto | BIP-21 URI | Bitcoin, Ethereum, Litecoin, Dogecoin, Monero, Bitcoin Cash; amount, label, message |
| Bank transfer | EPC069-12 GiroCode | SEPA scan-to-pay; fixed positional field order |
| PayPal | `paypal.me/user/amountCUR` | |
| WhatsApp | `wa.me/number?text=` | |
| Telegram | `t.me/handle` | |
| Zoom | `zoom.us/j/id?pwd=` | |
| Social profile | 12 networks | Instagram, X, Facebook, LinkedIn, TikTok, YouTube, GitHub, Snapchat, Pinterest, Reddit, Discord, Twitch |
| App download | Play / App Store / smart link | |
| Bookmark | `MEBKM:` | Titled link |
| FaceTime | `facetime:` / `facetime-audio:` | |
| Authenticator | `otpauth://` | TOTP and HOTP, SHA1/256/512, 6 or 8 digits, period or counter |

Escaping is per-format and load-bearing: WiFi/MeCard escape `\ ; , : "`;
vCard/iCal escape `\ ; ,` and newlines. An unescaped `;` in a Wi-Fi password
produces a code that silently joins the wrong network — covered by tests.

## 2. Visual customisation

| Feature | Provided by | Detail |
|---|---|---|
| Foreground colour | `react-native-qrcode-styled` | Any hex |
| Background colour | XegQR (SVG rect) | Drawn into the symbol so exports carry it |
| Gradients | `react-native-qrcode-styled` | Linear and radial, 6 presets plus custom start/end |
| Module shapes | `react-native-qrcode-styled` | 9: square, rounded, extra-rounded, dots, classy, classy-rounded, liquid, cut-corner, diamond |
| Eye frame shape | `react-native-qrcode-styled` | 6: square, rounded, circle, leaf, teardrop, cut |
| Eye centre shape | `react-native-qrcode-styled` | Same 6, set independently |
| Eye colours | `react-native-qrcode-styled` | Frame and centre independently, or inherit from the body |
| Logo embedding | `react-native-qrcode-styled` | Size 8–40%, padding, and module clearing behind it |
| Frames with a caption | **XegQR** | 6 styles: none, caption above, caption below, outline, card, speech bubble — the renderer has no frame support, so these are drawn as SVG inside the same `<svg>` (see below) |
| Error correction | `qrcode` via renderer | L / M / Q / H, with a prompt to raise it when a logo needs it |
| Size and quiet zone | `react-native-qrcode-styled` + XegQR | 140–520px render size, 0–48 quiet zone |
| Contrast checking | **XegQR** | WCAG ratio; warns below 3:1, which scanners struggle with |

**Why frames are drawn inside the SVG:** `toDataURL` captures only the `<svg>`
element. Wrapping the code in React Native views would look identical on screen
and then silently drop the frame from every export.

## 3. Export and sharing

| Feature | Native | Web |
|---|---|---|
| PNG | `react-native-svg`'s `toDataURL` → `expo-file-system` → `expo-sharing` | `XMLSerializer` → canvas raster → download |
| SVG | Not available — the native renderer cannot return its markup | `XMLSerializer` → download |
| Copy payload | `expo-clipboard` | `expo-clipboard` |

Exports render at 3× the on-screen size.

## 4. Scanning

Provided by **`expo-camera`**, using the platform's own decoder. Available on
Android and iOS unconditionally; on web it needs the browser's `BarcodeDetector`
(Chrome and Edge have it, Firefox and Safari do not), and the app says so
plainly instead of showing a camera that never fires.

## 5. Local storage

| Feature | Native | Web |
|---|---|---|
| Saved codes | `expo-sqlite` | IndexedDB |
| Cached logo images | `expo-sqlite` (data URIs) | IndexedDB |
| Settings | AsyncStorage | AsyncStorage (localStorage) |

IndexedDB rather than expo-sqlite's web build, which needs `SharedArrayBuffer`
and therefore COOP/COEP headers a static host may not allow.

**The size rule:** an over-limit image is still fully usable for the code being
made right now — only *caching* it is skipped. Defaults are 2 MB per image and
50 MB total, both adjustable in settings. When the total is reached, the
least-recently-used images are evicted rather than the new pick refused.

## 6. Deliberately not included

| Feature | Where it exists | Why not here |
|---|---|---|
| Dynamic QR (editable destination) | Uniqode, QR Tiger | Needs a hosted redirect service and an account |
| Scan analytics | Uniqode, QR Tiger | Same — requires a server and tracking |
| Password protection / expiry | Uniqode enterprise tiers | Same |
| Bulk CSV generation | QR Code Monkey paid, Uniqode | Possible offline later; no backend needed for it |
| Hosted generation APIs | goqr.me, QRickit, QR Code Monkey | Rate-limited network calls for something done locally in microseconds; would also send payloads (Wi-Fi passwords, OTP secrets) to a third party |

That last point is the reasoning behind the whole architecture: everything is
generated on-device, so nothing sensitive ever leaves it.
