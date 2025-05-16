// components/TeamBackground.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type TeamBackgroundProps = {
  primaryColor: string;   // e.g. '#bf3931'
  secondaryColor: string; // e.g. '#591B1B'
  children?: React.ReactNode;
};

const TeamBackground: React.FC<TeamBackgroundProps> = ({
  primaryColor,
  secondaryColor,
  children,
}) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.opacityWrapper}>
        <LinearGradient
          colors={[primaryColor, secondaryColor]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  opacityWrapper: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1, // Set opacity to 100%
  },
});

export default TeamBackground;
