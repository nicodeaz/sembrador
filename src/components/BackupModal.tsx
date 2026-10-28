import React, { useState } from 'react';
import { Batch, OperationRecord } from '../types';
import { changePin } from '../utils/api';
import { X, Download, Upload, Database, KeyRound, Check, Loader2 } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: Batch[];
  records: OperationRecord[];
  onImportData: (batches: Batch[], records: OperationRecord[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  batches,
  records,
  onImportData
}) => {
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [pinStatus, setPinStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [pinError, setPinError] = useState<string>('');

  if (!isOpen) return null;

  const handleExportJSON = () => {
    // El PIN nunca se incluye en el respaldo: es un archivo que se puede
    // compartir/guardar en otro lado y no queremos que ande dando vueltas
    // con la clave de acceso adentro.
    const data = {
      version: '2.0',
      appName: 'El Sembrador',
      exportDate: new Date().toISOString(),
      batches,
      records
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `El_Sembrador_Respaldo_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.batches && parsed.records) {
            onImportData(parsed.batches, parsed.records);
            alert('¡Datos restaurados con éxito en El Sembrador!');
            onClose();
          } else {
            alert('El archivo JSON no tiene la estructura correcta.');
          }
        } catch (err) {
          alert('Error al leer el archivo JSON.');
        }
      };
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (!/^\d{6}$/.test(newPin)) {
      setPinStatus('error');
      setPinError('El nuevo PIN debe tener exactamente 6 dígitos.');
      return;
    }

    setPinStatus('saving');
    const result = await changePin(currentPin, newPin);

    if (result.ok) {
      setPinStatus('ok');
      setCurrentPin('');
      setNewPin('');
    } else {
      setPinStatus('error');
      setPinError(
        result.error === 'current_pin_invalid'
          ? 'El PIN actual no es correcto.'
          : 'No se pudo cambiar el PIN. Intentá de nuevo.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-300 my-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-2xl">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Copia de Seguridad
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Los datos ya se guardan en el servidor automáticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportJSON}
            className="py-3.5 bg-green-800 hover:bg-green-900 text-white font-black rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
          >
            <Download className="w-5 h-5" />
            <span>Descargar Respaldo</span>
          </button>

          <label className="py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 touch-manipulation min-h-[48px]">
            <Upload className="w-5 h-5" />
            <span>Restaurar Archivo</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-5 h-5 text-slate-500" />
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">Cambiar PIN de Acceso</h4>
          </div>

          <form onSubmit={handleChangePin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">PIN actual (6 dígitos)</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border-2 border-slate-300 font-bold text-lg text-slate-900 tracking-widest focus:outline-none focus:border-green-700"
                placeholder="••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">PIN nuevo (6 dígitos)</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border-2 border-slate-300 font-bold text-lg text-slate-900 tracking-widest focus:outline-none focus:border-green-700"
                placeholder="••••••"
              />
            </div>

            {pinStatus === 'error' && pinError && (
              <p className="text-red-600 text-xs font-bold">{pinError}</p>
            )}
            {pinStatus === 'ok' && (
              <p className="text-green-700 text-xs font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                PIN actualizado correctamente.
              </p>
            )}

            <button
              type="submit"
              disabled={pinStatus === 'saving'}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white font-black rounded-xl text-sm shadow-md flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
            >
              {pinStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>Cambiar PIN</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
