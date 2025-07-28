# QR Code Test Data

This document shows the structure of the QR code data generated for users.

## Sample QR Code Data Structure

```json
{
  "userId": "102",
  "serverId": "102", 
  "email": "solid.snake2@wickedthink.com",
  "firstName": "Solid",
  "lastName": "Snake6",
  "eventCodeDocumentId": "wmct89pr7mm7j5u90jxngx8h",
  "eventScheduleDocumentId": "eelnri2c4053as31pttrwqfo",
  "generatedAt": "2025-01-21T20:15:30.000Z"
}
```

## QR Code Content

The QR code contains the above JSON data as a string, which can be scanned and parsed by event check-in systems.

## Features Implemented

1. **QR Code Generation**: Automatically generated when user registers
2. **Local Storage**: QR code data stored locally for offline access
3. **Account Page Display**: Embedded QR code with share/refresh actions
4. **Full Page View**: Dedicated page at `/userQR` with instructions
5. **Navigation**: "View Full QR Code" button on account page
6. **Cleanup**: QR code data cleared on logout

## Usage Flow

1. User registers → Server returns user data
2. Local auth state created with server data 
3. QR code automatically generated and stored
4. User can view QR code on account page or full page
5. QR code can be shared or refreshed
6. Event staff can scan QR code for user identification
