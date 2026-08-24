import React from 'react';
import { StyleSheet, Text, TextProps, View, ViewProps } from 'react-native';
import { COLORS, FONT_SIZES, RADII, SHADOWS, SPACING } from '@/constants/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function CardTitle(props: TextProps) {
  return <Text {...props} style={[styles.title, props.style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: '700',
    color: COLORS.text,
  },
});
