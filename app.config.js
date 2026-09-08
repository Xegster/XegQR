module.exports = {
  expo: {
    name: "XegQR",
    slug: "xegqr",
    version: "0.1.0",
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
    ],
    runtimeVersion: {
      policy: "appVersion",
    },
    experiments: {
      typedRoutes: false,
    },
    extra: {
      appVersion: "0.1.0",
      router: {},
    },
    owner: "xegster",
  },
};
