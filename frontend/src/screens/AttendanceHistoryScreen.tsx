import React from 'react';
import { View, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../core/store/useAppStore';

export const AttendanceHistoryScreen: React.FC = () => {
  const { attendanceRecords, users } = useAppStore();

  const getUsername = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown User';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Typography variant="h2" style={styles.header}>
          History
        </Typography>

        {attendanceRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography variant="body">No attendance records found.</Typography>
          </View>
        ) : (
          <FlatList
            data={attendanceRecords}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <View style={styles.row}>
                  <Typography variant="h2" style={styles.name}>
                    {getUsername(item.userId)}
                  </Typography>
                  <Typography
                    variant="caption"
                    style={[
                      styles.status,
                      item.status === 'SUCCESS' ? styles.success : styles.failed,
                    ]}
                  >
                    {item.status}
                  </Typography>
                </View>
                <Typography variant="caption">
                  {new Date(item.timestamp).toLocaleString()}
                </Typography>
              </Card>
            )}
          />
        )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    marginBottom: 0,
    fontSize: 18,
  },
  status: {
    fontWeight: 'bold',
  },
  success: {
    color: '#34C759',
  },
  failed: {
    color: '#FF3B30',
  },
});
