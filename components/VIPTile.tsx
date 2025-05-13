import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VIPTile({ icon, label, onPress }: { icon: string, label: string, onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress}>
      <Ionicons name={icon as any} size={28} color="white" />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 10,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
});
