// theme/TeamThemeContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type TeamTheme = {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
};

const defaultTheme: TeamTheme = {
  primary: '#000000',
  secondary: '#333333',
  tertiary: '#ffffff',
  quaternary: '#cccccc',
};

const TeamThemeContext = createContext<TeamTheme>(defaultTheme);

export const TeamThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<TeamTheme>(defaultTheme);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await fetch("https://timely-actor-10dfb03957.strapiapp.com/api/team-details?populate=team_colors&fields[0]=team_name");
        const json = await res.json();

        const firstItem = json.data?.[0];
        const colors = firstItem?.team_colors;

        if (!colors) {
          console.warn("No team colors found in response:", JSON.stringify(json, null, 2));
          return;
        }

        const newTheme: TeamTheme = {
          primary: colors.team_primary_color,
          secondary: colors.team_secondary_color,
          tertiary: colors.team_tertiary_color,
          quaternary: colors.team_quaternary_color,
        };

        setTheme(newTheme);

        if (Platform.OS === 'web') {
          document.documentElement.style.setProperty('--team-primary', newTheme.primary);
          document.documentElement.style.setProperty('--team-secondary', newTheme.secondary);
          document.documentElement.style.setProperty('--team-tertiary', newTheme.tertiary);
          document.documentElement.style.setProperty('--team-quaternary', newTheme.quaternary);
        }
      } catch (err) {
        console.error("Failed to load team theme:", err);
      }
    };

    fetchTheme();
  }, []);

  return (
    <TeamThemeContext.Provider value={theme}>
      {children}
    </TeamThemeContext.Provider>
  );
};

export default TeamThemeContext;
