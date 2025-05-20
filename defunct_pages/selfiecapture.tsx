import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, Alert } from 'react-native';
import { Camera, CameraType, CameraCapturedPicture, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import * as FileSystem from 'expo-file-system';

const FRONT_CAMERA = 1;


export default function SelfieCapture() {
  const cameraRef = useRef<Camera | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [step, setStep] = useState<'capture' | 'review'>('capture');

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleFacesDetected = ({ faces }: FaceDetector.FaceDetectionResult) => {
    setFaceDetected(faces.length > 0);
  };

  const takePhoto = async () => {
    if (cameraRef.current && faceDetected) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
      setStep('review');
    } else {
      Alert.alert("No face detected", "Please make sure your face is clearly visible in the frame.");
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    setStep('capture');
  };

  const savePhoto = async () => {
    if (photoUri) {
      const profilePicDir = `${FileSystem.documentDirectory}profile/`;
      await FileSystem.makeDirectoryAsync(profilePicDir, { intermediates: true });
      const destPath = `${profilePicDir}profile.jpg`;

      await FileSystem.copyAsync({
        from: photoUri,
        to: destPath,
      });

      Alert.alert('Saved', 'Your selfie has been saved!');
      // You can trigger navigation or state update here as needed
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {step === 'capture' && (
        <>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            //type={FRONT_CAMERA}
            onFacesDetected={handleFacesDetected}
            faceDetectorSettings={{
              mode: FaceDetector.FaceDetectorMode.fast,
              detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
              runClassifications: FaceDetector.FaceDetectorClassifications.none,
            }}
          />
          <Button title="Take Photo" onPress={takePhoto} disabled={!faceDetected} />
        </>
      )}

      {step === 'review' && photoUri && (
        <View style={styles.preview}>
          <Image source={{ uri: photoUri }} style={styles.image} />
          <Button title="Use this photo" onPress={savePhoto} />
          <Button title="Retake photo" onPress={retakePhoto} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1, aspectRatio: 3 / 4 },
  preview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: 300, height: 400, borderRadius: 10, margin: 10 },
});
