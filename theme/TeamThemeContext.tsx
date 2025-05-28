// theme/TeamThemeContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Define the shape of the theme object, which includes four color properties.
type TeamTheme = {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
};

// Default theme values used before fetching from the API or if fetch fails.
const defaultTheme: TeamTheme = {
  primary: '#000000',
  secondary: '#333333',
  tertiary: '#ffffff',
  quaternary: '#cccccc',
};

// Create a React context to provide the theme throughout the app.
const TeamThemeContext = createContext<TeamTheme>(defaultTheme);

// Provider component that fetches and supplies the team theme to its children.
export const TeamThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // State to hold the current theme, initialized with the default.
  const [theme, setTheme] = useState<TeamTheme>(defaultTheme);

  useEffect(() => {
    // Function to fetch the team theme from the remote API.
    const fetchTheme = async () => {
      try {
        // Fetch team details, including team colors, from the API.
        const res = await fetch("https://timely-actor-10dfb03957.strapiapp.com/api/team-details?populate=team_colors&fields[0]=team_name");
        const json = await res.json();

        // Get the first team item from the response.
        const firstItem = json.data?.[0];
        // Extract the team_colors object.
        const colors = firstItem?.team_colors;

        // If colors are not found, log a warning and exit.
        if (!colors) {
          console.warn("No team colors found in response:", JSON.stringify(json, null, 2));
          return;
        }

        // Construct a new theme object from the fetched colors.
        const newTheme: TeamTheme = {
          primary: colors.team_primary_color,
          secondary: colors.team_secondary_color,
          tertiary: colors.team_tertiary_color,
          quaternary: colors.team_quaternary_color,
        };

        // Update the theme state with the new theme.
        setTheme(newTheme);

        // If running on web, set CSS variables for the theme colors.
        if (Platform.OS === 'web') {
          document.documentElement.style.setProperty('--team-primary', newTheme.primary);
          document.documentElement.style.setProperty('--team-secondary', newTheme.secondary);
          document.documentElement.style.setProperty('--team-tertiary', newTheme.tertiary);
          document.documentElement.style.setProperty('--team-quaternary', newTheme.quaternary);
        }
      } catch (err) {
        // Log any errors that occur during fetch or processing.
        console.error("Failed to load team theme:", err);
      }
    };

    // Call the fetchTheme function once when the component mounts.
    fetchTheme();
  }, []);

  // Provide the current theme to all children components via context.
  return (
    <TeamThemeContext.Provider value={theme}>
      {children}
    </TeamThemeContext.Provider>
  );
};

// Export the context for use in other components.
export default TeamThemeContext;
