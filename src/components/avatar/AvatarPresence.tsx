import React from 'react';
import {
  AvatarState,
  AvatarPreferences,
} from '../../types/avatar.ts';
import {
  Mic,
  Brain,
  Volume2,
  AlertCircle,
  WifiOff,
  Sparkles,
  Sliders,
  Heart,
  Image as ImageIcon
} from 'lucide-react';
import { ChloeAvatar3D } from './ChloeAvatar3D.tsx';
import { ChloeAvatar } from './ChloeAvatar.tsx';


interface AvatarPresenceProps {
  state: AvatarState;
  preferences: AvatarPreferences;
  onOpenControls?: () => void;
  className?: string;
  isSidePanel?: boolean;
  isStage?: boolean;
}


export const AvatarPresence: React.FC<AvatarPresenceProps> = ({
  state,
  preferences,
  onOpenControls,
  className = '',
  isSidePanel = false,
  isStage = false,
}) => {
  if (!preferences.enabled) return null;

  // Determine state labels & aura colors
  const getStateMeta = () => {
    switch (state) {
      case 'listening':
        return {
          label: 'CHLOÉ vous écoute attentivement',
          badgeText: 'Écoute active',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          haloColor: 'from-cyan-500/35 via-purple-600/30 to-transparent',
          icon: Mic,
          animClass: 'anim-chloe-listening',
          glowClass: 'anim-chloe-glow-active',
        };
      case 'thinking':
        return {
          label: 'CHLOÉ réfléchit et prépare la réponse',
          badgeText: 'Réflexion IA',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          haloColor: 'from-purple-600/40 via-indigo-600/30 to-transparent',
          icon: Brain,
          animClass: 'anim-chloe-thinking',
          glowClass: 'anim-chloe-aura',
        };
      case 'responding':
        return {
          label: 'CHLOÉ génère sa réponse',
          badgeText: 'Réponse en cours',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          haloColor: 'from-indigo-500/40 via-purple-600/30 to-transparent',
          icon: Sparkles,
          animClass: 'anim-chloe-idle',
          glowClass: 'anim-chloe-aura',
        };
      case 'speaking':
        return {
          label: 'CHLOÉ s\'exprime oralement',
          badgeText: 'Lecture vocale',
          badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
          haloColor: 'from-fuchsia-500/45 via-purple-600/35 to-transparent',
          icon: Volume2,
          animClass: 'anim-chloe-speaking',
          glowClass: 'anim-chloe-aura',
        };
      case 'greeting':
      case 'happy':
        return {
          label: 'CHLOÉ vous accueille chaleureusement',
          badgeText: 'Salutation & Accueil',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          haloColor: 'from-amber-400/40 via-purple-600/30 to-transparent',
          icon: Heart,
          animClass: 'anim-chloe-idle',
          glowClass: 'anim-chloe-aura',
        };
      case 'error':
        return {
          label: 'Alerte technique / Erreur temporaire',
          badgeText: 'Alerte',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          haloColor: 'from-amber-500/30 via-purple-900/20 to-transparent',
          icon: AlertCircle,
          animClass: 'anim-chloe-idle',
          glowClass: '',
        };
      case 'offline':
        return {
          label: 'Connexion interrompue',
          badgeText: 'Hors ligne',
          badgeColor: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
          haloColor: 'from-slate-700/20 via-transparent to-transparent',
          icon: WifiOff,
          animClass: '',
          glowClass: '',
        };
      case 'idle':
      default:
        return {
          label: 'CHLOÉ est présente et attentive',
          badgeText: 'En veille attentive',
          badgeColor: 'bg-purple-950/40 text-purple-300 border-purple-500/30',
          haloColor: 'from-purple-600/30 via-indigo-900/20 to-transparent',
          icon: Sparkles,
          animClass: 'anim-chloe-idle',
          glowClass: 'anim-chloe-aura',
        };
    }
  };

  const meta = getStateMeta();
  const StateIcon = meta.icon;

  // Determine size in height
  const getHeightStyle = () => {
    if (isStage) return 'h-full max-h-full w-full';
    switch (preferences.size) {
      case 'small':
        return isSidePanel ? 'h-[50vh] max-h-[460px]' : 'h-[52vh] max-h-[500px]';
      case 'large':
        return isSidePanel ? 'h-[88dvh] max-h-[900px]' : 'h-[92dvh] max-h-[980px]';
      case 'medium':
      default:
        return isSidePanel ? 'h-[78dvh] max-h-[760px]' : 'h-[84dvh] max-h-[900px]';
    }
  };

  // Determine opacity value
  const getOpacityStyle = () => {
    if (isSidePanel || isStage) return 'opacity-100';
    switch (preferences.visibility) {
      case 'low':
        return 'opacity-45 hover:opacity-60 transition-opacity duration-500';
      case 'high':
        return 'opacity-95';
      case 'normal':
      default:
        return 'opacity-80';
    }
  };

  // Determine horizontal positioning for background mode
  const getPositionClass = () => {
    if (isSidePanel || isStage) return 'justify-center items-center';
    switch (preferences.position) {
      case 'left':
        return 'justify-start pl-4 sm:pl-10';
      case 'right':
        return 'justify-end pr-4 sm:pl-10';
      case 'center':
      default:
        return 'justify-center';
    }
  };

  return (
    <div
      className={`pointer-events-none select-none transition-all duration-700 ease-out flex ${getPositionClass()} ${className}`}
      aria-hidden="true"
    >
      <div className={`relative flex flex-col items-center justify-end ${getOpacityStyle()}`}>
        {/* Ambient Radial Aura / Glow */}
        {preferences.ambientParticles && (
          <div
            className={`absolute -inset-10 rounded-full bg-gradient-radial ${meta.haloColor} blur-2xl pointer-events-none transition-all duration-1000 ${
              preferences.animated ? meta.glowClass : ''
            }`}
          />
        )}

        {/* Outer Halo Rim behind the avatar */}
        <div className="absolute top-1/4 w-[280px] h-[340px] rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* Living Avatar: Three.js Fiber Pipeline, Canvas, or Official Photo */}
        <div
          className={`relative z-10 flex ${isStage ? 'items-center justify-center w-full max-w-full' : 'items-end justify-center w-[340px] sm:w-[420px] max-w-[92vw]'} pointer-events-auto ${getHeightStyle()}`}
          style={{
            transformOrigin: 'bottom center',
          }}
        >
          {preferences.engine === 'photo' ? (
            <div
              onClick={onOpenControls}
              className="relative w-full h-full flex items-end justify-center cursor-pointer group"
            >
              <img
                src="/chloe-avatar-fullbody.webp"
                alt="Chloé AI - Assistante Virtuelle"
                className={`w-full h-full object-contain object-bottom drop-shadow-[0_12px_30px_rgba(168,85,247,0.45)] transition-transform duration-700 ${
                  preferences.animated ? meta.animClass : ''
                }`}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
                    target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
                  }
                }}
              />
            </div>
          ) : preferences.engine === 'canvas' ? (
            <ChloeAvatar3D
              state={state}
              preferences={preferences}
              isSpeaking={state === 'speaking'}
              onTap={onOpenControls}
              isSidePanel={isSidePanel}
              className="w-full h-full"
            />
          ) : (
            <ChloeAvatar
              interactive={isSidePanel}
              showControls={isSidePanel}
              onTap={onOpenControls}
              showOfficialPhotoToggle={true}
              className="w-full h-full"
            />
          )}
        </div>

        {/* Interactive Status Badge / Indicator (Allows quick tap to customize) */}
        {preferences.showStatusBadge && (
          <div className="mt-2 z-20 pointer-events-auto">
            <button
              onClick={onOpenControls}
              className={`px-3 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all active:scale-95 hover:border-purple-400 ${meta.badgeColor}`}
              title="Ajuster la présence virtuelle de CHLOÉ"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    state === 'listening'
                      ? 'bg-cyan-400'
                      : state === 'speaking'
                      ? 'bg-fuchsia-400'
                      : state === 'thinking'
                      ? 'bg-purple-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    state === 'listening'
                      ? 'bg-cyan-500'
                      : state === 'speaking'
                      ? 'bg-fuchsia-500'
                      : state === 'thinking'
                      ? 'bg-purple-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </span>
              <StateIcon className="w-3 h-3 shrink-0" />
              <span>{meta.badgeText}</span>
              {onOpenControls && (
                <Sliders className="w-2.5 h-2.5 opacity-60 ml-0.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
