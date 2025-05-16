import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function VIPTile({ icon, label, onPress }: { icon: string, label: string, onPress: () => void }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        { backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background }
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={40}
        color={isDarkMode ? Colors.dark.text : Colors.light.text}
      />
      <Text
        style={[
          styles.label,
          { color: isDarkMode ? Colors.dark.text : Colors.light.text }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 10,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: 8,
    textAlign: 'center',
  },
});
