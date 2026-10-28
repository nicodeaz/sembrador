import { Batch, OperationRecord, BatchSummary, FarmConsolidated, CategoryType, Departure } from '../types';
import { today } from './dates';

export const TARGET_DAYS = 112; // 16 semanas * 7 días

export function calculateDaysBetween(startDateStr: string, endDateStr: string = today()): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function calculateBatchSummary(batch: Batch, records: OperationRecord[], departures: Departure[] = []): BatchSummary {
  const batchRecords = records.filter(r => r.batchId === batch.id);
  const currentAgeDays = calculateDaysBetween(batch.startDate, batch.endDate || today()) + (batch.ageOnArrivalDays || 0);
  const currentAgeWeeks = Math.floor(currentAgeDays / 7);
  const currentAgeDaysRemainder = currentAgeDays % 7;
  const progressPercent = Math.min(100, Math.round((currentAgeDays / TARGET_DAYS) * 100));

  let totalMortality = 0;
  let totalOperationalExpenses = 0;

  const costsByCategory: Record<CategoryType, number> = {
    alimento: 0,
    mortalidad: 0,
    vacunas: 0,
    calefaccion: 0,
    otros: 0
  };

  batchRecords.forEach(r => {
    if (r.category === 'mortalidad') {
      totalMortality += r.quantity || 0;
    }
    const cost = Number(r.cost) || 0;
    totalOperationalExpenses += cost;
    costsByCategory[r.category] = (costsByCategory[r.category] || 0) + cost;
  });

  const departed = departures.filter(d => d.batchId === batch.id).reduce((sum, d) => sum + d.count, 0);
  const currentLiveCount = batch.status === 'planned' ? 0 : Math.max(0, batch.initialCount - totalMortality - departed);
  const mortalityRate = batch.initialCount > 0 ? (totalMortality / batch.initialCount) * 100 : 0;
  const isCriticalMortality = mortalityRate >= 2.0; // Umbral crítico del 2%

  const initialPurchaseTotal = batch.initialCount * (batch.initialCostPerPullet || 0);
  const totalExpenses = initialPurchaseTotal + totalOperationalExpenses;

  const currentUnitCost = currentLiveCount > 0 ? totalExpenses / currentLiveCount : 0;

  // Proyección a Semana 16 (Día 112)
  // En recría avícola, el costo estimado de alimento + calefacción + vacunas promedio para semanas restantes
  // Se estima un consumo proyectado de ~$0.04 - $0.06 por ave por día restante en semanas tempranas
  const remainingDays = Math.max(0, TARGET_DAYS - currentAgeDays);
  
  // Si ya pasó o está en día 112
  let projectedCostWeek16 = currentUnitCost;
  if (remainingDays > 0) {
    // Estimación empírica para recría de pollitas:
    // Alimentación típica acumulada a sem 16 es aprox $3.80 - $4.50 total por ave.
    const estimatedDailyCostPerBird = currentAgeDays > 0 && currentLiveCount > 0
      ? totalOperationalExpenses / currentAgeDays / currentLiveCount : 0;
    const remainingEstimatedCostPerBird = remainingDays * estimatedDailyCostPerBird;
    projectedCostWeek16 = currentUnitCost + remainingEstimatedCostPerBird;
  }

  return {
    batch,
    currentAgeDays,
    currentAgeWeeks,
    currentAgeDaysRemainder,
    progressPercent,
    totalMortality,
    mortalityRate: Number(mortalityRate.toFixed(1)),
    isCriticalMortality,
    currentLiveCount,
    totalExpenses: Number(totalExpenses.toFixed(2)),
    currentUnitCost: Number(currentUnitCost.toFixed(2)),
    projectedCostWeek16: Number(projectedCostWeek16.toFixed(2)),
    costsByCategory
  };
}

export function calculateFarmConsolidated(summaries: BatchSummary[]): FarmConsolidated {
  const activeSummaries = summaries.filter(s => s.batch.status === 'active');
  
  let totalLivePullets = 0;
  let totalInitialPullets = 0;
  let totalMortality = 0;
  let totalInvestment = 0;

  activeSummaries.forEach(s => {
    totalLivePullets += s.currentLiveCount;
    totalInitialPullets += s.batch.initialCount;
    totalMortality += s.totalMortality;
    totalInvestment += s.totalExpenses;
  });

  const avgMortalityRate = totalInitialPullets > 0 ? (totalMortality / totalInitialPullets) * 100 : 0;
  const avgCostPerPullet = totalLivePullets > 0 ? totalInvestment / totalLivePullets : 0;

  return {
    totalActiveBatches: activeSummaries.length,
    totalLivePullets,
    totalInitialPullets,
    totalMortality,
    avgMortalityRate: Number(avgMortalityRate.toFixed(1)),
    totalInvestment: Number(totalInvestment.toFixed(2)),
    avgCostPerPullet: Number(avgCostPerPullet.toFixed(2))
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount).replace('ARS', '$');
}
