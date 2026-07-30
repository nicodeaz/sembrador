import React, { useMemo } from 'react';
import { BatchSummary, FarmConsolidated, OperationRecord } from '../types';
import { formatCurrency } from '../utils/calculations';
import { 
  PlusCircle, 
  Bird, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  ShieldAlert,
  LineChart as LineChartIcon,
  Flame,
  Info,
  Bell
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface MilestoneSettings {
  w4: boolean;
  w8: boolean;
  w12: boolean;
  w16: boolean;
}

interface DashboardViewProps {
  summaries: BatchSummary[];
  consolidated: FarmConsolidated;
  records: OperationRecord[];
  onSelectBatch: (batchId: string) => void;
  onQuickRecordOperation: (batchId: string) => void;
  onNewBatchClick: () => void;
  milestoneSettings?: MilestoneSettings;
}

const COLOR_PALETTE = ['#15803d', '#ea580c', '#2563eb', '#9333ea', '#db2777', '#0891b2'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  summaries,
  consolidated,
  records,
  onSelectBatch,
  onQuickRecordOperation,
  onNewBatchClick,
  milestoneSettings
}) => {
  // Contar lotes en estado crítico de mortalidad (>2%)
  const criticalSummaries = summaries.filter(s => s.isCriticalMortality);

  // Generar alertas de hitos de edad activos para la granja
  const activeMilestones = useMemo(() => {
    if (!milestoneSettings) return [];
    const alerts: { batchName: string; week: number; title: string; description: string }[] = [];

    summaries.forEach(s => {
      const w = s.currentAgeWeeks;
      if (w === 4 && milestoneSettings.w4) {
        alerts.push({
          batchName: s.batch.name,
          week: 4,
          title: 'Hito Semana 4: Cambio a Alimento Crecimiento',
          description: 'Transición obligatoria a Alimento Crecimiento y vacuna de refuerzo (Gumboro/Newcastle).'
        });
      } else if (w === 8 && milestoneSettings.w8) {
        alerts.push({
          batchName: s.batch.name,
          week: 8,
          title: 'Hito Semana 8: Control de Uniformidad y Pesaje',
          description: 'Pesaje del 10% del lote, evaluación de conformación de pechuga y esqueleto.'
        });
      } else if (w === 12 && milestoneSettings.w12) {
        alerts.push({
          batchName: s.batch.name,
          week: 12,
          title: 'Hito Semana 12: Vacunación Coriza y Viruela',
          description: 'Aplicación de vacunas claves previas a la etapa de pre-postura.'
        });
      } else if (w === 16 && milestoneSettings.w16) {
        alerts.push({
          batchName: s.batch.name,
          week: 16,
          title: 'Hito Semana 16: Preparación para Traslado a Postura',
          description: 'Fin de la etapa de recría. Suministro de alimento pre-postura y mudanza a Galpón de Producción.'
        });
      }
    });

    return alerts;
  }, [summaries, milestoneSettings]);

  // Generar datos para el gráfico de tendencias de costo acumulado por pollita (Semanas 0 a 16)
  const costTrendData = useMemo(() => {
    if (summaries.length === 0) return [];

    const weeks = Array.from({ length: 17 }, (_, i) => i); // 0 a 16

    return weeks.map(week => {
      const dataPoint: Record<string, any> = {
        weekLabel: `Sem ${week}`,
        weekNum: week
      };

      summaries.forEach(s => {
        const batch = s.batch;
        const startDate = new Date(batch.startDate);
        const cutoffDate = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);

        // Si la semana es menor o igual a la edad actual del lote
        if (week <= s.currentAgeWeeks) {
          const batchRecords = records.filter(r => {
            if (r.batchId !== batch.id) return false;
            const recDate = new Date(r.date);
            return recDate <= cutoffDate;
          });

          let opExpenses = 0;
          let mortalityCount = 0;

          batchRecords.forEach(r => {
            opExpenses += Number(r.cost) || 0;
            if (r.category === 'mortalidad') {
              mortalityCount += Number(r.quantity) || 0;
            }
          });

          const initialPurchase = batch.initialCount * (batch.initialCostPerPullet || 0);
          const liveAtWeek = Math.max(1, batch.initialCount - mortalityCount);
          const totalExpensesAtWeek = initialPurchase + opExpenses;
          const costPerBird = totalExpensesAtWeek / liveAtWeek;

          dataPoint[batch.name] = Number(costPerBird.toFixed(2));
        } else {
          // Proyección lineal para semanas futuras hasta semana 16
          const weeksDifference = week - s.currentAgeWeeks;
          const estimatedCostIncrease = weeksDifference * 7 * 0.042; // ~$0.29 por semana
          const projectedCost = s.currentUnitCost + estimatedCostIncrease;
          dataPoint[batch.name] = Number(projectedCost.toFixed(2));
        }
      });

      return dataPoint;
    });
  }, [summaries, records]);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner Resumen de la Granja */}
      <div className="bg-gradient-to-r from-green-800 to-green-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-green-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-green-700/60 pb-5">
          <div>
            <span className="bg-orange-500/20 text-orange-300 font-bold px-3 py-1 rounded-full text-xs sm:text-sm uppercase tracking-wider border border-orange-500/30">
              Resumen General • El Sembrador
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2 text-white">
              Mis Lotes en Recría
            </h2>
            <p className="text-green-200 text-sm sm:text-base mt-1">
              Control diario de gastos, mortalidad y costo por pollita viva
            </p>
          </div>

          <button
            onClick={onNewBatchClick}
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform text-base sm:text-lg border border-orange-400/40"
          >
            <PlusCircle className="w-6 h-6" />
            <span>Agregar Nuevo Lote</span>
          </button>
        </div>

        {/* 4 Métricas Clave de la Granja */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-xs sm:text-sm font-bold text-green-200 uppercase tracking-wide">
              Total Pollitas Vivas
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Bird className="w-7 h-7 text-orange-400" />
              <p className="text-2xl sm:text-3xl font-black text-white">
                {consolidated.totalLivePullets.toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-green-300 mt-1">
              En {consolidated.totalActiveBatches} Lotes Activos
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-xs sm:text-sm font-bold text-green-200 uppercase tracking-wide">
              Costo Promedio Actual
            </p>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign className="w-7 h-7 text-orange-400" />
              <p className="text-2xl sm:text-3xl font-black text-orange-300">
                {formatCurrency(consolidated.avgCostPerPullet)}
              </p>
            </div>
            <p className="text-xs text-green-300 mt-1">
              Por pollita viva acumulado
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-xs sm:text-sm font-bold text-green-200 uppercase tracking-wide">
              Mortalidad General
            </p>
            <div className="flex items-center gap-2 mt-1">
              <AlertTriangle className={`w-7 h-7 ${consolidated.avgMortalityRate >= 2.0 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`} />
              <p className="text-2xl sm:text-3xl font-black text-white">
                {consolidated.avgMortalityRate}%
              </p>
            </div>
            <p className="text-xs text-green-300 mt-1">
              {consolidated.totalMortality} bajas acumuladas
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-xs sm:text-sm font-bold text-green-200 uppercase tracking-wide">
              Gasto Total Invertido
            </p>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="w-7 h-7 text-green-300" />
              <p className="text-2xl sm:text-3xl font-black text-white">
                {formatCurrency(consolidated.totalInvestment)}
              </p>
            </div>
            <p className="text-xs text-green-300 mt-1">
              Inversión acumulada
            </p>
          </div>
        </div>
      </div>

      {/* Banner de Alerta Crítica de Mortalidad (>2.0%) */}
      {criticalSummaries.length > 0 && (
        <div className="bg-red-600 text-white p-5 rounded-3xl shadow-xl border-2 border-red-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <ShieldAlert className="w-8 h-8 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-wide flex items-center gap-2">
                <span>⚠️ ALERTA SANITARIA CRÍTICA EN "EL SEMBRADOR"</span>
              </h3>
              <p className="text-red-100 text-sm mt-1 font-semibold">
                Se detectó que <span className="font-extrabold text-white underline">{criticalSummaries.length} lote(s)</span> supera el umbral crítico de mortalidad recomendada del 2.0%. 
                Verifique inmediatamente la higiene de comederos, calidad del agua, temperatura de criadora y plan de vacunación.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {criticalSummaries.map(s => (
              <span key={s.batch.id} className="bg-white text-red-700 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-md border border-red-200">
                {s.batch.name}: {s.mortalityRate}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Banner de Recordatorios de Hitos de Edad (Semanas 4, 8, 12, 16) */}
      {activeMilestones.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-5 rounded-3xl shadow-xl border-2 border-orange-400 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl">
              <Bell className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide">
                🔔 RECORDATORIOS DE HITOS DE EDAD ACTIVOS
              </h3>
              <p className="text-orange-100 text-xs sm:text-sm font-semibold">
                Lotes que han alcanzado semanas claves en el proceso de recría
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {activeMilestones.map((m, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
                <div className="flex items-center justify-between">
                  <span className="bg-white text-orange-900 font-extrabold text-xs px-2.5 py-1 rounded-lg">
                    {m.batchName} • Semana {m.week}
                  </span>
                  <span className="text-xs font-bold text-orange-100 uppercase">Hito de Crianza</span>
                </div>
                <p className="font-extrabold text-sm text-white mt-1.5">{m.title}</p>
                <p className="text-xs text-orange-100 mt-1 font-medium">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico de Tendencia de Costo Acumulado por Pollita (Recharts) */}
      {summaries.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                <LineChartIcon className="w-7 h-7 text-orange-500" />
                <span>Tendencia del Costo Acumulado por Pollita ($/ave)</span>
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Evolución semana a semana (0 a 16 semanas) comparando el incremento de costo unitario por lote
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200 text-xs text-orange-900 font-bold self-start sm:self-auto">
              <Info className="w-4 h-4 text-orange-600" />
              <span>Semanas futuras = Proyección de recría</span>
            </div>
          </div>

          {/* Canvas Recharts */}
          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={costTrendData}
                margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="weekLabel" 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  interval={1}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatCurrency(Number(value)),
                    name
                  ]}
                  labelFormatter={(label) => `Evolución: ${label}`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    borderColor: '#cbd5e1',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    fontWeight: 'bold',
                    padding: '12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontWeight: 'bold' }} 
                />
                {summaries.map((s, index) => (
                  <Line
                    key={s.batch.id}
                    type="monotone"
                    dataKey={s.batch.name}
                    stroke={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                    strokeWidth={3.5}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Lista / Mosaico de Tarjetas de Lotes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span className="w-3 h-8 bg-green-700 rounded-full inline-block"></span>
            Lotes Activos ({summaries.length})
          </h3>
          <span className="text-sm font-semibold text-slate-500">
            Semanas 0 a 16 (Día 112)
          </span>
        </div>

        {summaries.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-300">
            <Bird className="w-16 h-16 text-slate-300 mx-auto mb-3" />
            <h4 className="text-2xl font-bold text-slate-700">
              No hay lotes creados aún
            </h4>
            <p className="text-slate-500 text-base max-w-md mx-auto mt-2">
              Haz clic en el botón "+ Agregar Nuevo Lote" para comenzar a registrar las pollitas de El Sembrador.
            </p>
            <button
              onClick={onNewBatchClick}
              className="mt-5 bg-green-800 hover:bg-green-900 text-white font-black px-6 py-3.5 rounded-2xl text-lg shadow-md transition-all inline-flex items-center gap-2"
            >
              <PlusCircle className="w-6 h-6" />
              <span>Crear Primer Lote</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summaries.map((s) => {
              const isCritical = s.isCriticalMortality;

              return (
                <div
                  key={s.batch.id}
                  className={`bg-white rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all border-2 flex flex-col justify-between space-y-5 ${
                    isCritical 
                      ? 'border-red-500 bg-red-50/20 ring-4 ring-red-100 shadow-red-100' 
                      : 'border-slate-200'
                  }`}
                >
                  {/* Header Lote */}
                  <div>
                    {/* Alerta Crítica en la Tarjeta */}
                    {isCritical && (
                      <div className="mb-3 bg-red-600 text-white px-3.5 py-1.5 rounded-2xl font-black text-xs uppercase tracking-wide flex items-center justify-between shadow-md border border-red-700">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 animate-bounce" />
                          <span>MORTALIDAD CRÍTICA (&gt;2.0%)</span>
                        </span>
                        <span>{s.mortalityRate}%</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 text-green-800 font-extrabold text-xs px-3 py-1 rounded-full border border-green-300 uppercase">
                            {s.batch.breed || 'Pollita BB'}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            Inicio: {s.batch.startDate}
                          </span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 mt-1">
                          {s.batch.name}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span className="inline-block bg-orange-100 text-orange-900 font-black text-base px-3.5 py-1.5 rounded-2xl border border-orange-300">
                          {s.currentAgeWeeks} sem {s.currentAgeDaysRemainder > 0 ? `+ ${s.currentAgeDaysRemainder}d` : ''}
                        </span>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Día {s.currentAgeDays} de 112
                        </p>
                      </div>
                    </div>

                    {/* Visual Progress Bar to Week 16 */}
                    <div className="mt-4 bg-slate-100 rounded-2xl p-3 border border-slate-200">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1.5">
                        <span>Evolución (Día 0 → Sem 16)</span>
                        <span className="text-green-800 font-black">{s.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden border border-slate-300">
                        <div
                          className="bg-gradient-to-r from-orange-500 via-orange-600 to-green-700 h-full rounded-full transition-all duration-500"
                          style={{ width: `${s.progressPercent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-semibold">
                        <span>Día 0 (Recepción)</span>
                        <span>Sem 8</span>
                        <span>Sem 16 (Postura)</span>
                      </div>
                    </div>

                    {/* Grid de Métricas Clave del Lote */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {/* Tarjeta Costo Actual Por Pollita Viva */}
                      <div className="bg-orange-50/80 rounded-2xl p-3.5 border-2 border-orange-200 flex flex-col justify-between">
                        <p className="text-xs font-bold text-orange-900 uppercase tracking-wide">
                          Costo Actual por Viva
                        </p>
                        <p className="text-2xl font-black text-orange-600 mt-1">
                          {formatCurrency(s.currentUnitCost)}
                        </p>
                        <p className="text-[11px] text-orange-800 font-semibold mt-0.5">
                          Inversión total: {formatCurrency(s.totalExpenses)}
                        </p>
                      </div>

                      {/* Proyección Sem 16 */}
                      <div className="bg-emerald-50/80 rounded-2xl p-3.5 border-2 border-emerald-200 flex flex-col justify-between">
                        <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                          Proyección Sem 16
                        </p>
                        <p className="text-2xl font-black text-emerald-700 mt-1">
                          {formatCurrency(s.projectedCostWeek16)}
                        </p>
                        <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                          Estimado final por ave
                        </p>
                      </div>
                    </div>

                    {/* Stock y Mortalidad */}
                    <div className={`mt-3 rounded-2xl p-3 border flex items-center justify-between text-sm ${
                      isCritical ? 'bg-red-100/80 border-red-300' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <Bird className="w-5 h-5 text-green-700" />
                        <span>Stock Vivo: <strong className="text-green-800 text-base">{s.currentLiveCount.toLocaleString()}</strong> / {s.batch.initialCount.toLocaleString()}</span>
                      </div>

                      <div className={`flex items-center gap-1 font-bold px-3 py-1 rounded-xl text-xs ${
                        isCritical 
                          ? 'bg-red-600 text-white font-black shadow-md border border-red-700 animate-pulse' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        <ShieldAlert className={`w-4 h-4 ${isCritical ? 'text-white' : 'text-red-600'}`} />
                        <span>Bajas: {s.totalMortality} ({s.mortalityRate}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones Grandes de Acción Tactil (Mínimo 48px de altura táctil) */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onQuickRecordOperation(s.batch.id)}
                      className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black py-3 px-3 rounded-2xl flex items-center justify-center gap-2 text-base shadow-md transition-all active:scale-95 touch-manipulation min-h-[48px]"
                    >
                      <PlusCircle className="w-5 h-5 shrink-0" />
                      <span>Registrar Gasto</span>
                    </button>

                    <button
                      onClick={() => onSelectBatch(s.batch.id)}
                      className="bg-green-800 hover:bg-green-900 active:bg-green-950 text-white font-black py-3 px-3 rounded-2xl flex items-center justify-center gap-2 text-base shadow-md transition-all active:scale-95 touch-manipulation min-h-[48px]"
                    >
                      <span>Ver Detalle</span>
                      <ArrowRight className="w-5 h-5 text-orange-400 shrink-0" />
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
