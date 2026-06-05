import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Typography } from '../ui/Typography';
import { StatusBadge } from '../ui/Badges';
import { Button } from '../ui/Button';
import { COLORS } from '../../config/theme';

interface SuccessOverlayProps {
  mode: 'ENROLL' | 'VERIFY';
  name: string;
  confidence: number;
  onContinue: () => void;
  onViewHistory: () => void;
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({
  mode,
  name,
  confidence,
  onContinue,
  onViewHistory,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const isVerify = mode === 'VERIFY';

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Typography variant="h1" style={styles.title}>
            {isVerify ? 'Personnel Verified' : 'Personnel Enrolled'}
          </Typography>
        </View>

        <View style={styles.detailsBox}>
          <Typography variant="label">
            {isVerify ? 'Identity Match' : 'Reference Profile'}
          </Typography>
          <Typography variant="h2">{name}</Typography>
          {isVerify && (
            <Typography variant="caption" style={styles.confidence}>
              Match Confidence: {(confidence * 100).toFixed(1)}%
            </Typography>
          )}
        </View>

        <View style={styles.checklist}>
          <View style={styles.checkItem}>
            <StatusBadge status="success" text="OK" />
            <Typography variant="body" style={styles.checkText}>Face Detected</Typography>
          </View>
          <View style={styles.checkItem}>
            <StatusBadge status="success" text="OK" />
            <Typography variant="body" style={styles.checkText}>
              {isVerify ? 'Liveness Verified' : 'Image Quality'}
            </Typography>
          </View>
          <View style={styles.checkItem}>
            <StatusBadge status="success" text="OK" />
            <Typography variant="body" style={styles.checkText}>
              {isVerify ? 'Identity Verified' : 'Profile Created'}
            </Typography>
          </View>
        </View>

        <View style={styles.storageBox}>
          <Typography variant="body" style={styles.storageText}>
            {isVerify ? '✓ Attendance Stored Offline' : '✓ Identity Stored Offline'}
          </Typography>
          <View style={styles.syncBox}>
            <Typography variant="caption">Pending Sync Queue</Typography>
            <StatusBadge status="pending" text="Awaiting Network" />
          </View>
        </View>

        <View style={styles.actions}>
          <Button 
            title={isVerify ? "Continue Operations" : "Done"} 
            onPress={onContinue} 
            style={styles.button} 
          />
          {isVerify && (
            <Button 
              title="View Log" 
              variant="secondary" 
              onPress={onViewHistory} 
              style={styles.button} 
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 24,
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: COLORS.success,
    marginBottom: 0,
    textAlign: 'center',
  },
  detailsBox: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confidence: {
    color: COLORS.success,
    fontWeight: 'bold',
  },
  checklist: {
    gap: 12,
    marginBottom: 24,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkText: {
    fontWeight: '500',
    color: COLORS.primaryText,
  },
  storageBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    marginBottom: 24,
  },
  storageText: {
    color: COLORS.success,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  syncBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
