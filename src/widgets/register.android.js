import {
  registerWidgetTaskHandler,
  registerWidgetConfigurationScreen,
} from "react-native-android-widget";
import { widgetTaskHandler } from "./widgetTaskHandler";
import WidgetConfigScreen from "./WidgetConfigScreen";

// Imported from the app's entry file (index.js). The task handler serves the
// headless widget events; the configuration screen is its own React root,
// shown in a separate activity when a tile is added or long-pressed to edit.
registerWidgetTaskHandler(widgetTaskHandler);
registerWidgetConfigurationScreen(WidgetConfigScreen);
