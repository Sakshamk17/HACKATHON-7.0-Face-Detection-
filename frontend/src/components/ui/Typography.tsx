import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { COLORS } from '../../config/theme';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  style,
  ...props
}) => {
  return (
    <Text style={[styles[variant], style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primaryText,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.primaryText,
    marginBottom: 12,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primaryText,
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: COLORS.secondaryText,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    color: COLORS.secondaryText,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
});
