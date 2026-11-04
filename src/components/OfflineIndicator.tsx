import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-12 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-xl bg-amber-600/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/40 animate-in fade-in">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Mode hors ligne – Vos données locales restent accessibles en mémoire cache.</span>
    </div>
  );
};
