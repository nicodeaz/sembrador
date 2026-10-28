// Cliente HTTP para la API de El Sembrador (api/*.php).
//
// El servidor es la fuente de verdad de los datos (ver App.tsx): el
// navegador solo guarda una copia local de respaldo por si se corta la
// conexión a mitad de una sesión ya desbloqueada.

import { Batch, OperationRecord } from '../types';

// En dev, BASE_URL es '/', y vite.config.ts redirige '/api' hacia el Apache
// de XAMPP. En producción, BASE_URL es '/sembrador/', así que esto resuelve
// a '/sembrador/api', que es donde queda el backend PHP (ver api/).
const API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/{2,}/g, '/');

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}/${path}`, {
    credentials: 'include',
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
}

export interface LoginResult {
  ok: boolean;
  lockedSeconds: number;
  offline: boolean;
}

export async function loginWithPin(pin: string): Promise<LoginResult> {
  try {
    const res = await request('login.php', { method: 'POST', body: JSON.stringify({ pin }) });
    if (res.ok) return { ok: true, lockedSeconds: 0, offline: false };
    const data = await res.json().catch(() => ({}));
    return { ok: false, lockedSeconds: Number(data.lockedSeconds) || 0, offline: false };
  } catch {
    return { ok: false, lockedSeconds: 0, offline: true };
  }
}

export async function logout(): Promise<void> {
  try {
    await request('logout.php', { method: 'POST' });
  } catch {
    // Sin conexión: no importa, igual bloqueamos la app del lado del cliente.
  }
}

export interface ServerData {
  batches: Batch[];
  records: OperationRecord[];
}

export type FetchDataResult =
  | { status: 'ok'; data: ServerData }
  | { status: 'unauthorized' }
  | { status: 'offline' };

export async function fetchServerData(): Promise<FetchDataResult> {
  try {
    const res = await request('data.php', { method: 'GET' });
    if (res.status === 401) return { status: 'unauthorized' };
    if (!res.ok) return { status: 'offline' };
    const data = await res.json();
    return {
      status: 'ok',
      data: { batches: data.batches || [], records: data.records || [] },
    };
  } catch {
    return { status: 'offline' };
  }
}

export async function saveServerData(batches: Batch[], records: OperationRecord[]): Promise<boolean> {
  try {
    const res = await request('data.php', {
      method: 'POST',
      body: JSON.stringify({ batches, records }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface ChangePinResult {
  ok: boolean;
  error?: 'current_pin_invalid' | 'invalid_new_pin' | 'network' | string;
}

export async function changePin(currentPin: string, newPin: string): Promise<ChangePinResult> {
  try {
    const res = await request('change_pin.php', {
      method: 'POST',
      body: JSON.stringify({ currentPin, newPin }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, error: data.error };
  } catch {
    return { ok: false, error: 'network' };
  }
}
