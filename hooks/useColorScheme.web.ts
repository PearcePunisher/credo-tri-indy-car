import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light'); // Default to light

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemColorScheme = useRNColorScheme();

  const toggleColorScheme = () => {
    setColorScheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setColorSchemePreference = (scheme: 'light' | 'dark') => {
    setColorScheme(scheme);
  };

  if (hasHydrated) {
    return {
      colorScheme: colorScheme,
      toggleColorScheme,
      setColorSchemePreference,
      isLoaded: true,
    };
  }

  return {
    colorScheme: 'light' as const,
    toggleColorScheme,
    setColorSchemePreference,
    isLoaded: false,
  };
}
