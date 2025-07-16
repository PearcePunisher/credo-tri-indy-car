import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, Linking, StyleSheet, Text, TouchableOpacity, View, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandLogo from '@/components/BrandLogo';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const isScanning = useRef(false); // prevent multiple triggers
  
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  // If permissions are loading
  if (!permission) return <View />;

  // If permissions are not granted
  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <BrandLogo style={styles.brand} />
        <View style={styles.permissionContainer}>
          <Text style={[styles.message, { color: colors.text }]}>We need your permission to show the camera</Text>
          <TouchableOpacity 
            style={[styles.permissionButton, { backgroundColor: colors.tint }]} 
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: colors.background }]}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Switch between front and back camera
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    setScannedData(null);
    setParsedData(null);
    isScanning.current = false;
  }

  // Handler for QR code detection
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (isScanning.current) return; // skip if already handled
    isScanning.current = true;

    if (data.startsWith('https://testing.com')) {
      Linking.openURL(data);
    } else {
      setScannedData(data);
      
      // Try to parse JSON data
      try {
        const jsonData = JSON.parse(data);
        setParsedData(jsonData);
      } catch (error) {
        // If not JSON, just display as text
        setParsedData({ 'Invitee Data': data });
      }
    }

    // Reset scan after 20 seconds
    setTimeout(() => {
      isScanning.current = false;
      setScannedData(null);
      setParsedData(null);
    }, 20000);
  };

  // Render JSON data as a table
  const renderDataTable = (data: any) => {
    if (!data) return null;

    const entries = Object.entries(data);
    return (
      <View style={[styles.dataTable, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.tableTitle, { color: colors.text }]}>Scanned Data</Text>
        {entries.map(([key, value], index) => (
          <View key={index} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tableKey, { color: colors.secondaryText }]}>{key}:</Text>
            <Text style={[styles.tableValue, { color: colors.text }]}>{String(value)}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BrandLogo style={styles.brand} />
        <Text style={[styles.header, { color: colors.text }]}>QR Code Scanner</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Point your camera at a QR code to scan
        </Text>
        
        <View style={[styles.cameraWrapper, { borderColor: colors.border }]}>
          <CameraView
            style={styles.camera}
            facing={facing}
            zoom={0}
            mode="picture"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'], // only scan QR codes
            }}
          />
          {scannedData && (
            <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
              <Text style={styles.scanText}>QR Code Detected!</Text>
            </View>
          )}
        </View>

        {/* Flip button */}
        <TouchableOpacity 
          style={[styles.flipButton, { backgroundColor: colors.tint }]} 
          onPress={toggleCameraFacing}
        >
          <Text style={[styles.flipText, { color: colors.background }]}>
            Switch to {facing === 'back' ? 'Front' : 'Back'} Camera
          </Text>
        </TouchableOpacity>

        {/* Data table */}
        {parsedData && renderDataTable(parsedData)}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  brand: {
    width: 250,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
    objectFit: 'contain',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 20,
    fontSize: 16,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cameraWrapper: {
    width: 300,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 20,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  scanText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  flipButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  flipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dataTable: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 10,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tableKey: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  tableValue: {
    flex: 2,
    fontSize: 14,
    flexWrap: 'wrap',
  },
});
