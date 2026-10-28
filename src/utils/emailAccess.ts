export const pendingAccessKey = 'sembrador.pending-email-access.v1';
export interface PendingAccess {
  email: string;
  challenge: string;
  expiresAt: number;
  retryAt: number;
}

// Keep the request across a mobile browser reload, never the code or session.
export function readPendingAccess(): PendingAccess | null {
  try {
    const value = JSON.parse(localStorage.getItem(pendingAccessKey) || 'null');
    if (!value || typeof value.email !== 'string' || typeof value.challenge !== 'string' || !/^[a-f0-9]{32}$/.test(value.challenge)
      || !Number.isFinite(value.expiresAt) || !Number.isFinite(value.retryAt)
      || value.expiresAt <= Date.now()) return null;
    return value;
  } catch { return null; }
}

export function savePendingAccess(value: PendingAccess | null): void {
  try {
    if (value) localStorage.setItem(pendingAccessKey, JSON.stringify(value));
    else localStorage.removeItem(pendingAccessKey);
  } catch { /* Access still works when browser storage is unavailable. */ }
}
