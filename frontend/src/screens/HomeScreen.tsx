import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Button } from '../components/ui/Button';
import { Typography } from '../components/ui/Typography';
import { StatusBadge } from '../components/ui/Badges';
import { MetricCard } from '../components/ui/MetricCard';
import { COLORS } from '../config/theme';
import { useAppStore } from '../core/store/useAppStore';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const users = useAppStore((state) => state.users);
  const records = useAppStore((state) => state.attendanceRecords);
  
  const todayVerifications = records.filter(r => 
    new Date(r.timestamp).toDateString() === new Date().toDateString()
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="label" style={styles.nhaiBrand}>NHAI Field Authentication System</Typography>
          <Typography variant="h1">Datalake 3.0</Typography>
          <View style={styles.badgeRow}>
            <StatusBadge status="offline" text="Offline Mode Active" />
          </View>
        </View>

        {/* Dashboard / Metrics */}
        <View style={styles.metricsRow}>
          <MetricCard label="Total Personnel" value={users.length} />
          <MetricCard label="Today's Verifications" value={todayVerifications} highlight />
        </View>

        {/* System Status */}
        <View style={styles.statusBox}>
          <Typography variant="h3">System Status</Typography>
          <View style={styles.statusItem}>
            <Typography variant="body">Face Detection Engine</Typography>
            <StatusBadge status="active" text="Ready" />
          </View>
          <View style={styles.statusItem}>
            <Typography variant="body">Liveness Detection</Typography>
            <StatusBadge status="active" text="Active" />
          </View>
          <View style={styles.statusItem}>
            <Typography variant="body">Sync Queue</Typography>
            <StatusBadge status="pending" text="0 Pending" />
          </View>
        </View>

        {/* Primary Actions */}
        <View style={styles.actionsBox}>
          <Typography variant="h3">Operational Commands</Typography>
          <Button
            title="Enroll Personnel"
            onPress={() => navigation.navigate('Enrollment')}
            style={styles.button}
          />
          <Button
            title="Verify Personnel"
            variant="secondary"
            onPress={() => navigation.navigate('Verification')}
            style={styles.button}
          />
          <Button
            title="Verification Log"
            variant="outline"
            onPress={() => navigation.navigate('AttendanceHistory')}
            style={styles.button}
          />
          <Button
            title="System Settings"
            variant="outline"
            onPress={() => navigation.navigate('Settings')}
            style={styles.button}
          />
        </View>

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
  header: {
    marginBottom: 24,
  },
  nhaiBrand: {
    color: COLORS.primary,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statusBox: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionsBox: {
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
});
