import React from 'react';
import { ElSembradorLogo } from './ElSembradorLogo';
import { LayoutDashboard, Layers, Syringe, Settings, Lock, PlusCircle, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'consolidated' | 'health' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'consolidated' | 'health' | 'settings') => void;
  onLock: () => void;
  onNewBatchClick: () => void;
  selectedBatchId?: string | null;
  onBackToDashboard?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onLock,
  onNewBatchClick,
  selectedBatchId,
  onBackToDashboard,
  isDarkMode = false,
  onToggleDarkMode
}) => {
  return (
    <header className="bg-green-800 text-white shadow-lg sticky top-0 z-40">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            if (onBackToDashboard) onBackToDashboard();
            setActiveTab('dashboard');
          }}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="bg-white p-1.5 rounded-2xl shadow-md group-hover:scale-105 transition-transform">
            <ElSembradorLogo size="sm" showText={false} />
          </div>
          <div>
            <h1 className="font-black text-xl sm:text-2xl text-orange-400 leading-tight">
              El Sembrador
            </h1>
            <p className="text-xs sm:text-sm font-bold text-green-100 opacity-90">
              Recría de Pollitas BB
            </p>
          </div>
        </button>

        {/* Action Buttons - Tactile Optimized (min 44px touch targets) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón Modo Noche */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className={`p-2.5 sm:px-3 sm:py-2 rounded-2xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 ${
                isDarkMode 
                  ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-md' 
                  : 'bg-green-900/80 hover:bg-green-900 text-green-100 border-green-700/50'
              }`}
              title={isDarkMode ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche (Tema Oscuro)'}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-900 shrink-0" /> : <Moon className="w-5 h-5 text-amber-300 shrink-0" />}
              <span className="hidden sm:inline">{isDarkMode ? 'Día' : 'Noche'}</span>
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
            onClick={onLock}
            className="bg-green-900/80 hover:bg-green-900 text-green-100 p-2.5 sm:px-3 sm:py-2.5 rounded-2xl border border-green-700/50 flex items-center justify-center gap-1.5 text-xs font-bold hover:text-white transition-colors min-h-[44px] min-w-[44px] touch-manipulation active:scale-95"
            title="Bloquear Aplicación"
          >
            <Lock className="w-5 h-5 text-orange-400 shrink-0" />
            <span className="hidden md:inline">Salir</span>
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

          <button
            onClick={() => {
              if (onBackToDashboard) onBackToDashboard();
              setActiveTab('settings');
            }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-base transition-all ${
              activeTab === 'settings'
                ? 'bg-orange-500 text-white shadow-inner'
                : 'text-green-100 hover:bg-green-800'
            }`}
          >
            <Settings className="w-5 h-5 text-orange-300" />
            <span>Respaldos & BD</span>
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

        <button
          onClick={() => {
            if (onBackToDashboard) onBackToDashboard();
            setActiveTab('settings');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all touch-manipulation min-h-[48px] ${
            activeTab === 'settings'
              ? 'bg-orange-500 text-white font-black shadow-md scale-105'
              : 'text-green-200 hover:text-white font-bold'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Ajustes</span>
        </button>
      </div>
    </header>
  );
};
