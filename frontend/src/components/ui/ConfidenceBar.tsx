import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../config/theme';

interface ConfidenceBarProps {
  confidence: number; // 0.0 to 1.0
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence }) => {
  const percentage = Math.min(Math.max(confidence * 100, 0), 100);
  
  let color = COLORS.danger;
  if (percentage >= 80) color = COLORS.success;
  else if (percentage >= 50) color = COLORS.warning;

  return (
    <View style={styles.container}>
      <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
