import React from 'react';
import { ElSembradorLogo } from './ElSembradorLogo';
import { LayoutDashboard, Layers, Syringe, Database, Lock, PlusCircle, Moon, Sun, Cloud, CloudOff, RefreshCw } from 'lucide-react';

type SyncStatus = 'synced' | 'saving' | 'pending' | 'error';

interface HeaderProps {
  activeTab: 'dashboard' | 'consolidated' | 'health';
  setActiveTab: (tab: 'dashboard' | 'consolidated' | 'health') => void;
  onLock: () => void;
  onNewBatchClick: () => void;
  onBackupClick: () => void;
  selectedBatchId?: string | null;
  onBackToDashboard?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  syncStatus?: SyncStatus;
}

const SyncIndicator: React.FC<{ status: SyncStatus }> = ({ status }) => {
  const config = {
    synced: { icon: Cloud, label: 'Guardado', className: 'text-green-200' },
    saving: { icon: RefreshCw, label: 'Guardando...', className: 'text-green-200 animate-spin' },
    pending: { icon: CloudOff, label: 'Sin conexión', className: 'text-amber-300' },
    error: { icon: CloudOff, label: 'Error al guardar', className: 'text-red-300' },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-green-900/60 border border-green-700/50 text-xs font-bold text-green-100"
      title={config.label}
    >
      <Icon className={`w-4 h-4 shrink-0 ${config.className}`} />
      <span>{config.label}</span>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onLock,
  onNewBatchClick,
  onBackupClick,
  selectedBatchId,
  onBackToDashboard,
  isDarkMode = false,
  onToggleDarkMode,
  syncStatus = 'synced'
}) => {
  return (
    <header className="bg-green-800 text-white shadow-lg sticky top-0 z-40">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <button
          onClick={() => {
            if (onBackToDashboard) onBackToDashboard();
            setActiveTab('dashboard');
          }}
          className="flex items-center gap-3 text-left focus:outline-none group min-w-0"
        >
          <div className="bg-white p-1.5 rounded-2xl shadow-md group-hover:scale-105 transition-transform shrink-0">
            <ElSembradorLogo size="sm" showText={false} />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-xl sm:text-2xl text-orange-400 leading-tight truncate">
              El Sembrador
            </h1>
            <p className="text-xs sm:text-sm font-bold text-green-100 opacity-90 truncate">
              Recría de Pollitas BB
            </p>
          </div>
        </button>

        {/* Action Buttons - Tactile Optimized (min 44px touch targets) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <SyncIndicator status={syncStatus} />

          {/* Botón Modo Noche */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className={`p-2.5 rounded-2xl border flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 transition-all ${
                isDarkMode
                  ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-md'
                  : 'bg-green-900/80 hover:bg-green-900 text-green-100 border-green-700/50'
              }`}
              title={isDarkMode ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche (Tema Oscuro)'}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-900 shrink-0" /> : <Moon className="w-5 h-5 text-amber-300 shrink-0" />}
            </button>
          )}

          <button
            onClick={onNewBatchClick}
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all text-sm sm:text-base border border-orange-400/30 min-h-[44px] touch-manipulation"
          >
            <PlusCircle className="w-5 h-5 shrink-0" />
            <span className="hidden sm:inline">Nuevo Lote</span>
            <span className="sm:hidden">Lote</span>
          </button>

          <button
            onClick={onBackupClick}
            className="bg-green-900/80 hover:bg-green-900 text-green-100 p-2.5 rounded-2xl border border-green-700/50 flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation active:scale-95"
            title="Copia de Seguridad"
          >
            <Database className="w-5 h-5 text-orange-400 shrink-0" />
          </button>

          <button
            onClick={onLock}
            className="bg-green-900/80 hover:bg-green-900 text-green-100 p-2.5 rounded-2xl border border-green-700/50 flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation active:scale-95"
            title="Bloquear Aplicación"
          >
            <Lock className="w-5 h-5 text-orange-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Main Navigation Bar - Desktop & Tablet */}
      <nav className="hidden md:block bg-green-900 border-t border-green-700/60 px-2 sm:px-4 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 py-1 min-w-max">
          <button
            onClick={() => {
              if (onBackToDashboard) onBackToDashboard();
              setActiveTab('dashboard');
            }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-base transition-all ${
              activeTab === 'dashboard' && !selectedBatchId
                ? 'bg-orange-500 text-white shadow-inner'
                : 'text-green-100 hover:bg-green-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 text-orange-300" />
            <span>Mis Lotes</span>
          </button>

          <button
            onClick={() => {
              if (onBackToDashboard) onBackToDashboard();
              setActiveTab('consolidated');
            }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-base transition-all ${
              activeTab === 'consolidated'
                ? 'bg-orange-500 text-white shadow-inner'
                : 'text-green-100 hover:bg-green-800'
            }`}
          >
            <Layers className="w-5 h-5 text-orange-300" />
            <span>Vista Consolidada</span>
          </button>

          <button
            onClick={() => {
              if (onBackToDashboard) onBackToDashboard();
              setActiveTab('health');
            }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-base transition-all ${
              activeTab === 'health'
                ? 'bg-orange-500 text-white shadow-inner'
                : 'text-green-100 hover:bg-green-800'
            }`}
          >
            <Syringe className="w-5 h-5 text-orange-300" />
            <span>Calendario Sanitario</span>
          </button>
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation Bar - Optimized 100% for Phone */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-green-950/95 backdrop-blur-md border-t-2 border-green-700/80 px-2 py-1.5 flex justify-around items-center shadow-2xl">
        <button
          onClick={() => {
            if (onBackToDashboard) onBackToDashboard();
            setActiveTab('dashboard');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all touch-manipulation min-h-[48px] ${
            activeTab === 'dashboard' && !selectedBatchId
              ? 'bg-orange-500 text-white font-black shadow-md scale-105'
              : 'text-green-200 hover:text-white font-bold'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Lotes</span>
        </button>

        <button
          onClick={() => {
            if (onBackToDashboard) onBackToDashboard();
            setActiveTab('consolidated');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all touch-manipulation min-h-[48px] ${
            activeTab === 'consolidated'
              ? 'bg-orange-500 text-white font-black shadow-md scale-105'
              : 'text-green-200 hover:text-white font-bold'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Consolidado</span>
        </button>

        <button
          onClick={() => {
            if (onBackToDashboard) onBackToDashboard();
            setActiveTab('health');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all touch-manipulation min-h-[48px] ${
            activeTab === 'health'
              ? 'bg-orange-500 text-white font-black shadow-md scale-105'
              : 'text-green-200 hover:text-white font-bold'
          }`}
        >
          <Syringe className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Sanidad</span>
        </button>
      </div>
    </header>
  );
};
