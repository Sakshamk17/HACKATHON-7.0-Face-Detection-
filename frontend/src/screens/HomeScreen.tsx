import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Button } from '../components/ui/Button';
import { Typography } from '../components/ui/Typography';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Typography variant="h1">Offline Face Auth</Typography>
        <Typography variant="body" style={styles.subtitle}>
          Secure, Offline-first Facial Recognition
        </Typography>

        <View style={styles.buttonContainer}>
          <Button
            title="Enroll New User"
            onPress={() => navigation.navigate('Enrollment')}
            style={styles.button}
          />
          <Button
            title="Verify Identity (Attendance)"
            variant="secondary"
            onPress={() => navigation.navigate('Verification')}
            style={styles.button}
          />
          <Button
            title="View History"
            variant="outline"
            onPress={() => navigation.navigate('AttendanceHistory')}
            style={styles.button}
          />
          <Button
            title="Settings"
            variant="outline"
            onPress={() => navigation.navigate('Settings')}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    marginBottom: 12,
  },
});
