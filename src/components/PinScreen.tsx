import React, { useState } from 'react';
import { ElSembradorLogo } from './ElSembradorLogo';
import { Lock, Delete, ArrowRight, ShieldCheck } from 'lucide-react';

interface PinScreenProps {
  correctPin: string;
  onSuccess: () => void;
  onResetPinRequest?: () => void;
}

export const PinScreen: React.FC<PinScreenProps> = ({ correctPin, onSuccess }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      if (newPin.length === 4) {
        if (newPin === correctPin) {
          onSuccess();
        } else {
          setError('PIN Incorrecto. Intenta de nuevo.');
          setTimeout(() => setPin(''), 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-4 sm:p-6 font-sans select-none">
      {/* Header Marca */}
      <div className="w-full max-w-sm pt-4 flex flex-col items-center text-center">
        <ElSembradorLogo size="lg" />
        <p className="mt-2 text-slate-600 font-medium text-lg">
          Gestión de Recría de Pollitas BB
        </p>
      </div>

      {/* Tarjeta Central PIN */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border-2 border-green-800/10 flex flex-col items-center my-auto">
        <div className="flex items-center gap-2 mb-2 bg-green-50 px-4 py-2 rounded-full border border-green-200 text-green-800 font-bold text-base">
          <Lock className="w-5 h-5 text-orange-600" />
          <span>Acceso Seguro</span>
        </div>

        <h2 className="text-2xl font-black text-slate-800 text-center mt-1">
          Ingresa tu PIN
        </h2>
        <p className="text-slate-500 text-base text-center mt-1">
          PIN de 4 dígitos para ingresar
        </p>

        {/* Indicadores Visuales de Dígitos Grandes */}
        <div className="flex justify-center items-center gap-4 my-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-12 h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-all ${
                pin.length > index
                  ? 'bg-orange-600 text-white shadow-md scale-105'
                  : 'bg-slate-100 border-2 border-slate-300 text-slate-400'
              }`}
            >
              {pin.length > index ? '•' : ''}
            </div>
          ))}
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-base font-bold text-center w-full animate-bounce mb-3">
            {error}
          </div>
        )}

        {/* Teclado Numérico Gigante y Accesible */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-16 rounded-2xl bg-slate-100 hover:bg-orange-100 active:bg-orange-500 active:text-white border border-slate-200 text-slate-800 font-black text-3xl flex items-center justify-center shadow-sm transition-transform active:scale-95 touch-manipulation"
            >
              {num}
            </button>
          ))}

          {/* Botón Limpiar */}
          <button
            onClick={handleClear}
            className="h-16 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-base flex items-center justify-center active:scale-95 touch-manipulation"
          >
            Borrar
          </button>

          {/* Cero */}
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-slate-100 hover:bg-orange-100 active:bg-orange-500 active:text-white border border-slate-200 text-slate-800 font-black text-3xl flex items-center justify-center shadow-sm active:scale-95 touch-manipulation"
          >
            0
          </button>

          {/* Botón Backspace */}
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center active:scale-95 touch-manipulation"
            aria-label="Borrar último número"
          >
            <Delete className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Footer / Info */}
      <div className="w-full max-w-sm pb-4 text-center">
        <div className="flex items-center justify-center gap-1 text-slate-500 text-sm font-semibold">
          <ShieldCheck className="w-4 h-4 text-green-700" />
          <span>Establecimiento El Sembrador • Julio Santiago Díaz</span>
        </div>
      </div>
    </div>
  );
};
