import React, { useState, useMemo } from 'react';
import { BatchSummary, FarmConsolidated, OperationRecord } from '../types';
import { formatCurrency } from '../utils/calculations';
import { 
  Layers, 
  Bird, 
  DollarSign, 
  TrendingUp, 
  ShieldAlert, 
  Wheat, 
  Syringe, 
  Flame,
  Calendar,
  Filter,
  X,
  Tag,
  Scale,
  Award,
  ArrowRightLeft,
  CheckCircle2
} from 'lucide-react';

interface ConsolidatedViewProps {
  summaries: BatchSummary[];
  consolidated: FarmConsolidated;
  records: OperationRecord[];
  onSelectBatch: (batchId: string) => void;
}

type DatePreset = 'all' | 'this_month' | 'last_30' | 'this_quarter' | 'custom';

export const ConsolidatedView: React.FC<ConsolidatedViewProps> = ({
  summaries,
  consolidated,
  records,
  onSelectBatch
}) => {
  const [preset, setPreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Estados para selección de 2 lotes a comparar lado a lado
  const [batchIdA, setBatchIdA] = useState<string>(summaries[0]?.batch.id || '');
  const [batchIdB, setBatchIdB] = useState<string>(summaries[1]?.batch.id || summaries[0]?.batch.id || '');

  const summaryA = useMemo(() => {
    return summaries.find(s => s.batch.id === batchIdA) || summaries[0];
  }, [summaries, batchIdA]);

  const summaryB = useMemo(() => {
    return summaries.find(s => s.batch.id === batchIdB) || summaries[1] || summaries[0];
  }, [summaries, batchIdB]);

  // Configurar las fechas según el preset seleccionado
  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (newPreset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (newPreset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (newPreset === 'last_30') {
      const past30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past30.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (newPreset === 'this_quarter') {
      const currentQuarterMonth = Math.floor(today.getMonth() / 3) * 3;
      const quarterStart = new Date(today.getFullYear(), currentQuarterMonth, 1);
      setStartDate(quarterStart.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Filtrar registros según rango
  const filteredRecords = useMemo(() => {
    if (preset === 'all' && !startDate && !endDate) {
      return records;
    }

    return records.filter(r => {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });
  }, [records, preset, startDate, endDate]);

  // Cálculos consolidados en el período filtrado
  const periodMetrics = useMemo(() => {
    let alimento = 0;
    let vacunas = 0;
    let calefaccion = 0;
    let otros = 0;
    let mortalidadCount = 0;

    filteredRecords.forEach(r => {
      const cost = Number(r.cost) || 0;
      if (r.category === 'alimento') alimento += cost;
      if (r.category === 'vacunas') vacunas += cost;
      if (r.category === 'calefaccion') calefaccion += cost;
      if (r.category === 'otros') otros += cost;

      if (r.category === 'mortalidad') {
        mortalidadCount += Number(r.quantity) || 0;
      }
    });

    const totalOpExpenses = alimento + vacunas + calefaccion + otros;

    // Compra inicial global
    const compraInicial = summaries.reduce((acc, s) => {
      return acc + (s.batch.initialCount * (s.batch.initialCostPerPullet || 0));
    }, 0);

    const totalPeriodCost = (preset === 'all' ? compraInicial : 0) + totalOpExpenses;
    const denominator = totalPeriodCost || 1;

    return {
      alimento,
      vacunas,
      calefaccion,
      otros,
      compraInicial,
      totalOpExpenses,
      totalPeriodCost,
      mortalidadCount,
      percentages: {
        compraInicial: Math.round((compraInicial / denominator) * 100),
        alimento: Math.round((alimento / denominator) * 100),
        vacunas: Math.round((vacunas / denominator) * 100),
        calefaccion: Math.round((calefaccion / denominator) * 100),
        otros: Math.round((otros / denominator) * 100)
      }
    };
  }, [filteredRecords, summaries, preset]);

  // Desglose de gastos por categoría para la comparativa de 2 lotes
  const compareBreakdown = useMemo(() => {
    if (!summaryA || !summaryB) return null;

    const calcCategories = (batchId: string) => {
      const bRecs = records.filter(r => r.batchId === batchId);
      let alimento = 0;
      let vacunas = 0;
      let calefaccion = 0;
      let otros = 0;
      bRecs.forEach(r => {
        const c = Number(r.cost) || 0;
        if (r.category === 'alimento') alimento += c;
        if (r.category === 'vacunas') vacunas += c;
        if (r.category === 'calefaccion') calefaccion += c;
        if (r.category === 'otros') otros += c;
      });
      return { alimento, vacunas, calefaccion, otros };
    };

    const breakdownA = calcCategories(summaryA.batch.id);
    const breakdownB = calcCategories(summaryB.batch.id);

    return { breakdownA, breakdownB };
  }, [summaryA, summaryB, records]);

  // Métricas específicas por lote en el período seleccionado
  const batchPeriodBreakdown = useMemo(() => {
    return summaries.map(s => {
      const bRecords = filteredRecords.filter(r => r.batchId === s.batch.id);
      let periodExpenses = 0;
      let periodMortality = 0;

      bRecords.forEach(r => {
        periodExpenses += Number(r.cost) || 0;
        if (r.category === 'mortalidad') {
          periodMortality += Number(r.quantity) || 0;
        }
      });

      return {
        ...s,
        periodExpenses,
        periodMortality
      };
    });
  }, [summaries, filteredRecords]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Panel */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl border border-orange-200">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">
                Vista Consolidada "El Sembrador"
              </h2>
              <p className="text-slate-600 text-base mt-0.5">
                Panel integrado de todos los lotes y balance de gastos por período
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Rango de Fechas */}
        <div className="mt-5 bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span>Filtrar Período de Análisis:</span>
            </label>

            {(preset !== 'all' || startDate || endDate) && (
              <button
                onClick={() => handlePresetChange('all')}
                className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-xl flex items-center gap-1 transition-colors self-start sm:self-auto"
              >
                <X className="w-4 h-4" />
                <span>Restablecer Todo el Historial</span>
              </button>
            )}
          </div>

          {/* Botones de Presets Rpidos */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all touch-manipulation ${
                preset === 'all'
                  ? 'bg-green-800 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Todo el Historial
            </button>

            <button
              onClick={() => handlePresetChange('this_month')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all touch-manipulation ${
                preset === 'this_month'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Este Mes
            </button>

            <button
              onClick={() => handlePresetChange('last_30')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all touch-manipulation ${
                preset === 'last_30'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Últimos 30 Días
            </button>

            <button
              onClick={() => handlePresetChange('this_quarter')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all touch-manipulation ${
                preset === 'this_quarter'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Este Trimestre (90d)
            </button>

            <button
              onClick={() => setPreset('custom')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all touch-manipulation ${
                preset === 'custom'
                  ? 'bg-green-800 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Entradas de Fecha Desde / Hasta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreset('custom');
                }}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-green-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset('custom');
                }}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-green-700"
              />
            </div>
          </div>

          {/* Etiqueta Informativa de Rango Activo */}
          {(startDate || endDate) && (
            <div className="bg-orange-100 text-orange-900 border border-orange-300 p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between">
              <span>
                🗓️ Período activo: <strong className="underline">{startDate || 'Inicio'}</strong> al <strong className="underline">{endDate || 'Hoy'}</strong> ({filteredRecords.length} registros hallados)
              </span>
              <span className="text-orange-950 font-black">
                Gasto Período: {formatCurrency(periodMetrics.totalPeriodCost)}
              </span>
            </div>
          )}
        </div>

        {/* 4 Indicadores Clave del Período */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase">Aves Vivas Totales</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {consolidated.totalLivePullets.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              En {consolidated.totalActiveBatches} Lotes
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 border-l-4 border-l-orange-400 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase">Gasto Período Filtrado</p>
            <p className="text-3xl font-black text-orange-600 mt-1">
              {formatCurrency(periodMetrics.totalPeriodCost)}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              {preset === 'all' ? 'Inversión global acumulada' : 'Total operacional en rango'}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase">Bajas en Período</p>
            <p className="text-3xl font-black text-red-600 mt-1">
              {periodMetrics.mortalidadCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {preset === 'all' ? `Tasa global: ${consolidated.avgMortalityRate}%` : 'Mortalidad en el rango'}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 border-l-4 border-l-green-600 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase">Costo Promedio Viva</p>
            <p className="text-3xl font-black text-green-800 mt-1">
              {formatCurrency(consolidated.avgCostPerPullet)}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              Consolidado por ave
            </p>
          </div>
        </div>
      </div>

      {/* Distribución Global de Gastos (Barra Porcentual) */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-900">
            Distribución de Gastos en el Período
          </h3>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
            {preset === 'all' ? 'Todo el Historial' : 'Período Filtrado'}
          </span>
        </div>
        
        {/* Visual Bar */}
        <div className="w-full bg-slate-100 h-8 rounded-2xl overflow-hidden flex border border-slate-300">
          {preset === 'all' && (
            <div style={{ width: `${periodMetrics.percentages.compraInicial}%` }} className="bg-slate-700 h-full text-[11px] text-white font-bold flex items-center justify-center" title="Compra BB">
              {periodMetrics.percentages.compraInicial > 8 ? `${periodMetrics.percentages.compraInicial}%` : ''}
            </div>
          )}
          <div style={{ width: `${periodMetrics.percentages.alimento}%` }} className="bg-green-600 h-full text-[11px] text-white font-bold flex items-center justify-center" title="Alimento">
            {periodMetrics.percentages.alimento > 8 ? `${periodMetrics.percentages.alimento}%` : ''}
          </div>
          <div style={{ width: `${periodMetrics.percentages.vacunas}%` }} className="bg-blue-600 h-full text-[11px] text-white font-bold flex items-center justify-center" title="Vacunas">
            {periodMetrics.percentages.vacunas > 8 ? `${periodMetrics.percentages.vacunas}%` : ''}
          </div>
          <div style={{ width: `${periodMetrics.percentages.calefaccion}%` }} className="bg-amber-600 h-full text-[11px] text-white font-bold flex items-center justify-center" title="Calefacción">
            {periodMetrics.percentages.calefaccion > 8 ? `${periodMetrics.percentages.calefaccion}%` : ''}
          </div>
          <div style={{ width: `${periodMetrics.percentages.otros}%` }} className="bg-purple-600 h-full text-[11px] text-white font-bold flex items-center justify-center" title="Otros">
            {periodMetrics.percentages.otros > 8 ? `${periodMetrics.percentages.otros}%` : ''}
          </div>
        </div>

        {/* Leyenda de Categorías */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {preset === 'all' && (
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="w-4 h-4 bg-slate-700 rounded-md"></div>
              <div>
                <p className="text-xs font-bold text-slate-700">Compra Pollitas BB</p>
                <p className="text-sm font-black text-slate-900">{formatCurrency(periodMetrics.compraInicial)} ({periodMetrics.percentages.compraInicial}%)</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 bg-green-50 p-3 rounded-xl border border-green-200">
            <Wheat className="w-5 h-5 text-green-700" />
            <div>
              <p className="text-xs font-bold text-green-900">Alimento / Ración</p>
              <p className="text-sm font-black text-green-800">{formatCurrency(periodMetrics.alimento)} ({periodMetrics.percentages.alimento}%)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl border border-blue-200">
            <Syringe className="w-5 h-5 text-blue-700" />
            <div>
              <p className="text-xs font-bold text-blue-900">Vacunas & Sanidad</p>
              <p className="text-sm font-black text-blue-800">{formatCurrency(periodMetrics.vacunas)} ({periodMetrics.percentages.vacunas}%)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <Flame className="w-5 h-5 text-amber-700" />
            <div>
              <p className="text-xs font-bold text-amber-900">Calefacción & Energía</p>
              <p className="text-sm font-black text-amber-800">{formatCurrency(periodMetrics.calefaccion)} ({periodMetrics.percentages.calefaccion}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Comparativa de Lotes en el Período */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200 overflow-x-auto">
        <h3 className="text-2xl font-black text-slate-900 mb-4">
          Comparativa por Lote (Período Seleccionado)
        </h3>

        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="border-b-2 border-slate-200 text-xs font-black uppercase text-slate-500 bg-slate-50">
              <th className="p-3">Lote / Raza</th>
              <th className="p-3">Edad (Semanas)</th>
              <th className="p-3">Stock Vivas</th>
              <th className="p-3">Bajas Período (Total)</th>
              <th className="p-3">Gasto en Período</th>
              <th className="p-3">Costo Actual por Viva</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium text-base">
            {batchPeriodBreakdown.map((s) => (
              <tr key={s.batch.id} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-900">
                  {s.batch.name}
                  <span className="block text-xs font-normal text-slate-500">{s.batch.breed}</span>
                </td>
                <td className="p-3 font-extrabold text-green-800">
                  {s.currentAgeWeeks} sem (+ {s.currentAgeDaysRemainder}d)
                </td>
                <td className="p-3 font-bold text-slate-800">
                  {s.currentLiveCount.toLocaleString()}
                </td>
                <td className="p-3 font-bold text-red-600">
                  {s.periodMortality} bajas ({s.totalMortality} acum. {s.mortalityRate}%)
                </td>
                <td className="p-3 font-black text-orange-600">
                  {formatCurrency(s.periodExpenses)}
                </td>
                <td className="p-3 font-black text-emerald-700">
                  {formatCurrency(s.currentUnitCost)}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onSelectBatch(s.batch.id)}
                    className="bg-green-800 hover:bg-green-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm"
                  >
                    Ver Lote
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SECCIÓN COMPARATIVA DE 2 LOTES LADO A LADO */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">
                Comparativa Lado a Lado (2 Lotes)
              </h3>
              <p className="text-slate-600 text-sm mt-0.5 font-medium">
                Seleccione dos lotes específicos para contrastar rendimientos, costos y mortalidad en tabla simplificada.
              </p>
            </div>
          </div>
        </div>

        {/* Selectores de Lote A y Lote B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-xs font-black text-green-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-700 inline-block"></span>
              Lote A (Lote Base)
            </label>
            <select
              value={batchIdA}
              onChange={(e) => setBatchIdA(e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-xl border-2 border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-green-700"
            >
              {summaries.map(s => (
                <option key={s.batch.id} value={s.batch.id}>
                  {s.batch.name} ({s.batch.breed}) - {s.currentAgeWeeks} sem
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-orange-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-600 inline-block"></span>
              Lote B (Lote a Comparar)
            </label>
            <select
              value={batchIdB}
              onChange={(e) => setBatchIdB(e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-xl border-2 border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-orange-600"
            >
              {summaries.map(s => (
                <option key={s.batch.id} value={s.batch.id}>
                  {s.batch.name} ({s.batch.breed}) - {s.currentAgeWeeks} sem
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Highlights of Best Performer */}
        {summaryA && summaryB && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-3">
              <Award className="w-6 h-6 text-emerald-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Menor Costo por Ave Viva</p>
                <p className="text-sm font-black text-emerald-800">
                  {summaryA.currentUnitCost <= summaryB.currentUnitCost 
                    ? `${summaryA.batch.name} (${formatCurrency(summaryA.currentUnitCost)}/ave)`
                    : `${summaryB.batch.name} (${formatCurrency(summaryB.currentUnitCost)}/ave)`
                  }
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-blue-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-900">Menor Tasa de Mortalidad</p>
                <p className="text-sm font-black text-blue-800">
                  {summaryA.mortalityRate <= summaryB.mortalityRate
                    ? `${summaryA.batch.name} (${summaryA.mortalityRate}%)`
                    : `${summaryB.batch.name} (${summaryB.mortalityRate}%)`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla Simplificada Comparativa Lado a Lado */}
        {summaryA && summaryB && (
          <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-100 text-xs font-black uppercase text-slate-700 border-b-2 border-slate-200">
                  <th className="p-3 w-1/3">Métrica de Rendimiento</th>
                  <th className="p-3 w-1/3 text-green-800 border-x border-slate-200">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-700 inline-block"></span>
                      {summaryA.batch.name}
                    </span>
                  </th>
                  <th className="p-3 w-1/3 text-orange-800">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block"></span>
                      {summaryB.batch.name}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm font-semibold text-slate-800">
                <tr>
                  <td className="p-3 font-bold text-slate-700">Raza / Genética</td>
                  <td className="p-3 border-x border-slate-200 font-extrabold text-slate-900">{summaryA.batch.breed}</td>
                  <td className="p-3 font-extrabold text-slate-900">{summaryB.batch.breed}</td>
                </tr>

                <tr>
                  <td className="p-3 font-bold text-slate-700">Edad Actual (Recría)</td>
                  <td className="p-3 border-x border-slate-200 font-extrabold text-green-800">
                    Semana {summaryA.currentAgeWeeks} (+{summaryA.currentAgeDaysRemainder}d)
                  </td>
                  <td className="p-3 font-extrabold text-orange-800">
                    Semana {summaryB.currentAgeWeeks} (+{summaryB.currentAgeDaysRemainder}d)
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-bold text-slate-700">Aves BB Iniciales</td>
                  <td className="p-3 border-x border-slate-200">{summaryA.batch.initialCount.toLocaleString()} aves</td>
                  <td className="p-3">{summaryB.batch.initialCount.toLocaleString()} aves</td>
                </tr>

                <tr>
                  <td className="p-3 font-bold text-slate-700">Stock Vivas Actuales</td>
                  <td className="p-3 border-x border-slate-200 font-bold text-slate-900">{summaryA.currentLiveCount.toLocaleString()} aves</td>
                  <td className="p-3 font-bold text-slate-900">{summaryB.currentLiveCount.toLocaleString()} aves</td>
                </tr>

                <tr>
                  <td className="p-3 font-bold text-slate-700">Bajas Acumuladas (%)</td>
                  <td className={`p-3 border-x border-slate-200 font-black ${summaryA.isCriticalMortality ? 'text-red-600' : 'text-slate-800'}`}>
                    {summaryA.totalMortality} aves ({summaryA.mortalityRate}%)
                  </td>
                  <td className={`p-3 font-black ${summaryB.isCriticalMortality ? 'text-red-600' : 'text-slate-800'}`}>
                    {summaryB.totalMortality} aves ({summaryB.mortalityRate}%)
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-bold text-slate-700">Gasto Alimento Acum.</td>
                  <td className="p-3 border-x border-slate-200">{formatCurrency(compareBreakdown?.breakdownA.alimento || 0)}</td>
                  <td className="p-3">{formatCurrency(compareBreakdown?.breakdownB.alimento || 0)}</td>
                </tr>

                <tr>
                  <td className="p-3 font-bold text-slate-700">Gasto Vacunas Acum.</td>
                  <td className="p-3 border-x border-slate-200">{formatCurrency(compareBreakdown?.breakdownA.vacunas || 0)}</td>
                  <td className="p-3">{formatCurrency(compareBreakdown?.breakdownB.vacunas || 0)}</td>
                </tr>

                <tr>
                  <td className="p-3 font-bold text-slate-700">Gasto Calefacción Acum.</td>
                  <td className="p-3 border-x border-slate-200">{formatCurrency(compareBreakdown?.breakdownA.calefaccion || 0)}</td>
                  <td className="p-3">{formatCurrency(compareBreakdown?.breakdownB.calefaccion || 0)}</td>
                </tr>

                <tr className="bg-slate-50 font-black">
                  <td className="p-3 text-slate-900">Total Inversión Acumulada</td>
                  <td className="p-3 border-x border-slate-200 text-green-800">{formatCurrency(summaryA.totalExpenses)}</td>
                  <td className="p-3 text-orange-800">{formatCurrency(summaryB.totalExpenses)}</td>
                </tr>

                <tr className="bg-slate-100 font-black text-base">
                  <td className="p-3 text-slate-900">Costo Actual por Pollita Viva</td>
                  <td className="p-3 border-x border-slate-300 text-green-800 font-black">
                    {formatCurrency(summaryA.currentUnitCost)} / ave
                  </td>
                  <td className="p-3 text-orange-800 font-black">
                    {formatCurrency(summaryB.currentUnitCost)} / ave
                  </td>
                </tr>

                <tr className="bg-slate-50 font-black">
                  <td className="p-3 text-slate-800">Proyección Final (Sem. 16)</td>
                  <td className="p-3 border-x border-slate-200 text-emerald-800">
                    ~ {formatCurrency(summaryA.projectedCostWeek16)} / ave
                  </td>
                  <td className="p-3 text-amber-800">
                    ~ {formatCurrency(summaryB.projectedCostWeek16)} / ave
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
