import AsyncStorage from '@react-native-async-storage/async-storage';

const ENV_BASE = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
const STORAGE_KEY = 'backendBaseUrl';

async function resolveBaseUrl(): Promise<string> {
  try {
    if (ENV_BASE) {
      await AsyncStorage.setItem(STORAGE_KEY, ENV_BASE);
      return ENV_BASE;
    }
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch (e) {
    // no-op
  }
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn('[apiClient] EXPO_PUBLIC_BACKEND_URL is not set and no stored base URL found. API calls may fail.');
  }
  return '';
}

export async function getBaseUrl(): Promise<string> {
  return await resolveBaseUrl();
}

export async function get(path: string, init?: RequestInit) {
  const base = await resolveBaseUrl();
  if (!base) throw new Error('Backend base URL is not configured');
  const url = path.startsWith('http') ? path : `${base}${path}`;
  return fetch(url, init);
}

export async function post(path: string, body?: any, init?: RequestInit) {
  const base = await resolveBaseUrl();
  if (!base) throw new Error('Backend base URL is not configured');
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
  } as Record<string, string>;
  return fetch(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...init, headers });
}

export function withAuth(token?: string | null) {
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export default { getBaseUrl, get, post, withAuth };
