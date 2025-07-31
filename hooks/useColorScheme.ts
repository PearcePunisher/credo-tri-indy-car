import { useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLOR_SCHEME_KEY = 'user-color-scheme';

export function useColorScheme() {
  const systemColorScheme = useRNColorScheme();
  console.log('🎨 Hook called - systemColorScheme from RN:', systemColorScheme);
  
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light'); 
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasStoredPreference, setHasStoredPreference] = useState<boolean | null>(null);

  useEffect(() => {
    loadStoredColorScheme();
  }, []); 

  // Separate effect to handle system color scheme changes
  useEffect(() => {
    console.log('🎨 System color scheme effect triggered:', { 
      systemColorScheme, 
      isLoaded, 
      hasStoredPreference,
      currentColorScheme: colorScheme 
    });
    
    // If system color scheme becomes available and we don't have a stored preference
    if (systemColorScheme && isLoaded && hasStoredPreference === false) {
      console.log('🌟 System preference available, updating from', colorScheme, 'to', systemColorScheme);
      setColorScheme(systemColorScheme);
    }
  }, [systemColorScheme, isLoaded, hasStoredPreference]);

  const checkForSystemPreferenceUpdate = async () => {
    try {
      const storedScheme = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
      if (!storedScheme && systemColorScheme) {
        // No stored preference, follow system
        console.log('🎨 Following system preference:', systemColorScheme);
        setColorScheme(systemColorScheme);
      }
    } catch (error) {
      console.error('Error checking system preference:', error);
    }
  };

  const loadStoredColorScheme = async () => {
    try {
      console.log('🎨 Loading stored color scheme, system preference:', systemColorScheme);
      const storedScheme = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
      console.log('🎨 Raw stored value:', storedScheme);
      
      if (storedScheme === 'light' || storedScheme === 'dark') {
        console.log('📱 Found stored preference:', storedScheme);
        setColorScheme(storedScheme);
        setHasStoredPreference(true);
      } else {
        console.log('🌟 No stored preference found');
        setHasStoredPreference(false);
        
        // If no stored preference and system preference is available, use it
        if (systemColorScheme) {
          console.log('🌟 Using system preference:', systemColorScheme);
          setColorScheme(systemColorScheme);
        } else {
          console.log('⚠️ No system preference available yet, defaulting to light');
          setColorScheme('light');
        }
      }
    } catch (error) {
      console.error('Error loading color scheme:', error);
      setHasStoredPreference(false);
      // Default to system preference on error, or light if not available
      setColorScheme(systemColorScheme || 'light');
    } finally {
      setIsLoaded(true);
    }
  };

  const toggleColorScheme = async () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    console.log('🎨 Toggling color scheme from', colorScheme, 'to', newScheme);
    setColorScheme(newScheme);
    try {
      await AsyncStorage.setItem(COLOR_SCHEME_KEY, newScheme);
      console.log('✅ Color scheme saved to storage:', newScheme);
    } catch (error) {
      console.error('Error saving color scheme:', error);
    }
  };

  const setColorSchemePreference = async (scheme: 'light' | 'dark') => {
    console.log('🎨 Setting color scheme preference to:', scheme);
    setColorScheme(scheme);
    try {
      await AsyncStorage.setItem(COLOR_SCHEME_KEY, scheme);
      console.log('✅ Color scheme preference saved to storage:', scheme);
    } catch (error) {
      console.error('Error saving color scheme:', error);
    }
  };

  const clearColorSchemePreference = async () => {
    console.log('🗑️ Clearing color scheme preference - will follow system');
    try {
      await AsyncStorage.removeItem(COLOR_SCHEME_KEY);
      const devicePreference = systemColorScheme || 'light';
      setColorScheme(devicePreference);
      console.log('✅ Color scheme preference cleared, following system:', devicePreference);
    } catch (error) {
      console.error('Error clearing color scheme preference:', error);
    }
  };

  return {
    colorScheme: isLoaded ? colorScheme : (systemColorScheme || 'light'), 
    systemColorScheme, 
    hasStoredPreference,
    toggleColorScheme,
    setColorSchemePreference,
    clearColorSchemePreference,
    isLoaded,
  };
}
