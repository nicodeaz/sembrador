import React, { useState, useEffect } from 'react';
import { Batch, OperationRecord, CategoryType, BatchSummary } from './types';
import { INITIAL_BATCHES, INITIAL_RECORDS } from './utils/sampleData';
import { calculateBatchSummary, calculateFarmConsolidated } from './utils/calculations';
import { Header } from './components/Header';
import { PinScreen } from './components/PinScreen';
import { DashboardView } from './components/DashboardView';
import { BatchDetailView } from './components/BatchDetailView';
import { ConsolidatedView } from './components/ConsolidatedView';
import { HealthScheduleView } from './components/HealthScheduleView';
import { SettingsBackupView } from './components/SettingsBackupView';
import { OperationModal } from './components/OperationModal';
import { NewBatchModal } from './components/NewBatchModal';
import { InstallPrompt } from './components/InstallPrompt';

export default function App() {
  // Estado de Bloqueo PIN
  const [pin, setPin] = useState<string>(() => {
    return localStorage.getItem('sembrador_pin') || '1234';
  });
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Estado de Navegación
  const [activeTab, setActiveTab] = useState<'dashboard' | 'consolidated' | 'health' | 'settings'>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Estado de Datos (Lotes y Registros)
  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem('sembrador_batches');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_BATCHES;
      }
    }
    return INITIAL_BATCHES;
  });

  const [records, setRecords] = useState<OperationRecord[]>(() => {
    const saved = localStorage.getItem('sembrador_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_RECORDS;
      }
    }
    return INITIAL_RECORDS;
  });

  // Modales
  const [isNewBatchOpen, setIsNewBatchOpen] = useState<boolean>(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [activeRecordCategory, setActiveRecordCategory] = useState<CategoryType>('alimento');
  const [targetBatchForRecord, setTargetBatchForRecord] = useState<{ id: string; name: string } | null>(null);

  // Estado de Modo Accesible (Texto Gigante & Alto Contraste)
  const [isHighAccessibility, setIsHighAccessibility] = useState<boolean>(() => {
    return localStorage.getItem('sembrador_accessibility') === 'true';
  });

  // Estado de Modo Noche (Tema Oscuro Nocturno)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sembrador_darkmode') === 'true';
  });

  // Estado de Notificaciones de Hitos de Edad
  const [milestoneSettings, setMilestoneSettings] = useState<{ w4: boolean; w8: boolean; w12: boolean; w16: boolean }>(() => {
    const saved = localStorage.getItem('sembrador_milestones');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { w4: true, w8: true, w12: true, w16: true };
      }
    }
    return { w4: true, w8: true, w12: true, w16: true };
  });

  // Guardar en LocalStorage ante cambios
  useEffect(() => {
    localStorage.setItem('sembrador_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('sembrador_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('sembrador_pin', pin);
  }, [pin]);

  useEffect(() => {
    localStorage.setItem('sembrador_accessibility', isHighAccessibility ? 'true' : 'false');
  }, [isHighAccessibility]);

  useEffect(() => {
    localStorage.setItem('sembrador_darkmode', isDarkMode ? 'true' : 'false');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('sembrador_milestones', JSON.stringify(milestoneSettings));
  }, [milestoneSettings]);

  const handleToggleMilestone = (key: 'w4' | 'w8' | 'w12' | 'w16') => {
    setMilestoneSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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

  const handleResetSampleData = () => {
    setBatches(INITIAL_BATCHES);
    setRecords(INITIAL_RECORDS);
    setSelectedBatchId(null);
  };

  // Si no ha ingresado el PIN, mostrar pantalla de bloqueo
  if (!isUnlocked) {
    return (
      <>
        <PinScreen
          correctPin={pin}
          onSuccess={() => setIsUnlocked(true)}
        />
        <InstallPrompt />
      </>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col antialiased selection:bg-orange-500 selection:text-white pb-20 md:pb-6 transition-colors duration-200 ${
      isDarkMode ? 'dark-theme bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
    } ${
      isHighAccessibility ? 'high-accessibility' : ''
    }`}>
      {/* Header Fijo & Navegación Móvil Tactil */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLock={() => setIsUnlocked(false)}
        onNewBatchClick={() => setIsNewBatchOpen(true)}
        selectedBatchId={selectedBatchId}
        onBackToDashboard={() => setSelectedBatchId(null)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
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
                milestoneSettings={milestoneSettings}
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

            {activeTab === 'settings' && (
              <SettingsBackupView
                batches={batches}
                records={records}
                pin={pin}
                onUpdatePin={setPin}
                onImportData={handleImportData}
                onResetSampleData={handleResetSampleData}
                isHighAccessibility={isHighAccessibility}
                onToggleHighAccessibility={() => setIsHighAccessibility(prev => !prev)}
                milestoneSettings={milestoneSettings}
                onToggleMilestone={handleToggleMilestone}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
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

      <InstallPrompt />
    </div>
  );
}
