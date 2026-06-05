import React from 'react';
import { View, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badges';
import { ConfidenceBar } from '../components/ui/ConfidenceBar';
import { COLORS } from '../config/theme';
import { useAppStore } from '../core/store/useAppStore';

export const AttendanceHistoryScreen: React.FC = () => {
  const attendanceRecords = useAppStore((state) => state.attendanceRecords);
  const users = useAppStore((state) => state.users);

  const getUsername = (userId: string) => {
    return users.find((user) => user.id === userId)?.name || 'Unknown Personnel';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Typography variant="label" style={styles.nhaiBrand}>NHAI Datalake 3.0</Typography>
        <Typography variant="h1" style={styles.header}>Verification Log</Typography>

        {attendanceRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography variant="body">No verification logs available.</Typography>
          </View>
        ) : (
          <FlatList
            data={attendanceRecords}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <View style={styles.row}>
                  <Typography variant="h3" style={styles.name}>
                    {item.userName ?? getUsername(item.userId)}
                  </Typography>
                  <StatusBadge 
                    status={item.status === 'SUCCESS' ? 'success' : 'error'} 
                    text={item.status === 'SUCCESS' ? 'VERIFIED' : 'FAILED'} 
                  />
                </View>

                <View style={styles.detailsRow}>
                  <Typography variant="caption">ID: {item.userId.split('_')[1] || 'UNK'}</Typography>
                  <Typography variant="caption">{new Date(item.timestamp).toLocaleString()}</Typography>
                </View>

                {typeof item.confidence === 'number' && (
                  <View style={styles.confidenceBox}>
                    <View style={styles.confidenceHeader}>
                      <Typography variant="caption">Match Confidence</Typography>
                      <Typography variant="caption">{(item.confidence * 100).toFixed(1)}%</Typography>
                    </View>
                    <ConfidenceBar confidence={item.confidence} />
                  </View>
                )}

                <View style={styles.syncRow}>
                  <StatusBadge status="pending" text="Pending Sync" />
                </View>
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
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  nhaiBrand: {
    color: COLORS.primary,
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
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    marginBottom: 0,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  confidenceBox: {
    marginTop: 8,
    marginBottom: 12,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  syncRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 4,
    alignItems: 'flex-start',
  },
});
