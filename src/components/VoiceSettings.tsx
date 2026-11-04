import React, { useState, useEffect, useRef } from 'react';
import { UserSettings } from '../../shared/types.ts';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Sliders,
  CheckCircle2,
  Languages,
  Mic,
  RotateCcw,
  Zap,
  Activity
} from 'lucide-react';
import { speechLipSync } from '../services/speechLipSync.ts';

interface VoiceSettingsProps {
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  className?: string;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  settings,
  onUpdateSettings,
  className = '',
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>(settings.voiceUri || '');
  const [speed, setSpeed] = useState<number>(settings.voiceSpeed || 1.0);
  const [pitch, setPitch] = useState<number>(settings.voicePitch || 1.05);
  const [expressivity, setExpressivity] = useState<number>(
    settings.voiceExpressivity !== undefined ? settings.voiceExpressivity : 0.85
  );
  const [pauseCadence, setPauseCadence] = useState<number>(
    settings.voicePauseDuration !== undefined ? settings.voicePauseDuration : 1.0
  );
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Load available system synthesis voices
  useEffect(() => {
    const updateVoices = () => {
      if (!('speechSynthesis' in window)) return;
      const available = window.speechSynthesis.getVoices();
      setVoices(available);

      if (!selectedVoiceUri && available.length > 0) {
        // Auto-select preferred French female voice
        const pref =
          available.find(v => v.lang.startsWith('fr') && /female|femme|amelie|julie|hortense|celia/i.test(v.name)) ||
          available.find(v => v.lang.startsWith('fr')) ||
          available[0];
        if (pref) {
          setSelectedVoiceUri(pref.voiceURI);
        }
      }
    };

    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Update speech lip sync expressivity whenever it changes
  useEffect(() => {
    speechLipSync.setExpressivity(expressivity);
  }, [expressivity]);

  // Persist settings changes
  const applySettings = async (updates: Partial<UserSettings>) => {
    try {
      await onUpdateSettings(updates);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    } catch (e) {
      console.warn('Failed to save voice settings:', e);
    }
  };

  const handleVoiceChange = (uri: string) => {
    setSelectedVoiceUri(uri);
    applySettings({ voiceUri: uri });
  };

  const handleSpeedChange = (val: number) => {
    setSpeed(val);
    applySettings({ voiceSpeed: val });
  };

  const handlePitchChange = (val: number) => {
    setPitch(val);
    applySettings({ voicePitch: val });
  };

  const handleExpressivityChange = (val: number) => {
    setExpressivity(val);
    speechLipSync.setExpressivity(val);
    applySettings({ voiceExpressivity: val });
  };

  const handlePauseCadenceChange = (val: number) => {
    setPauseCadence(val);
    applySettings({ voicePauseDuration: val });
  };

  const handleResetDefaults = () => {
    const defSpeed = 1.0;
    const defPitch = 1.05;
    const defExpr = 0.85;
    const defPause = 1.0;
    setSpeed(defSpeed);
    setPitch(defPitch);
    setExpressivity(defExpr);
    setPauseCadence(defPause);
    speechLipSync.setExpressivity(defExpr);
    applySettings({
      voiceSpeed: defSpeed,
      voicePitch: defPitch,
      voiceExpressivity: defExpr,
      voicePauseDuration: defPause,
    });
  };

  // Audio Preview Execution
  const toggleAudioPreview = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingPreview) {
      window.speechSynthesis.cancel();
      speechLipSync.stopSpeaking();
      setIsPlayingPreview(false);
      return;
    }

    window.speechSynthesis.cancel();
    speechLipSync.stopSpeaking();

    const sampleText =
      settings.language === 'en'
        ? `Hello! I am ${settings.assistantName}, your personal assistant on Samsung Galaxy S24. Here is a preview of my voice with your current settings.`
        : `Bonjour ! Je suis ${settings.assistantName}, votre assistante personnelle sur Samsung Galaxy S24. Voici un aperçu de ma voix avec vos réglages actuels.`;

    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = speed;
    utterance.pitch = pitch;
    utterance.lang = settings.language === 'en' ? 'en-US' : 'fr-FR';

    // Apply selected voice
    if (selectedVoiceUri && voices.length > 0) {
      const match = voices.find(v => v.voiceURI === selectedVoiceUri);
      if (match) utterance.voice = match;
    } else {
      const frenchVoice =
        voices.find(v => v.lang.startsWith('fr') && /female|femme|amelie|julie|hortense|celia/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith('fr'));
      if (frenchVoice) utterance.voice = frenchVoice;
    }

    // Attach dynamic lip-sync engine
    speechLipSync.attachUtterance(utterance, sampleText);

    utterance.onstart = () => setIsPlayingPreview(true);
    utterance.onend = () => {
      setIsPlayingPreview(false);
      speechLipSync.stopSpeaking();
    };
    utterance.onerror = () => {
      setIsPlayingPreview(false);
      speechLipSync.stopSpeaking();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Group voices for easier selection
  const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));
  const otherVoices = voices.filter(v => !v.lang.startsWith('fr'));

  return (
    <div className={`p-4 sm:p-5 rounded-3xl bg-[#0e1226]/90 border border-purple-500/30 backdrop-blur-md shadow-xl space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
            <Volume2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <span>Voix & Synthèse Vocale</span>
              {saveFeedback && (
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3 h-3" />
                  Enregistré
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Personnalisation de la voix, de l'élocution et de l'expressivité labiale de CHLOÉ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1 transition-all active:scale-95"
          title="Rétablir les paramètres par défaut"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span className="hidden sm:inline">Par défaut</span>
        </button>
      </div>

      {/* Voice Selection Dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-purple-400" />
            <span>Moteur vocal du système :</span>
          </span>
          <span className="text-[10px] text-purple-300/80 font-normal">
            {voices.length} voix détectées
          </span>
        </label>
        <select
          value={selectedVoiceUri}
          onChange={e => handleVoiceChange(e.target.value)}
          className="w-full bg-[#12162B] border border-slate-700/80 rounded-2xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 shadow-inner"
        >
          {frenchVoices.length > 0 && (
            <optgroup label="🇫🇷 Voix françaises recommandées">
              {frenchVoices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}) {v.default ? '★ Défaut' : ''}
                </option>
              ))}
            </optgroup>
          )}

          {otherVoices.length > 0 && (
            <optgroup label="🌐 Autres langues et voix système">
              {otherVoices.slice(0, 30).map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Speed Slider */}
        <div className="p-3 rounded-2xl bg-[#121730]/60 border border-purple-900/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Vitesse d'élocution
            </span>
            <span className="font-mono text-purple-300 font-semibold bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-500/30 text-[11px]">
              {speed.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.8"
            step="0.05"
            value={speed}
            onChange={e => handleSpeedChange(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
            <button
              type="button"
              onClick={() => handleSpeedChange(0.85)}
              className="hover:text-purple-300 transition-colors"
            >
              Calme (0.85x)
            </button>
            <button
              type="button"
              onClick={() => handleSpeedChange(1.0)}
              className="hover:text-purple-300 transition-colors"
            >
              Naturel (1.0x)
            </button>
            <button
              type="button"
              onClick={() => handleSpeedChange(1.25)}
              className="hover:text-purple-300 transition-colors"
            >
              Rapide (1.25x)
            </button>
          </div>
        </div>

        {/* Pitch Slider */}
        <div className="p-3 rounded-2xl bg-[#121730]/60 border border-purple-900/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-fuchsia-400" />
              Tonalité (Pitch)
            </span>
            <span className="font-mono text-fuchsia-300 font-semibold bg-fuchsia-950/60 px-2 py-0.5 rounded-lg border border-fuchsia-500/30 text-[11px]">
              {pitch.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.4"
            step="0.05"
            value={pitch}
            onChange={e => handlePitchChange(parseFloat(e.target.value))}
            className="w-full accent-fuchsia-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
            <button
              type="button"
              onClick={() => handlePitchChange(0.9)}
              className="hover:text-fuchsia-300 transition-colors"
            >
              Grave (0.9)
            </button>
            <button
              type="button"
              onClick={() => handlePitchChange(1.05)}
              className="hover:text-fuchsia-300 transition-colors"
            >
              Standard (1.05)
            </button>
            <button
              type="button"
              onClick={() => handlePitchChange(1.25)}
              className="hover:text-fuchsia-300 transition-colors"
            >
              Aigu (1.25)
            </button>
          </div>
        </div>

        {/* Expressivity Slider */}
        <div className="p-3 rounded-2xl bg-[#121730]/60 border border-purple-900/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Expressivité & Vivacité
            </span>
            <span className="font-mono text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/30 text-[11px]">
              {Math.round(expressivity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.3"
            step="0.05"
            value={expressivity}
            onChange={e => handleExpressivityChange(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
            <span className="hover:text-amber-300 transition-colors">Modérée</span>
            <span className="hover:text-amber-300 transition-colors">Chaleureuse (85%)</span>
            <span className="hover:text-amber-300 transition-colors">Dynamique</span>
          </div>
        </div>

        {/* Pause Cadence */}
        <div className="p-3 rounded-2xl bg-[#121730]/60 border border-purple-900/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Cadence & Respiration
            </span>
            <span className="font-mono text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30 text-[11px]">
              {pauseCadence === 0.85 ? 'Fluide' : pauseCadence === 1.25 ? 'Posée' : 'Naturelle'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            {[
              { val: 0.85, label: 'Fluide' },
              { val: 1.0, label: 'Naturelle' },
              { val: 1.25, label: 'Posée' },
            ].map(item => (
              <button
                key={item.val}
                type="button"
                onClick={() => handlePauseCadenceChange(item.val)}
                className={`py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  pauseCadence === item.val
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audio Preview Banner */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-fuchsia-950/40 to-indigo-950/60 border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleAudioPreview}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0 ${
              isPlayingPreview
                ? 'bg-rose-600 text-white shadow-rose-950/80 animate-pulse'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/60'
            }`}
            title={isPlayingPreview ? 'Arrêter la lecture' : 'Tester la voix de Chloé'}
          >
            {isPlayingPreview ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-xs sm:text-sm">
                Tester la voix de {settings.assistantName}
              </span>
              {isPlayingPreview && (
                <div className="flex items-end gap-1 h-3.5 px-1.5 py-0.5 rounded-full bg-fuchsia-900/40 border border-fuchsia-500/30">
                  <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-3" />
                  <span className="w-1 bg-fuchsia-400 rounded-full animate-pulse h-2" />
                  <span className="w-1 bg-purple-400 rounded-full animate-bounce h-3" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              {isPlayingPreview
                ? 'Lecture en cours avec synchronisation labiale temps réel...'
                : 'Cliquez pour écouter un échantillon avec la voix et les modulations sélectionnées.'}
            </p>
          </div>
        </div>

        {isPlayingPreview && (
          <button
            type="button"
            onClick={toggleAudioPreview}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1.5 shrink-0"
          >
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            <span>Arrêter</span>
          </button>
        )}
      </div>
    </div>
  );
};
