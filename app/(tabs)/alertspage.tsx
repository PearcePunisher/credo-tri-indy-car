import React, { useState } from 'react';
import { View, Text, TextInput, Button, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';




const AlarmScheduler = () => {
  const [date, setDate] = useState(new Date());
  const [message, setMessage] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const scheduleNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Alarm',
        body: message || 'Your scheduled alarm is going off!',
        sound: true,
      },
      trigger: date,
    });
    alert('Alarm scheduled successfully!');
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Select Date and Time:</Text>
      <Button title="Pick Date & Time" onPress={() => setShowPicker(true)} />
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            const currentDate = selectedDate || date;
            setShowPicker(Platform.OS === 'ios');
            setDate(currentDate);
          }}
        />
      )}
      <TextInput
        placeholder="Enter your message"
        value={message}
        onChangeText={setMessage}
        style={{ borderBottomWidth: 1, marginTop: 20 }}
      />
      <Button title="Schedule Alarm" onPress={scheduleNotification} />
    </View>
  );
};

export default AlarmScheduler;
