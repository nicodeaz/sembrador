import React, { useState } from 'react';
import { BatchSummary, VaccineScheduleItem } from '../types';
import { VACCINE_SCHEDULE } from '../utils/sampleData';
import { Syringe, CheckCircle2, AlertCircle, Clock, Calendar, Plus } from 'lucide-react';

interface HealthScheduleViewProps {
  summaries: BatchSummary[];
  onOpenVaccineRegister: (batchId: string) => void;
}

export const HealthScheduleView: React.FC<HealthScheduleViewProps> = ({
  summaries,
  onOpenVaccineRegister
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(summaries[0]?.batch.id || '');

  const selectedSummary = summaries.find(s => s.batch.id === selectedBatchId) || summaries[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Syringe className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900">
              Calendario Sanitario & Vacunación
            </h2>
            <p className="text-slate-600 text-base mt-0.5">
              Guía de vacunación paso a paso de Semana 1 a Semana 16
            </p>
          </div>
        </div>

        {/* Selector de Lote para Auditoría Sanitaria */}
        {summaries.length > 0 && (
          <div className="mt-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
                Selecciona Lote para ver vacunas pendientes:
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="px-4 py-2.5 bg-white rounded-xl border-2 border-green-700 font-bold text-base text-slate-900 focus:outline-none"
              >
                {summaries.map(s => (
                  <option key={s.batch.id} value={s.batch.id}>
                    {s.batch.name} — Edad: {s.currentAgeWeeks} Semanas ({s.currentLiveCount} aves)
                  </option>
                ))}
              </select>
            </div>

            {selectedSummary && (
              <button
                onClick={() => onOpenVaccineRegister(selectedSummary.batch.id)}
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
              >
                <Plus className="w-5 h-5" />
                <span>Registrar Vacuna Aplicada</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Calendario de Vacunación Tabla Visual */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-900">
            Esquema Oficial de Vacunación
          </h3>
          <span className="text-xs font-bold text-slate-500">
            Día 1 a Semana 16
          </span>
        </div>

        <div className="space-y-3">
          {VACCINE_SCHEDULE.map((item, idx) => {
            const currentWeek = selectedSummary ? selectedSummary.currentAgeWeeks : 0;
            const isDueNow = selectedSummary && item.week === currentWeek;
            const isPast = selectedSummary && item.week < currentWeek;
            const isUpcoming = selectedSummary && item.week > currentWeek;

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDueNow
                    ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-300'
                    : isPast
                    ? 'bg-slate-50 border-slate-200 opacity-80'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-2xl font-black text-base flex flex-col items-center justify-center min-w-[70px] ${
                    isDueNow ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    <span className="text-xs uppercase font-extrabold">Semana</span>
                    <span className="text-xl leading-none">{item.week}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-lg text-slate-900">
                        {item.disease}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full border border-slate-300 uppercase">
                        Vía {item.method}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-green-800 mt-0.5">
                      {item.vaccineName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end border-t md:border-t-0 pt-2 md:pt-0">
                  {isDueNow && (
                    <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1.5 rounded-full border border-amber-300 flex items-center gap-1.5 animate-pulse">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>¡Corresponde esta semana!</span>
                    </span>
                  )}
                  {isPast && (
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Semana completada</span>
                    </span>
                  )}
                  {isUpcoming && (
                    <span className="bg-slate-50 text-slate-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Próximamente</span>
                    </span>
                  )}

                  {selectedSummary && (
                    <button
                      onClick={() => onOpenVaccineRegister(selectedSummary.batch.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs"
                    >
                      Registrar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
