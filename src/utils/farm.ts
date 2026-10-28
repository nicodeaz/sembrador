import { FarmData, OperationRecord, StockMovement, emptyFarm } from '../types';
import { today } from './dates';

export const PRODUCTS = ['Maíz', 'Soja', 'Ración ovina peletizada', 'Ración ovina no peletizada', 'Ración ponedoras', 'Ración recría', 'Ración BB'];
export const movementLabels: Record<StockMovement['type'], string> = { purchase: 'Compra', sale: 'Venta', feed: 'Alimentación', production: 'Elaboración', expense: 'Gasto' };
export const id = () => crypto.randomUUID();
export const kilos = (value: number) => `${value.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg`;

export function reconcileLifecycle(data: FarmData, batchId: string) {
  const batch = data.batches.find(b => b.id === batchId);
  if (!batch || batch.status === 'planned' || batch.status === 'archived') return;
  const deaths = data.records.filter(r => r.batchId === batchId && r.category === 'mortalidad');
  const exits = data.departures.filter(d => d.batchId === batchId);
  const removed = deaths.reduce((s,r) => s + (r.quantity || 0), 0) + exits.reduce((s,d) => s + d.count, 0);
  if (removed === batch.initialCount) {
    batch.status = 'completed';
    batch.endDate = [...deaths, ...exits].map(r => r.date).sort().at(-1);
  } else if (removed < batch.initialCount && batch.status === 'completed') {
    batch.status = 'active'; delete batch.endDate;
  }
}

export function normalizeFarm(input: unknown): FarmData {
  const raw = input as Record<string, unknown>;
  if (!raw || typeof raw !== 'object' || (raw.schemaVersion !== undefined && raw.schemaVersion !== 3)) throw new Error('Versión de respaldo no compatible.');
  const data = { ...emptyFarm(), ...raw, schemaVersion: 3 } as FarmData;
  const validDate = (s: unknown) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s;
  const num = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  const text = (s: unknown) => typeof s === 'string' && s.trim().length > 0;
  const fail = () => { throw new Error('El archivo contiene datos incompletos o inválidos.'); };
  if (!Array.isArray(raw.batches) || !Array.isArray(raw.records)) fail();
  for (const key of ['batches', 'records', 'departures', 'tasks', 'movements'] as const) {
    if (!Array.isArray(data[key])) fail();
    const ids = new Set<string>();
    for (const item of data[key]) {
      if (!item || !text(item.id) || ids.has(item.id)) fail();
      for (const field of ['name','title','product','notes','contact','breed','barn','createdAt','batchId','unit','purchaseId']) {
        const val = (item as unknown as Record<string,unknown>)[field];
        if (val !== undefined && (typeof val !== 'string' || val.length > 10000)) fail();
      }
      ids.add(item.id);
    }
  }
  const batchIds = new Set(data.batches.map(b => b.id));
  for (const b of data.batches) {
    if (!text(b.name) || !validDate(b.startDate) || !Number.isInteger(b.initialCount) || b.initialCount < 1 || !num(b.initialCostPerPullet) || !['planned', 'active', 'completed', 'archived'].includes(b.status)) fail();
    if (b.endDate && (!validDate(b.endDate) || b.endDate < b.startDate)) fail();
    if (b.expectedExitDate && (!validDate(b.expectedExitDate) || b.expectedExitDate < b.startDate)) fail();
    if (b.ageOnArrivalDays !== undefined && (!Number.isInteger(b.ageOnArrivalDays) || b.ageOnArrivalDays < 0)) fail();
  }
  for (const r of data.records) if (!batchIds.has(r.batchId) || !validDate(r.date) || !text(r.title) || !num(r.cost) || !['alimento','mortalidad','vacunas','calefaccion','otros'].includes(r.category) || (r.quantity !== undefined && !num(r.quantity)) || (r.category === 'mortalidad' && !Number.isInteger(r.quantity))) fail();
  for (const d of data.departures) if (!batchIds.has(d.batchId) || !validDate(d.date) || !Number.isInteger(d.count) || d.count < 1 || !num(d.amount)) fail();
  for (const t of data.tasks) if (!text(t.title) || !validDate(t.date) || !num(t.cost) || !['pending','done'].includes(t.status) || (t.status === 'done' && !validDate(t.completedDate)) || (t.batchId && !batchIds.has(t.batchId))) fail();
  for (const m of data.movements) {
    if (!validDate(m.date) || !text(m.product) || !num(m.quantityKg) || !num(m.amount) || !Object.keys(movementLabels).includes(m.type) || (m.batchId && !batchIds.has(m.batchId)) || (m.type === 'feed' && !m.batchId) || (m.type !== 'expense' && m.quantityKg <= 0)) fail();
    if (m.type === 'production' && (!Array.isArray(m.ingredients) || m.ingredients.length === 0 || m.ingredients.some(i => !text(i.product) || !num(i.quantityKg) || i.quantityKg <= 0 || i.product === m.product))) fail();
    if (m.quantityUnit !== undefined && !['kg','bolsas'].includes(m.quantityUnit)) fail();
    if (m.quantityUnit === 'bolsas' && (!num(m.bagWeightKg) || !m.bagWeightKg)) fail();
    if (m.purchaseId) {
      const purchase = data.movements.find(p => p.id === m.purchaseId && p.type === 'purchase');
      if (m.type !== 'feed' || !purchase || purchase.product !== m.product || purchase.date > m.date) throw new Error('El alimento debe corresponder a una compra anterior del mismo producto.');
      if (Math.abs(m.amount - feedCost(purchase, m.quantityKg)) > 0.011) throw new Error('El costo del consumo debe coincidir con el precio de su compra.');
    }
  }
  for (const purchase of data.movements.filter(m => m.type === 'purchase')) {
    if (data.movements.filter(m => m.purchaseId === purchase.id).reduce((sum,m) => sum + m.quantityKg, 0) > purchase.quantityKg + 0.001) throw new Error('Los consumos asignados superan los kilos de esa compra.');
  }
  for (const b of data.batches) {
    const deaths = data.records.filter(r => r.batchId === b.id && r.category === 'mortalidad').reduce((s, r) => s + (r.quantity || 0), 0);
    const exits = data.departures.filter(d => d.batchId === b.id);
    if (deaths + exits.reduce((s, d) => s + d.count, 0) > b.initialCount || exits.some(d => d.date < b.startDate)) fail();
  }
  // Only persisted fields: never carry legacy PINs into new backups.
  return { schemaVersion: 3, batches: data.batches, records: data.records, movements: data.movements, tasks: data.tasks, departures: data.departures };
}

export function feedCost(purchase: StockMovement, quantityKg: number): number {
  return Math.round((purchase.amount / purchase.quantityKg * quantityKg + Number.EPSILON) * 100) / 100;
}

export function refreshLinkedFeedCosts(data: FarmData): void {
  for (const movement of data.movements) {
    if (!movement.purchaseId) continue;
    const purchase = data.movements.find(p => p.id === movement.purchaseId && p.type === 'purchase');
    if (purchase) { movement.product = purchase.product; movement.amount = feedCost(purchase, movement.quantityKg); }
  }
}

export function stockBalances(movements: StockMovement[], until = today()): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const m of movements.filter(m => m.date <= until)) {
    if (m.type === 'expense') continue;
    stock[m.product] = (stock[m.product] || 0) + m.quantityKg * (['purchase', 'production'].includes(m.type) ? 1 : -1);
    for (const i of m.type === 'production' ? m.ingredients || [] : []) stock[i.product] = (stock[i.product] || 0) - i.quantityKg;
  }
  return stock;
}

// Allocated feed and completed work affect batch costs, but are not counted
// again as cash purchases in the cash ledger.
export function costRecords(data: FarmData): OperationRecord[] {
  return [...data.records, ...data.movements.filter(m => m.batchId && ['feed','expense'].includes(m.type)).map(m => ({
    id: m.id, batchId: m.batchId!, date: m.date, category: (m.type === 'feed' ? 'alimento' : 'otros') as OperationRecord['category'], title: m.product, quantity: m.quantityKg, unit: 'kg' as const, cost: m.amount, notes: m.notes, createdAt: m.date,
  })), ...data.tasks.filter(t => t.status === 'done' && t.batchId).map(t => ({
    id: t.id, batchId: t.batchId!, date: t.completedDate!, category: 'otros' as const, title: t.title, cost: t.cost, notes: t.notes, createdAt: t.completedDate!,
  }))];
}

export function cashEntries(data: FarmData) {
  return [
    ...data.movements.filter(m => ['purchase','sale','expense','production'].includes(m.type)).map(m => ({ id: m.id, date: m.date, title: `${movementLabels[m.type]} · ${m.product}`, income: m.type === 'sale' ? m.amount : 0, expense: m.type === 'sale' ? 0 : m.amount })),
    ...data.departures.map(d => ({ id: d.id, date: d.date, title: `Salida · ${data.batches.find(b => b.id === d.batchId)?.name}`, income: d.amount, expense: 0 })),
    ...data.batches.filter(b => b.status !== 'planned').map(b => ({ id: b.id, date: b.startDate, title: `Compra de pollitas · ${b.name}`, income: 0, expense: b.initialCount * b.initialCostPerPullet })),
    ...data.records.map(r => ({ id: r.id, date: r.date, title: r.title, income: 0, expense: r.cost })),
    ...data.tasks.filter(t => t.status === 'done').map(t => ({ id: t.id, date: t.completedDate!, title: t.title, income: 0, expense: t.cost })),
  ].sort((a,b) => b.date.localeCompare(a.date));
}

export function downloadBackup(data: FarmData, suffix = '') {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ ...data, appName: 'El Sembrador', exportDate: new Date().toISOString() }, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = `El-Sembrador-${today()}${suffix}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
