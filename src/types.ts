export type CategoryType = 'alimento' | 'mortalidad' | 'vacunas' | 'calefaccion' | 'otros';

export interface Batch {
  id: string;
  name: string; // ej: "Lote A - Ene 15"
  startDate: string; // YYYY-MM-DD (Día 0)
  initialCount: number; // Cantidad inicial de pollitas BB
  initialCostPerPullet: number; // Costo de compra inicial por pollita BB (ej: $1.20)
  breed?: string; // Raza ej: "Hy-Line Brown", "Lohmann Brown", "Cobb"
  barn?: string;
  notes?: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  endDate?: string;
  expectedExitDate?: string;
  ageOnArrivalDays?: number;
  createdAt: string;
}

export interface Departure {
  id: string;
  batchId: string;
  date: string;
  count: number;
  amount: number;
  notes: string;
}

export interface FarmTask {
  id: string;
  title: string;
  date: string;
  batchId?: string;
  kind: 'limpieza' | 'sanidad' | 'mantenimiento' | 'otro';
  status: 'pending' | 'done';
  completedDate?: string;
  cost: number;
  notes: string;
}

export interface StockMovement {
  id: string;
  type: 'purchase' | 'sale' | 'feed' | 'production' | 'expense';
  date: string;
  product: string;
  quantityKg: number;
  amount: number;
  batchId?: string;
  purchaseId?: string;
  quantityUnit?: 'kg' | 'bolsas';
  bagWeightKg?: number;
  contact: string;
  notes: string;
  ingredients?: { product: string; quantityKg: number }[];
}

export interface MediaAsset {
  id: string;
  title: string;
  category: 'logo' | 'etiqueta' | 'flyer' | 'servicios';
  mime: string;
  size: number;
  createdAt: string;
}

export interface FarmData {
  schemaVersion: 3;
  batches: Batch[];
  records: OperationRecord[];
  departures: Departure[];
  tasks: FarmTask[];
  movements: StockMovement[];
}

export const emptyFarm = (): FarmData => ({ schemaVersion: 3, batches: [], records: [], departures: [], tasks: [], movements: [] });

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
