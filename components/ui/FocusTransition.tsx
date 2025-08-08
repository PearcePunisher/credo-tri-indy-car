import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

type Variant = 'fade' | 'slide';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  durationIn?: number;
  durationOut?: number;
};

export default function FocusTransition({
  children,
  variant = 'fade',
  style,
  durationIn = 200,
  durationOut = 150,
}: Props) {
  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: durationIn,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        variant === 'slide'
          ? Animated.timing(translateX, {
              toValue: 0,
              duration: durationIn,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            })
          : Animated.delay(0),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: durationOut,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        variant === 'slide'
          ? Animated.timing(translateX, {
              toValue: 12,
              duration: durationOut,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            })
          : Animated.delay(0),
      ]).start();
    }
  }, [isFocused, opacity, translateX, variant, durationIn, durationOut]);

  return (
    <Animated.View
      style={[
        style,
        {
          flex: 1,
          opacity,
          transform: [{ translateX: variant === 'slide' ? translateX : 0 }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
