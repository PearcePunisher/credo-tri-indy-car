/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#cc1e4a';
const tintColorDark = '#ffc906';

export const Colors = {
  light: {
    text: "#222222",              // Dark grey for primary text
    textOnGreen: "#ffffff",       // White for primary text on green background
    background: "#fff",           // White background
    tint: "#E31837",              // Green for accents (buttons, links)
    icon: "#222222",              // Dark grey for icons
    tabIconDefault: "#2b2b2b",    // Light grey for inactive tab icons
    tabIconSelected: "#E31837",   // Green for active tab icons
    secondaryText: "#2b2b2b",     // Light grey for secondary text
    card: "#f7f7f7",              // Optional: very light grey for cards
    border: "#e0e0e0",            // Optional: subtle border color
    error: "#ff0000",             // Red for error messages
  },
  dark: {
    text: "#fff",                 // White for primary text
    textOnGreen: "#000000",       // Black for primary text on green background
    background: "#000",           // Black background
    tint: "#E31837",              // Green for accents
    icon: "#fff",                 // White for icons
    tabIconDefault: "#2b2b2b",    // Light grey for inactive tab icons
    tabIconSelected: "#E31837",   // Green for active tab icons
    secondaryText: "#919391",     // Light grey for secondary text
    card: "#2b2b2b",              // Light grey for cards
    border: "#333",               // Optional: subtle border color
    error: "#ff0000",             // Red for error messages
  },
};
