import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, RADII, SPACING } from '@/constants/theme';

type BadgeTone = 'success' | 'warning' | 'accent' | 'info' | 'neutral';

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  success: { bg: COLORS.successSoft, fg: COLORS.success },
  warning: { bg: COLORS.warningSoft, fg: COLORS.warning },
  accent: { bg: COLORS.accentSoft, fg: COLORS.accent },
  info: { bg: COLORS.primarySoft, fg: COLORS.primary },
  neutral: { bg: COLORS.background, fg: COLORS.muted },
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: string;
}

export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const palette = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.fg }]}>{icon ? `${icon} ${label}` : label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADII.badge,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '700',
  },
});
