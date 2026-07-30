import React, { useState, useEffect } from 'react';
import { CategoryType, OperationRecord } from '../types';
import { X, Check, Wheat, ShieldAlert, Syringe, Flame, Plus, Minus } from 'lucide-react';

interface OperationModalProps {
  isOpen: boolean;
  batchId: string;
  batchName: string;
  initialCategory?: CategoryType;
  onClose: () => void;
  onSaveRecord: (record: Omit<OperationRecord, 'id' | 'createdAt'>) => void;
}

export const OperationModal: React.FC<OperationModalProps> = ({
  isOpen,
  batchId,
  batchName,
  initialCategory = 'alimento',
  onClose,
  onSaveRecord
}) => {
  const [category, setCategory] = useState<CategoryType>(initialCategory);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<'bolsas' | 'kg' | 'aves' | 'dosis' | 'garrafas' | 'unidades'>('bolsas');
  const [cost, setCost] = useState<number | ''>('');
  const [season, setSeason] = useState<'invierno' | 'verano' | 'neutral'>('neutral');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    setCategory(initialCategory);
    // Ajustar unidad por defecto según categoría
    if (initialCategory === 'alimento') {
      setUnit('bolsas');
      setTitle('Ración / Alimento Iniciador');
    } else if (initialCategory === 'mortalidad') {
      setUnit('aves');
      setTitle('Bajas de pollitas');
      setCost(0);
    } else if (initialCategory === 'vacunas') {
      setUnit('dosis');
      setTitle('Vacuna Gumboro / Newcastle');
    } else if (initialCategory === 'calefaccion') {
      setUnit('garrafas');
      setTitle('Gas Criadora Calefacción');
      setSeason('invierno');
    }
  }, [initialCategory, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: CategoryType) => {
    setCategory(newCat);
    if (newCat === 'alimento') {
      setUnit('bolsas');
      if (!title || title.includes('Bajas') || title.includes('Gas')) setTitle('Ración / Alimento');
    } else if (newCat === 'mortalidad') {
      setUnit('aves');
      setTitle('Bajas de pollitas');
      setCost(0);
    } else if (newCat === 'vacunas') {
      setUnit('dosis');
      setTitle('Vacuna Gumboro');
    } else if (newCat === 'calefaccion') {
      setUnit('garrafas');
      setTitle('Gas Criadora Calefacción');
      setSeason('invierno');
    }
  };

  const handlePresetSelect = (presetTitle: string, defaultCost?: number) => {
    setTitle(presetTitle);
    if (defaultCost !== undefined) setCost(defaultCost);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor ingresa un título o selecciona una opción.');
      return;
    }

    onSaveRecord({
      batchId,
      date,
      category,
      title,
      quantity: Number(quantity) || 0,
      unit,
      cost: cost === '' ? 0 : Number(cost),
      season: category === 'calefaccion' ? season : undefined,
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border-2 border-slate-300 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              {batchName}
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              Nuevo Registro
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Selector de Categorías Accesible */}
          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase mb-2">
              Tipo de Registro
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCategoryChange('alimento')}
                className={`p-3.5 rounded-2xl border-2 font-black text-sm flex items-center justify-center gap-2 transition-all min-h-[50px] touch-manipulation active:scale-95 ${
                  category === 'alimento'
                    ? 'bg-green-600 text-white border-green-700 shadow-md scale-102'
                    : 'bg-green-50 text-green-900 border-green-200 hover:bg-green-100'
                }`}
              >
                <Wheat className="w-5 h-5 shrink-0" />
                <span>1. Alimento</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('mortalidad')}
                className={`p-3.5 rounded-2xl border-2 font-black text-sm flex items-center justify-center gap-2 transition-all min-h-[50px] touch-manipulation active:scale-95 ${
                  category === 'mortalidad'
                    ? 'bg-red-600 text-white border-red-700 shadow-md scale-102'
                    : 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
                }`}
              >
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>2. Mortalidad</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('vacunas')}
                className={`p-3.5 rounded-2xl border-2 font-black text-sm flex items-center justify-center gap-2 transition-all min-h-[50px] touch-manipulation active:scale-95 ${
                  category === 'vacunas'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-102'
                    : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Syringe className="w-5 h-5 shrink-0" />
                <span>3. Vacunas</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('calefaccion')}
                className={`p-3.5 rounded-2xl border-2 font-black text-sm flex items-center justify-center gap-2 transition-all min-h-[50px] touch-manipulation active:scale-95 ${
                  category === 'calefaccion'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-md scale-102'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Flame className="w-5 h-5 shrink-0" />
                <span>4. Calefacción</span>
              </button>
            </div>
          </div>

          {/* Opciones Rápida (Presets) */}
          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1.5">
              Atajos Rápidos
            </label>
            <div className="flex flex-wrap gap-1.5">
              {category === 'alimento' && (
                <>
                  <button type="button" onClick={() => handlePresetSelect('Iniciador Pollita BB (21% Prot)')} className="px-3 py-1.5 bg-slate-100 hover:bg-green-100 rounded-xl text-xs font-bold text-slate-800 border border-slate-300">Iniciador BB</button>
                  <button type="button" onClick={() => handlePresetSelect('Crecimiento Pollita (18% Prot)')} className="px-3 py-1.5 bg-slate-100 hover:bg-green-100 rounded-xl text-xs font-bold text-slate-800 border border-slate-300">Crecimiento</button>
                  <button type="button" onClick={() => handlePresetSelect('Desarrollo y Pre-postura')} className="px-3 py-1.5 bg-slate-100 hover:bg-green-100 rounded-xl text-xs font-bold text-slate-800 border border-slate-300">Desarrollo</button>
                </>
              )}
              {category === 'mortalidad' && (
                <>
                  <button type="button" onClick={() => handlePresetSelect('Mortalidad natural de recepción')} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-xl text-xs font-bold text-red-900 border border-red-300">Natural Recepción</button>
                  <button type="button" onClick={() => handlePresetSelect('Descarte por bajo peso')} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-xl text-xs font-bold text-red-900 border border-red-300">Descarte Peso</button>
                </>
              )}
              {category === 'vacunas' && (
                <>
                  <button type="button" onClick={() => handlePresetSelect('Vacuna Gumboro agua')} className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-xl text-xs font-bold text-blue-900 border border-blue-300">Gumboro</button>
                  <button type="button" onClick={() => handlePresetSelect('Vacuna Newcastle + Bronquitis')} className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-xl text-xs font-bold text-blue-900 border border-blue-300">Newcastle</button>
                  <button type="button" onClick={() => handlePresetSelect('Viruela Aviar en ala')} className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-xl text-xs font-bold text-blue-900 border border-blue-300">Viruela</button>
                </>
              )}
              {category === 'calefaccion' && (
                <>
                  <button type="button" onClick={() => handlePresetSelect('Garrafas de Gas Criadora', 150)} className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-xl text-xs font-bold text-amber-900 border border-amber-300">Garrafas Gas</button>
                  <button type="button" onClick={() => handlePresetSelect('Carga de Leña Criadora')} className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-xl text-xs font-bold text-amber-900 border border-amber-300">Leña</button>
                </>
              )}
            </div>
          </div>

          {/* Título o Concepto */}
          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
              Descripción / Concepto
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej. 10 Bolsas Alimento Iniciador"
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-slate-300 text-slate-900 font-bold text-base focus:border-green-600 focus:outline-none"
            />
          </div>

          {/* Cantidad y Unidad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
                {category === 'mortalidad' ? 'Nº Aves Fallecidas' : 'Cantidad'}
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-800 font-bold"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full text-center py-3 bg-slate-50 rounded-xl border-2 border-slate-300 text-slate-900 font-black text-xl"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-800 font-bold"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Botones de incremento rápido */}
              <div className="flex gap-1 mt-1.5">
                {[5, 10, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(prev => prev + num)}
                    className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-extrabold rounded-lg"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
                Unidad
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full py-3 px-3 bg-slate-50 rounded-xl border-2 border-slate-300 text-slate-900 font-bold text-base"
              >
                <option value="bolsas">Bolsas</option>
                <option value="kg">Kilogramos (Kg)</option>
                <option value="aves">Aves (Bajas)</option>
                <option value="dosis">Dosis</option>
                <option value="garrafas">Garrafas</option>
                <option value="unidades">Unidades</option>
              </select>
            </div>
          </div>

          {/* Costo Total en $ */}
          {category !== 'mortalidad' && (
            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
                Costo Total Invertido ($)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400 font-black text-xl">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-9 pr-4 py-3 bg-orange-50/50 rounded-2xl border-2 border-orange-300 text-orange-950 font-black text-2xl focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Selección Invierno / Verano para Calefacción */}
          {category === 'calefaccion' && (
            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
                Estación (Impacto Energético)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSeason('invierno')}
                  className={`py-2.5 rounded-xl font-bold text-sm border-2 ${
                    season === 'invierno'
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  ❄️ Invierno (Alto Gasto)
                </button>
                <button
                  type="button"
                  onClick={() => setSeason('verano')}
                  className={`py-2.5 rounded-xl font-bold text-sm border-2 ${
                    season === 'verano'
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  ☀️ Verano (Bajo Gasto)
                </button>
              </div>
            </div>
          )}

          {/* Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
                Fecha
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border-2 border-slate-300 text-slate-800 font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
                Notas (Opcional)
              </label>
              <input
                type="text"
                placeholder="ej. Proveedor X"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border-2 border-slate-300 text-slate-800 font-bold text-sm"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-2xl text-base transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black rounded-2xl text-lg shadow-lg border border-orange-400 transition-transform flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6" />
              <span>Guardar Registro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
