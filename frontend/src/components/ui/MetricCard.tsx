import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Typography } from './Typography';
import { COLORS } from '../../config/theme';

interface MetricCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, highlight }) => {
  return (
    <Card style={[styles.container, highlight && styles.highlight]}>
      <Typography variant="caption" style={highlight ? styles.highlightText : undefined}>
        {label}
      </Typography>
      <Typography variant="h2" style={[styles.value, highlight ? styles.highlightText : undefined]}>
        {value}
      </Typography>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginBottom: 0,
  },
  highlight: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  highlightText: {
    color: '#FFFFFF',
  },
  value: {
    marginBottom: 0,
    marginTop: 4,
  },
});
