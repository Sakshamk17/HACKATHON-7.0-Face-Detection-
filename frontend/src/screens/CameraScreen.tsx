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
import { SuccessOverlay } from '../components/camera/SuccessOverlay';
import { useAppStore } from '../core/store/useAppStore';
import { enrollFace, verifyFace } from '../core/backend/faceAuthBackend';
import { createEmbeddingFromDetectionSignal } from '../core/ml/embeddingAdapter';
import { COLORS } from '../config/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Camera'>;
  route: RouteProp<RootStackParamList, 'Camera'>;
};

export const CameraScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mode, enrollmentName } = route.params;
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission, device } = useCameraSetup();

  const cameraRef = useRef<CameraRef>(null);

  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
  const onLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      setViewSize({ width, height });
    },
    [],
  );

  const [showDebug, setShowDebug] = useState(false);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultStatus, setResultStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // State for Success Overlay details
  const [successData, setSuccessData] = useState<{name: string, confidence: number} | null>(null);
  
  const verificationHandledRef = useRef(false);

  const detectedFaces = useAppStore((state) => state.detectedFaces);

  const [isInitializing, setIsInitializing] = useState(!hasPermission);
  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission().finally(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }
  }, [hasPermission, requestPermission]);

  const isDetectionActive = isFocused && hasPermission && device != null && !isInitializing && resultStatus !== 'success';
  const isVerifyMode = mode === 'VERIFY';

  const { detectionFps } = useFaceDetection({
    cameraRef,
    viewSize,
    isActive: isDetectionActive,
    livenessMode: isVerifyMode,
    debug: __DEV__,
  });

  const { resetLiveness } = useLiveness({
    isActive: isDetectionActive && isVerifyMode,
    onVerified: async () => {
      if (__DEV__) console.log('[CameraScreen] Liveness VERIFIED');
      if (verificationHandledRef.current) return;
      verificationHandledRef.current = true;

      const state = useAppStore.getState();
      const face = state.detectedFaces[0];
      const latestLivenessFrame =
        state.livenessFrameBuffer[state.livenessFrameBuffer.length - 1];

      if (!face) {
        setResultStatus('error');
        setResultMessage('No face available for verification');
        return;
      }

      setIsProcessingResult(true);
      try {
        const embedding = createEmbeddingFromDetectionSignal(face, latestLivenessFrame);
        const result = await verifyFace({
          embedding,
          livenessPassed: true,
          deviceId: 'mobile-local',
        });
        useAppStore.getState().recordAttendance(result.record);
        
        if (result.status === 'SUCCESS') {
          setResultStatus('success');
          setSuccessData({
            name: result.user?.name || 'Unknown',
            confidence: result.confidence
          });
        } else {
          setResultStatus('error');
          setResultMessage(result.message);
        }
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
    const state = useAppStore.getState();
    const face = state.detectedFaces[0];
    const latestLivenessFrame =
      state.livenessFrameBuffer[state.livenessFrameBuffer.length - 1];

    if (!face || !enrollmentName) return;

    setIsProcessingResult(true);
    try {
      const embedding = createEmbeddingFromDetectionSignal(face, latestLivenessFrame);
      const result = await enrollFace({
        name: enrollmentName,
        embedding,
      });
      useAppStore.getState().enrollUser(result.user);
      
      setResultStatus('success');
      setSuccessData({
        name: result.user.name,
        confidence: 1.0 // Enrollment is 100% confidence by definition
      });
    } catch (error) {
      setResultStatus('error');
      setResultMessage('Enrollment could not be saved');
    } finally {
      setIsProcessingResult(false);
    }
  }, [enrollmentName]);

  const resetSequence = () => {
    setResultStatus('idle');
    setSuccessData(null);
    setResultMessage('');
    verificationHandledRef.current = false;
    if (isVerifyMode) resetLiveness();
  };


  if (isInitializing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Typography style={{ color: '#fff', marginTop: 16 }}>
          Initializing Hardware...
        </Typography>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Typography variant="h3" style={{ color: '#fff', marginBottom: 16 }}>
          Hardware Access Required
        </Typography>
        <Typography style={{ color: '#999', marginBottom: 32, textAlign: 'center' }}>
          This app requires camera access to perform facial recognition and liveness detection.
        </Typography>
        <Button title="Grant Access" onPress={requestPermission} />
        <Button
          title="Abort Operation"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Typography variant="h3" style={{ color: '#fff', marginBottom: 16 }}>
          Hardware Fault
        </Typography>
        <Button title="Abort Operation" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused && resultStatus !== 'success'} // Pause camera on success
        pixelFormat="yuv"
      />

      <CameraOverlay mode={mode} showDebug={showDebug} onLivenessRetry={handleLivenessRetry} />

      {resultStatus === 'success' && successData && (
        <SuccessOverlay
          mode={mode}
          name={successData.name}
          confidence={successData.confidence}
          onContinue={mode === 'ENROLL' ? () => navigation.goBack() : resetSequence}
          onViewHistory={() => navigation.replace('AttendanceHistory')}
        />
      )}

      {/* Bottom controls when NOT in success state */}
      {resultStatus !== 'success' && (
        <View style={styles.bottomControls}>
          {resultMessage.length > 0 && (
            <View style={[styles.resultPanel, styles.resultError]}>
              <Text style={styles.resultText}>{resultMessage}</Text>
            </View>
          )}

          {mode === 'ENROLL' && (
            <Button
              title={isProcessingResult ? 'Processing...' : 'Capture Reference Face'}
              onPress={handleEnrollmentCapture}
              disabled={isProcessingResult || detectedFaces.length === 0 || !enrollmentName}
              style={styles.button}
            />
          )}

          {mode === 'VERIFY' && resultStatus === 'error' && (
            <Button
              title="Acknowledge Fault"
              onPress={handleLivenessRetry}
              disabled={isProcessingResult}
              style={styles.button}
              variant="danger"
            />
          )}

          <Pressable
            onPress={() => setShowDebug((v) => !v)}
            style={styles.debugToggle}
          >
            <Text style={styles.debugToggleText}>
              {showDebug ? `SYS: ${detectionFps.toFixed(1)}Hz` : 'SYS: DBG'}
            </Text>
          </Pressable>

          <Button
            title="Abort Sequence"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.button}
          />
        </View>
      )}
    </View>
  );
};

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
    gap: 12,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderColor: COLORS.primaryText,
    borderWidth: 1,
  },
  resultPanel: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  resultError: {
    backgroundColor: 'rgba(219, 68, 55, 0.9)',
    borderColor: COLORS.danger,
  },
  resultText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  debugToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  debugToggleText: {
    color: COLORS.secondaryText,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
});
