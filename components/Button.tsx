import React from 'react';
import { TouchableOpacity, Text, ViewStyle, StyleSheet } from 'react-native';
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
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  const backgroundColor = outlined
    ? 'transparent'
    : colors.tint;

  const borderColor = outlined
    ? colors.tint
    : 'transparent';

  const textColor = outlined
    ? colors.tint
    : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
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
