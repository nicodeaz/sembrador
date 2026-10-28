import React, { useState } from 'react';
import { BatchSummary, OperationRecord, CategoryType } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  ArrowLeft,
  Wheat,
  ShieldAlert,
  Syringe,
  Flame,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  PieChart,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface BatchDetailViewProps {
  summary: BatchSummary;
  records: OperationRecord[];
  onBack: () => void;
  onOpenRecordModal: (category?: CategoryType) => void;
  onDeleteRecord: (recordId: string) => void;
  onDeleteBatch: (batchId: string) => void;
}

export const BatchDetailView: React.FC<BatchDetailViewProps> = ({
  summary,
  records,
  onBack,
  onOpenRecordModal,
  onDeleteRecord,
  onDeleteBatch
}) => {
  const [filterCategory, setFilterCategory] = useState<CategoryType | 'todas'>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const batchRecords = records.filter(r => r.batchId === summary.batch.id);

  const filteredRecords = batchRecords.filter(r => {
    const matchesCategory = filterCategory === 'todas' || r.category === filterCategory;
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categoryLabels: Record<CategoryType, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
    alimento: {
      label: 'Alimento / Ración',
      icon: <Wheat className="w-8 h-8 text-green-700" />,
      bg: 'bg-green-100 hover:bg-green-200',
      text: 'text-green-900',
      border: 'border-green-300'
    },
    mortalidad: {
      label: 'Mortalidad (Bajas)',
      icon: <ShieldAlert className="w-8 h-8 text-red-600" />,
      bg: 'bg-red-100 hover:bg-red-200',
      text: 'text-red-900',
      border: 'border-red-300'
    },
    vacunas: {
      label: 'Vacunas / Sanidad',
      icon: <Syringe className="w-8 h-8 text-blue-600" />,
      bg: 'bg-blue-100 hover:bg-blue-200',
      text: 'text-blue-900',
      border: 'border-blue-300'
    },
    calefaccion: {
      label: 'Calefacción / Energía',
      icon: <Flame className="w-8 h-8 text-amber-600" />,
      bg: 'bg-amber-100 hover:bg-amber-200',
      text: 'text-amber-900',
      border: 'border-amber-300'
    },
    otros: {
      label: 'Otros Gastos',
      icon: <DollarSign className="w-8 h-8 text-slate-700" />,
      bg: 'bg-slate-100 hover:bg-slate-200',
      text: 'text-slate-900',
      border: 'border-slate-300'
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Botón Volver y Nombre Lote */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 text-base transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-orange-600" />
          <span>Volver a Mis Lotes</span>
        </button>

        <button
          onClick={() => {
            if (confirm(`¿Seguro que deseas eliminar el lote "${summary.batch.name}"? Se borrarán sus registros.`)) {
              onDeleteBatch(summary.batch.id);
            }
          }}
          className="text-red-600 hover:text-red-800 text-xs font-bold underline px-3 py-1"
        >
          Eliminar Lote
        </button>
      </div>

      {/* Header Info Principal Lote */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-100 text-orange-900 font-extrabold text-xs px-3 py-1 rounded-full uppercase border border-orange-200">
                Lote Activo • {summary.batch.breed || 'Pollitas BB'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Fecha Inicio: {summary.batch.startDate}
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              {summary.batch.name}
            </h2>
            {summary.batch.notes && (
              <p className="text-slate-500 text-sm mt-1">{summary.batch.notes}</p>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-around gap-6">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-500 uppercase">Edad Actual</p>
              <p className="text-2xl font-black text-green-800 mt-0.5">
                {summary.currentAgeWeeks} sem {summary.currentAgeDaysRemainder > 0 ? `+ ${summary.currentAgeDaysRemainder}d` : ''}
              </p>
              <p className="text-[11px] text-slate-500">Día {summary.currentAgeDays} de 112</p>
            </div>

            <div className="w-px h-10 bg-slate-300"></div>

            <div className="text-center">
              <p className="text-xs font-bold text-slate-500 uppercase">Pollitas Vivas</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {summary.currentLiveCount.toLocaleString()}
              </p>
              <p className="text-[11px] text-red-600 font-bold">
                Bajas: {summary.totalMortality} ({summary.mortalityRate}%)
              </p>
            </div>
          </div>
        </div>

        {/* MOTOR DE CÁLCULO: Tarjeta de Costo Unitario Actual */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-orange-400">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Costo Unitario Actual Por Viva
            </p>
            <p className="text-3xl sm:text-4xl font-black mt-1 text-orange-600">
              {formatCurrency(summary.currentUnitCost)}
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Fórmula: Total Gastos ({formatCurrency(summary.totalExpenses)}) / Aves Vivas ({summary.currentLiveCount})
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Proyección a Semana 16
            </p>
            <p className="text-3xl sm:text-4xl font-black mt-1 text-emerald-700">
              {formatCurrency(summary.projectedCostWeek16)}
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Estimado final por pollita al término de recría (Día 112)
            </p>
          </div>

          <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Compra Inicial</span>
              <span>{formatCurrency(summary.batch.initialCount * summary.batch.initialCostPerPullet)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mt-1">
              <span>Gastos Alimento</span>
              <span>{formatCurrency(summary.costsByCategory.alimento)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mt-1">
              <span>Vacunas + Calefacción</span>
              <span>{formatCurrency(summary.costsByCategory.vacunas + summary.costsByCategory.calefaccion)}</span>
            </div>
            <div className="border-t border-slate-300 mt-2 pt-2 flex items-center justify-between font-black text-sm text-slate-900">
              <span>Gasto Total Lote</span>
              <span className="text-orange-600">{formatCurrency(summary.totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* REGISTRO DE OPERACIONES ACCESIBLE - 4 BOTONES GIGANTES */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200">
        <h3 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-2">
          <Plus className="w-6 h-6 text-orange-600" />
          <span>Registrar Operación en este Lote</span>
        </h3>
        <p className="text-slate-600 text-base mb-5">
          Toca uno de los botones grandes para registrar ración, bajas o vacunas:
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onOpenRecordModal('alimento')}
            className="p-5 rounded-3xl bg-green-50 hover:bg-green-100 active:bg-green-200 border-2 border-green-300 flex flex-col items-center text-center shadow-md active:scale-95 transition-all touch-manipulation group"
          >
            <div className="w-16 h-16 rounded-2xl bg-green-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform mb-3">
              <Wheat className="w-9 h-9" />
            </div>
            <span className="font-black text-xl text-green-950">Alimento / Ración</span>
            <span className="text-xs text-green-800 font-bold mt-1">Bolsas, Kg y costo</span>
          </button>

          <button
            onClick={() => onOpenRecordModal('mortalidad')}
            className="p-5 rounded-3xl bg-red-50 hover:bg-red-100 active:bg-red-200 border-2 border-red-300 flex flex-col items-center text-center shadow-md active:scale-95 transition-all touch-manipulation group"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform mb-3">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <span className="font-black text-xl text-red-950">Mortalidad</span>
            <span className="text-xs text-red-800 font-bold mt-1">Número de bajas</span>
          </button>

          <button
            onClick={() => onOpenRecordModal('vacunas')}
            className="p-5 rounded-3xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border-2 border-blue-300 flex flex-col items-center text-center shadow-md active:scale-95 transition-all touch-manipulation group"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform mb-3">
              <Syringe className="w-9 h-9" />
            </div>
            <span className="font-black text-xl text-blue-950">Vacunas</span>
            <span className="text-xs text-blue-800 font-bold mt-1">Vacunación y dosis</span>
          </button>

          <button
            onClick={() => onOpenRecordModal('calefaccion')}
            className="p-5 rounded-3xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border-2 border-amber-300 flex flex-col items-center text-center shadow-md active:scale-95 transition-all touch-manipulation group"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform mb-3">
              <Flame className="w-9 h-9" />
            </div>
            <span className="font-black text-xl text-amber-950">Calefacción</span>
            <span className="text-xs text-amber-800 font-bold mt-1">Gas, leña o energía</span>
          </button>
        </div>
      </div>

      {/* Historial de Registros */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <h3 className="text-2xl font-black text-slate-900">
            Historial de Operaciones ({filteredRecords.length})
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* Buscador */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar registro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-600 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Filtros por Categoría */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {(['todas', 'alimento', 'mortalidad', 'vacunas', 'calefaccion', 'otros'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-green-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'todas' ? 'Todas' : categoryLabels[cat].label}
            </button>
          ))}
        </div>

        {/* Lista de Registros */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-lg font-bold">No se encontraron registros</p>
            <p className="text-sm">Usa los botones superiores para registrar tu primer gasto o bajas.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredRecords.map((rec) => {
              const meta = categoryLabels[rec.category];
              return (
                <div key={rec.id} className="py-4 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-2xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border ${meta.bg} ${meta.border}`}>
                      {meta.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${meta.bg} ${meta.text}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">{rec.date}</span>
                        {rec.season && (
                          <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">
                            {rec.season}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-lg text-slate-900 mt-0.5">
                        {rec.title}
                      </h4>
                      {rec.notes && (
                        <p className="text-xs text-slate-500 mt-0.5">{rec.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {rec.quantity && rec.quantity > 0 && (
                        <p className="font-black text-slate-800 text-base">
                          {rec.quantity} {rec.unit || ''}
                        </p>
                      )}
                      <p className="font-black text-orange-600 text-lg">
                        {rec.cost > 0 ? formatCurrency(rec.cost) : 'Sin costo $'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar registro "${rec.title}"?`)) {
                          onDeleteRecord(rec.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
