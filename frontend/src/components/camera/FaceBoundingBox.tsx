/**
 * FaceBoundingBox.tsx
 *
 * Renders a single animated face bounding box over the camera preview.
 * Uses React Native Animated for smooth tracking without Reanimated dependency.
 *
 * Design:
 * - Corner bracket accents (not full border) — looks premium, less visual noise
 * - Animated scale + opacity on appear/disappear
 * - Color shifts based on detection confidence (green = good, white = scanning)
 * - Face ID badge for multi-face debugging
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import type { ScreenBounds } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CORNER_SIZE = 20;
const CORNER_THICKNESS = 3;
const ANIMATION_DURATION = 80; // ms — fast snap to position

// ─── Types ────────────────────────────────────────────────────────────────────

interface FaceBoundingBoxProps {
  bounds: ScreenBounds;
  /** Detection quality — affects color. true = locked, false = scanning */
  isLocked?: boolean;
  /** Optional face index for debugging */
  faceIndex?: number;
  /** Whether to show debug info (bounds, index) */
  showDebug?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FaceBoundingBox: React.FC<FaceBoundingBoxProps> = React.memo(
  ({ bounds, isLocked = false, faceIndex = 0, showDebug = false }) => {
    // Animated values for smooth position/size transitions
    const animTop = useRef(new Animated.Value(bounds.top)).current;
    const animLeft = useRef(new Animated.Value(bounds.left)).current;
    const animWidth = useRef(new Animated.Value(bounds.width)).current;
    const animHeight = useRef(new Animated.Value(bounds.height)).current;
    const animOpacity = useRef(new Animated.Value(0)).current;

    // Fade in on mount
    useEffect(() => {
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, [animOpacity]);

    // Smooth position / size tracking
    useEffect(() => {
      Animated.parallel([
        Animated.timing(animTop, {
          toValue: bounds.top,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(animLeft, {
          toValue: bounds.left,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(animWidth, {
          toValue: bounds.width,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(animHeight, {
          toValue: bounds.height,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
      ]).start();
    }, [bounds.top, bounds.left, bounds.width, bounds.height, animTop, animLeft, animWidth, animHeight]);

    const cornerColor = isLocked ? '#00FF88' : 'rgba(255, 255, 255, 0.85)';

    return (
      // Outer: opacity only — safe to run on native driver (GPU compositing)
      <Animated.View style={{ opacity: animOpacity }}>
        {/* Inner: layout props cannot use native driver — must be JS-driven */}
        <Animated.View
          style={[
            styles.container,
            {
              top: animTop,
              left: animLeft,
              width: animWidth,
              height: animHeight,
            },
          ]}
        >
          {/* ── Corner Brackets ── */}
          {/* Top-left */}
          <View style={[styles.corner, styles.cornerTL, { borderColor: cornerColor }]} />
          {/* Top-right */}
          <View style={[styles.corner, styles.cornerTR, { borderColor: cornerColor }]} />
          {/* Bottom-left */}
          <View style={[styles.corner, styles.cornerBL, { borderColor: cornerColor }]} />
          {/* Bottom-right */}
          <View style={[styles.corner, styles.cornerBR, { borderColor: cornerColor }]} />

          {/* ── Debug badge ── */}
          {showDebug && (
            <View style={styles.debugBadge}>
              <Text style={styles.debugText}>
                #{faceIndex} {Math.round(bounds.width)}×{Math.round(bounds.height)}
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    );
  },
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },
  debugBadge: {
    position: 'absolute',
    top: -20,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  debugText: {
    color: '#00FF88',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
