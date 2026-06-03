import React from 'react';
import { View, StyleSheet, SafeAreaView, Switch } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';

export const SettingsScreen: React.FC = () => {
  const [offlineSync, setOfflineSync] = React.useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Typography variant="h2" style={styles.header}>Settings</Typography>

        <Card style={styles.settingRow}>
          <Typography variant="body">Enable Background Sync (Future)</Typography>
          <Switch
            value={offlineSync}
            onValueChange={setOfflineSync}
            trackColor={{ false: '#767577', true: '#34C759' }}
          />
        </Card>

        <Card style={styles.settingRow}>
          <Typography variant="body">Clear Local Database</Typography>
          <Typography variant="caption" style={styles.destructive}>
            Reset
          </Typography>
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
  header: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  destructive: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});
