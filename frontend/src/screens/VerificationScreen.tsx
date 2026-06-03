import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Button } from '../components/ui/Button';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Verification'>;
};

export const VerificationScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Typography variant="h2">Verify Identity</Typography>
          <Typography variant="body" style={styles.description}>
            Ready to mark attendance? The camera will open to verify your face locally.
          </Typography>
          <Button
            title="Start Face Scan"
            onPress={() => navigation.navigate('Camera', { mode: 'VERIFY' })}
          />
        </Card>
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
  },
  card: {
    gap: 16,
    alignItems: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 8,
  },
});
