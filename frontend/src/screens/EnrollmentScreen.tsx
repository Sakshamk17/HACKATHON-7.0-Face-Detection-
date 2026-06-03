import React from 'react';
import { View, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Button } from '../components/ui/Button';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Enrollment'>;
};

export const EnrollmentScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = React.useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Typography variant="h2">New Enrollment</Typography>
          <Typography variant="body" style={styles.label}>
            Enter employee/student name
          </Typography>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
          />
          <Button
            title="Proceed to Face Scan"
            onPress={() => navigation.navigate('Camera', { mode: 'ENROLL' })}
            disabled={!name.trim()}
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
  },
  label: {
    marginBottom: -8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});
