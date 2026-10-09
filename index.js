// Custom entry: expo-router's own, plus the Android widget registrations.
// Metro resolves ./src/widgets/register to register.android.js on Android and to
// the empty register.js everywhere else, so web and iOS never load the widget
// library. Keep this file to these two lines.
import "expo-router/entry";
import "./src/widgets/register";
