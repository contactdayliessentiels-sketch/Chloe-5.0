import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Download, Sparkles, X, Smartphone } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // If running in standalone PWA mode or dismissed, suppress banner
  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900/80 border-b border-purple-500/20 px-3 py-2 text-xs flex items-center justify-between gap-2 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <p className="text-slate-200 truncate">
            <span className="font-semibold text-purple-300">Samsung Galaxy S24 :</span> Installez CHLOÉ sur votre écran d'accueil
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isInstallable ? (
            <button
              onClick={install}
              className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-medium px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1 transition-all shadow-sm shadow-purple-900/50"
            >
              <Download className="w-3 h-3" />
              Installer
            </button>
          ) : (
            <button
              onClick={() => setShowGuide(true)}
              className="bg-purple-900/40 hover:bg-purple-800/40 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-md text-[11px] transition-colors"
            >
              Guide S24
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-200 p-1"
            title="Masquer"
            aria-label="Fermer la bannière"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-purple-500/30 p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Installation sur Galaxy S24
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300 mb-4">
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <p className="font-medium text-purple-300 mb-1">Depuis Chrome ou Samsung Internet :</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Touchez le menu <strong>⋮ (trois points)</strong> en haut à droite.</li>
                  <li>Sélectionnez <strong>"Ajouter à l'écran d'accueil"</strong> ou <strong>"Installer l'application"</strong>.</li>
                  <li>Validez pour disposer de CHLOÉ AI comme une application native en plein écran !</li>
                </ol>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-medium text-white text-xs transition-colors"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
