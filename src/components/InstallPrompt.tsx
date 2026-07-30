import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'sembrador_install_dismissed_at';
const DISMISS_DAYS = 7;

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as any).standalone === true
  );
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const lastDismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const daysSinceDismiss = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24);
    if (lastDismissed && daysSinceDismiss < DISMISS_DAYS) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm z-[60] animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-green-900 text-white rounded-2xl shadow-2xl border border-green-700/60 p-4 flex items-start gap-3">
        <div className="bg-orange-500 p-2.5 rounded-xl shrink-0">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm sm:text-base leading-tight">Instalar SembraBB</p>
          <p className="text-green-100 text-xs sm:text-sm mt-0.5 font-medium">
            Agrégala a tu pantalla de inicio para abrirla en pantalla completa, sin conexión y como una app nativa.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black px-3 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all touch-manipulation min-h-[40px]"
            >
              <Download className="w-4 h-4" />
              <span>Instalar</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2.5 rounded-xl text-sm font-bold text-green-200 hover:text-white hover:bg-green-800 transition-colors touch-manipulation min-h-[40px]"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-green-300 hover:text-white shrink-0 p-1 touch-manipulation"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
