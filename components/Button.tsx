import React, { useMemo, useRef } from 'react';
import { TouchableOpacity, Text, ViewStyle, StyleSheet, Animated, Easing } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  outlined?: boolean;
  disabled?: boolean;
};

export const Button = ({
  children,
  onPress,
  style,
  outlined = false,
  disabled = false,
}: ButtonProps) => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const scale = useRef(new Animated.Value(1)).current;

  // Custom logic for background, text, and border based on color scheme and outlined
  let backgroundColor = 'black';
  let textColor = 'white';
  let borderColor = 'transparent';

  if (outlined) {
    backgroundColor = 'transparent';
    textColor = colors.tint;
    borderColor = colors.tint;
  } else if (colorScheme === 'dark') {
    backgroundColor = 'black';
    textColor = 'white';
    borderColor = colors.tint;
  } else if (colorScheme === 'light') {
    backgroundColor = 'black';
    textColor = 'white';
    borderColor = 'transparent';
  }

  const animateIn = useMemo(() => () => {
    Animated.timing(scale, {
      toValue: 0.98,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const animateOut = useMemo(() => () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 110,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={animateIn}
        onPressOut={animateOut}
        disabled={disabled}
        style={[
          styles.button,
          {
            backgroundColor,
            borderColor,
            opacity: disabled ? 0.6 : 1,
          },
          style,
          outlined && styles.outlined,
        ]}
        accessibilityRole="button"
      >
        <Text style={[styles.text, { color: textColor }]}>
          {children}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    minWidth: 80,
    minHeight: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 2,
  },
  outlined: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    
  },
});
