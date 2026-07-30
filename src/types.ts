export type CategoryType = 'alimento' | 'mortalidad' | 'vacunas' | 'calefaccion' | 'otros';

export interface Batch {
  id: string;
  name: string; // ej: "Lote A - Ene 15"
  startDate: string; // YYYY-MM-DD (Día 0)
  initialCount: number; // Cantidad inicial de pollitas BB
  initialCostPerPullet: number; // Costo de compra inicial por pollita BB (ej: $1.20)
  breed?: string; // Raza ej: "Hy-Line Brown", "Lohmann Brown", "Cobb"
  notes?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
}

export interface OperationRecord {
  id: string;
  batchId: string;
  date: string; // YYYY-MM-DD
  category: CategoryType;
  title: string;
  
  // Especificos segun categoria
  quantity?: number; // Para alimento (bolsas o kg) o mortalidad (cantidad de bajas)
  unit?: 'bolsas' | 'kg' | 'aves' | 'dosis' | 'garrafas' | 'unidades';
  cost: number; // Costo total en $ (0 para mortalidad pura salvo que implique un cargo)
  season?: 'invierno' | 'verano' | 'neutral';
  notes?: string;
  createdAt: string;
}

export interface VaccineScheduleItem {
  week: number;
  day: number;
  disease: string;
  vaccineName: string;
  method: 'agua' | 'ocular' | 'Inyección' | 'spray' | 'punción';
  description: string;
  mandatory: boolean;
}

export interface BatchSummary {
  batch: Batch;
  currentAgeDays: number;
  currentAgeWeeks: number;
  currentAgeDaysRemainder: number;
  progressPercent: number; // 0 to 100 towards 16 weeks (112 days)
  totalMortality: number;
  mortalityRate: number; // percentage
  isCriticalMortality: boolean; // True if mortality exceeds threshold (2.0%)
  currentLiveCount: number;
  totalExpenses: number; // Incluye costo inicial de compra + gastos acumulados
  currentUnitCost: number; // Costo por pollita viva actual
  projectedCostWeek16: number; // Proyección a semana 16
  costsByCategory: Record<CategoryType, number>;
}

export interface FarmConsolidated {
  totalActiveBatches: number;
  totalLivePullets: number;
  totalInitialPullets: number;
  totalMortality: number;
  avgMortalityRate: number;
  totalInvestment: number;
  avgCostPerPullet: number;
}
