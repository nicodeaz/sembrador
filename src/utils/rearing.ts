import { Batch, FarmData } from '../types';
import { costRecords } from './farm';
import { addDays, today, weekStart } from './dates';

export const BARN_SUGGESTIONS = ['Galpón grande 1', 'Galpón grande 2', 'Galpón chico'];
export const suggestedExit = (startDate: string, ageOnArrivalDays = 0) => addDays(startDate, Math.max(0, 112 - ageOnArrivalDays));
export const barnLabel = (batch?: Batch) => batch?.barn?.trim() || 'Sin galpón asignado';

export function feedOverview(data: FarmData, batchId: string, until = today()) {
  const entries = costRecords(data).filter(r => r.batchId === batchId && r.category === 'alimento' && r.date <= until);
  const known = entries.filter(r => r.unit === 'kg');
  const weekly = new Map<string, { week: string; product: string; kg: number; cost: number }>();
  for (const entry of known) {
    const week = weekStart(entry.date);
    const key = `${week}|${entry.title}`;
    const row = weekly.get(key) || { week, product: entry.title, kg: 0, cost: 0 };
    row.kg += entry.quantity || 0; row.cost += entry.cost; weekly.set(key, row);
  }
  return {
    totalKg: known.reduce((s,r) => s + (r.quantity || 0), 0),
    todayKg: known.filter(r => r.date === until).reduce((s,r) => s + (r.quantity || 0), 0),
    recentKg: known.filter(r => r.date >= addDays(until,-6)).reduce((s,r) => s + (r.quantity || 0), 0),
    last: [...entries].sort((a,b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''))[0],
    cost: entries.reduce((s,r) => s + r.cost, 0),
    hasUnconvertedBags: entries.some(r => r.unit === 'bolsas'),
    weekly: [...weekly.values()].sort((a,b) => b.week.localeCompare(a.week) || a.product.localeCompare(b.product)),
  };
}

export interface CalendarEntry { id: string; date: string; title: string; detail: string; kind: 'arrival'|'departure'|'task'; planned: boolean; batchId?: string; taskId?: string }
export function calendarEntries(data: FarmData): CalendarEntry[] {
  const events: CalendarEntry[] = [];
  for (const batch of data.batches) {
    events.push({id:`arrival-${batch.id}`,date:batch.startDate,title:`${batch.status === 'planned' ? 'Entra' : 'Entró'}: ${batch.name}`,detail:`${batch.initialCount} pollitas · ${barnLabel(batch)}`,kind:'arrival',planned:batch.status === 'planned',batchId:batch.id});
    if (['planned','active'].includes(batch.status) && batch.expectedExitDate) events.push({id:`expected-${batch.id}`,date:batch.expectedExitDate,title:`Retiro previsto: ${batch.name}`,detail:barnLabel(batch),kind:'departure',planned:true,batchId:batch.id});
    // Keep closure dates from old backups even when no departure rows existed.
    if (batch.endDate && !data.departures.some(d => d.batchId === batch.id && d.date === batch.endDate)) events.push({id:`closed-${batch.id}`,date:batch.endDate,title:`Finalizó: ${batch.name}`,detail:barnLabel(batch),kind:'departure',planned:false,batchId:batch.id});
  }
  for (const d of data.departures) {
    const batch = data.batches.find(b => b.id === d.batchId);
    events.push({id:`departure-${d.id}`,date:d.date,title:`Salieron ${d.count} pollitas: ${batch?.name || ''}`,detail:barnLabel(batch),kind:'departure',planned:false,batchId:d.batchId});
  }
  for (const task of data.tasks) events.push({id:`task-${task.id}`,date:task.status === 'done' ? task.completedDate! : task.date,title:task.title,detail:task.batchId ? barnLabel(data.batches.find(b => b.id === task.batchId)) : 'Toda la granja',kind:'task',planned:task.status === 'pending',batchId:task.batchId,taskId:task.id});
  return events.sort((a,b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}
