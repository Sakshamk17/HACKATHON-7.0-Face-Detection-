import React from 'react';
import { View, StyleSheet, SafeAreaView, Switch, ScrollView } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { COLORS } from '../config/theme';

export const SettingsScreen: React.FC = () => {
  const [offlineSync, setOfflineSync] = React.useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="label" style={styles.nhaiBrand}>Administration</Typography>
        <Typography variant="h1" style={styles.header}>System Information</Typography>

        <Card style={styles.card}>
          <Typography variant="h3">Hardware & Software</Typography>
          <View style={styles.settingRow}>
            <Typography variant="body">App Version</Typography>
            <Typography variant="body" style={styles.value}>v1.2.0-field</Typography>
          </View>
          <View style={styles.settingRow}>
            <Typography variant="body">AI Model</Typography>
            <Typography variant="body" style={styles.value}>MobileFaceNet (TFLite Pending)</Typography>
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3">Connectivity</Typography>
          <View style={styles.settingRow}>
            <Typography variant="body">Background Sync</Typography>
            <Switch
              value={offlineSync}
              onValueChange={setOfflineSync}
              trackColor={{ false: COLORS.border, true: COLORS.success }}
            />
          </View>
          <View style={styles.settingRow}>
            <Typography variant="body">Network Status</Typography>
            <Typography variant="body" style={[styles.value, {color: COLORS.warning}]}>Offline</Typography>
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3">Local Database Health</Typography>
          <View style={styles.settingRow}>
            <Typography variant="body">Storage Usage</Typography>
            <Typography variant="body" style={styles.value}>1.4 MB</Typography>
          </View>
          <View style={styles.settingRow}>
            <Typography variant="body">Clear Field Data</Typography>
            <Typography variant="label" style={styles.destructive}>
              RESET
            </Typography>
          </View>
        </Card>
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
  header: {
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
    gap: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  value: {
    color: COLORS.primaryText,
    fontWeight: '500',
  },
  destructive: {
    color: COLORS.danger,
    marginBottom: 0,
  },
});
