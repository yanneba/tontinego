import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/store/auth';
import { requestOtp, verifyOtp } from '@/api/client';
import {
  COLORS,
  DEFAULT_COUNTRY_CODE,
  FONT_SIZES,
  RADII,
  SHADOWS,
  SPACING,
} from '@/constants/theme';

type Step = 'phone' | 'code';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fullPhone = phone.startsWith('+') ? phone : `${DEFAULT_COUNTRY_CODE}${phone}`;

  async function handleRequestCode() {
    setError(null);
    if (phone.trim().length < 4) {
      setError('Veuillez saisir un numéro de téléphone valide.');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(fullPhone);
      setStep('code');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Envoi du code impossible.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(null);
    if (code.trim().length < 4) {
      setError('Le code doit contenir au moins 4 chiffres.');
      return;
    }
    setLoading(true);
    try {
      const auth = await verifyOtp({
        phone: fullPhone,
        code: code.trim(),
        name: name.trim() || undefined,
      });
      signIn(auth.user);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logoTontine}>
              Tontine<Text style={styles.logoGo}>Go</Text>
            </Text>
            <Text style={styles.tagline}>Épargnez ensemble, en toute simplicité.</Text>
          </View>

          {step === 'phone' ? (
            <>
              <View style={styles.card}>
                <Text style={styles.label}>Votre nom</Text>
                <TextInput
                  style={styles.standaloneInput}
                  placeholder="Ex. Awa Koné (requis à la première connexion)"
                  placeholderTextColor={COLORS.muted}
                  autoComplete="name"
                  value={name}
                  onChangeText={setName}
                />
                <Text style={styles.label}>Numéro de téléphone</Text>
                <View style={styles.phoneRow}>
                  <Text style={styles.countryCode}>{DEFAULT_COUNTRY_CODE}</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="07 00 00 00 01"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>
              <PrimaryButton label="Recevoir mon code" onPress={() => void handleRequestCode()} loading={loading} />
            </>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.label}>Code de vérification</Text>
                <Text style={styles.hint}>
                  Envoyé par SMS au {fullPhone}
                </Text>
                <TextInput
                  style={[styles.phoneInput, styles.codeInput]}
                  placeholder="••••••"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                  autoFocus
                />
              </View>
              <PrimaryButton label="Se connecter" onPress={() => void handleVerify()} loading={loading} />
              <PrimaryButton
                label="Modifier le numéro"
                variant="secondary"
                onPress={() => {
                  setStep('phone');
                  setCode('');
                  setError(null);
                }}
                style={{ marginTop: SPACING.md }}
              />
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoTontine: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  logoGo: {
    color: COLORS.accent,
  },
  tagline: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.body,
    color: COLORS.muted,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: SPACING.xl,
    ...SHADOWS.card,
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
  },
  hint: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.muted,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADII.input,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  standaloneInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADII.input,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: FONT_SIZES.subtitle,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  countryCode: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    paddingRight: SPACING.md,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingLeft: SPACING.lg,
    fontSize: FONT_SIZES.subtitle,
    color: COLORS.text,
  },
  codeInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADII.input,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '800',
    backgroundColor: COLORS.background,
  },
  error: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    fontWeight: '600',
  },
});
