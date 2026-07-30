import React, { useState } from 'react';
import { Batch } from '../types';
import { X, Check, Bird, Calendar, Plus } from 'lucide-react';

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (batch: Omit<Batch, 'id' | 'createdAt'>) => void;
}

export const NewBatchModal: React.FC<NewBatchModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch
}) => {
  const [name, setName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [initialCount, setInitialCount] = useState<number>(2000);
  const [initialCostPerPullet, setInitialCostPerPullet] = useState<number>(1.50);
  const [breed, setBreed] = useState<string>('Hy-Line Brown');
  const [notes, setNotes] = useState<string>('Galpón 1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingresa un identificador para el lote (ej. Lote C - Mar 10).');
      return;
    }

    onSaveBatch({
      name,
      startDate,
      initialCount: Number(initialCount) || 1,
      initialCostPerPullet: Number(initialCostPerPullet) || 0,
      breed,
      notes,
      status: 'active'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-300 my-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 text-green-800 rounded-2xl">
              <Bird className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">
                Nuevo Lote de Pollitas BB
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Ingresa los datos de recepción del lote
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
              Nombre o Identificador del Lote
            </label>
            <input
              type="text"
              required
              placeholder="ej. Lote C - Mar 15"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-slate-300 font-black text-lg text-slate-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
                Fecha Recepción (Día 0)
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border-2 border-slate-300 font-bold text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
                Raza / Línea
              </label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border-2 border-slate-300 font-bold text-sm text-slate-900"
              >
                <option value="Hy-Line Brown">Hy-Line Brown</option>
                <option value="Lohmann Brown">Lohmann Brown</option>
                <option value="Isa Brown">Isa Brown</option>
                <option value="Novogen Brown">Novogen Brown</option>
                <option value="Otra Raza">Otra Raza</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
                Aves Iniciales (BB)
              </label>
              <input
                type="number"
                min="1"
                required
                value={initialCount}
                onChange={(e) => setInitialCount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border-2 border-slate-300 font-black text-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
                Costo Compra c/u ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={initialCostPerPullet}
                onChange={(e) => setInitialCostPerPullet(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border-2 border-slate-300 font-black text-xl text-orange-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
              Ubicación / Galpón / Notas
            </label>
            <input
              type="text"
              placeholder="ej. Galpón 3 - Criadora gas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border-2 border-slate-300 font-semibold text-sm text-slate-900"
            />
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-2xl text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 bg-green-800 hover:bg-green-900 text-white font-black rounded-2xl text-lg shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Crear Lote</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
