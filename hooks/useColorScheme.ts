import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for persistence
const COLOR_SCHEME_KEY = 'user-color-scheme';

// Module-level global state so ALL components share one theme instance
let globalColorScheme: 'light' | 'dark' = 'light';
let hasLoadedFromStorage = false;
const listeners = new Set<React.Dispatch<React.SetStateAction<'light' | 'dark'>>>();
let loadingPromise: Promise<void> | null = null;

async function loadOnce() {
  if (hasLoadedFromStorage) return;
  if (!loadingPromise) {
    loadingPromise = (async () => {
      try {
        const stored = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
        if (stored === 'light' || stored === 'dark') {
          globalColorScheme = stored;
        } else {
          globalColorScheme = 'light'; // explicit default
        }
      } catch (e) {
        globalColorScheme = 'light';
      } finally {
        hasLoadedFromStorage = true;
        // Notify all subscribers that initial load finished
        listeners.forEach(l => l(globalColorScheme));
      }
    })();
  }
  await loadingPromise;
}

function notifyAll() {
  listeners.forEach(l => l(globalColorScheme));
}

async function persist(scheme: 'light' | 'dark') {
  try {
    await AsyncStorage.setItem(COLOR_SCHEME_KEY, scheme);
  } catch (e) {
    // non-fatal
  }
}

export function useColorScheme() {
  const [scheme, setScheme] = useState<'light' | 'dark'>(globalColorScheme);
  const [isLoaded, setIsLoaded] = useState<boolean>(hasLoadedFromStorage);

  useEffect(() => {
    listeners.add(setScheme);
    if (!hasLoadedFromStorage) {
      loadOnce().then(() => setIsLoaded(true));
    }
    return () => {
      listeners.delete(setScheme);
    };
  }, []);

  const toggleColorScheme = async () => {
    globalColorScheme = globalColorScheme === 'light' ? 'dark' : 'light';
    notifyAll();
    await persist(globalColorScheme);
  };

  const setColorSchemePreference = async (newScheme: 'light' | 'dark') => {
    if (globalColorScheme === newScheme) return;
    globalColorScheme = newScheme;
    notifyAll();
    await persist(globalColorScheme);
  };

  return {
    colorScheme: scheme,
    toggleColorScheme,
    setColorSchemePreference,
    isLoaded,
  };
}
