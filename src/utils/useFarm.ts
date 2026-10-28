import { useEffect, useRef, useState } from 'react';
import { emptyFarm, FarmData } from '../types';
import { ApiError, loadFarm, saveFarm } from './farmApi';
import { downloadBackup, id, normalizeFarm } from './farm';

const KEY = 'sembrador:farm:v3';
// A separate outbox per tab keeps another tab from erasing unsent changes.
const TAB_ID = (() => {
  try {
    const existing = sessionStorage.getItem('sembrador:tab-id');
    if (existing) return existing;
    const value = id(); sessionStorage.setItem('sembrador:tab-id', value); return value;
  } catch { return id(); }
})();
const OUTBOX = `sembrador:pending:${TAB_ID}`;
interface Snapshot { data: FarmData; revision: number; pending: boolean; requestId: string }
function cached(): Snapshot | null {
  try {
    const value = JSON.parse(localStorage.getItem(OUTBOX) || localStorage.getItem(KEY) || 'null');
    return value && Number.isInteger(value.revision) ? { ...value, data: normalizeFarm(value.data) } : null;
  } catch { return null; }
}
export function useFarm() {
  const [data, setData] = useState<FarmData>(emptyFarm);
  const [boot, setBoot] = useState<'loading'|'locked'|'ready'|'error'>('loading');
  const [status, setStatus] = useState<'saved'|'saving'|'pending'|'conflict'|'error'>('saved');
  const [cacheError, setCacheError] = useState(false);
  const state = useRef<Snapshot | null>(null);
  const busy = useRef(false);
  const paused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loading = useRef(0);
  const store = (snapshot: Snapshot) => {
    state.current = snapshot;
    try {
      if (snapshot.pending) localStorage.setItem(OUTBOX, JSON.stringify(snapshot));
      else { localStorage.setItem(KEY, JSON.stringify(snapshot)); localStorage.removeItem(OUTBOX); }
      setCacheError(false);
    }
    catch { setCacheError(true); }
  };
  const flush = async (): Promise<boolean> => {
    if (busy.current || paused.current) return false;
    const sent = state.current;
    if (!sent?.pending) return true;
    busy.current = true; setStatus('saving');
    let success = false;
    try {
      const revision = await saveFarm(sent.data, sent.revision, sent.requestId);
      const current = state.current!;
      const changed = current.requestId !== sent.requestId;
      store({ ...current, revision, pending: changed });
      setStatus(changed ? 'pending' : 'saved');
      success = !changed;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) { paused.current = true; setStatus('conflict'); }
      else if (error instanceof ApiError && error.status === 401) { setBoot('locked'); setStatus('pending'); paused.current = true; }
      else setStatus(error instanceof ApiError ? 'error' : 'pending');
    } finally { busy.current = false; }
    // Changes made while saving are serialized after this response.
    if (!paused.current && state.current?.pending && state.current.requestId !== sent.requestId) void flush();
    return success;
  };
  const load = async () => {
    const sequence = ++loading.current;
    setBoot('loading');
    try {
      const remote = await loadFarm();
      if (sequence !== loading.current) return;
      const local = state.current || cached();
      paused.current = false;
      if (local?.pending) {
        // Retry an interrupted request idempotently, including lost responses.
        store(local); setData(local.data);
        if (remote.revision !== local.revision && remote.requestId !== local.requestId) { paused.current = true; setStatus('conflict'); }
        else { setStatus('pending'); void flush(); }
      } else { store({ ...remote, pending: false }); setData(remote.data); setStatus('saved'); }
      setBoot('ready');
    } catch (error) { if (sequence === loading.current) setBoot(error instanceof ApiError && error.status === 401 ? 'locked' : 'error'); }
  };
  const update = (next: FarmData) => {
    if (!state.current || paused.current) throw new Error('Primero resolvé los cambios pendientes.');
    const validated = normalizeFarm(next);
    store({ data: validated, revision: state.current.revision, pending: true, requestId: id() });
    setData(validated); setStatus('pending');
    clearTimeout(timer.current); timer.current = setTimeout(() => void flush(), 300);
  };
  const useServer = async () => {
    if (!state.current) return;
    downloadBackup(state.current.data, '-pendiente');
    const remote = await loadFarm();
    store({ ...remote, pending: false }); setData(remote.data); paused.current = false; setStatus('saved');
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const retry = () => void flush();
    const guard = (event: BeforeUnloadEvent) => { if (state.current?.pending) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('online', retry); window.addEventListener('beforeunload', guard);
    const interval = setInterval(retry, 15000);
    return () => { clearInterval(interval); window.removeEventListener('online', retry); window.removeEventListener('beforeunload', guard); };
  }, []);
  return { data, update, boot, setBoot, status, cacheError, load, flush, useServer };
}
