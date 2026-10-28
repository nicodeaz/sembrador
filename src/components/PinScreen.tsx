import React, { useState, useEffect, useRef } from 'react';
import { ElSembradorLogo } from './ElSembradorLogo';
import { Lock, Delete, ShieldCheck, WifiOff } from 'lucide-react';
import { loginWithPin } from '../utils/api';

const PIN_LENGTH = 6;

interface PinScreenProps {
  onSuccess: () => void;
}

export const PinScreen: React.FC<PinScreenProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lockedSeconds, setLockedSeconds] = useState<number>(0);
  const tickRef = useRef<number | null>(null);

  // Cuenta regresiva del bloqueo por intentos fallidos (lo controla el
  // servidor: esto solo refleja lo que ya nos dijo, no lo decide acá).
  useEffect(() => {
    if (lockedSeconds <= 0) return;
    tickRef.current = window.setInterval(() => {
      setLockedSeconds(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [lockedSeconds > 0]);

  const attemptLogin = async (candidate: string) => {
    setIsSubmitting(true);
    setError('');
    setIsOffline(false);

    const result = await loginWithPin(candidate);

    setIsSubmitting(false);

    if (result.ok) {
      onSuccess();
      return;
    }

    setPin('');

    if (result.offline) {
      setIsOffline(true);
      return;
    }

    if (result.lockedSeconds > 0) {
      setLockedSeconds(result.lockedSeconds);
      setError('Demasiados intentos fallidos. Esperá para volver a intentar.');
    } else {
      setError('PIN Incorrecto. Intenta de nuevo.');
    }
  };

  const isLocked = lockedSeconds > 0;
  const isDisabled = isLocked || isSubmitting;

  const handleKeyPress = (digit: string) => {
    if (isDisabled || pin.length >= PIN_LENGTH) return;

    const newPin = pin + digit;
    setPin(newPin);
    setError('');
    setIsOffline(false);

    if (newPin.length === PIN_LENGTH) {
      attemptLogin(newPin);
    }
  };

  const handleDelete = () => {
    if (isDisabled) return;
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (isDisabled) return;
    setPin('');
    setError('');
  };

  const formatLockedTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min`;
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
          PIN de {PIN_LENGTH} dígitos para ingresar
        </p>

        {/* Indicadores Visuales de Dígitos Grandes */}
        <div className="flex justify-center items-center gap-2 sm:gap-3 my-6 flex-wrap">
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <div
              key={index}
              className={`w-10 h-12 sm:w-11 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-all ${
                pin.length > index
                  ? 'bg-orange-600 text-white shadow-md scale-105'
                  : 'bg-slate-100 border-2 border-slate-300 text-slate-400'
              }`}
            >
              {pin.length > index ? '•' : ''}
            </div>
          ))}
        </div>

        {/* Bloqueo por Intentos Fallidos */}
        {isLocked && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-2xl text-center w-full mb-3">
            <p className="font-black text-base">Acceso bloqueado temporalmente</p>
            <p className="text-sm font-semibold mt-0.5">Volvé a intentar en {formatLockedTime(lockedSeconds)}</p>
          </div>
        )}

        {/* Sin Conexión */}
        {isOffline && !isLocked && (
          <div className="bg-slate-100 border-2 border-slate-300 text-slate-700 px-4 py-3 rounded-2xl text-center w-full mb-3 flex items-center justify-center gap-2">
            <WifiOff className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">Sin conexión: no se puede verificar el PIN ahora.</p>
          </div>
        )}

        {/* Mensaje de Error */}
        {error && !isLocked && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-base font-bold text-center w-full animate-bounce mb-3">
            {error}
          </div>
        )}

        {/* Teclado Numérico Gigante y Accesible */}
        <div className={`grid grid-cols-3 gap-3 w-full ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
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
