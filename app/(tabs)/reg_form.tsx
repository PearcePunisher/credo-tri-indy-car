import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';


const UserRegistrationForm = () => {
  const { control, handleSubmit, register, setValue } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      pronouns: '',
      countryOfOrigin: '',
      profilePicture: null,
      children: [],
    },
  });


    const styles2 = StyleSheet.create({
    test: {
        color: 'white'
    },
    text: {
        color: 'white'
    }
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
  });

  const pickImage = async (onChange) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.cancelled) {
      onChange(result.uri);
    }
  };

  const onSubmit = async (data) => {
    console.log(data);
    // Handle form submission logic here

    try {
    const response = await fetch('https://theme-test.com/user/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log('Registration successful:', responseData);
      // You can add further logic here, such as navigation or displaying a success message
    } else {
      const errorData = await response.json();
      console.error('Registration failed:', errorData);
      // Handle errors as needed
    }
  } catch (error) {
    console.error('An error occurred during registration:', error);
    // Handle network or other errors
  }

  };

  return (
    <ScrollView>
      <Text style={styles2.text}>First Name</Text>
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles2.text}  value={value} onChangeText={onChange} />
        )}
      />

      <Text style={styles2.text}>Last Name</Text>
      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles2.text} value={value} onChangeText={onChange} />
        )}
      />

      <Text style={styles2.text}>Email</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles2.text} value={value} onChangeText={onChange} keyboardType="email-address" />
        )}
      />

      <Text style={styles2.text}>Date of Birth</Text>
      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles2.text} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" />
        )}
      />

      <Text style={styles2.text}>Pronouns</Text>
      <Controller
        control={control}
        name="pronouns"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles2.text} value={value} onChangeText={onChange} />
        )}
      />

      <Text style={styles2.text}>Country of Origin</Text>
      <Controller
        control={control}
        name="countryOfOrigin"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles2.text} value={value} onChangeText={onChange} />
        )}
      />

      <Text style={styles2.text}>Profile Picture</Text>
      <Controller
        control={control}
        name="profilePicture"
        render={({ field: { onChange, value } }) => (
          <>
            {value && <Image source={{ uri: value }} style={{ width: 100, height: 100 }} />}
            <Button title="Select Profile Picture" onPress={() => pickImage(onChange)} />
          </>
        )}
      />

      <Text style={styles2.text}>Children</Text>
      {fields.map((item, index) => (
        <View key={item.id}>
          <Text style={styles2.text}>Child {index + 1}</Text>

          <Text style={styles2.text}>First Name</Text>
          <Controller
            control={control}
            name={`children[${index}].firstName`}
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles2.text} value={value} onChangeText={onChange} />
            )}
          />

          <Text style={styles2.text}>Last Name</Text>
          <Controller
            control={control}
            name={`children[${index}].lastName`}
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles2.text} value={value} onChangeText={onChange} />
            )}
          />

          <Text style={styles2.text}>Phone Number</Text>
          <Controller
            control={control}
            name={`children[${index}].phoneNumber`}
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles2.text} value={value} onChangeText={onChange} keyboardType="phone-pad" />
            )}
          />

          <Text style={styles2.text}>Sex</Text>
          <Controller
            control={control}
            name={`children[${index}].sex`}
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles2.text} value={value} onChangeText={onChange} />
            )}
          />

          <Text style={styles2.text}>Profile Picture</Text>
          <Controller
            control={control}
            name={`children[${index}].profilePicture`}
            render={({ field: { onChange, value } }) => (
              <>
                {value && <Image source={{ uri: value }} style={{ width: 100, height: 100 }} />}
                <Button title="Select Child's Profile Picture" onPress={() => pickImage(onChange)} />
              </>
            )}
          />

          <Button title="Remove Child" onPress={() => remove(index)} />
        </View>
      ))}

      <Button
        title="Add Child"
        onPress={() => append({ firstName: '', lastName: '', phoneNumber: '', sex: '', profilePicture: null })}
      />

      <Button title="Submit" onPress={handleSubmit(onSubmit)} />
    </ScrollView>
  );





};

export default UserRegistrationForm;
