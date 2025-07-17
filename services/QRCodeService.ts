import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from './AuthService';

export interface QRCodeData {
  userId: string;
  serverId?: string;
  email: string;
  firstName: string;
  lastName: string;
  eventCodeDocumentId?: string;
  eventScheduleDocumentId?: string;
  generatedAt: string;
}

class QRCodeService {
  private static instance: QRCodeService;

  public static getInstance(): QRCodeService {
    if (!QRCodeService.instance) {
      QRCodeService.instance = new QRCodeService();
    }
    return QRCodeService.instance;
  }

  // Generate QR code data from user information
  generateQRCodeData(user: User): QRCodeData {
    return {
      userId: user.id,
      serverId: user.serverId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      eventCodeDocumentId: user.eventCodeDocumentId,
      eventScheduleDocumentId: user.eventScheduleDocumentId,
      generatedAt: new Date().toISOString(),
    };
  }

  // Convert QR code data to JSON string for QR code content
  generateQRCodeString(user: User): string {
    const qrData = this.generateQRCodeData(user);
    return JSON.stringify(qrData);
  }

  // Store QR code data locally
  async storeQRCodeData(user: User): Promise<void> {
    try {
      const qrData = this.generateQRCodeData(user);
      await AsyncStorage.setItem(`@qr_code_${user.id}`, JSON.stringify(qrData));
      console.log('QR code data stored successfully');
    } catch (error) {
      console.error('Error storing QR code data:', error);
      throw error;
    }
  }

  // Retrieve stored QR code data
  async getStoredQRCodeData(userId: string): Promise<QRCodeData | null> {
    try {
      const storedData = await AsyncStorage.getItem(`@qr_code_${userId}`);
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error('Error retrieving QR code data:', error);
      return null;
    }
  }

  // Check if QR code exists for user
  async hasQRCode(userId: string): Promise<boolean> {
    try {
      const qrData = await this.getStoredQRCodeData(userId);
      return qrData !== null;
    } catch (error) {
      console.error('Error checking QR code existence:', error);
      return false;
    }
  }

  // Clear QR code data (useful for logout)
  async clearQRCodeData(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@qr_code_${userId}`);
      console.log('QR code data cleared');
    } catch (error) {
      console.error('Error clearing QR code data:', error);
      throw error;
    }
  }
}

export default QRCodeService;
