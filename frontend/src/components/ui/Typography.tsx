import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'body' | 'caption';
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
    color: '#000',
    marginBottom: 16,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    color: '#999',
  },
});
