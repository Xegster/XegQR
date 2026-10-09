# XegQR

A QR code generator that runs entirely on your device. One Expo codebase builds
the Android app and the website; there is no account, no server, and nothing you
type ever leaves the device.

21 code types, full visual styling (shapes, gradients, logos, captioned frames),
light and dark themes, and local caching of the images and codes you want to
reuse. On Android, a home-screen tile opens any saved code full screen at full
brightness, ready to be scanned.

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

The Android home-screen widget is a native module, so it needs a development or
EAS build (`npx expo run:android`); it does not exist in Expo Go. Its handlers
are registered from the custom entry file `index.js`, which then loads
expo-router as usual.

## Building for the web

```bash
npx expo export -p web
```

Output lands in `dist/` as a static bundle.

## Web hosting (EAS)

One-time setup, interactively, from a machine logged into the project's Expo
account:

```bash
npx eas-cli deploy
```

The first run asks you to link the project to EAS Hosting and pick a
subdomain (e.g. `xegqr`) — after that, deploys are non-interactive.

```bash
npx eas-cli deploy --alias preview
```

Deploys the current `dist/` build to `preview--<subdomain>.expo.app` without
touching production. Pushing to `develop` does this automatically via
`.github/workflows/eas-hosting-deploy.yml`, reusing the same `EXPO_TOKEN`
secret as the Android OTA workflow.

```bash
npx eas-cli deploy --prod
```

Promotes a build to the production URL, `<subdomain>.expo.app`. Run
`npx expo export -p web` first — `eas deploy` uploads whatever is already in
`dist/`, it does not build it for you.

## Android preview distribution (EAS)

```bash
npx eas-cli build --platform android --profile preview
```

Builds an installable preview APK and prints a download link + QR code when
done — scan it on the phone to install.

```bash
npx eas-cli update --channel preview --message "My update message!"
```

Publishes an OTA update to the `preview` channel without a full rebuild —
force-close and reopen the app on the phone to pick it up. Pushing to
`develop` does this automatically via `.github/workflows/eas-update.yml`.

> OTA updates only apply when `expo.appVersion` matches the version baked
> into the installed APK. If you bump the app version, rebuild and reinstall
> the preview APK before OTA updates will work again.

## Layout

```
index.js                 entry: expo-router, plus the Android widget registrations
app/                     expo-router routes
  index.js               bento grid of code types
  generate/[type].js     one generator screen for all 21 types
  saved.js               saved code library
  show/[id].js           one code full screen, brightness boosted (widget tap target)
  widget/[id].js         in-app setup for a home-screen tile (Android)
  scan.js                camera scanner
  settings.js            theme, defaults, cache limits, widget help
src/
  components/            reusable UI (AppButton, BentoTile, Panel, QrPreview…)
    icons/QrIcons.js     hand-rolled SVG icon set
  theme/                 ThemeProvider + gradient palette
  stores/                Zustand stores
  db/                    store.native.js (SQLite) / store.web.js (IndexedDB)
  services/              encoding, export, image cache, widget sync
  widgets/               Android home-screen tile: renderer, bindings, setup screen
  hooks/                 useBrightnessBoost
  utils/                 payload builders, style resolution, colour helpers
docs/FEATURES.md         full feature/provider matrix
docs/WIDGET-PLAN.md      home-screen widget design
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
  build and a developer account. The home-screen widget is Android-only; on
  iOS the widget code resolves to no-op `.js` twins of the `.android.js` files.
- **Widget code stays out of the web and iOS bundles** through platform files
  (`register`, `widgetSync`, `TilePreview` each have a `.android.js` and a
  plain `.js`). Import those by their bare name, never with the extension.
