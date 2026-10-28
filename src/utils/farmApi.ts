import { FarmData } from '../types';
import { normalizeFarm } from './farm';
const base = `${import.meta.env.BASE_URL}api/`;
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
async function request(options: RequestInit) {
  const response = await fetch(`${base}data.php`, { credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000), ...options });
  if (!response.ok) throw new ApiError(response.status, (await response.json()).error || 'Error del servidor');
  return response.json();
}
export async function loadFarm() {
  const result = await request({ method: 'GET' });
  return { revision: result.revision as number, data: normalizeFarm(result.data), requestId: result.requestId as string };
}
export async function saveFarm(data: FarmData, revision: number, requestId: string): Promise<number> {
  const result = await request({ method: 'POST', body: JSON.stringify({ data, revision, requestId }) });
  return result.revision;
}
