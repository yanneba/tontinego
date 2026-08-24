import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { CardTitle } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState } from '@/components/states';
import { useAuth } from '@/store/auth';
import {
  COLORS,
  DEFAULT_API_URL,
  FONT_SIZES,
  RADII,
  SHADOWS,
  SPACING,
} from '@/constants/theme';

export default function ProfileScreen() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.phone}>{user.phone}</Text>

        <Card style={styles.infoCard}>
          <CardTitle style={styles.sectionTitle}>Compte</CardTitle>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Nom</Text>
            <Text style={styles.rowValue}>{user.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Téléphone</Text>
            <Text style={styles.rowValue}>{user.phone}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Serveur API</Text>
            <Text style={styles.rowValueSmall} numberOfLines={1}>
              {DEFAULT_API_URL}
            </Text>
          </View>
        </Card>

        <PrimaryButton label="Se déconnecter" variant="danger" onPress={() => void signOut()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: SPACING.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: RADII.avatar,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: '900',
  },
  name: {
    textAlign: 'center',
    fontSize: FONT_SIZES.display,
    fontWeight: '800',
    color: COLORS.text,
  },
  phone: {
    textAlign: 'center',
    fontSize: FONT_SIZES.body,
    color: COLORS.muted,
    marginTop: -SPACING.sm,
  },
  infoCard: {
    gap: SPACING.md,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  rowLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.muted,
  },
  rowValue: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  rowValueSmall: {
    flexShrink: 1,
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    color: COLORS.text,
  },
});
