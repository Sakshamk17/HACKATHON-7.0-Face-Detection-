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
import { CameraOverlay } from '../components/camera/CameraOverlay';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Camera'>;
  route: RouteProp<RootStackParamList, 'Camera'>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const CameraScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mode } = route.params;
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

  const { detectionFps } = useFaceDetection({
    cameraRef,
    viewSize,
    isActive: isDetectionActive,
    debug: __DEV__,
  });

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

      {/* Face detection overlay — bounding boxes, status, debug panel */}
      <CameraOverlay mode={mode} showDebug={showDebug} />

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
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

