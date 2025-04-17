import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const isScanning = useRef(false); // prevent multiple triggers

  // If permissions are loading
  if (!permission) return <View />;

  // If permissions are not granted
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  // Switch between front and back camera
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    setScannedData(null); // reset scanned data on camera flip
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
    }

    // Reset scan after 5 seconds
    setTimeout(() => {
      isScanning.current = false;
      setScannedData(null);
    }, 5000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'], // only scan QR codes
          }}
        />
        {scannedData && (
          <View style={styles.overlay}>
            <Text style={styles.scanText}>{scannedData}</Text>
          </View>
        )}
      </View>

      {/* Flip button */}
      <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
        <Text style={styles.flipText}>Flip Camera</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  cameraWrapper: {
    width: 300,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    width: '100%',
  },
  scanText: {
    color: 'white',
    textAlign: 'center',
  },
  flipButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  flipText: {
    color: '#fff',
    fontSize: 16,
  },
});
