# XegQR

A QR code generator that runs entirely on your device. One Expo codebase builds
the Android app and the website; there is no account, no server, and nothing you
type ever leaves the device.

21 code types, full visual styling (shapes, gradients, logos, captioned frames),
light and dark themes, and local caching of the images and codes you want to
reuse.

See [docs/FEATURES.md](docs/FEATURES.md) for the complete feature inventory and
which dependency provides each piece.

## Stack

Matches the NetXegManager and PoGoManager projects:

- **Expo SDK 54** + React Native 0.81 + React 19, **Expo Router 6** (file-based routing)
- **Plain JavaScript**, no TypeScript
- **Zustand** for state
- React Native `StyleSheet` with a context-based theme — no CSS framework
- **npm**

The one deliberate divergence: no Firebase. Both sibling apps use Firebase Auth
and Firestore; XegQR has no login, so it has no backend at all.

## Running it

```bash
npm install
```

```bash
npx expo start --web
```

```bash
npx expo run:android
```

```bash
npm test
```

## Building for the web

```bash
npx expo export -p web
```

Output lands in `dist/` as a static bundle — deployable to Firebase Hosting
first, and portable to Netlify later with no code changes.

## Layout

```
app/                     expo-router routes
  index.js               bento grid of code types
  generate/[type].js     one generator screen for all 21 types
  saved.js               saved code library
  scan.js                camera scanner
  settings.js            theme, defaults, cache limits
src/
  components/            reusable UI (AppButton, BentoTile, Panel, QrPreview…)
    icons/QrIcons.js     hand-rolled SVG icon set
  theme/                 ThemeProvider + gradient palette
  stores/                Zustand stores
  db/                    store.native.js (SQLite) / store.web.js (IndexedDB)
  services/              encoding, export, image cache
  utils/                 payload builders, style resolution, colour helpers
docs/FEATURES.md         full feature/provider matrix
```

## Notes for future work

- **Adding a code type** is a data change in `src/utils/qrPayloads.js`. The
  `fields` schema drives the form, so no new screen is needed.
- **Swapping the QR renderer** means rewriting `resolveQrProps` in
  `src/utils/qrStyleOptions.js` and little else — that function is the only
  place that knows the renderer's prop names.
- **`scopeSvgIds`** exists because the renderer hardcodes its gradient element
  ids, which collide when two gradient codes share a page on the web. Do not
  remove it without checking the saved-codes list with several gradient codes.
- **iOS** needs no code changes — it is already an Expo target; it just needs a
  build and a developer account.
