import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Button } from '../components/ui/Button';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badges';
import { COLORS } from '../config/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Verification'>;
};

export const VerificationScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="label" style={styles.nhaiBrand}>NHAI Field Operations</Typography>
        <Typography variant="h1">Personnel Verification</Typography>

        <Card style={styles.card}>
          <Typography variant="h3">Authentication Pipeline</Typography>
          
          <View style={styles.pipelineStep}>
            <View style={styles.iconPlaceholder} />
            <Typography variant="body" style={styles.stepText}>Face Detection</Typography>
            <StatusBadge status="pending" text="Awaiting" />
          </View>
          
          <View style={styles.pipelineStep}>
            <View style={styles.iconPlaceholder} />
            <Typography variant="body" style={styles.stepText}>Liveness Verification</Typography>
            <StatusBadge status="pending" text="Awaiting" />
          </View>
          
          <View style={styles.pipelineStep}>
            <View style={styles.iconPlaceholder} />
            <Typography variant="body" style={styles.stepText}>Identity Matching</Typography>
            <StatusBadge status="pending" text="Awaiting" />
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3">System Storage</Typography>
          <View style={styles.statusRow}>
            <Typography variant="body">Storage Strategy</Typography>
            <StatusBadge status="offline" text="Local Offline" />
          </View>
        </Card>

        <Button
          title="Initialize Scanner"
          onPress={() => navigation.navigate('Camera', { mode: 'VERIFY' })}
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
    gap: 16,
  },
  pipelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  iconPlaceholder: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    color: COLORS.primaryText,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButton: {
    marginTop: 32,
  },
});
