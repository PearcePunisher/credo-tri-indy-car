import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Provider as PaperProvider } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

const loginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  console.log('🔧 LoginForm component starting...');
  
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  
  // Debug logging for color scheme
  console.log('🎨 Login Form Color Debug:', {
    colorScheme,
    textColor: colors.text,
    backgroundColor: colors.background,
    isLight: colorScheme === 'light',
    isDark: colorScheme === 'dark'
  });
  const router = useRouter();
  const { createLocalAuthState } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  console.log('✅ LoginForm hooks initialized successfully');

  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      // For now, we'll simulate a login process
      // In a real app, you'd authenticate with your backend
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create authenticated state with the provided email
      // In a real app, you'd get user data from your login API
      await createLocalAuthState({
        email: values.email,
        firstName: "Returning", // You'd get this from your API
        lastName: "User",
        dateOfBirth: "1990-01-01",
        phoneNumber: "",
        userIsStaff: false, // Default to false for login users
      });

      Alert.alert("Login Successful", "Welcome back!", [
        { text: "Continue", onPress: () => router.push('/video') }
      ]);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        "Login Failed", 
        "Please check your credentials and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PaperProvider 
      theme={{
        colors: {
          primary: colors.tint,
          onPrimary: '#FFFFFF',
          primaryContainer: colors.tint + '20',
          onPrimaryContainer: colors.text,
          secondary: colors.tint,
          onSecondary: '#FFFFFF', 
          secondaryContainer: colors.tint + '20',
          onSecondaryContainer: colors.text,
          tertiary: colors.tint,
          onTertiary: '#FFFFFF',
          tertiaryContainer: colors.tint + '20',
          onTertiaryContainer: colors.text,
          error: colors.error || '#BA1A1A',
          onError: '#FFFFFF',
          errorContainer: '#FFDAD6',
          onErrorContainer: '#410002',
          background: colors.background,
          onBackground: colors.text,
          surface: colors.card,
          onSurface: colors.text,
          surfaceVariant: colors.card,
          onSurfaceVariant: colors.secondaryText,
          outline: colors.secondaryText,
          outlineVariant: colors.secondaryText + '50',
          shadow: '#000000',
          scrim: '#000000',
          inverseSurface: colorScheme === 'light' ? '#313033' : '#E6E1E5',
          inverseOnSurface: colorScheme === 'light' ? '#F4EFF4' : '#313033',
          inversePrimary: colors.tint,
          elevation: {
            level0: 'transparent',
            level1: colors.card,
            level2: colors.card,
            level3: colors.card,
            level4: colors.card,
            level5: colors.card,
          },
          surfaceDisabled: colors.secondaryText + '12',
          onSurfaceDisabled: colors.secondaryText + '38',
          backdrop: colors.background + 'CC',
        },
      }}
    >
      <Formik
        initialValues={{
          email: '',
          password: '',
        }}
        validationSchema={loginValidationSchema}
        onSubmit={handleLogin}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
        }) => (
          <View style={styles.container}>
            <TextInput
              label="Email"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              theme={{
                colors: {
                  primary: colors.tint,
                  background: colors.card,
                  text: colors.text,
                  placeholder: colors.secondaryText,
                },
                fonts: {
                  regular: {
                    fontFamily: "Roobert",
                  },
                },
              }}
              error={!!(touched.email && errors.email)}
            />
            {touched.email && errors.email && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.email}
              </Text>
            )}

            <TextInput
              label="Password"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              style={styles.input}
              mode="outlined"
              secureTextEntry
              autoComplete="password"
              theme={{
                colors: {
                  primary: colors.tint,
                  background: colors.card,
                  text: colors.text,
                  placeholder: colors.secondaryText,
                },
                fonts: {
                  regular: {
                    fontFamily: "Roobert",
                  },
                },
              }}
              error={!!(touched.password && errors.password)}
            />
            {touched.password && errors.password && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.password}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={() => handleSubmit()}
              style={[styles.loginButton, { backgroundColor: colors.tint }]}
              labelStyle={{ color: colors.background, fontFamily: "Roobert" }}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            <Text style={[styles.helpText, { color: colors.secondaryText }]}>
              Forgot your password? Contact support for assistance.
            </Text>
          </View>
        )}
      </Formik>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    marginBottom: 12,
  },
  loginButton: {
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: "Roobert",
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: "Roobert",
  },
});
