import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from './Badge';
import { COLORS, FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import type { Member } from '@/types';

const AVATAR_PALETTE = ['#003DA5', '#C8963E', '#0D7C4A', '#D9822B', '#7A3EA1', '#2B7DA8'];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} F`;
}

interface MemberRowProps {
  member: Member;
  /** Montant de la cotisation affiché dans la ligne (optionnel). */
  amount?: number;
}

export function MemberRow({ member, amount }: MemberRowProps) {
  const paid = member.paid_current_round === true;
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: avatarColor(member.name) }]}>
        <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {member.name}
        </Text>
        <Text style={styles.sub}>
          {member.role === 'creator' ? 'Créateur' : member.role === 'treasurer' ? 'Trésorier' : 'Membre'}
          {amount !== undefined ? ` · ${formatFcfa(amount)}` : ''}
        </Text>
      </View>
      <Badge label={paid ? 'Payé' : 'En attente'} tone={paid ? 'success' : 'warning'} icon={paid ? '✓' : undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: RADII.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  sub: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.muted,
  },
});
