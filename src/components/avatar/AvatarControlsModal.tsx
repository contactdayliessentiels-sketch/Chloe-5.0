import React from 'react';
import {
  AvatarPreferences,
  AvatarState,
  AvatarSize,
  AvatarPosition,
  AvatarVisibility,
  AvatarIntensity,
  AvatarLayoutMode,
} from '../../types/avatar.ts';
import {
  X,
  Sparkles,
  Sliders,
  Volume2,
  Eye,
  Activity,
  Layers,
  Check,
  RotateCcw,
  Smartphone
} from 'lucide-react';

interface AvatarControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: AvatarPreferences;
  onUpdatePreferences: (updates: Partial<AvatarPreferences>) => void;
  currentState: AvatarState;
  onPreviewState: (state: AvatarState) => void;
  onClearPreview: () => void;
  isOverridden: boolean;
}

export const AvatarControlsModal: React.FC<AvatarControlsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  currentState,
  onPreviewState,
  onClearPreview,
  isOverridden,
}) => {
  if (!isOpen) return null;

  const statesList: { id: AvatarState; label: string; desc: string }[] = [
    { id: 'idle', label: 'Repos / Veille', desc: 'Respiration lente, halo apaisé' },
    { id: 'listening', label: 'Écoute active', desc: 'Légère inclinaison attentive, halo cyan' },
    { id: 'thinking', label: 'Réflexion IA', desc: 'Pulsation pourpre, concentration' },
    { id: 'speaking', label: 'Parole vocale', desc: 'Synchronisation labiale en temps réel' },
    { id: 'greeting', label: 'Accueil / Salutation', desc: 'Sourire chaleureux et signe de tête' },
    { id: 'happy', label: 'Joie / Sourire', desc: 'Regard pétillant et étincelles dorées' },
    { id: 'error', label: 'Alerte / Erreur', desc: 'Halo ambré bienveillant' },
    { id: 'offline', label: 'Hors ligne', desc: 'Feutré, présence sobre' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[#0b0f20] border border-purple-500/30 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl shadow-purple-950/80 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-900/30 flex items-center justify-between bg-gradient-to-r from-[#0d1226] to-[#121733] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Présence Virtuelle de CHLOÉ</h2>
              <p className="text-[11px] text-purple-300">Avatar immersif & cinématique naturelle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-200">
          {/* Main Activation Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30">
            <div>
              <span className="font-semibold text-white text-xs block">Afficher la présence virtuelle</span>
              <span className="text-[11px] text-slate-400">CHLOÉ en pied intégrée à la conversation</span>
            </div>
            <button
              onClick={() => onUpdatePreferences({ enabled: !preferences.enabled })}
              className={`w-12 h-6.5 rounded-full p-1 transition-colors relative flex items-center ${
                preferences.enabled ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                  preferences.enabled ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Assistant Official Portrait Reference Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900/60 border border-purple-500/30 flex items-center gap-3">
            <div className="w-14 h-18 rounded-xl overflow-hidden bg-black/50 border border-purple-500/40 shrink-0 shadow-md">
              <img
                src="/chloe-avatar-fullbody.webp"
                alt="Chloé AI"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
                    target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
                  }
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-white text-xs truncate">Portrait Officiel de Chloé</span>
              </div>
              <p className="text-[10px] text-purple-300 mt-0.5 leading-tight">
                Pull lavande col roulé, pantalon violet évasé, bottines en cuir.
              </p>
              <div className="flex gap-1 mt-1.5">
                <span className="px-1.5 py-0.5 rounded bg-purple-900/40 text-[9px] text-purple-200 border border-purple-500/30 font-medium">
                  Galaxy S24 Calibré
                </span>
                <span className="px-1.5 py-0.5 rounded bg-purple-900/40 text-[9px] text-purple-200 border border-purple-500/30 font-medium">
                  Corps entier
                </span>
              </div>
            </div>
          </div>

          {/* Engine Selector: 3D Fiber vs Canvas vs Photo */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Moteur de rendu de l'avatar</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'r3f', label: '3D Fiber Pipeline', desc: 'React Three Fiber & morphs' },
                { id: 'canvas', label: 'Canvas WebGL', desc: 'Three.js procédural léger' },
                { id: 'photo', label: 'Photo Officielle', desc: 'Rendu 2D haute définition' },
              ].map(eng => (
                <button
                  key={eng.id}
                  onClick={() => onUpdatePreferences({ engine: eng.id as any })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    (preferences.engine || 'r3f') === eng.id
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm shadow-purple-950'
                      : 'bg-[#101426] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-[11px] truncate">{eng.label}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{eng.desc}</p>
                </button>
              ))}
            </div>
          </div>


          {/* Visibility / Opacity */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>Niveau de présence & transparence</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'low', label: 'Discrète (25%)', desc: 'En retrait doux' },
                  { id: 'normal', label: 'Équilibrée (55%)', desc: 'Idéale lecture' },
                  { id: 'high', label: 'Affirmée (85%)', desc: 'Présence nette' },
                ] as { id: AvatarVisibility; label: string; desc: string }[]
              ).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => onUpdatePreferences({ visibility: opt.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    preferences.visibility === opt.id
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm shadow-purple-950'
                      : 'bg-[#101426] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-[11px]">{opt.label}</p>
                  <p className="text-[10px] opacity-80 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Size */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Taille de l'avatar</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'small', label: 'Compacte', val: '45%' },
                  { id: 'medium', label: 'Standard', val: '65%' },
                  { id: 'large', label: 'Grande', val: '85%' },
                ] as { id: AvatarSize; label: string; val: string }[]
              ).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => onUpdatePreferences({ size: opt.id })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    preferences.size === opt.id
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-[#101426] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-semibold text-[11px]">{opt.label}</p>
                  <p className="text-[10px] text-purple-300 mt-0.5">{opt.val}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Positionnement horizontal</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'left', label: 'À gauche' },
                  { id: 'center', label: 'Au centre' },
                  { id: 'right', label: 'À droite' },
                ] as { id: AvatarPosition; label: string }[]
              ).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => onUpdatePreferences({ position: opt.id })}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    preferences.position === opt.id
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-[#101426] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-medium text-[11px]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Layout Mode (Mobile vs Tablet/Desktop) */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span>Mode d'affichage</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'hybrid', label: 'Hybride auto', desc: 'Fond sur mobile, panneau sur grand écran' },
                  { id: 'background', label: 'Arrière-plan', desc: 'Toujours en profondeur de chat' },
                  { id: 'side', label: 'Panneau latéral', desc: 'Zone dédiée à côté du chat' },
                ] as { id: AvatarLayoutMode; label: string; desc: string }[]
              ).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => onUpdatePreferences({ mode: opt.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    preferences.mode === opt.id
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-[#101426] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-semibold text-[11px]">{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles: Animations & Voice Sync */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-[#101426] border border-slate-800 flex items-center justify-between">
              <div className="pr-2">
                <span className="font-medium text-slate-200 block text-[11px]">Animations naturelles</span>
                <span className="text-[10px] text-slate-400">Micro-respiration & postures</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.animated}
                onChange={e => onUpdatePreferences({ animated: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#101426] border border-slate-800 flex items-center justify-between">
              <div className="pr-2">
                <span className="font-medium text-slate-200 block text-[11px]">Synchronisation vocale</span>
                <span className="text-[10px] text-slate-400">Aura vibrante pendant la parole</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.voiceSync}
                onChange={e => onUpdatePreferences({ voiceSync: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#101426] border border-slate-800 flex items-center justify-between">
              <div className="pr-2">
                <span className="font-medium text-slate-200 block text-[11px]">Badge d'état interactif</span>
                <span className="text-[10px] text-slate-400">Affiche l'état courant de CHLOÉ</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.showStatusBadge}
                onChange={e => onUpdatePreferences({ showStatusBadge: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#101426] border border-slate-800 flex items-center justify-between">
              <div className="pr-2">
                <span className="font-medium text-slate-200 block text-[11px]">Halo & particules d'aura</span>
                <span className="text-[10px] text-slate-400">Profondeur lumineuse violette</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.ambientParticles}
                onChange={e => onUpdatePreferences({ ambientParticles: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Live State Tester */}
          <div className="p-3.5 rounded-2xl bg-[#090d1c] border border-purple-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold text-white text-[11px]">
                  Tester les 7 états en direct (Aperçu)
                </span>
              </div>
              {isOverridden && (
                <button
                  onClick={onClearPreview}
                  className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/50 border border-purple-500/30"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Rétablir l'état réel
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {statesList.map(st => (
                <button
                  key={st.id}
                  onClick={() => onPreviewState(st.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    currentState === st.id
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950'
                      : 'bg-[#121629] border-slate-800 text-slate-300 hover:bg-purple-950/30'
                  }`}
                >
                  <span className="font-medium text-[11px] block">{st.label}</span>
                  <span className="text-[9px] opacity-75 block truncate">{st.desc}</span>
                </button>
              ))}
            </div>
          </div>


        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-purple-900/30 bg-[#0d1226] flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950 transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Valider et fermer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
