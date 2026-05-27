/**
 * LivenessOverlay.tsx
 *
 * Premium liveness challenge UI overlay.
 *
 * Visual design:
 * - Bottom card with challenge instruction + icon
 * - Animated progress arc (timeout indicator)
 * - Step dots showing challenge sequence
 * - Animated success / failure state transitions
 * - Retry button on failure
 *
 * Subscribes to livenessState from Zustand store.
 * Completely isolated from detection logic — pure UI.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { useAppStore } from '../../core/store/useAppStore';
import { CHALLENGE_ICONS, TOTAL_CHALLENGES } from '../../core/liveness/challengeManager';
import type { LivenessStatus, ChallengeType } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onRetry?: () => void;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<LivenessStatus, string> = {
  idle: 'rgba(255,255,255,0.2)',
  waiting_for_face: 'rgba(255,255,255,0.5)',
  face_stable: '#4FC3F7',
  challenge_active: '#FFFFFF',
  challenge_passed: '#00FF88',
  verified: '#00FF88',
  failed: '#FF5252',
  retrying: '#FFB74D',
};

const STATUS_BG: Record<LivenessStatus, string> = {
  idle: 'rgba(0,0,0,0)',
  waiting_for_face: 'rgba(0,0,0,0.55)',
  face_stable: 'rgba(10,30,50,0.75)',
  challenge_active: 'rgba(10,10,30,0.82)',
  challenge_passed: 'rgba(0,40,20,0.82)',
  verified: 'rgba(0,50,25,0.92)',
  failed: 'rgba(40,5,5,0.92)',
  retrying: 'rgba(40,25,0,0.88)',
};

// ─── Step Dots ────────────────────────────────────────────────────────────────

const StepDots: React.FC<{ total: number; current: number; status: LivenessStatus }> =
  React.memo(({ total, current, status }) => (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current || status === 'verified';
        const active = i === current && status === 'challenge_active';
        return (
          <View
            key={i}
            style={[
              styles.dot,
              done && styles.dotDone,
              active && styles.dotActive,
            ]}
          />
        );
      })}
    </View>
  ));

// ─── Progress Arc (pure CSS border trick) ────────────────────────────────────

const TimeoutBar: React.FC<{ progress: number; color: string }> = React.memo(
  ({ progress, color }) => {
    const widthAnim = useRef(new Animated.Value(progress)).current;

    useEffect(() => {
      Animated.timing(widthAnim, {
        toValue: progress,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }, [progress, widthAnim]);

    return (
      <View style={styles.timeoutTrack}>
        <Animated.View
          style={[
            styles.timeoutBar,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: color,
            },
          ]}
        />
      </View>
    );
  },
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const LivenessOverlay: React.FC<Props> = React.memo(({ onRetry }) => {
  const livenessState = useAppStore((s) => s.livenessState);
  const { status, currentChallenge, challengeProgress, challengeIndex, instruction } =
    livenessState;

  // Animate card entrance
  const cardTranslateY = useRef(new Animated.Value(120)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const showCard = useCallback(() => {
    Animated.parallel([
      Animated.spring(cardTranslateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardTranslateY, cardOpacity]);

  const hideCard = useCallback(() => {
    Animated.parallel([
      Animated.timing(cardTranslateY, { toValue: 120, duration: 200, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [cardTranslateY, cardOpacity]);

  useEffect(() => {
    if (status === 'idle' || status === 'waiting_for_face') {
      hideCard();
    } else {
      showCard();
    }
  }, [status, showCard, hideCard]);

  // Pulse animation for challenge icon
  const iconScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (status === 'challenge_active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconScale, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(iconScale, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      iconScale.stopAnimation();
      iconScale.setValue(1);
    }
  }, [status, iconScale]);

  const statusColor = STATUS_COLORS[status];
  const bgColor = STATUS_BG[status];
  const icon = currentChallenge ? CHALLENGE_ICONS[currentChallenge as ChallengeType] : null;

  // Don't render when idle
  if (status === 'idle') return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

      {/* ── Waiting for face — simple banner ── */}
      {status === 'waiting_for_face' && (
        <View style={styles.waitingBanner}>
          <Text style={styles.waitingText}>👤 Look into the camera</Text>
        </View>
      )}

      {/* ── Main challenge card ── */}
      {status !== 'waiting_for_face' && (
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: bgColor, transform: [{ translateY: cardTranslateY }], opacity: cardOpacity },
          ]}
        >
          {/* Step dots */}
          {(status === 'challenge_active' || status === 'challenge_passed') && (
            <StepDots
              total={TOTAL_CHALLENGES}
              current={challengeIndex}
              status={status}
            />
          )}

          {/* Challenge icon */}
          {icon && (
            <Animated.Text
              style={[styles.challengeIcon, { transform: [{ scale: iconScale }] }]}
            >
              {icon}
            </Animated.Text>
          )}

          {/* Verified icon */}
          {status === 'verified' && (
            <Text style={styles.verifiedIcon}>✅</Text>
          )}

          {/* Failed icon */}
          {(status === 'failed' || status === 'retrying') && (
            <Text style={styles.verifiedIcon}>
              {status === 'retrying' ? '🔄' : '❌'}
            </Text>
          )}

          {/* Face stable progress */}
          {status === 'face_stable' && (
            <Text style={styles.challengeIcon}>🎯</Text>
          )}

          {/* Instruction text */}
          <Text style={[styles.instruction, { color: statusColor }]}>{instruction}</Text>

          {/* Timeout progress bar */}
          {status === 'challenge_active' && (
            <TimeoutBar
              progress={1 - challengeProgress}
              color={challengeProgress > 0.7 ? '#FF5252' : '#4FC3F7'}
            />
          )}

          {/* Face stable progress bar */}
          {status === 'face_stable' && (
            <TimeoutBar progress={challengeProgress} color="#4FC3F7" />
          )}

          {/* Retry button */}
          {status === 'failed' && onRetry && (
            <Pressable onPress={onRetry} style={styles.retryButton}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  waitingBanner: {
    position: 'absolute',
    bottom: 160,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  waitingText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '500',
  },
  card: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    borderRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    // Glassmorphism shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotDone: {
    backgroundColor: '#00FF88',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 20,
    borderRadius: 4,
  },
  challengeIcon: {
    fontSize: 44,
    textAlign: 'center',
  },
  verifiedIcon: {
    fontSize: 44,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  timeoutTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  timeoutBar: {
    height: 4,
    borderRadius: 2,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
