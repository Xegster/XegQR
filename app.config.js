module.exports = {
  expo: {
    name: "XegQR",
    slug: "xegqr",
    version: "0.2.2",
    orientation: "portrait",
    assetBundlePatterns: ["assets/**/*"],
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    scheme: "xegqr",
    platforms: ["ios", "android", "web"],
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#121212",
    },
    android: {
      package: "com.xegster.xegqr",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
        backgroundColor: "#121212",
      },
      edgeToEdgeEnabled: true,
      // expo-brightness is auto-applied by prebuild and asks for this. XegQR only
      // brightens its own window while a code is on screen, which needs no
      // permission, so the system-wide one is stripped from the manifest.
      blockedPermissions: ["android.permission.WRITE_SETTINGS"],
    },
    ios: {
      bundleIdentifier: "com.xegster.xegqr",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/favicon.png",
      name: "XegQR",
      shortName: "XegQR",
      description:
        "Create, scan and save QR codes. Everything stays on your device.",
      themeColor: "#121212",
      backgroundColor: "#121212",
    },
    plugins: [
      "expo-router",
      "expo-sqlite",
      [
        "expo-camera",
        {
          cameraPermission:
            "Allow XegQR to use the camera to scan a QR code.",
          recordAudioAndroid: false,
        },
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow XegQR to save QR codes to your photos.",
          savePhotosPermission: "Allow XegQR to save QR codes to your photos.",
          isAccessMediaLocationEnabled: false,
        },
      ],
      [
        // A home-screen tile that opens one saved code full screen. One provider,
        // 1x1 and not resizable: the tile is an icon. See src/widgets/ and
        // docs/WIDGET-PLAN.md.
        "react-native-android-widget",
        {
          widgets: [
            {
              name: "QrTile",
              label: "XegQR code",
              description: "An icon that opens one saved code, ready to scan",
              minWidth: "40dp",
              minHeight: "40dp",
              targetCellWidth: 1,
              targetCellHeight: 1,
              resizeMode: "none",
              widgetFeatures: "reconfigurable",
              updatePeriodMillis: 0,
            },
          ],
        },
      ],
    ],
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/e0a13e09-1c6f-4963-a2f9-2e96fd4c5938",
    },
    experiments: {
      typedRoutes: false,
    },
    extra: {
      appVersion: "0.2.8",
      router: {},
      eas: {
        projectId: "e0a13e09-1c6f-4963-a2f9-2e96fd4c5938",
      },
    },
    owner: "xegster",
  },
};
