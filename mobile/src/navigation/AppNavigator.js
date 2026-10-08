import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import VerifyScreen from '../screens/VerifyScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#0B0B0F', card: '#0B0B0F', text: '#fff' },
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0B0F', justifyContent: 'center' }}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Chat" component={ChatScreen}
              options={{ headerShown: true, headerStyle: { backgroundColor: '#14141A' } }} />
            <Stack.Screen name="Profile" component={ProfileScreen}
              options={{ headerShown: true, title: 'My Profile', headerStyle: { backgroundColor: '#14141A' } }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen}
              options={{ headerShown: true, title: 'Edit Profile', headerStyle: { backgroundColor: '#14141A' } }} />
            <Stack.Screen name="Verify" component={VerifyScreen}
              options={{ headerShown: true, title: 'Verification', headerStyle: { backgroundColor: '#14141A' } }} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen}
              options={{ headerShown: true, title: 'Admin', headerStyle: { backgroundColor: '#14141A' } }} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen}
              options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
