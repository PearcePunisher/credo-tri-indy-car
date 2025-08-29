import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function BlurTabBarBackground() {
  const { colorScheme } = useColorScheme();
  // Force blur tint to follow app theme instead of underlying system appearance
  const blurTint: any = colorScheme === 'light' ? 'light' : 'dark';
  return (
    <BlurView
      tint={blurTint}
      intensity={80}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function useBottomTabOverflow() {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}
