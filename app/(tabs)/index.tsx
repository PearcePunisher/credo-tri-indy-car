// app/(tabs)/vip.tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import VIPTile from '@/components/VIPTile';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';

const router = useRouter();

export default function VIPHomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0C0F" }}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>PIT LANE CLUB</Text>
      <Text style={styles.sub}>The ultimate individual VIP Hospitality experience</Text>

      <View style={styles.grid}>
        <VIPTile icon="qr-code" label="My ID" onPress={() => {}} />
        <VIPTile icon="door-open" label="Welcome" onPress={() => {}} />
        <VIPTile icon="flash" label="Experience" onPress={() => {}} />
        <VIPTile icon="calendar" label="Weekend Schedule" onPress={() => {}} />
        <VIPTile icon="location" label="Venue Directions" onPress={() => {}} />
        <VIPTile icon="car-sport" label="Track Info" onPress={() => {}} />
        <VIPTile icon="people" label="The Team" onPress={() => router.push('/team')} />
        <VIPTile icon="car" label="The Car" onPress={() => {}} />
        <VIPTile icon="calendar-clear" label="2025 Indy Car Calendar" onPress={() => {}} />
        <VIPTile icon="help-circle" label="FAQ’s" onPress={() => {}} />
        <VIPTile icon="chatbubbles" label="Feedback" onPress={() => {}} />
        <VIPTile icon="log-out" label="Log Out" onPress={() => {}} />
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#000',
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sub: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
});
