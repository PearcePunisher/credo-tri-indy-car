# QR Code Scanner Test Data

## Test QR Codes for JSON Parsing

The updated camera scanner can now parse JSON data from QR codes and display it in a formatted table. Here are some example JSON structures you can create QR codes for:

### Example 1: User Information
```json
{
  "name": "John Doe",
  "vipLevel": "Platinum",
  "ticketNumber": "VIP-001-2025",
  "accessLevel": "Full Garage Access",
  "expires": "2025-12-31"
}
```

### Example 2: Race Event Data
```json
{
  "eventName": "Indianapolis 500",
  "date": "2025-05-25",
  "driver": "Marcus Ericsson",
  "carNumber": "8",
  "team": "Chip Ganassi Racing",
  "gridPosition": "P3"
}
```

### Example 3: VIP Experience Details
```json
{
  "experienceType": "Pit Lane Tour",
  "timeSlot": "14:30 - 15:30",
  "meetingPoint": "VIP Hospitality Tent",
  "groupSize": "8 people max",
  "specialAccess": "Driver Meet & Greet"
}
```

### Example 4: Simple Contact Info
```json
{
  "type": "Contact",
  "name": "Race Coordinator",
  "phone": "+1-555-0123",
  "email": "coordinator@indycar.com",
  "location": "Paddock Club"
}
```

## How to Create Test QR Codes

1. Go to any QR code generator (like qr-code-generator.com)
2. Select "Text" option
3. Copy and paste one of the JSON examples above
4. Generate the QR code
5. Test with your app's camera scanner

## Expected Behavior

- **Valid JSON**: Will be parsed and displayed in a formatted table with key-value pairs
- **Invalid JSON or Plain Text**: Will be displayed under "rawData" field
- **URLs starting with https://testing.com**: Will open in browser directly
- **Scan Duration**: Data disappears after 20 seconds automatically

## Features

- ✅ **Brand Logo**: Matches your app's styling
- ✅ **Color Theming**: Uses your app's light/dark color scheme
- ✅ **Dynamic Table**: Automatically resizes based on JSON content
- ✅ **Scrollable**: Long data won't overflow the screen
- ✅ **Camera Controls**: Switch between front/back cameras
- ✅ **Permission Handling**: Styled permission request screen
- ✅ **JSON Parsing**: Automatic JSON detection and formatting
