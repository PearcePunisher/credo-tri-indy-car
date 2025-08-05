/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#D30000';  // Firestone Red
const tintColorDark = '#D30000';   // Firestone Red

export const Colors = {
  light: {
    text: "#1a1a1a",              // Dark grey for primary text
    textOnRed: "#ffffff",         // White for primary text on red background
    background: "#ffffff",        // Clean white background
    tint: "#D30000",              // Firestone Red for accents (buttons, links)
    icon: "#1a1a1a",              // Dark grey for icons
    tabIconDefault: "#666666",    // Grey for inactive tab icons
    tabIconSelected: "#D30000",   // Firestone Red for active tab icons
    secondaryText: "#666666",     // Grey for secondary text
    card: "#f8f8f8",              // Very light grey for cards
    border: "#e0e0e0",            // Subtle border color
    error: "#cc0000",             // Darker red for error messages
    primary: "#D30000",           // Firestone Red primary
    secondary: "#1a1a1a",         // Dark grey secondary
  },
  dark: {
    text: "#ffffff",              // White for primary text
    textOnRed: "#ffffff",         // White for primary text on red background
    background: "#121212",        // Dark background
    tint: "#D30000",              // Firestone Red for accents
    icon: "#ffffff",              // White for icons
    tabIconDefault: "#666666",    // Grey for inactive tab icons
    tabIconSelected: "#D30000",   // Firestone Red for active tab icons
    secondaryText: "#cccccc",     // Light grey for secondary text
    card: "#1e1e1e",              // Dark grey for cards
    border: "#333333",            // Subtle border color
    error: "#ff3333",             // Lighter red for error messages in dark mode
    primary: "#D30000",           // Firestone Red primary
    secondary: "#ffffff",         // White secondary
  },
};
