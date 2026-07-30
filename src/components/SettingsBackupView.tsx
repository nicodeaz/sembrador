import React, { useState } from 'react';
import { Batch, OperationRecord } from '../types';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Key, 
  Database, 
  Server, 
  Check, 
  Copy,
  Eye,
  Bell,
  BellRing,
  Smartphone,
  ShieldCheck,
  Zap,
  Sparkles,
  Moon,
  Sun
} from 'lucide-react';

interface MilestoneSettings {
  w4: boolean;
  w8: boolean;
  w12: boolean;
  w16: boolean;
}

interface SettingsBackupViewProps {
  batches: Batch[];
  records: OperationRecord[];
  pin: string;
  onUpdatePin: (newPin: string) => void;
  onImportData: (batches: Batch[], records: OperationRecord[]) => void;
  onResetSampleData: () => void;
  isHighAccessibility: boolean;
  onToggleHighAccessibility: () => void;
  milestoneSettings: MilestoneSettings;
  onToggleMilestone: (key: keyof MilestoneSettings) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  batches,
  records,
  pin,
  onUpdatePin,
  onImportData,
  onResetSampleData,
  isHighAccessibility,
  onToggleHighAccessibility,
  milestoneSettings,
  onToggleMilestone,
  isDarkMode = false,
  onToggleDarkMode
}) => {
  const [newPin, setNewPin] = useState<string>('');
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);
  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false);

  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      appName: 'El Sembrador',
      exportDate: new Date().toISOString(),
      pin,
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
            if (parsed.pin) onUpdatePin(parsed.pin);
            alert('¡Datos restaurados con éxito en El Sembrador!');
          } else {
            alert('El archivo JSON no tiene la estructura correcta.');
          }
        } catch (err) {
          alert('Error al leer el archivo JSON.');
        }
      };
    }
  };

  const handlePinChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4 && /^\d+$/.test(newPin)) {
      onUpdatePin(newPin);
      setNewPin('');
      alert(`¡PIN actualizado con éxito! Nuevo PIN: ${newPin}`);
    } else {
      alert('El PIN debe ser un número exacto de 4 dígitos.');
    }
  };

  const handleTestNotification = () => {
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 4000);

    // Intentar lanzar notificación web si el navegador lo permite
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('🔔 El Sembrador - Prueba de Hito de Edad', {
          body: '¡Hito Semana 4 Alcanzado! Recordatorio: Realizar cambio de alimento a Crecimiento y refuerzo vacunal.',
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('🔔 El Sembrador - Prueba de Hito de Edad', {
              body: '¡Hito Semana 4 Alcanzado! Recordatorio: Realizar cambio de alimento a Crecimiento.',
              icon: '/favicon.ico'
            });
          }
        });
      }
    }
  };

  const dbSchemaJSON = JSON.stringify({
    entidades: {
      Lote: {
        id: "string (UUID)",
        name: "string (Ej: Lote A - Ene 15)",
        startDate: "string (YYYY-MM-DD)",
        initialCount: "number (Aves BB)",
        initialCostPerPullet: "number ($)",
        breed: "string (Hy-Line / Lohmann)",
        status: "'active' | 'completed'"
      },
      RegistroOperacion: {
        id: "string (UUID)",
        batchId: "string (FK -> Lote.id)",
        date: "string (YYYY-MM-DD)",
        category: "'alimento' | 'mortalidad' | 'vacunas' | 'calefaccion' | 'otros'",
        title: "string",
        quantity: "number",
        unit: "'bolsas' | 'kg' | 'aves' | 'dosis' | 'garrafas'",
        cost: "number ($)",
        season: "'invierno' | 'verano'"
      }
    }
  }, null, 2);

  return (
    <div className="space-y-6 pb-20">
      {/* SECCIÓN 1: MODO ACCESIBLE (TEXTO GIGANTE Y ALTO CONTRASTE) */}
      <div className={`rounded-3xl p-6 shadow-xl border-2 transition-all ${
        isHighAccessibility 
          ? 'bg-amber-50 border-orange-500 ring-4 ring-orange-200' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-start gap-3">
            <div className={`p-3.5 rounded-2xl ${
              isHighAccessibility ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-700'
            }`}>
              <Eye className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Modo Accesible (Visibilidad Aumentada)
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isHighAccessibility ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {isHighAccessibility ? 'ACTIVADO' : 'NORMAL'}
                </span>
              </div>
              <p className="text-slate-700 text-sm sm:text-base mt-1 font-semibold">
                Incremente el tamaño de letra, el grosor del texto y el contraste visual de todos los botones y tablas para facilitar la lectura directa en el teléfono bajo sol brillante en granja.
              </p>
            </div>
          </div>

          <button
            onClick={onToggleHighAccessibility}
            className={`px-6 py-4 rounded-2xl font-black text-base sm:text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-3 touch-manipulation min-h-[52px] ${
              isHighAccessibility
                ? 'bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-800'
                : 'bg-green-800 hover:bg-green-900 text-white border-2 border-green-900'
            }`}
          >
            <Eye className="w-6 h-6" />
            <span>{isHighAccessibility ? 'Desactivar Modo Accesible' : 'Activar Modo Accesible'}</span>
          </button>
        </div>

        {/* Indicador visual de accesibilidad activa */}
        {isHighAccessibility && (
          <div className="mt-4 bg-orange-100 border-2 border-orange-300 p-4 rounded-2xl text-orange-950 font-extrabold text-sm flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600 shrink-0" />
            <span>Modo Accesible Activo: Tipografía ampliada, bordes reforzados y texto de alto contraste aplicados en toda la aplicación.</span>
          </div>
        )}
      </div>

      {/* SECCIÓN 1.5: MODO NOCHE / TEMA OSCURO */}
      {onToggleDarkMode && (
        <div className={`rounded-3xl p-6 shadow-xl border-2 transition-all ${
          isDarkMode 
            ? 'bg-slate-900 border-indigo-500 text-slate-100 ring-4 ring-indigo-900/50' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/40 pb-5">
            <div className="flex items-start gap-3">
              <div className={`p-3.5 rounded-2xl ${
                isDarkMode ? 'bg-indigo-600 text-amber-300 shadow-md' : 'bg-slate-100 text-slate-700'
              }`}>
                {isDarkMode ? <Moon className="w-8 h-8" /> : <Sun className="w-8 h-8 text-amber-500" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black">
                    Modo Noche (Tema Oscuro Nocturno)
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isDarkMode ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isDarkMode ? 'ACTIVADO' : 'APAGADO'}
                  </span>
                </div>
                <p className="text-slate-400 text-sm sm:text-base mt-1 font-semibold">
                  Invierta los colores y reduzca la luminosidad de la pantalla para evitar la fatiga visual al registrar mortalidad o alimentación tarde en la noche en el galpón.
                </p>
              </div>
            </div>

            <button
              onClick={onToggleDarkMode}
              className={`px-6 py-4 rounded-2xl font-black text-base sm:text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-3 touch-manipulation min-h-[52px] ${
                isDarkMode
                  ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-2 border-amber-300'
                  : 'bg-indigo-900 hover:bg-indigo-950 text-white border-2 border-indigo-700'
              }`}
            >
              {isDarkMode ? <Sun className="w-6 h-6 text-slate-950" /> : <Moon className="w-6 h-6 text-amber-300" />}
              <span>{isDarkMode ? 'Activar Modo Día' : 'Activar Modo Noche'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN 2: NOTIFICACIONES DE HITOS DE EDAD (SEMANA 4, 8, 12, 16) */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
              <BellRing className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">
                Notificaciones y Recordatorios de Hitos de Edad
              </h3>
              <p className="text-slate-600 text-sm mt-0.5 font-medium">
                Configure alertas automáticas en el panel cuando los lotes cumplan semanas críticas en la recría.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestNotification}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-300 flex items-center justify-center gap-2 touch-manipulation self-start sm:self-auto"
          >
            <Bell className="w-4 h-4 text-orange-500" />
            <span>Probar Recordatorio</span>
          </button>
        </div>

        {/* Notificación de prueba activa */}
        {testNotificationSent && (
          <div className="bg-green-100 border-2 border-green-400 text-green-900 p-4 rounded-2xl text-sm font-black flex items-center gap-2 animate-bounce">
            <Sparkles className="w-5 h-5 text-green-700" />
            <span>🔔 Recordatorio de Prueba Enviado: "Lote A alcanzó la Semana 4 - Cambio a Alimento Crecimiento"</span>
          </div>
        )}

        {/* Opciones de Hitos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Semana 4 */}
          <div 
            onClick={() => onToggleMilestone('w4')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 touch-manipulation ${
              milestoneSettings.w4 
                ? 'bg-green-50 border-green-500 ring-2 ring-green-200' 
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}
          >
            <input 
              type="checkbox" 
              checked={milestoneSettings.w4} 
              onChange={() => {}} 
              className="mt-1 w-5 h-5 text-green-700 rounded focus:ring-green-500 shrink-0 pointer-events-none" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900">🐣 Hito Semana 4 (Día 28)</span>
                <span className="bg-green-200 text-green-800 text-[11px] font-black px-2 py-0.5 rounded-md">Alimento</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                Alerta para inicio de Alimento Crecimiento + Refuerzo Vacunal Gumboro/Newcastle.
              </p>
            </div>
          </div>

          {/* Semana 8 */}
          <div 
            onClick={() => onToggleMilestone('w8')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 touch-manipulation ${
              milestoneSettings.w8 
                ? 'bg-green-50 border-green-500 ring-2 ring-green-200' 
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}
          >
            <input 
              type="checkbox" 
              checked={milestoneSettings.w8} 
              onChange={() => {}} 
              className="mt-1 w-5 h-5 text-green-700 rounded focus:ring-green-500 shrink-0 pointer-events-none" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900">🐔 Hito Semana 8 (Día 56)</span>
                <span className="bg-orange-200 text-orange-900 text-[11px] font-black px-2 py-0.5 rounded-md">Uniformidad</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                Alerta para pesaje de lote, evaluación de pechuga y control de desarrollo óseo.
              </p>
            </div>
          </div>

          {/* Semana 12 */}
          <div 
            onClick={() => onToggleMilestone('w12')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 touch-manipulation ${
              milestoneSettings.w12 
                ? 'bg-green-50 border-green-500 ring-2 ring-green-200' 
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}
          >
            <input 
              type="checkbox" 
              checked={milestoneSettings.w12} 
              onChange={() => {}} 
              className="mt-1 w-5 h-5 text-green-700 rounded focus:ring-green-500 shrink-0 pointer-events-none" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900">💉 Hito Semana 12 (Día 84)</span>
                <span className="bg-blue-200 text-blue-900 text-[11px] font-black px-2 py-0.5 rounded-md">Sanidad</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                Alerta para vacuna de Coriza aviar / Viruela y evaluación de ganancia de peso.
              </p>
            </div>
          </div>

          {/* Semana 16 */}
          <div 
            onClick={() => onToggleMilestone('w16')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 touch-manipulation ${
              milestoneSettings.w16 
                ? 'bg-green-50 border-green-500 ring-2 ring-green-200' 
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}
          >
            <input 
              type="checkbox" 
              checked={milestoneSettings.w16} 
              onChange={() => {}} 
              className="mt-1 w-5 h-5 text-green-700 rounded focus:ring-green-500 shrink-0 pointer-events-none" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900">🏠 Hito Semana 16 (Día 112)</span>
                <span className="bg-purple-200 text-purple-900 text-[11px] font-black px-2 py-0.5 rounded-md">Postura</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                Alerta de fin de recría: Preparación de Galpón de Postura y Alimento Pre-Postura.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: RESPALDOS JSON Y SEGURIDAD */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-3 bg-green-100 text-green-800 rounded-2xl">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              Respaldos de Datos Local JSON
            </h3>
            <p className="text-slate-600 text-sm mt-0.5 font-medium">
              Exporte o importe sus lotes y gastos de El Sembrador en cualquier momento
            </p>
          </div>
        </div>

        {/* 3 Botones Principales de Respaldo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Exportar */}
          <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 flex flex-col justify-between">
            <div>
              <Download className="w-8 h-8 text-green-700 mb-2" />
              <h4 className="font-bold text-lg text-slate-900">Descargar Respaldo</h4>
              <p className="text-xs text-slate-500 mt-1">
                Guarda una copia de todos tus lotes y gastos en un archivo JSON.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="mt-4 w-full py-3.5 bg-green-800 hover:bg-green-900 text-white font-black rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
            >
              <Download className="w-5 h-5" />
              <span>Exportar JSON</span>
            </button>
          </div>

          {/* Cargar / Importar */}
          <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 flex flex-col justify-between">
            <div>
              <Upload className="w-8 h-8 text-orange-600 mb-2" />
              <h4 className="font-bold text-lg text-slate-900">Restaurar Respaldo</h4>
              <p className="text-xs text-slate-500 mt-1">
                Carga un archivo JSON previo para recuperar tus datos.
              </p>
            </div>
            <label className="mt-4 w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 text-center touch-manipulation min-h-[48px]">
              <Upload className="w-5 h-5" />
              <span>Cargar Archivo</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>

          {/* Reset Datos de Ejemplo */}
          <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 flex flex-col justify-between">
            <div>
              <RefreshCw className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-bold text-lg text-slate-900">Datos de Muestra</h4>
              <p className="text-xs text-slate-500 mt-1">
                Restablece la aplicación con datos de ejemplo de El Sembrador.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('¿Cargar datos de prueba de El Sembrador? Esto reemplazará los datos actuales.')) {
                  onResetSampleData();
                }
              }}
              className="mt-4 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Cargar Datos Ejemplo</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: CAMBIO DE PIN */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-6 h-6 text-orange-600" />
          <h3 className="text-2xl font-black text-slate-900">
            Seguridad PIN de Acceso
          </h3>
        </div>

        <form onSubmit={handlePinChangeSubmit} className="max-w-md space-y-3">
          <p className="text-sm text-slate-700 font-bold">
            PIN actual de la granja: <strong className="text-orange-600 font-black text-base">{pin}</strong>
          </p>
          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase mb-1">
              Nuevo PIN (4 Dígitos)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                pattern="\d{4}"
                placeholder="ej. 4321"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-300 font-black text-xl text-slate-900 focus:outline-none focus:border-green-700"
              />
              <button
                type="submit"
                className="bg-green-800 hover:bg-green-900 text-white font-black px-6 py-3 rounded-xl text-sm shadow-md touch-manipulation min-h-[48px]"
              >
                Cambiar PIN
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* SECCIÓN 5: ESQUEMA BASE DE DATOS */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-green-700" />
            <h3 className="text-2xl font-black text-slate-900">
              Esquema de Base de Datos Propuesto
            </h3>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(dbSchemaJSON);
              setCopiedSchema(true);
              setTimeout(() => setCopiedSchema(false), 2000);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-300 touch-manipulation"
          >
            {copiedSchema ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSchema ? 'Copiado!' : 'Copiar Esquema JSON'}</span>
          </button>
        </div>

        <p className="text-slate-600 text-sm">
          Este esquema relacional / JSON respalda todas las entidades del negocio (Lotes y Operaciones):
        </p>

        <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800">
          {dbSchemaJSON}
        </pre>
      </div>
    </div>
  );
};
