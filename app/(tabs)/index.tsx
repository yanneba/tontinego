import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Card } from '@/components/Card';
import { MemberRow, formatFcfa } from '@/components/MemberRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { getTontine, listTontines, payContribution } from '@/api/client';
import { useAuth } from '@/store/auth';
import {
  COLORS,
  FONT_SIZES,
  RADII,
  SHADOWS,
  SPACING,
} from '@/constants/theme';
import type { Member, Tontine, TontineDetail } from '@/types';

export default function HomeScreen() {
  const { user } = useAuth();
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [activeTontine, setActiveTontine] = useState<TontineDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [payFeedback, setPayFeedback] = useState<string | null>(null);

  const loadData = useCallback(async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    setError(null);
    try {
      const data = await listTontines();
      setTontines(data);
      const active = data.find((item) => item.status !== 'completed') ?? data[0] ?? null;
      if (active) {
        const detail = await getTontine(active.id);
        setActiveTontine(detail);
        setMembers(detail.members);
      } else {
        setActiveTontine(null);
        setMembers([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Recharger à chaque retour sur l'accueil (après paiement, création…).
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) void loadData(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  async function handlePay() {
    if (!activeTontine) return;
    setIsPaying(true);
    setPayFeedback(null);
    try {
      const result = await payContribution(activeTontine.id);
      setPayFeedback(result.already_paid ? '✅ Cette cotisation était déjà réglée.' : '✅ Cotisation enregistrée, merci !');
      await loadData(true);
    } catch (e) {
      setPayFeedback(e instanceof Error ? `⚠️ ${e.message}` : '⚠️ Paiement impossible.');
    } finally {
      setIsPaying(false);
    }
  }

  const firstName = user?.name.split(' ')[0] ?? '';
  const pot = activeTontine?.pot_total_collected ?? 0;
  const turn = activeTontine?.current_round ?? 0;
  const totalTurns = activeTontine?.member_count_target ?? 1;
  const progress = totalTurns > 0 ? Math.min(1, turn / totalTurns) : 0;
  const canPay = activeTontine?.status === 'active';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.content}
        data={members}
        keyExtractor={(m) => String(m.user_id)}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadData(true)} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.greetingRow}>
              <View>
                <Text style={styles.greeting}>Bonjour {firstName} 👋</Text>
                <Text style={styles.subtitle}>Voici votre tontine du moment</Text>
              </View>
            </View>

            {error ? (
              <ErrorState message={error} onRetry={() => void loadData(true)} />
            ) : !activeTontine ? (
              <EmptyState
                emoji="🪙"
                title="Aucune tontine active"
                message="Rejoignez une tontine avec un code d'invitation ou créez la vôtre."
                actionLabel="Voir mes tontines"
                onAction={() => router.navigate('/(tabs)/tontines')}
              />
            ) : (
              <>
                <Card style={styles.potCard}>
                  <Text style={styles.potLabel}>Caisse commune</Text>
                  <Text style={styles.potAmount}>{formatFcfa(pot)}</Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.max(4, progress * 100)}%` as `${number}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressCaption}>
                    Tour {turn}/{totalTurns} · {activeTontine.name}
                  </Text>
                </Card>

                {payFeedback ? (
                  <Text style={styles.feedback}>{payFeedback}</Text>
                ) : null}

                <PrimaryButton
                  label={
                    activeTontine.status === 'forming'
                      ? `En attente de ${activeTontine.member_count_target - activeTontine.member_count} membre(s)`
                      : activeTontine.status === 'completed'
                        ? 'Tontine terminée'
                        : `Simuler le paiement · ${formatFcfa(activeTontine.amount_per_member)}`
                  }
                  onPress={() => void handlePay()}
                  loading={isPaying}
                  disabled={!canPay}
                />

                {canPay ? (
                  <Text style={styles.demoNotice}>
                    Mode pilote : aucun débit Mobile Money réel ne sera effectué.
                  </Text>
                ) : null}

                <Text style={styles.sectionTitle}>Membres</Text>
              </>
            )}
          </>
        }
        renderItem={({ item }) => (
          <Card style={styles.memberCard}>
            <MemberRow member={item} amount={activeTontine?.amount_per_member} />
          </Card>
        )}
        ListEmptyComponent={
          error === null && activeTontine !== null ? (
            <EmptyState emoji="👥" title="Aucun membre pour le moment" />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.xl,
    gap: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  greetingRow: {
    marginBottom: SPACING.sm,
  },
  greeting: {
    fontSize: FONT_SIZES.display,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FONT_SIZES.body,
    color: COLORS.muted,
  },
  potCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.card,
    ...SHADOWS.card,
  },
  potLabel: {
    color: COLORS.primarySoft,
    fontSize: FONT_SIZES.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  potAmount: {
    marginTop: SPACING.sm,
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  progressTrack: {
    height: 10,
    borderRadius: RADII.badge,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: SPACING.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADII.badge,
    backgroundColor: COLORS.accent,
  },
  progressCaption: {
    marginTop: SPACING.md,
    color: COLORS.primarySoft,
    fontSize: FONT_SIZES.caption,
    fontWeight: '700',
  },
  feedback: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.success,
  },
  demoNotice: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.muted,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  memberCard: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
});
