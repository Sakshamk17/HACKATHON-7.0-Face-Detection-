import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../config/theme';

type Props = {
  bounds: { x?: number; y?: number; left?: number; top?: number; width: number; height: number };
  isLocked?: boolean;
  faceIndex?: number;
  showDebug?: boolean;
};

export const FaceBoundingBox: React.FC<Props> = React.memo(({ bounds, isLocked }) => {
  // Handle ML Kit coordinate mapping differences
  const x = bounds.left ?? bounds.x ?? 0;
  const y = bounds.top ?? bounds.y ?? 0;
  const width = bounds.width;
  const height = bounds.height;

  const animLeft = useRef(new Animated.Value(x)).current;
  const animTop = useRef(new Animated.Value(y)).current;
  const animWidth = useRef(new Animated.Value(width)).current;
  const animHeight = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.spring(animLeft, { toValue: x, useNativeDriver: false, friction: 8 }).start();
    Animated.spring(animTop, { toValue: y, useNativeDriver: false, friction: 8 }).start();
    Animated.spring(animWidth, { toValue: width, useNativeDriver: false, friction: 8 }).start();
    Animated.spring(animHeight, { toValue: height, useNativeDriver: false, friction: 8 }).start();
  }, [x, y, width, height]);

  const color = isLocked ? COLORS.success : COLORS.warning;

  return (
    <Animated.View style={[styles.container, {
      left: animLeft,
      top: animTop,
      width: animWidth,
      height: animHeight,
    }]}>
      {/* Top Left */}
      <Animated.View style={[styles.corner, styles.topLeft, { borderColor: color }]} />
      {/* Top Right */}
      <Animated.View style={[styles.corner, styles.topRight, { borderColor: color }]} />
      {/* Bottom Left */}
      <Animated.View style={[styles.corner, styles.bottomLeft, { borderColor: color }]} />
      {/* Bottom Right */}
      <Animated.View style={[styles.corner, styles.bottomRight, { borderColor: color }]} />
      
      {/* Center crosshair minimal */}
      <Animated.View style={[styles.crosshairX, { backgroundColor: color }]} />
      <Animated.View style={[styles.crosshairY, { backgroundColor: color }]} />
    </Animated.View>
  );
});

const CORNER_SIZE = 24;
const BORDER_WIDTH = 4;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
  },
  crosshairX: {
    position: 'absolute',
    width: 12,
    height: 1,
    opacity: 0.5,
  },
  crosshairY: {
    position: 'absolute',
    width: 1,
    height: 12,
    opacity: 0.5,
  },
});
