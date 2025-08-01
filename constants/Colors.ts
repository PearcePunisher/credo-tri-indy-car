/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#FB4F14';  // Broncos Orange
const tintColorDark = '#FB4F14';   // Broncos Orange

export const Colors = {
  light: {
    text: "#002244",              // Broncos Navy for primary text
    textOnOrange: "#ffffff",      // White for primary text on orange background
    background: "#eeeeee",        // Light grey background
    tint: "#FB4F14",              // Broncos Orange for accents (buttons, links)
    icon: "#002244",              // Broncos Navy for icons
    tabIconDefault: "#666666",    // Grey for inactive tab icons
    tabIconSelected: "#FB4F14",   // Broncos Orange for active tab icons
    secondaryText: "#666666",     // Grey for secondary text
    card: "#f7f7f7",              // Very light grey for cards
    border: "#e0e0e0",            // Subtle border color
    error: "#ff0000",             // Red for error messages
    primary: "#FB4F14",           // Broncos Orange primary
    secondary: "#002244",         // Broncos Navy secondary
  },
  dark: {
    text: "#fff",                   // White for primary text
    textOnOrange: "#002244",      // Broncos Navy for primary text on orange background
    background: "#002244",        // Broncos Navy background
    tint: "#FB4F14",              // Broncos Orange for accents
    icon: "#fff",                   // White for icons
    tabIconDefault: "#666666",    // Grey for inactive tab icons
    tabIconSelected: "#FB4F14",   // Broncos Orange for active tab icons
    secondaryText: "#cccccc",     // Light grey for secondary text
    card: "#1a3a5c",              // Lighter navy for cards
    border: "#444444",            // Subtle border color
    error: "#ff0000",             // Red for error messages
    primary: "#FB4F14",           // Broncos Orange primary
    secondary: "#ffffff",         // White secondary
  },
};
