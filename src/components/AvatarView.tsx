import React, { useState } from 'react';
import { UserSettings } from '../../shared/types.ts';
import { AvatarState, DEFAULT_AVATAR_PREFERENCES } from '../types/avatar.ts';
import { useGlobalAvatar } from '../context/AvatarContext.tsx';
import {
  Mic,
  Brain,
  Volume2,
  Sparkles,
  AlertCircle,
  WifiOff,
  Sliders,
  Image as ImageIcon,
  Box,
  Layers,
  Heart,
  Maximize2,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { ChloeAvatar } from './avatar/ChloeAvatar.tsx';
import { ChloeAvatar3D } from './avatar/ChloeAvatar3D.tsx';
import { AvatarControlsModal } from './avatar/AvatarControlsModal.tsx';

interface AvatarViewProps {
  settings?: Partial<UserSettings>;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  stateOverride?: AvatarState;
  showBadge?: boolean;
  showAura?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}

export const AvatarView: React.FC<AvatarViewProps> = ({
  settings,
  className = '',
  size = 'large',
  stateOverride,
  showBadge = true,
  showAura = true,
  onClick,
  interactive = true,
}) => {
  const globalAvatar = useGlobalAvatar();
  const currentState: AvatarState = stateOverride || globalAvatar.state;
  const preferences = globalAvatar.preferences || DEFAULT_AVATAR_PREFERENCES;
  const [activeTabMode, setActiveTabMode] = useState<'3d' | 'photo' | 'dual'>('3d');
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className={`relative flex flex-col w-full h-full max-w-4xl mx-auto p-3 sm:p-6 space-y-4 ${className}`}>
      {/* View Header with Mode Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0d1124]/90 p-4 rounded-3xl border border-purple-500/30 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-purple-950/60 border border-purple-400/50 shrink-0 shadow-md">
            <img
              src="/chloe-avatar-fullbody.webp"
              alt="CHLOÉ"
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
                  target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
                }
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base sm:text-lg tracking-tight">
                Studio Avatar CHLOÉ AI
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[10px] font-semibold uppercase">
                3D & Incarnation
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rendu 3D temps réel, synchronisation labiale et portrait officiel haute résolution
            </p>
          </div>
        </div>

        {/* View Switcher: 3D / Photo / Dual */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <div className="bg-[#080a15] p-1 rounded-2xl border border-purple-500/20 flex items-center gap-1">
            <button
              onClick={() => setActiveTabMode('3d')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTabMode === '3d'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Scène 3D</span>
            </button>
            <button
              onClick={() => setActiveTabMode('photo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTabMode === 'photo'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Portrait Officiel</span>
            </button>
            <button
              onClick={() => setActiveTabMode('dual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium hidden md:flex items-center gap-1.5 transition-all ${
                activeTabMode === 'dual'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Duo Comparatif</span>
            </button>
          </div>

          <button
            onClick={() => setIsControlsModalOpen(true)}
            className="p-2 rounded-2xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-1 transition-all shadow-sm"
            title="Paramètres de présence"
          >
            <Sliders className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
        {/* Left Column: 3D Scene Viewport (Rendered in '3d' or 'dual' mode) */}
        {(activeTabMode === '3d' || activeTabMode === 'dual') && (
          <div className={`${activeTabMode === 'dual' ? 'md:col-span-7' : 'md:col-span-12'} h-[68vh] min-h-[460px] relative rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl`}>
            <ChloeAvatar
              interactive={true}
              showControls={true}
              showOfficialPhotoToggle={false}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Right Column: Official Portrait Display (Rendered in 'photo' or 'dual' mode) */}
        {(activeTabMode === 'photo' || activeTabMode === 'dual') && (
          <div className={`${activeTabMode === 'dual' ? 'md:col-span-5' : 'md:col-span-12'} flex flex-col h-[68vh] min-h-[460px] bg-[#0c1022] rounded-3xl border border-purple-500/30 p-4 overflow-hidden relative shadow-2xl`}>
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 z-10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="font-bold text-white text-sm">Portrait Officiel de Chloé</h3>
              </div>
              <button
                onClick={() => setLightboxOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-1 hover:bg-purple-900/60"
                title="Plein écran"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Agrandir</span>
              </button>
            </div>

            {/* Chloé's high-res official assistant image */}
            <div className="relative flex-1 flex items-center justify-center p-2 overflow-hidden">
              <div className="absolute inset-0 bg-radial from-purple-600/20 via-transparent to-transparent blur-3xl pointer-events-none" />
              <img
                src="/chloe-avatar-fullbody.webp"
                alt="CHLOÉ Assistante Virtuelle"
                className="max-h-full max-w-full object-contain object-bottom drop-shadow-[0_15px_35px_rgba(168,85,247,0.45)] select-none cursor-pointer"
                onClick={() => setLightboxOpen(true)}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
                    target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
                  }
                }}
              />
            </div>

            {/* Portrait metadata tags */}
            <div className="pt-3 border-t border-purple-500/20 shrink-0 space-y-1.5 z-10 text-xs">
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-200 text-[10px]">
                  Pull col roulé lavande
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-200 text-[10px]">
                  Pantalon violet évasé
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-200 text-[10px]">
                  Bottines cuir
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[10px]">
                  Corps entier
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Image de référence authentique pour l'assistant CHLOÉ AI sur Samsung Galaxy S24.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for High-Resolution Fullscreen View */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex flex-col items-center justify-center animate-in fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-lg w-full max-h-[92vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-2 right-2 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 z-10"
            >
              ✕
            </button>
            <img
              src="/chloe-avatar-fullbody.webp"
              alt="CHLOÉ Plein Écran"
              className="max-h-[82vh] w-auto object-contain drop-shadow-[0_20px_50px_rgba(168,85,247,0.5)]"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
                  target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
                }
              }}
            />
            <p className="text-white text-xs mt-3 font-medium bg-black/60 px-4 py-1.5 rounded-full border border-purple-500/30">
              CHLOÉ AI — Assistante Virtuelle Personnelle
            </p>
          </div>
        </div>
      )}

      {/* Avatar Controls Modal */}
      <AvatarControlsModal
        isOpen={isControlsModalOpen}
        onClose={() => setIsControlsModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={globalAvatar.updatePreferences}
        currentState={currentState}
        onPreviewState={globalAvatar.triggerStatePreview}
        onClearPreview={globalAvatar.clearPreview}
        isOverridden={globalAvatar.isOverridden}
      />
    </div>
  );
};
