module.exports = {
  expo: {
    name: "XegQR",
    slug: "xegqr",
    version: "0.2.1",
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
        // Home-screen tiles that open one saved code full screen. Two providers
        // so each size gets its own entry in the launcher's widget picker. See
        // src/widgets/ and docs/WIDGET-PLAN.md.
        "react-native-android-widget",
        {
          widgets: [
            {
              name: "QrTileCompact",
              label: "XegQR code (small)",
              description: "A tile that opens one saved code, ready to scan",
              minWidth: "110dp",
              minHeight: "40dp",
              targetCellWidth: 2,
              targetCellHeight: 1,
              resizeMode: "horizontal|vertical",
              widgetFeatures: "reconfigurable",
              updatePeriodMillis: 0,
            },
            {
              name: "QrTileLarge",
              label: "XegQR code (large)",
              description: "A large tile that opens one saved code, ready to scan",
              minWidth: "250dp",
              minHeight: "110dp",
              targetCellWidth: 4,
              targetCellHeight: 2,
              resizeMode: "horizontal|vertical",
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
      appVersion: "0.2.1",
      router: {},
      eas: {
        projectId: "e0a13e09-1c6f-4963-a2f9-2e96fd4c5938",
      },
    },
    owner: "xegster",
  },
};
