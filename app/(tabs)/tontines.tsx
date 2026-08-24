import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { createTontine, joinTontine, listTontines } from '@/api/client';
import {
  COLORS,
  FONT_SIZES,
  RADII,
  SHADOWS,
  SPACING,
} from '@/constants/theme';
import type { Frequency } from '@/types';

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Jour' },
  { value: 'weekly', label: 'Semaine' },
  { value: 'monthly', label: 'Mois' },
];

export default function TontinesScreen() {
  const [tontines, setTontines] = useState<import('@/types').Tontine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [totalTurns, setTotalTurns] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const loadData = useCallback(async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    setError(null);
    try {
      setTontines(await listTontines());
    } catch (e) {
      setError(e instanceof Error ? e.message : null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData(true);
    }, [loadData]),
  );

  function resetForm() {
    setName('');
    setAmount('');
    setFrequency('weekly');
    setTotalTurns('');
    setFormError(null);
  }

  async function handleCreate() {
    setFormError(null);
    const amountNum = Number.parseInt(amount.replace(/\s/g, ''), 10);
    const turnsNum = Number.parseInt(totalTurns, 10);
    if (!name.trim()) return setFormError('Le nom est obligatoire.');
    if (!Number.isFinite(amountNum) || amountNum <= 0)
      return setFormError('Montant invalide.');
    if (!Number.isFinite(turnsNum) || turnsNum < 2 || turnsNum > 36)
      return setFormError('Nombre de membres : entre 2 et 36.');

    setIsSubmitting(true);
    try {
      await createTontine({
        name: name.trim(),
        amount_per_member: amountNum,
        frequency,
        member_count_target: turnsNum,
      });
      setModalVisible(false);
      resetForm();
      await loadData(true);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin() {
    setInviteError(null);
    if (inviteCode.trim().length < 4)
      return setInviteError('Veuillez saisir un code d’invitation.');
    setIsJoining(true);
    try {
      await joinTontine(inviteCode.trim().toUpperCase());
      setInviteCode('');
      await loadData(true);
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Code invalide.');
    } finally {
      setIsJoining(false);
    }
  }

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
        data={tontines}
        keyExtractor={(t) => String(t.id)}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadData(true)} />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Mes tontines</Text>
            <View style={styles.joinCard}>
              <Text style={styles.joinLabel}>Rejoindre avec un code</Text>
              <View style={styles.joinRow}>
                <TextInput
                  style={[styles.joinInput, inviteError && styles.inputError]}
                  placeholder="Ex. TONT-8F3K"
                  placeholderTextColor={COLORS.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                />
                <PrimaryButton label="OK" onPress={() => void handleJoin()} loading={isJoining} style={styles.joinBtn} />
              </View>
              {inviteError ? <Text style={styles.error}>{inviteError}</Text> : null}
            </View>
            {error ? <ErrorState message={error} onRetry={() => void loadData(true)} /> : null}
          </>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(tabs)/tontines/${item.id}`)}>
            <Card style={styles.tontineCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.tontineName}>{item.name}</Text>
                <Badge label={`Tour ${item.current_round}/${item.member_count_target}`} tone="accent" />
              </View>
              <Text style={styles.meta}>
                {formatFcfa(item.amount_per_member)} / membre ·{' '}
                {labelFrequency(item.frequency)} · {item.member_count} membres
              </Text>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          error === null ? (
            <EmptyState
              emoji="🪙"
              title="Aucune tontine"
              message="Créez votre première tontine ou rejoignez-en une avec un code."
            />
          ) : null
        }
        ListFooterComponent={
          <PrimaryButton
            label="+ Créer une tontine"
            onPress={() => setModalVisible(true)}
            variant="secondary"
          />
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle tontine</Text>

            <Text style={styles.label}>Nom de la tontine</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex. Tontine famille"
              placeholderTextColor={COLORS.muted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Montant par membre (FCFA)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex. 10000"
              placeholderTextColor={COLORS.muted}
              keyboardType="number-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>Fréquence des tours</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f.value}
                  onPress={() => setFrequency(f.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: frequency === f.value }}
                  style={[styles.freqChip, frequency === f.value && styles.freqChipActive]}
                >
                  <Text
                    style={[
                      styles.freqChipLabel,
                      frequency === f.value && styles.freqChipLabelActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Nombre de membres (tours)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex. 6"
              placeholderTextColor={COLORS.muted}
              keyboardType="number-pad"
              value={totalTurns}
              onChangeText={setTotalTurns}
            />

            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <View style={styles.modalActions}>
              <PrimaryButton
                label="Annuler"
                variant="secondary"
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
                style={styles.flex1}
              />
              <PrimaryButton
                label="Créer"
                onPress={() => void handleCreate()}
                loading={isSubmitting}
                style={styles.flex1}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function formatFcfa(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} F`;
}

function labelFrequency(f: string): string {
  return f === 'daily' ? '/ jour' : f === 'monthly' ? '/ mois' : '/ semaine';
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
  title: {
    fontSize: FONT_SIZES.display,
    fontWeight: '800',
    color: COLORS.text,
  },
  joinCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  joinLabel: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  joinRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  joinInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADII.input,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.subtitle,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  joinBtn: {
    minHeight: 48,
    paddingHorizontal: SPACING.xl,
  },
  tontineCard: {
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  tontineName: {
    flexShrink: 1,
    fontSize: FONT_SIZES.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  meta: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.muted,
  },
  error: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,26,62,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.card,
    borderTopRightRadius: RADII.card,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  modalTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  label: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADII.input,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.subtitle,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  freqRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  freqChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADII.badge,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  freqChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  freqChipLabel: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.muted,
  },
  freqChipLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  flex1: {
    flex: 1,
  },
});
