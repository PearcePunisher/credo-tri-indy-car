import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const COLOR_SCHEME_KEY = 'user-color-scheme';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const systemColorScheme = useRNColorScheme();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light'); // Start with light, will be updated

  useEffect(() => {
    loadStoredColorScheme();
  }, []);

  // Separate effect to handle system color scheme changes
  useEffect(() => {
    if (hasHydrated && systemColorScheme) {
      checkForSystemPreferenceUpdate();
    }
  }, [systemColorScheme, hasHydrated]);

  const checkForSystemPreferenceUpdate = () => {
    try {
      const storedScheme = localStorage.getItem(COLOR_SCHEME_KEY);
      if (!storedScheme) {
        // No stored preference, follow system
        const devicePreference = systemColorScheme || 'light';
        console.log('🎨 [Web] Following system preference:', devicePreference);
        setColorScheme(devicePreference);
      }
    } catch (error) {
      console.error('Error checking system preference:', error);
    }
  };

  const loadStoredColorScheme = () => {
    try {
      console.log('🎨 [Web] Loading stored color scheme, system preference:', systemColorScheme);
      const storedScheme = localStorage.getItem(COLOR_SCHEME_KEY);
      if (storedScheme === 'light' || storedScheme === 'dark') {
        console.log('📱 [Web] Found stored preference:', storedScheme);
        setColorScheme(storedScheme);
      } else {
        // If no stored preference, follow system/device preference
        const devicePreference = systemColorScheme || 'light';
        console.log('🌟 [Web] No stored preference, using system preference:', devicePreference);
        setColorScheme(devicePreference);
      }
    } catch (error) {
      console.error('Error loading color scheme:', error);
      // Default to system preference on error
      setColorScheme(systemColorScheme || 'light');
    } finally {
      setHasHydrated(true);
    }
  };

  const toggleColorScheme = () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    console.log('🎨 [Web] Toggling color scheme from', colorScheme, 'to', newScheme);
    setColorScheme(newScheme);
    try {
      localStorage.setItem(COLOR_SCHEME_KEY, newScheme);
      console.log('✅ [Web] Color scheme saved to storage:', newScheme);
    } catch (error) {
      console.error('Error saving color scheme:', error);
    }
  };

  const setColorSchemePreference = (scheme: 'light' | 'dark') => {
    console.log('🎨 [Web] Setting color scheme preference to:', scheme);
    setColorScheme(scheme);
    try {
      localStorage.setItem(COLOR_SCHEME_KEY, scheme);
      console.log('✅ [Web] Color scheme preference saved to storage:', scheme);
    } catch (error) {
      console.error('Error saving color scheme:', error);
    }
  };

  const clearColorSchemePreference = () => {
    console.log('🗑️ [Web] Clearing color scheme preference - will follow system');
    try {
      localStorage.removeItem(COLOR_SCHEME_KEY);
      const devicePreference = systemColorScheme || 'light';
      setColorScheme(devicePreference);
      console.log('✅ [Web] Color scheme preference cleared, following system:', devicePreference);
    } catch (error) {
      console.error('Error clearing color scheme preference:', error);
    }
  };

  if (hasHydrated) {
    return {
      colorScheme: colorScheme,
      systemColorScheme,
      toggleColorScheme,
      setColorSchemePreference,
      clearColorSchemePreference,
      isLoaded: true,
    };
  }

  return {
    colorScheme: (systemColorScheme || 'light') as 'light' | 'dark',
    systemColorScheme,
    toggleColorScheme,
    setColorSchemePreference,
    clearColorSchemePreference,
    isLoaded: false,
  };
}
