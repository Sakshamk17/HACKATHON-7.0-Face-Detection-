import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

import { HomeScreen } from '../screens/HomeScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { EnrollmentScreen } from '../screens/EnrollmentScreen';
import { VerificationScreen } from '../screens/VerificationScreen';
import { AttendanceHistoryScreen } from '../screens/AttendanceHistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#F2F2F7',
        },
        headerShadowVisible: false,
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ 
          headerShown: false,
          presentation: 'fullScreenModal' 
        }} 
      />
      <Stack.Screen 
        name="Enrollment" 
        component={EnrollmentScreen} 
        options={{ title: 'Enroll User' }} 
      />
      <Stack.Screen 
        name="Verification" 
        component={VerificationScreen} 
        options={{ title: 'Verify Identity' }} 
      />
      <Stack.Screen 
        name="AttendanceHistory" 
        component={AttendanceHistoryScreen} 
        options={{ title: 'History' }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
      />
    </Stack.Navigator>
  );
};
