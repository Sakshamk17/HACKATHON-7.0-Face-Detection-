import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Text,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useIsFocused } from '@react-navigation/native';
import { Camera } from 'react-native-vision-camera';
import type { CameraRef } from 'react-native-vision-camera';

import { RootStackParamList } from '../types';
import { Button } from '../components/ui/Button';
import { Typography } from '../components/ui/Typography';
import { useCameraSetup } from '../hooks/useCameraSetup';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { useLiveness } from '../hooks/useLiveness';
import { CameraOverlay } from '../components/camera/CameraOverlay';
import { useAppStore } from '../core/store/useAppStore';
import {
  enrollFaceFromImage,
  verifyFace,
  verifyFaceFromImage,
} from '../core/backend/faceAuthBackend';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Camera'>;
  route: RouteProp<RootStackParamList, 'Camera'>;
};

const MODEL_SNAPSHOT_QUALITY = 85;

// ─── Component ────────────────────────────────────────────────────────────────

export const CameraScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mode, enrollmentName } = route.params;
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission, device } = useCameraSetup();

  // ── Refs ────────────────────────────────────────────────────────────────────
  const cameraRef = useRef<CameraRef>(null);

  // ── View layout (for coordinate mapping) ───────────────────────────────────
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
  const onLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      setViewSize({ width, height });
    },
    [],
  );

  // ── Debug toggle ────────────────────────────────────────────────────────────
  const [showDebug, setShowDebug] = useState(false);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultStatus, setResultStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const verificationHandledRef = useRef(false);

  const detectedFaces = useAppStore((state) => state.detectedFaces);

  const captureModelInput = useCallback(async (): Promise<string> => {
    const image = await cameraRef.current?.takeSnapshot?.();
    if (!image) {
      throw new Error('Camera snapshot failed');
    }

    const tempPath = await image.saveToTemporaryFileAsync('jpg', MODEL_SNAPSHOT_QUALITY);
    return `file://${tempPath}`;
  }, []);

  // ── Permission loading state ─────────────────────────────────────────────
  const [isInitializing, setIsInitializing] = useState(!hasPermission);
  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission().finally(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }
  }, [hasPermission, requestPermission]);

  // ── Face detection pipeline ─────────────────────────────────────────────────
  // Only active when screen is focused, permission granted, and device ready
  const isDetectionActive = isFocused && hasPermission && device != null && !isInitializing;
  // Use liveness mode (classificationMode:all) in VERIFY mode
  const isVerifyMode = mode === 'VERIFY';

  const { detectionFps } = useFaceDetection({
    cameraRef,
    viewSize,
    isActive: isDetectionActive,
    livenessMode: isVerifyMode,
    debug: __DEV__,
  });

  // ── Liveness verification (VERIFY mode only) ────────────────────────────────
  const { resetLiveness } = useLiveness({
    isActive: isDetectionActive && isVerifyMode,
    onVerified: async () => {
      if (__DEV__) console.log('[CameraScreen] Liveness VERIFIED');
      if (verificationHandledRef.current) return;
      verificationHandledRef.current = true;

      const state = useAppStore.getState();
      const face = state.detectedFaces[0];

      if (!face) {
        setResultStatus('error');
        setResultMessage('No face available for verification');
        return;
      }

      setIsProcessingResult(true);
      try {
        const imageUri = await captureModelInput();
        const result = await verifyFaceFromImage({
          imageUri,
          livenessPassed: true,
          deviceId: 'mobile-local',
        });
        useAppStore.getState().recordAttendance(result.record);
        setResultStatus(result.status === 'SUCCESS' ? 'success' : 'error');
        setResultMessage(
          `${result.message} (${(result.confidence * 100).toFixed(1)}% confidence)`,
        );
      } finally {
        setIsProcessingResult(false);
      }
    },
    onFailed: async () => {
      if (__DEV__) console.log('[CameraScreen] Liveness FAILED');
      if (verificationHandledRef.current) return;
      verificationHandledRef.current = true;

      setIsProcessingResult(true);
      try {
        const result = await verifyFace({
          embedding: [],
          livenessPassed: false,
          deviceId: 'mobile-local',
        });
        useAppStore.getState().recordAttendance(result.record);
        setResultStatus('error');
        setResultMessage(result.message);
      } finally {
        setIsProcessingResult(false);
      }
    },
  });

  const handleLivenessRetry = useCallback(() => {
    verificationHandledRef.current = false;
    setResultStatus('idle');
    setResultMessage('');
    resetLiveness();
  }, [resetLiveness]);

  const handleEnrollmentCapture = useCallback(async () => {
    if (detectedFaces.length === 0 || !enrollmentName) return;

    setIsProcessingResult(true);
    try {
      const imageUri = await captureModelInput();
      const result = await enrollFaceFromImage({
        name: enrollmentName,
        imageUri,
      });
      useAppStore.getState().enrollUser(result.user);
      setResultStatus('success');
      setResultMessage(
        result.modelUsed
          ? `${result.user.name} enrolled with ML model`
          : `${result.user.name} enrolled and saved`,
      );
    } catch (error) {
      setResultStatus('error');
      setResultMessage('Enrollment could not run through ML model');
      if (__DEV__) console.warn('[CameraScreen] Enrollment error:', error);
    } finally {
      setIsProcessingResult(false);
    }
  }, [captureModelInput, detectedFaces.length, enrollmentName]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Loading
  // ─────────────────────────────────────────────────────────────────────────────

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
        <Typography style={{ color: '#fff', marginTop: 16 }}>
          Initializing Camera...
        </Typography>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: No Permission
  // ─────────────────────────────────────────────────────────────────────────────

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Typography variant="h3" style={{ color: '#fff', marginBottom: 16 }}>
          Camera Permission Required
        </Typography>
        <Typography style={{ color: '#999', marginBottom: 32, textAlign: 'center' }}>
          This app requires camera access to perform facial recognition and liveness detection.
        </Typography>
        <Button title="Grant Permission" onPress={requestPermission} />
        <Button
          title="Go Back"
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: No Device
  // ─────────────────────────────────────────────────────────────────────────────

  if (device == null) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Typography variant="h3" style={{ color: '#fff', marginBottom: 16 }}>
          No Camera Device Found
        </Typography>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Camera + Detection Overlay
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        pixelFormat="yuv"
      />

      {/* Face detection overlay — bounding boxes, status, debug panel, liveness */}
      <CameraOverlay mode={mode} showDebug={showDebug} onLivenessRetry={handleLivenessRetry} />

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {resultMessage.length > 0 && (
          <View
            style={[
              styles.resultPanel,
              resultStatus === 'success' ? styles.resultSuccess : styles.resultError,
            ]}
          >
            <Text style={styles.resultText}>{resultMessage}</Text>
          </View>
        )}

        {mode === 'ENROLL' && (
          <Button
            title={isProcessingResult ? 'Saving...' : 'Capture & Save'}
            onPress={handleEnrollmentCapture}
            disabled={isProcessingResult || detectedFaces.length === 0 || !enrollmentName}
            style={styles.button}
          />
        )}

        {mode === 'VERIFY' && resultStatus !== 'idle' && (
          <Button
            title="View History"
            onPress={() => navigation.navigate('AttendanceHistory')}
            disabled={isProcessingResult}
            style={styles.button}
          />
        )}

        {/* Debug toggle */}
        <Pressable
          onPress={() => setShowDebug((v) => !v)}
          style={styles.debugToggle}
        >
          <Text style={styles.debugToggleText}>
            {showDebug ? `⚡ ${detectionFps.toFixed(1)} fps` : '⚡ Debug'}
          </Text>
        </Pressable>

        <Button
          title="Go Back"
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={styles.button}
        />
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    zIndex: 20,
    gap: 10,
    alignItems: 'center',
  },
  button: {
    width: '100%',
  },
  resultPanel: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: 'rgba(0, 70, 35, 0.82)',
    borderColor: 'rgba(0, 255, 136, 0.55)',
  },
  resultError: {
    backgroundColor: 'rgba(80, 10, 10, 0.82)',
    borderColor: 'rgba(255, 82, 82, 0.55)',
  },
  resultText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.4)',
  },
  debugToggleText: {
    color: '#00FF88',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
