/**
 * TontineGo — Design tokens (alignés maquette validée).
 * Aucune valeur magique en dur dans les écrans : tout passe par ici.
 */

export const COLORS = {
  primary: '#003DA5',
  primaryStrong: '#002F80',
  primarySoft: '#E4EDFB',
  accent: '#C8963E',
  accentSoft: '#F7EDDA',
  background: '#F6F8FC',
  surface: '#FFFFFF',
  text: '#0F1A3E',
  muted: '#5B6780',
  success: '#0D7C4A',
  successSoft: '#E2F3EA',
  warning: '#D9822B',
  warningSoft: '#FBEBDB',
  danger: '#C0392B',
  dangerSoft: '#F9E5E2',
  border: '#E3E9F4',
  white: '#FFFFFF',
} as const;

export const RADII = {
  card: 24,
  input: 16,
  badge: 999,
  button: 999,
  avatar: 999,
} as const;

/** Grille de 4px */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const FONT_SIZES = {
  caption: 11,
  body: 14,
  subtitle: 15,
  title: 18,
  display: 26,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#0F1A3E',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const DEFAULT_API_URL = 'http://localhost:8100/api/v1';

/** Compte de démonstration (backend dev) */
export const DEMO_PHONE = '+2250700000001';
export const DEMO_OTP_CODE = '123456';

export const DEFAULT_COUNTRY_CODE = '+225';
