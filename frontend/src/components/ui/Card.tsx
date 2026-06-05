import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { COLORS } from '../../config/theme';

export const Card: React.FC<ViewProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    // Minimal shadow for flat, professional look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
});
