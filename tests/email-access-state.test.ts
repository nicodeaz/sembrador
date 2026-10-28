import test from 'node:test';
import assert from 'node:assert/strict';
import { pendingAccessKey, readPendingAccess, savePendingAccess } from '../src/utils/emailAccess';

test('returning from email restores the request and cooldown, and successful login clears it', () => {
  const values = new Map<string, string>();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }});
  try {
    const pending = {email: 'owner@example.test', challenge: 'a'.repeat(32), expiresAt: Date.now() + 3600000, retryAt: Date.now() + 60000};
    savePendingAccess(pending);
    assert.deepEqual(readPendingAccess(), pending);
    savePendingAccess(null);
    assert.equal(readPendingAccess(), null);
    savePendingAccess({...pending, expiresAt: Date.now() - 1});
    assert.equal(readPendingAccess(), null);
    values.set(pendingAccessKey, '{broken');
    assert.equal(readPendingAccess(), null);
    Object.defineProperty(globalThis, 'localStorage', {configurable: true, get() { throw new Error('Storage disabled'); }});
    assert.equal(readPendingAccess(), null);
    assert.doesNotThrow(() => savePendingAccess(pending));
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete (globalThis as {localStorage?: Storage}).localStorage;
  }
});
