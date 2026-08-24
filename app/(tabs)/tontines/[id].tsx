import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { ProgressRing } from '@/components/ProgressRing';
import { MemberRow, formatFcfa } from '@/components/MemberRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { getTontine } from '@/api/client';
import {
  COLORS,
  FONT_SIZES,
  RADII,
  SHADOWS,
  SPACING,
} from '@/constants/theme';
import type { Contribution, Member, TontineDetail } from '@/types';

export default function TontineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tontine, setTontine] = useState<TontineDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const detail = await getTontine(id);
      setTontine(detail);
      setMembers(detail.members);
    } catch (e) {
      setError(e instanceof Error ? e.message : null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error !== null || !tontine) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <EmptyState emoji="🔍" title="Tontine introuvable" message={error ?? undefined} />
        <PrimaryButton label="Retour" onPress={() => router.back()} style={{ minWidth: 180 }} />
      </SafeAreaView>
    );
  }

  const turns: TontineDetail['turns'] = tontine.turns ?? [];
  const contributions: Contribution[] = tontine.my_contributions ?? [];
  const memberList = members.length > 0 ? members : (tontine.members ?? []);
  const pot = tontine.pot_total_collected;
  const targetPot =
    tontine.amount_per_member * tontine.member_count_target * tontine.member_count_target;
  const ringProgress = targetPot > 0 ? Math.min(1, pot / targetPot) : 0;
  const currentTurnNumber = tontine.current_round;

  // Strip calendrier : une pastille par tour.
  const calendarTurns =
    turns.length > 0
      ? turns
      : Array.from({ length: tontine.member_count_target }, (_, i) => ({
          position: i + 1,
          beneficiary_name: '',
          beneficiary_id: null,
          status:
            i + 1 < currentTurnNumber
              ? ('paid' as const)
              : i + 1 === currentTurnNumber
                ? ('current' as const)
                : ('pending' as const),
        }));

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.content}
        data={contributions}
        keyExtractor={(c) => String(c.round_number)}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{tontine.name}</Text>
              <Badge
                label={`${memberList.length || tontine.member_count} membres`}
                tone="info"
              />
            </View>

            {/* Strip calendrier des échéances */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
              {calendarTurns.map((turn) => (
                <View
                  key={turn.position}
                  style={[
                    styles.dayChip,
                    turn.status === 'current' && styles.dayChipCurrent,
                    turn.status === 'paid' && styles.dayChipDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      turn.status !== 'pending' && styles.dayNumLight,
                    ]}
                  >
                    T{turn.position}
                  </Text>
                  <Text
                    style={[
                      styles.dayLabel,
                      turn.status === 'current' && styles.dayLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {turn.beneficiary_name || (turn.status === 'current' ? 'En cours' : '—')}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Anneau de progression du pot */}
            <Card style={styles.ringCard}>
              <ProgressRing
                progress={ringProgress}
                caption={`${formatFcfa(pot)} sur ${formatFcfa(targetPot)}`}
              />
              <View style={styles.ringMeta}>
                <Text style={styles.ringMetaLabel}>Cotisation</Text>
                <Text style={styles.ringMetaValue}>
                  {formatFcfa(tontine.amount_per_member)} ·{' '}
                  {labelFrequency(tontine.frequency)}
                </Text>
                <Text style={styles.ringMetaLabel}>Code d’invitation</Text>
                <Text style={styles.inviteCode}>{tontine.invite_code}</Text>
              </View>
            </Card>

            {/* Ordre des tours */}
            {turns.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Ordre des tours</Text>
                <Card style={styles.turnCard}>
                  {turns.map((turn) => (
                    <View
                      key={turn.position}
                      style={[
                        styles.turnRow,
                        turn.status === 'current' && styles.turnRowCurrent,
                      ]}
                    >
                      <Text style={styles.turnPos}>#{turn.position}</Text>
                      <Text style={styles.turnName} numberOfLines={1}>
                        {turn.beneficiary_name || 'À définir'}
                      </Text>
                      {turn.status === 'current' && (
                        <Badge label="Bénéficiaire" tone="accent" />
                      )}
                      {turn.status === 'paid' && <Badge label="Reçu ✓" tone="success" />}
                    </View>
                  ))}
                </Card>
              </>
            ) : null}

            {/* Membres */}
            <Text style={styles.sectionTitle}>Membres</Text>
            {memberList.length > 0 ? (
              <Card style={styles.memberList}>
                {memberList.map((m) => (
                  <MemberRow key={m.user_id} member={m} amount={tontine.amount_per_member} />
                ))}
              </Card>
            ) : (
              <EmptyState emoji="👥" title="Aucun membre pour le moment" />
            )}

            {/* Historique */}
            <Text style={styles.sectionTitle}>Historique des contributions</Text>
          </>
        }
        renderItem={({ item }) => (
          <Card style={styles.contribCard}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.contribName}>Votre cotisation · Tour {item.round_number}</Text>
                <Text style={styles.contribDate}>{item.paid_at ? formatDate(item.paid_at) : 'En attente'}</Text>
              </View>
              <Badge label={formatFcfa(item.amount)} tone="success" icon="✓" />
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState emoji="🧾" title="Aucune contribution enregistrée" />}
        ListFooterComponent={
          <PrimaryButton label="Retour aux tontines" variant="secondary" onPress={() => router.back()} />
        }
      />
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function labelFrequency(f: string): string {
  return f === 'daily' ? '/ jour' : f === 'monthly' ? '/ mois' : '/ semaine';
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  content: {
    padding: SPACING.xl,
    gap: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  title: {
    flexShrink: 1,
    fontSize: FONT_SIZES.display,
    fontWeight: '800',
    color: COLORS.text,
  },
  strip: {
    flexGrow: 0,
  },
  dayChip: {
    width: 76,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.input,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dayChipCurrent: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
    ...SHADOWS.card,
  },
  dayChipDone: {
    borderColor: COLORS.successSoft,
    backgroundColor: COLORS.successSoft,
  },
  dayNum: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '800',
    color: COLORS.muted,
  },
  dayNumLight: {
    color: COLORS.text,
  },
  dayLabel: {
    marginTop: 2,
    fontSize: FONT_SIZES.caption - 1,
    color: COLORS.muted,
    maxWidth: 64,
  },
  dayLabelActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  ringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
  },
  ringMeta: {
    flex: 1,
    gap: 2,
  },
  ringMetaLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.sm,
  },
  ringMetaValue: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
  },
  inviteCode: {
    fontSize: FONT_SIZES.title,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  turnCard: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADII.input,
    paddingHorizontal: SPACING.sm,
  },
  turnRowCurrent: {
    backgroundColor: COLORS.accentSoft,
  },
  turnPos: {
    fontSize: FONT_SIZES.body,
    fontWeight: '800',
    color: COLORS.muted,
    width: 30,
  },
  turnName: {
    flex: 1,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  memberList: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  contribCard: {
    paddingVertical: SPACING.lg,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  contribName: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  contribDate: {
    marginTop: 2,
    fontSize: FONT_SIZES.caption,
    color: COLORS.muted,
  },
});
