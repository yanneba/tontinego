import { DEFAULT_API_URL } from '@/constants/theme';
import { clearToken, loadToken, saveToken } from './tokenStorage';
import type {
  AuthResponse,
  Frequency,
  Member,
  PayResponse,
  Tontine,
  TontineDetail,
  User,
} from '@/types';

export const BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
) {
      super(message);
      this.name = 'ApiError';
  }
}

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Appel public (auth) : n'exige pas de token. */
  auth?: boolean;
}

/** Hook utilisé par la couche auth pour réagir à une session expirée (401). */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options;

  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (auth) {
    const token = await loadToken();
    if (!token) throw new ApiError(401, 'Session expirée');
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur. Vérifiez votre connexion.');
  }

  if (response.status === 401 && !path.startsWith('/auth/')) {
    await clearToken();
    onUnauthorized?.();
    throw new ApiError(401, 'Session expirée, veuillez vous reconnecter.');
  }

  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    try {
      const data = (await response.json()) as { detail?: string; message?: string };
      message = data.detail ?? data.message ?? message;
    } catch {
      // corps non JSON : garder le message par défaut
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/* ----------------------------- Auth ----------------------------- */

export function requestOtp(phone: string): Promise<{ sent: boolean }> {
  return request('/auth/request-otp', { method: 'POST', body: { phone }, auth: false });
}

export async function verifyOtp(params: {
  phone: string;
  code: string;
  name?: string;
}): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/verify-otp', {
    method: 'POST',
    body: params,
    auth: false,
  });
  await saveToken(data.access_token);
  return data;
}

export function getMe(): Promise<User> {
  return request<User>('/auth/me');
}

/* --------------------------- Tontines --------------------------- */

export function listTontines(): Promise<Tontine[]> {
  return request<Tontine[]>('/tontines');
}

export function getTontine(id: number | string): Promise<TontineDetail> {
  return request<TontineDetail>(`/tontines/${id}`);
}

export function createTontine(payload: {
  name: string;
  amount_per_member: number;
  frequency: Frequency;
  member_count_target: number;
}): Promise<Tontine> {
  return request<Tontine>('/tontines', { method: 'POST', body: payload });
}

export function joinTontine(inviteCode: string): Promise<Tontine> {
  return request<Tontine>('/tontines/join', {
    method: 'POST',
    body: { invite_code: inviteCode },
  });
}

export function payContribution(tontineId: number | string): Promise<PayResponse> {
  return request<PayResponse>(`/tontines/${tontineId}/pay`, {
    method: 'POST',
    body: { method: 'mock_wave' },
  });
}

export function listMembers(tontineId: number | string): Promise<Member[]> {
  return request<Member[]>(`/tontines/${tontineId}/members`);
}
