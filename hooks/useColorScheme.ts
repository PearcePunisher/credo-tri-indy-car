import { useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLOR_SCHEME_KEY = 'user-color-scheme';

export function useColorScheme() {
  const systemColorScheme = useRNColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light'); // Default to light
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadStoredColorScheme();
  }, []);

  const loadStoredColorScheme = async () => {
    try {
      const storedScheme = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
      if (storedScheme === 'light' || storedScheme === 'dark') {
        setColorScheme(storedScheme);
      } else {
        // If no stored preference, default to light mode
        setColorScheme('light');
      }
    } catch (error) {
      console.error('Error loading color scheme:', error);
      setColorScheme('light'); // Default to light on error
    } finally {
      setIsLoaded(true);
    }
  };

  const toggleColorScheme = async () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newScheme);
    try {
      await AsyncStorage.setItem(COLOR_SCHEME_KEY, newScheme);
    } catch (error) {
      console.error('Error saving color scheme:', error);
    }
  };

  const setColorSchemePreference = async (scheme: 'light' | 'dark') => {
    setColorScheme(scheme);
    try {
      await AsyncStorage.setItem(COLOR_SCHEME_KEY, scheme);
    } catch (error) {
      console.error('Error saving color scheme:', error);
    }
  };

  return {
    colorScheme: isLoaded ? colorScheme : 'light', // Return light while loading
    toggleColorScheme,
    setColorSchemePreference,
    isLoaded,
  };
}
