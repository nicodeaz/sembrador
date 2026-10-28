import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Batch, OperationRecord, CategoryType, BatchSummary } from './types';
import { calculateBatchSummary, calculateFarmConsolidated } from './utils/calculations';
import { readJSON, writeJSON, readString, writeString, STORAGE_KEYS } from './utils/storage';
import { fetchServerData, saveServerData, logout } from './utils/api';
import { Header } from './components/Header';
import { PinScreen } from './components/PinScreen';
import { DashboardView } from './components/DashboardView';
import { BatchDetailView } from './components/BatchDetailView';
import { ConsolidatedView } from './components/ConsolidatedView';
import { HealthScheduleView } from './components/HealthScheduleView';
import { BackupModal } from './components/BackupModal';
import { OperationModal } from './components/OperationModal';
import { NewBatchModal } from './components/NewBatchModal';
import { InstallPrompt } from './components/InstallPrompt';
import { ElSembradorLogo } from './components/ElSembradorLogo';
import { WifiOff, RotateCw } from 'lucide-react';

// Hitos de edad fijos: antes eran configurables desde Ajustes, pero ese panel
// se sacó de la app (ver conversación con el usuario) para que quede simple
// para un usuario no técnico. Quedan siempre activos.
const MILESTONE_SETTINGS = { w4: true, w8: true, w12: true, w16: true } as const;

type BootStatus = 'checking' | 'locked' | 'unlocked' | 'offline';
type SyncStatus = 'synced' | 'saving' | 'pending' | 'error';

export default function App() {
  // Arranque de la app: primero hay que saber si ya hay una sesión válida en
  // el servidor (cookie de PIN vigente) antes de decidir qué mostrar.
  const [bootStatus, setBootStatus] = useState<BootStatus>('checking');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Estado de Navegación
  const [activeTab, setActiveTab] = useState<'dashboard' | 'consolidated' | 'health'>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Estado de Datos (Lotes y Registros). El servidor es la fuente de verdad;
  // esto arranca desde la última copia local conocida solo para no mostrar
  // una pantalla vacía mientras se confirma la sesión / se pierde la
  // conexión a mitad de uso (ver utils/api.ts y utils/storage.ts).
  const [batches, setBatches] = useState<Batch[]>(() => readJSON<Batch[]>(STORAGE_KEYS.batches, []));
  const [records, setRecords] = useState<OperationRecord[]>(() => readJSON<OperationRecord[]>(STORAGE_KEYS.records, []));

  // Modales
  const [isNewBatchOpen, setIsNewBatchOpen] = useState<boolean>(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [activeRecordCategory, setActiveRecordCategory] = useState<CategoryType>('alimento');
  const [targetBatchForRecord, setTargetBatchForRecord] = useState<{ id: string; name: string } | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);

  // Estado de Modo Noche (Tema Oscuro Nocturno) - preferencia local del dispositivo
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return readString(STORAGE_KEYS.darkMode, 'false') === 'true';
  });

  useEffect(() => {
    writeString(STORAGE_KEYS.darkMode, isDarkMode ? 'true' : 'false');
  }, [isDarkMode]);

  // hasLoadedRef: true apenas se confirmó una sesión válida (con o sin datos
  // nuevos del servidor). skipNextSaveRef evita re-mandar al servidor los
  // mismos datos que acabamos de traer de ahí.
  const hasLoadedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const loadFromServer = useCallback(async (afterLogin: boolean) => {
    const result = await fetchServerData();

    if (result.status === 'ok') {
      skipNextSaveRef.current = true;
      setBatches(result.data.batches);
      setRecords(result.data.records);
      writeJSON(STORAGE_KEYS.batches, result.data.batches, true);
      writeJSON(STORAGE_KEYS.records, result.data.records, true);
      hasLoadedRef.current = true;
      setBootStatus('unlocked');
      setSyncStatus('synced');
      return;
    }

    if (result.status === 'unauthorized') {
      hasLoadedRef.current = false;
      setBootStatus('locked');
      return;
    }

    // Sin conexión.
    if (afterLogin) {
      // El PIN ya se validó recién contra el servidor; seguimos con la
      // última copia local mientras se restablece la conexión.
      hasLoadedRef.current = true;
      setBootStatus('unlocked');
      setSyncStatus('pending');
    } else {
      setBootStatus('offline');
    }
  }, []);

  useEffect(() => {
    loadFromServer(false);
  }, [loadFromServer]);

  // Guardado en el servidor con debounce ante cambios en lotes/registros,
  // más una copia local espejo (respaldo si se corta la conexión).
  useEffect(() => {
    writeJSON(STORAGE_KEYS.batches, batches, true);
    writeJSON(STORAGE_KEYS.records, records, true);

    if (!hasLoadedRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    setSyncStatus('saving');
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      const ok = await saveServerData(batches, records);
      setSyncStatus(ok ? 'synced' : 'error');
    }, 500);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches, records]);

  // Reintentar el guardado apenas vuelve la conexión.
  useEffect(() => {
    const handleOnline = () => {
      if (!hasLoadedRef.current) return;
      setSyncStatus('saving');
      saveServerData(batches, records).then((ok) => setSyncStatus(ok ? 'synced' : 'error'));
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [batches, records]);

  // Cálculos Derivados
  const summaries: BatchSummary[] = batches.map(b => calculateBatchSummary(b, records));
  const consolidated = calculateFarmConsolidated(summaries);

  const selectedSummary = selectedBatchId ? summaries.find(s => s.batch.id === selectedBatchId) : null;

  // Handlers para Operaciones
  const handleSaveRecord = (newRecordData: Omit<OperationRecord, 'id' | 'createdAt'>) => {
    const newRec: OperationRecord = {
      ...newRecordData,
      id: 'rec-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setRecords(prev => [newRec, ...prev]);
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords(prev => prev.filter(r => r.id !== recordId));
  };

  const handleSaveBatch = (newBatchData: Omit<Batch, 'id' | 'createdAt'>) => {
    const newB: Batch = {
      ...newBatchData,
      id: 'lote-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setBatches(prev => [newB, ...prev]);
    setSelectedBatchId(newB.id);
  };

  const handleDeleteBatch = (batchId: string) => {
    setBatches(prev => prev.filter(b => b.id !== batchId));
    setRecords(prev => prev.filter(r => r.batchId !== batchId));
    if (selectedBatchId === batchId) {
      setSelectedBatchId(null);
    }
  };

  const handleOpenRecordModal = (batchId: string, category: CategoryType = 'alimento') => {
    const b = batches.find(x => x.id === batchId);
    if (b) {
      setTargetBatchForRecord({ id: b.id, name: b.name });
      setActiveRecordCategory(category);
      setIsRecordModalOpen(true);
    }
  };

  const handleImportData = (newBatches: Batch[], newRecords: OperationRecord[]) => {
    setBatches(newBatches);
    setRecords(newRecords);
  };

  const handleLock = async () => {
    await logout();
    hasLoadedRef.current = false;
    setBootStatus('locked');
  };

  // Pantalla de arranque mientras se confirma la sesión con el servidor.
  if (bootStatus === 'checking') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6">
        <ElSembradorLogo size="lg" />
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <RotateCw className="w-4 h-4 animate-spin" />
          <span>Conectando con el servidor...</span>
        </div>
      </div>
    );
  }

  // Sin conexión desde el arranque: no se puede verificar el PIN ni traer
  // datos, así que no tiene sentido mostrar la app todavía.
  if (bootStatus === 'offline') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-5 p-6 text-center">
        <ElSembradorLogo size="lg" />
        <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200 max-w-sm">
          <WifiOff className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-black text-slate-800">Sin conexión a Internet</h2>
          <p className="text-slate-500 text-sm mt-2">
            El Sembrador guarda los datos en el servidor. Verificá tu WiFi o datos móviles e intentá de nuevo.
          </p>
          <button
            onClick={() => { setBootStatus('checking'); loadFromServer(false); }}
            className="mt-4 w-full py-3 bg-green-800 hover:bg-green-900 text-white font-black rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
          >
            <RotateCw className="w-5 h-5" />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }

  // Si no hay una sesión válida, mostrar pantalla de bloqueo por PIN.
  if (bootStatus === 'locked') {
    return (
      <>
        <PinScreen onSuccess={() => loadFromServer(true)} />
        <InstallPrompt />
      </>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col antialiased selection:bg-orange-500 selection:text-white pb-20 md:pb-6 transition-colors duration-200 ${
      isDarkMode ? 'dark-theme bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      {/* Header Fijo & Navegación Móvil Tactil */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLock={handleLock}
        onNewBatchClick={() => setIsNewBatchOpen(true)}
        onBackupClick={() => setIsBackupOpen(true)}
        selectedBatchId={selectedBatchId}
        onBackToDashboard={() => setSelectedBatchId(null)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
        syncStatus={syncStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-5">
        {selectedBatchId && selectedSummary ? (
          <BatchDetailView
            summary={selectedSummary}
            records={records}
            onBack={() => setSelectedBatchId(null)}
            onOpenRecordModal={(cat) => handleOpenRecordModal(selectedSummary.batch.id, cat)}
            onDeleteRecord={handleDeleteRecord}
            onDeleteBatch={handleDeleteBatch}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                summaries={summaries}
                consolidated={consolidated}
                records={records}
                onSelectBatch={(id) => setSelectedBatchId(id)}
                onQuickRecordOperation={(id) => handleOpenRecordModal(id, 'alimento')}
                onNewBatchClick={() => setIsNewBatchOpen(true)}
                milestoneSettings={MILESTONE_SETTINGS}
              />
            )}

            {activeTab === 'consolidated' && (
              <ConsolidatedView
                summaries={summaries}
                consolidated={consolidated}
                records={records}
                onSelectBatch={(id) => setSelectedBatchId(id)}
              />
            )}

            {activeTab === 'health' && (
              <HealthScheduleView
                summaries={summaries}
                onOpenVaccineRegister={(id) => handleOpenRecordModal(id, 'vacunas')}
              />
            )}
          </>
        )}
      </main>

      {/* Modales */}
      {targetBatchForRecord && (
        <OperationModal
          isOpen={isRecordModalOpen}
          batchId={targetBatchForRecord.id}
          batchName={targetBatchForRecord.name}
          initialCategory={activeRecordCategory}
          onClose={() => setIsRecordModalOpen(false)}
          onSaveRecord={handleSaveRecord}
        />
      )}

      <NewBatchModal
        isOpen={isNewBatchOpen}
        onClose={() => setIsNewBatchOpen(false)}
        onSaveBatch={handleSaveBatch}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        batches={batches}
        records={records}
        onImportData={handleImportData}
      />

      <InstallPrompt />
    </div>
  );
}
