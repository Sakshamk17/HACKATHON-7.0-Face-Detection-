import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../config/theme';

interface BadgeProps {
  status: 'active' | 'offline' | 'pending' | 'success' | 'error';
  text: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, text }) => {
  let backgroundColor = COLORS.background;
  let textColor = COLORS.primaryText;

  switch (status) {
    case 'active':
    case 'success':
      backgroundColor = '#E6F4EA'; // Light green
      textColor = COLORS.success;
      break;
    case 'offline':
    case 'pending':
    case 'warning':
      backgroundColor = '#FEF7E0'; // Light yellow/orange
      textColor = COLORS.warning;
      break;
    case 'error':
      backgroundColor = '#FCE8E6'; // Light red
      textColor = COLORS.danger;
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
