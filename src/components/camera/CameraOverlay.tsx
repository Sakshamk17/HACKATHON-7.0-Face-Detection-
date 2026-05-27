import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { Typography } from '../ui/Typography';
import { FaceBoundingBox } from './FaceBoundingBox';
import { useAppStore } from '../../core/store/useAppStore';
import type { FaceDetectionStatus } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  mode: 'ENROLL' | 'VERIFY';
  /** Whether to show debug panel (FPS, detection coords) */
  showDebug?: boolean;
};

// ─── Status Label Map ─────────────────────────────────────────────────────────

const STATUS_LABEL: Record<FaceDetectionStatus, string> = {
  idle: 'Initializing...',
  detecting: 'Scanning...',
  face_detected: 'Face Detected ✓',
  no_face: 'No Face Found',
  error: 'Detection Error',
};

const STATUS_COLOR: Record<FaceDetectionStatus, string> = {
  idle: 'rgba(255,255,255,0.5)',
  detecting: 'rgba(255,255,255,0.7)',
  face_detected: '#00FF88',
  no_face: 'rgba(255,200,100,0.9)',
  error: 'rgba(255,80,80,0.9)',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const CameraOverlay: React.FC<Props> = React.memo(({ mode, showDebug = false }) => {
  // Use separate primitive/stable selectors — returning a new object every call
  // will cause useSyncExternalStore infinite loop in React 19 + Zustand v5
  const detectedFaces = useAppStore((s) => s.detectedFaces);
  const detectionStatus = useAppStore((s) => s.detectionStatus);
  const detectionFps = useAppStore((s) => s.detectionFps);

  // Animate status label opacity on change
  const statusOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(statusOpacity, { toValue: 0.3, duration: 80, useNativeDriver: true }),
      Animated.timing(statusOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [detectionStatus, statusOpacity]);

  const hasFace = detectedFaces.length > 0;
  const statusColor = STATUS_COLOR[detectionStatus];
  const statusLabel = STATUS_LABEL[detectionStatus];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">

      {/* ── Header ── */}
      <View style={styles.header}>
        <Typography variant="h3" style={styles.headerText}>
          {mode === 'ENROLL' ? 'Enroll Face' : 'Verify Identity'}
        </Typography>
      </View>

      {/* ── Face Bounding Boxes ── */}
      {detectedFaces.map((face, index) => (
        <FaceBoundingBox
          key={face.trackingId ?? index}
          bounds={face.screenBounds}
          isLocked={detectionStatus === 'face_detected'}
          faceIndex={index}
          showDebug={showDebug}
        />
      ))}

      {/* ── Guide oval — shown when no face detected ── */}
      {!hasFace && detectionStatus !== 'idle' && (
        <View style={styles.guideContainer} pointerEvents="none">
          <View
            style={[
              styles.guideFrame,
              detectionStatus === 'no_face' && styles.guideFrameNoFace,
            ]}
          />
        </View>
      )}

      {/* ── Status indicator ── */}
      <Animated.View style={[styles.statusContainer, { opacity: statusOpacity }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
        {hasFace && detectedFaces.length > 1 && (
          <View style={styles.faceBadge}>
            <Text style={styles.faceBadgeText}>{detectedFaces.length} faces</Text>
          </View>
        )}
      </Animated.View>

      {/* ── Debug panel ── */}
      {showDebug && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugText}>Detection FPS: {detectionFps.toFixed(1)}</Text>
          <Text style={styles.debugText}>Status: {detectionStatus}</Text>
          <Text style={styles.debugText}>Faces: {detectedFaces.length}</Text>
          {detectedFaces[0] && (
            <Text style={styles.debugText}>
              Box: {Math.round(detectedFaces[0].screenBounds.left)},{Math.round(detectedFaces[0].screenBounds.top)}{' '}
              {Math.round(detectedFaces[0].screenBounds.width)}×{Math.round(detectedFaces[0].screenBounds.height)}
            </Text>
          )}
        </View>
      )}

      {/* ── Footer instruction ── */}
      <View style={styles.footer}>
        <Typography variant="body" style={styles.footerText}>
          {hasFace
            ? mode === 'ENROLL'
              ? 'Hold still for enrollment'
              : 'Verifying...'
            : 'Position your face in frame'}
        </Typography>
      </View>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  headerText: {
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  guideContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: 240,
    height: 320,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 140,
    borderStyle: 'dashed',
  },
  guideFrameNoFace: {
    borderColor: 'rgba(255, 200, 100, 0.5)',
  },
  statusContainer: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  faceBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  faceBadgeText: {
    color: '#fff',
    fontSize: 11,
  },
  debugPanel: {
    position: 'absolute',
    bottom: 120,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
    gap: 3,
  },
  debugText: {
    color: '#00FF88',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

