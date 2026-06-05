import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Typography } from '../ui/Typography';
import { CHALLENGE_INSTRUCTIONS } from '../../core/liveness/challengeManager';
import { useAppStore } from '../../core/store/useAppStore';
import { COLORS } from '../../config/theme';

export const LivenessOverlay: React.FC = () => {
  const liveness = useAppStore((state) => state.livenessState);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (liveness.status !== 'idle') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [liveness.status, fadeAnim]);

  if (liveness.status === 'idle') return null;

  return (
    <Animated.View 
      style={[styles.container, { opacity: fadeAnim }]}
    >
      <View style={styles.card}>
        <Typography variant="label" style={styles.brand}>LIVENESS PROTOCOL</Typography>
        
        <View style={styles.progressRow}>
          {Array.from({ length: liveness.totalChallenges }).map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                i < liveness.challengeIndex && styles.dotComplete,
                i === liveness.challengeIndex && styles.dotActive
              ]} 
            />
          ))}
        </View>

        <Typography variant="h2" style={styles.statusText}>
          {liveness.status === 'waiting_for_face' && 'Position Face in Frame'}
          {liveness.status === 'face_stable' && 'Locking Target...'}
          {liveness.status === 'challenge_active' && liveness.currentChallenge && CHALLENGE_INSTRUCTIONS[liveness.currentChallenge]}
          {liveness.status === 'challenge_passed' && 'Verification Step Complete'}
          {liveness.status === 'retrying' && 'Sequence Failed. Retrying...'}
          {liveness.status === 'verified' && 'Liveness Confirmed'}
          {liveness.status === 'failed' && 'Protocol Failed'}
        </Typography>

        {(liveness.status === 'waiting_for_face' || liveness.status === 'face_stable') && (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        )}

        {liveness.status === 'challenge_active' && (
          <View style={styles.timeoutBarContainer}>
            <View 
              style={[
                styles.timeoutBar, 
                { width: `${Math.max(0, Math.min(100, (liveness.timeRemaining / 6000) * 100))}%` }
              ]} 
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  brand: {
    color: COLORS.primary,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 24,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  dotActive: {
    backgroundColor: COLORS.warning,
  },
  dotComplete: {
    backgroundColor: COLORS.success,
  },
  statusText: {
    textAlign: 'center',
    marginBottom: 0,
  },
  loader: {
    marginTop: 16,
  },
  timeoutBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  timeoutBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
});
