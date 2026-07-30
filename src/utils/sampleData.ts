import { Batch, OperationRecord, VaccineScheduleItem } from '../types';

export const VACCINE_SCHEDULE: VaccineScheduleItem[] = [
  { week: 1, day: 1, disease: 'Marek & Coccidiosis', vaccineName: 'HVT + Rispens / Spray Coccidiosis', method: 'Inyección', description: 'Aplicada en incubadora o día 1 de recepción.', mandatory: true },
  { week: 1, day: 7, disease: 'Newcastle + Bronquitis', vaccineName: 'B1 / Ma5 en agua de bebida', method: 'agua', description: 'Protección primaria respiratoria.', mandatory: true },
  { week: 2, day: 14, disease: 'Gumboro (IBD)', vaccineName: 'Gumboro Cepa Intermedia', method: 'agua', description: 'Primer refuerzo de la bolsa de Fabricio.', mandatory: true },
  { week: 4, day: 28, disease: 'Gumboro (Refuerzo)', vaccineName: 'Gumboro Cepa Intermedia Plus', method: 'agua', description: 'Segunda dosis para inmunidad duradera.', mandatory: true },
  { week: 6, day: 42, disease: 'Viruela Aviar', vaccineName: 'Cepa Suave / Pox', method: 'punción', description: 'Punción en la membrana del ala.', mandatory: true },
  { week: 8, day: 56, disease: 'Newcastle + Bronquitis', vaccineName: 'LaSota / Clonada', method: 'agua', description: 'Refuerzo de inmunidad humoral.', mandatory: true },
  { week: 10, day: 70, disease: 'Laringotraqueítis (LTI)', vaccineName: 'LT Vectorizada', method: 'ocular', description: 'Gotas en ojo o punción según zona.', mandatory: false },
  { week: 12, day: 84, disease: 'Coriza Avium', vaccineName: 'Bacterina Triple Coriza', method: 'Inyección', description: 'Inyección intramuscular o subcutánea.', mandatory: true },
  { week: 14, day: 98, disease: 'Síndrome de Caída de Postura (EDS) + Newcastle + Bronquitis', vaccineName: 'Vacuna Oleosa Inactivada Tiple', method: 'Inyección', description: 'Dosis previa al traslado a jaula/piso de postura.', mandatory: true }
];

// Generar fechas relativas para que los datos se vean actuales
const getPastDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const INITIAL_BATCHES: Batch[] = [
  {
    id: 'lote-1',
    name: 'Lote A - Ene 15',
    startDate: getPastDate(42), // 6 semanas de edad (Día 42)
    initialCount: 2500,
    initialCostPerPullet: 1.50,
    breed: 'Hy-Line Brown',
    notes: 'Galpón 1 - Temperatura controlada con criadora a gas',
    status: 'active',
    createdAt: getPastDate(42)
  },
  {
    id: 'lote-2',
    name: 'Lote B - Mar 01',
    startDate: getPastDate(14), // 2 semanas de edad (Día 14)
    initialCount: 1800,
    initialCostPerPullet: 1.55,
    breed: 'Lohmann Brown',
    notes: 'Galpón 2 - Recepción con cama de viruta nueva',
    status: 'active',
    createdAt: getPastDate(14)
  }
];

export const INITIAL_RECORDS: OperationRecord[] = [
  // Lote A
  {
    id: 'rec-1',
    batchId: 'lote-1',
    date: getPastDate(40),
    category: 'alimento',
    title: 'Iniciador Pollita BB (10 Bolsas)',
    quantity: 10,
    unit: 'bolsas',
    cost: 450,
    notes: 'Alimento iniciador 21% proteína',
    createdAt: getPastDate(40)
  },
  {
    id: 'rec-2',
    batchId: 'lote-1',
    date: getPastDate(35),
    category: 'mortalidad',
    title: 'Bajas primera semana',
    quantity: 18,
    unit: 'aves',
    cost: 0,
    notes: 'Mortalidad natural de recepción Día 1-7',
    createdAt: getPastDate(35)
  },
  {
    id: 'rec-3',
    batchId: 'lote-1',
    date: getPastDate(28),
    category: 'vacunas',
    title: 'Vacuna Gumboro + Newcastle',
    quantity: 2500,
    unit: 'dosis',
    cost: 120,
    notes: 'Aplicado en agua de bebida con neutralizador de cloro',
    createdAt: getPastDate(28)
  },
  {
    id: 'rec-4',
    batchId: 'lote-1',
    date: getPastDate(20),
    category: 'calefaccion',
    title: 'Garrafas Gas Criadora (Invierno)',
    quantity: 4,
    unit: 'garrafas',
    cost: 180,
    season: 'invierno',
    notes: 'Calefacción nocturna semana 2 y 3',
    createdAt: getPastDate(20)
  },
  {
    id: 'rec-5',
    batchId: 'lote-1',
    date: getPastDate(10),
    category: 'alimento',
    title: 'Crecimiento Pollita (20 Bolsas)',
    quantity: 20,
    unit: 'bolsas',
    cost: 880,
    notes: 'Cambio a alimento crecimiento',
    createdAt: getPastDate(10)
  },
  {
    id: 'rec-6',
    batchId: 'lote-1',
    date: getPastDate(5),
    category: 'mortalidad',
    title: 'Bajas semana 5',
    quantity: 5,
    unit: 'aves',
    cost: 0,
    notes: 'Aves con bajo peso eliminadas',
    createdAt: getPastDate(5)
  },

  // Lote B
  {
    id: 'rec-7',
    batchId: 'lote-2',
    date: getPastDate(13),
    category: 'alimento',
    title: 'Iniciador Pollita BB (8 Bolsas)',
    quantity: 8,
    unit: 'bolsas',
    cost: 360,
    notes: 'Recepción Lote B',
    createdAt: getPastDate(13)
  },
  {
    id: 'rec-8',
    batchId: 'lote-2',
    date: getPastDate(10),
    category: 'calefaccion',
    title: 'Calefacción Eléctrica + Gas',
    quantity: 2,
    unit: 'garrafas',
    cost: 95,
    season: 'invierno',
    notes: 'Primera semana de vida',
    createdAt: getPastDate(10)
  },
  {
    id: 'rec-9',
    batchId: 'lote-2',
    date: getPastDate(7),
    category: 'mortalidad',
    title: 'Bajas recepción',
    quantity: 12,
    unit: 'aves',
    cost: 0,
    createdAt: getPastDate(7)
  }
];
