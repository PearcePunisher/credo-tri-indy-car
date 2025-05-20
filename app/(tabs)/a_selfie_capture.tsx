import React, { useState, useRef, useEffect } from 'react';
import { CameraView, useCameraPermissions, takePictureAsync, saveToLibraryAsync } from 'expo-camera';
import { StyleSheet, Text, TouchableOpacity, View, Image, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as FaceDetector from 'expo-face-detector';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [faceDetected, setFaceDetected] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [step, setStep] = useState<'capture' | 'review'>('capture');
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      Alert.alert('Unsupported', 'This camera feature is only available on mobile devices.');
    }
  }, []);
console.log("TEST IN HEREZ");
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.flipButton}>
          <Text style={styles.flipText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleFacesDetected = ({ faces }: FaceDetector.FaceDetectionResult) => {
    setFaceDetected(faces.length > 0);
    console.log("face detected");
  };

  const takePhoto = async () => {
    console.log("TEST IN HERE1");
    if (!cameraRef.current /*|| !faceDetected*/) return;
    console.log("TEST IN HERE2");
    try {
      console.log("TEST IN HERE3");
      const photo = await takePictureAsync(cameraRef.current, { skipProcessing: true });
      setPhotoUri(photo.uri);
      setStep('review');
    } catch (err) {
      console.log("TEST IN HERECC");
      Alert.alert('Error', 'Could not take photo.');
    }
  };

  const savePhoto = async () => {
    if (!photoUri) return;
    try {
      const profilePicDir = `${FileSystem.documentDirectory}profile/`;
      await FileSystem.makeDirectoryAsync(profilePicDir, { intermediates: true });

      const dest = `${profilePicDir}profile.jpg`;
      await FileSystem.copyAsync({
        from: photoUri,
        to: dest,
      });

      Alert.alert('Saved', 'Profile photo saved locally.');
      // Optionally: Trigger navigation or upload here
    } catch (err) {
      Alert.alert('Error', 'Failed to save photo.');
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    setStep('capture');
  };
  console.log("TEST IN HEREA");
  return (
    <View style={styles.container}>
      {step === 'capture' && (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            
            facing="front"
       //     onFacesDetected={handleFacesDetected}
            onCameraReady={() => setCameraReady(true)}
          /*  faceDetectorSettings={{
              mode: FaceDetector.FaceDetectorMode.fast,
              detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
              runClassifications: FaceDetector.FaceDetectorClassifications.none,
            }}*/
          />
          <TouchableOpacity
            style={[styles.flipButton, { backgroundColor: faceDetected ? '#4CAF50' : '#aaa' }]}
            onPress={takePhoto}
            disabled={/*!faceDetected ||*/ !cameraReady}
          >
            <Text style={styles.flipText}>Take Photo</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'review' && photoUri && (
        <View style={styles.preview}>
          <Image source={{ uri: photoUri }} style={styles.image} />
          <TouchableOpacity onPress={savePhoto} style={styles.flipButton}>
            <Text style={styles.flipText}>Use this photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={retakePhoto} style={styles.flipButton}>
            <Text style={styles.flipText}>Retake</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  message: { textAlign: 'center', paddingBottom: 10 },
  camera: { width: 300, height: 400, borderRadius: 12, overflow: 'hidden' },
  flipButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
  },
  flipText: { color: '#fff', fontSize: 16 },
  preview: { alignItems: 'center', justifyContent: 'center' },
  image: { width: 300, height: 400, borderRadius: 10, margin: 20 },
});
