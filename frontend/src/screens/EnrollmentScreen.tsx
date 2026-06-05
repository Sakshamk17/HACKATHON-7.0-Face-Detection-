import React from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Button } from '../components/ui/Button';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { COLORS } from '../config/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Enrollment'>;
};

export const EnrollmentScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = React.useState('');
  const [personnelId, setPersonnelId] = React.useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="label" style={styles.nhaiBrand}>NHAI Field Operations</Typography>
        <Typography variant="h1">Personnel Enrollment</Typography>

        <Card style={styles.card}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Typography variant="label" style={styles.stepText}>STEP 1</Typography></View>
            <Typography variant="h3" style={styles.stepTitle}>Information</Typography>
          </View>
          
          <Typography variant="label">Personnel ID (Optional)</Typography>
          <TextInput
            style={styles.input}
            placeholder="e.g. ENG-4092"
            value={personnelId}
            onChangeText={setPersonnelId}
            placeholderTextColor={COLORS.secondaryText}
          />

          <Typography variant="label">Full Name</Typography>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            placeholderTextColor={COLORS.secondaryText}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Typography variant="label" style={styles.stepText}>STEP 2</Typography></View>
            <Typography variant="h3" style={styles.stepTitle}>Reference Face</Typography>
          </View>
          <Typography variant="body" style={styles.instructions}>
            The system requires a clear facial scan. Ensure the personnel is well-lit and not wearing sunglasses or masks.
          </Typography>
        </Card>

        <Button
          title="Initiate Scan Sequence"
          onPress={() => navigation.navigate('Camera', {
            mode: 'ENROLL',
            enrollmentName: name.trim(),
          })}
          disabled={!name.trim()}
          style={styles.actionButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
  },
  nhaiBrand: {
    color: COLORS.primary,
  },
  card: {
    marginTop: 16,
    gap: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  stepText: {
    color: '#FFF',
    marginBottom: 0,
  },
  stepTitle: {
    marginBottom: 0,
  },
  instructions: {
    color: COLORS.secondaryText,
  },
  input: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 4,
    fontSize: 16,
    color: COLORS.primaryText,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  actionButton: {
    marginTop: 24,
  },
});
