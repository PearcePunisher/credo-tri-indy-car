// App.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<Camera | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [catFact, setCatFact] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        // Fetch a cat fact if permission is denied
        try {
          const response = await fetch('https://catfact.ninja/fact');
          const data = await response.json();
          setCatFact(data.fact);
        } catch (error) {
          console.error('Error fetching cat fact:', error);
        }
      }
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        setCapturedPhoto(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const uploadPhoto = async () => {
    if (!capturedPhoto) return;

    setUploading(true);

    const uriParts = capturedPhoto.split('/');
    const fileName = uriParts[uriParts.length - 1];
    const fileType = 'image/jpeg';

    const formData = new FormData();
    formData.append('files', {
      uri: capturedPhoto,
      name: fileName,
      type: fileType,
    } as any);

    try {
      const response = await fetch('https://timely-actor-10dfb03957.strapiapp.com/api/upload/', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        alert('Image uploaded successfully!');
        setCapturedPhoto(null);
      } else {
        alert('Upload failed.');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>You denied camera access. Please rethink your life choices.</Text>
        {catFact && (
          <View style={styles.catFactContainer}>
            <Text style={styles.catFactTitle}>🐱 Cat Fact:</Text>
            <Text style={styles.catFact}>{catFact}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!capturedPhoto ? (
        <>
          <Camera
            style={styles.camera}
            type={CameraType.front}
            ref={(ref) => setCameraRef(ref)}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.buttonText}>📸 Take Picture</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedPhoto }} style={styles.preview} />
          <View style={styles.actionButtons}>
            <Button title="Approve & Upload" onPress={uploadPhoto} disabled={uploading} />
            <Button title="Retake" onPress={() => setCapturedPhoto(null)} />
          </View>
          {uploading && <ActivityIndicator size="large" color="#0000ff" />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
  },
  catFactContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  catFactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  catFact: {
    fontSize: 14,
    marginTop: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#ffffffaa',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 18,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    width: '90%',
    height: '70%',
    borderRadius: 10,
  },
  actionButtons: {
    marginTop: 20,
    width: '60%',
    justifyContent: 'space-between',
    height: 100,
  },
});
