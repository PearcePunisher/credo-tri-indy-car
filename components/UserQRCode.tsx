import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { User } from '@/services/AuthService';
import QRCodeService, { QRCodeData } from '@/services/QRCodeService';
import { Ionicons } from '@expo/vector-icons';

interface UserQRCodeProps {
  user: User;
  size?: number;
  showActions?: boolean;
}

export const UserQRCode: React.FC<UserQRCodeProps> = ({ 
  user, 
  size = 200, 
  showActions = true 
}) => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const qrCodeService = QRCodeService.getInstance();

  useEffect(() => {
    generateAndStoreQRCode();
  }, [user]);

  const generateAndStoreQRCode = async () => {
    try {
      setIsLoading(true);
      
      // Generate and store QR code data
      await qrCodeService.storeQRCodeData(user);
      const storedData = await qrCodeService.getStoredQRCodeData(user.id);
      setQrData(storedData);
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (!qrData) return;
      
      const shareContent = `My IndyCar Event QR Code\n\nName: ${qrData.firstName} ${qrData.lastName}\nEmail: ${qrData.email}\nUser ID: ${qrData.userId}`;
      
      await Share.share({
        message: shareContent,
        title: 'IndyCar Event QR Code',
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handleRefresh = () => {
    generateAndStoreQRCode();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Generating QR Code...
        </Text>
      </View>
    );
  }

  if (!qrData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Failed to generate QR code
        </Text>
        {showActions && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.actionButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const qrCodeString = qrCodeService.generateQRCodeString(user);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.qrContainer, { backgroundColor: 'white' }]}>
        <QRCode
          value={qrCodeString}
          size={size}
          color="black"
          backgroundColor="white"
          logoSize={size * 0.2}
          logoMargin={2}
          logoBorderRadius={4}
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {qrData.firstName} {qrData.lastName}
        </Text>
        <Text style={[styles.userEmail, { color: colors.secondaryText }]}>
          {qrData.email}
        </Text>
        <Text style={[styles.userId, { color: colors.secondaryText }]}>
          ID: {qrData.userId}
        </Text>
      </View>

      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={16} color="white" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.secondaryText }]}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  qrContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
    
  },
  userId: {
    fontSize: 12,
    
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    
  },
  loadingText: {
    fontSize: 16,
    
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    
  },
});

export default UserQRCode;
