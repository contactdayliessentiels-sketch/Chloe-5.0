import React, { useState, useEffect } from 'react';
import { UserSettings, AIProviderConfig, AIProviderId } from '../../shared/types.ts';
import {
  Settings,
  User,
  Sliders,
  Volume2,
  Cpu,
  Globe,
  Download,
  AlertOctagon,
  Check,
  Smartphone,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  Layers,
  Activity,
  ShieldCheck,
  Key,
  KeyRound,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Image as ImageIcon,
  Brain
} from 'lucide-react';

import { useAvatarState } from '../hooks/useAvatarState.ts';
import { AvatarSize, AvatarPosition, AvatarVisibility, AvatarLayoutMode } from '../types/avatar.ts';

const PROVIDER_FALLBACKS: AIProviderConfig[] = [
  { id: 'gemini', name: 'Google Gemini', endpoint: 'Google GenAI Cloud', description: 'Modèle multimodal Google.', keyUrl: 'https://aistudio.google.com/app/apikey', hasKey: false, maskedKey: '', status: 'not_configured', models: ['gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.1-flash-lite'], selectedModel: 'gemini-3.8-flash' },
  { id: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1', description: 'Modèles OpenAI.', keyUrl: 'https://platform.openai.com/api-keys', hasKey: false, maskedKey: '', status: 'not_configured', models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'gpt-4.5-preview'], selectedModel: 'gpt-4o' },
  { id: 'nvidia', name: 'NVIDIA NIM', endpoint: 'https://integrate.api.nvidia.com/v1', description: 'Modèles NVIDIA NIM.', keyUrl: 'https://build.nvidia.com', hasKey: false, maskedKey: '', status: 'not_configured', models: ['meta/llama-3.3-70b-instruct', 'mistralai/mistral-large-2-instruct', 'deepseek-ai/deepseek-r1', 'nvidia/llama-3.1-nemotron-70b-instruct'], selectedModel: 'meta/llama-3.3-70b-instruct' },
  { id: 'openrouter', name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1', description: 'Passerelle multi-fournisseurs.', keyUrl: 'https://openrouter.ai/keys', hasKey: false, maskedKey: '', status: 'not_configured', models: ['deepseek/deepseek-r1', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.3-70b-instruct', 'google/gemini-2.0-flash-001', 'openai/gpt-4o'], selectedModel: 'deepseek/deepseek-r1' },
];

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  onExportData: () => void;
  onWipeAccount: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportData,
  onWipeAccount,
}) => {
  const [form, setForm] = useState<UserSettings>(settings);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Multi-Provider state
  const [providers, setProviders] = useState<AIProviderConfig[]>(PROVIDER_FALLBACKS);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<AIProviderId>('gemini');
  const [activeModel, setActiveModel] = useState<string>('gemini-3.8-flash');
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latencyMs: number }>>({});
  const [savingKeyId, setSavingKeyId] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setProviders(Array.isArray(data.providers) && data.providers.length ? data.providers : PROVIDER_FALLBACKS);
      setActiveProvider(data.activeProvider || 'gemini');
      setActiveModel(data.activeModel || 'gemini-3.8-flash');
      setProvidersError(null);
    } catch (e: any) {
      console.warn('Erreur chargement providers:', e);
      setProvidersError(`Impossible de charger les fournisseurs : ${e.message || 'serveur API inaccessible'}. Vérifiez l’URL API et le backend HTTPS.`);
      setProviders(prev => prev.length ? prev : PROVIDER_FALLBACKS);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSaveKey = async (id: AIProviderId) => {
    const key = keyInputs[id];
    if (!key || !key.trim()) return;
    setSavingKeyId(id);
    try {
      const res = await fetch('/api/providers/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, key: key.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setKeyInputs(prev => ({ ...prev, [id]: '' }));
      setProvidersError(null);
      await fetchProviders();
    } catch (e: any) {
      console.error('Erreur sauvegarde clé:', e);
      setProvidersError(`Sauvegarde impossible : ${e.message || 'erreur serveur'}`);
    } finally {
      setSavingKeyId(null);
    }
  };

  const handleSelectProvider = async (id: AIProviderId, model?: string) => {
    try {
      const res = await fetch('/api/providers/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, model }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setActiveProvider(data.activeProvider);
      setActiveModel(data.activeModel);
      setProviders(data.providers || PROVIDER_FALLBACKS);
      setProvidersError(null);
    } catch (e: any) {
      console.error('Erreur sélection provider:', e);
      setProvidersError(`Activation impossible : ${e.message || 'erreur serveur'}`);
    }
  };

  const handleSetProviderModel = async (id: AIProviderId, model: string) => {
    try {
      const res = await fetch('/api/providers/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, model }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setProviders(data.providers || PROVIDER_FALLBACKS);
      setActiveProvider(data.activeProvider || activeProvider);
      setActiveModel(data.activeModel || activeModel);
      setProvidersError(null);
    } catch (e: any) {
      setProvidersError(`Modification du modèle impossible : ${e.message || 'erreur serveur'}`);
    }
  };

  const handleTestProvider = async (id: AIProviderId) => {
    setTestingId(id);
    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [id]: data }));
    } catch (e: any) {
      setTestResults(prev => ({
        ...prev,
        [id]: { success: false, message: e.message || 'Erreur réseau', latencyMs: 0 },
      }));
    } finally {
      setTestingId(null);
    }
  };

  // Avatar state and preferences
  const avatar = useAvatarState();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings(form);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto pb-24">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">Paramètres de CHLOÉ</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
            Personnalisation
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Ajustez l'identité, la présence virtuelle, la voix, le modèle d'IA et les préférences de votre assistante
        </p>
      </div>

      {savedFeedback && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Paramètres enregistrés avec succès.</span>
        </div>
      )}

      {/* Section 1: Présence Virtuelle & Avatar Full-Body */}
      <div className="p-4 rounded-2xl bg-[#0f1428] border border-purple-500/30 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                Présence Virtuelle Immersive (Full-Body)
              </h3>
              <p className="text-[11px] text-purple-300">
                Avatar en pied présent pendant vos conversations sur Samsung Galaxy S24
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-purple-950/70 border border-purple-500/40 text-purple-200 px-2 py-0.5 rounded-full">
            Actif
          </span>
        </div>

        {/* Live Preview Card */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl bg-[#080b18] border border-slate-800">
          <div className="w-24 h-36 rounded-xl overflow-hidden bg-gradient-to-b from-purple-950/50 to-black/80 border border-purple-500/30 flex items-end justify-center relative shrink-0 shadow-lg shadow-purple-950/60">
            <img
              src="/chloe-avatar-fullbody.webp"
              alt="Aperçu CHLOÉ en pied"
              className="h-32 object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
                  target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
                }
              }}
            />
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          <div className="space-y-1.5 flex-1 text-[11px]">
            <p className="text-white font-medium">
              Silhouette féminine élégante & naturelle — Tenue soignée
            </p>
            <p className="text-slate-400 leading-relaxed">
              CHLOÉ s'affiche en pied (pull col roulé mauve, pantalon violet) avec une micro-respiration et des postures synchronisées avec la conversation (écoute, réflexion, parole).
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/20 text-[10px]">
                Taille : {avatar.preferences.size}
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/20 text-[10px]">
                Position : {avatar.preferences.position}
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/20 text-[10px]">
                Visibilité : {avatar.preferences.visibility}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 text-[10px]">
                {avatar.preferences.animated ? 'Animée (GPU)' : 'Statique'}
              </span>
            </div>
          </div>
        </div>

        {/* Avatar Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Taille à l'écran :</label>
            <select
              value={avatar.preferences.size}
              onChange={e => avatar.updatePreferences({ size: e.target.value as AvatarSize })}
              className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value="small">Compacte (50% de hauteur)</option>
              <option value="medium">Standard (70% de hauteur)</option>
              <option value="large">Grande (85% de hauteur)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Positionnement :</label>
            <select
              value={avatar.preferences.position}
              onChange={e => avatar.updatePreferences({ position: e.target.value as AvatarPosition })}
              className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value="center">Au centre (recommandé fond)</option>
              <option value="left">À gauche</option>
              <option value="right">À droite</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Intensité visuelle / Opacité :</label>
            <select
              value={avatar.preferences.visibility}
              onChange={e => avatar.updatePreferences({ visibility: e.target.value as AvatarVisibility })}
              className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value="low">Discrète (25% en transparence)</option>
              <option value="normal">Équilibrée (55% lisible)</option>
              <option value="high">Affirmée (85% mise en avant)</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
            <span className="text-slate-300">Animations naturelles (respiration/postures)</span>
            <input
              type="checkbox"
              checked={avatar.preferences.animated}
              onChange={e => avatar.updatePreferences({ animated: e.target.checked })}
              className="w-4 h-4 accent-purple-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
            <span className="text-slate-300">Synchronisation vocale avec l'aura</span>
            <input
              type="checkbox"
              checked={avatar.preferences.voiceSync}
              onChange={e => avatar.updatePreferences({ voiceSync: e.target.checked })}
              className="w-4 h-4 accent-purple-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Section 2: Fournisseurs d'IA & Clés API Multi-Moteurs */}
      <div className="p-4 rounded-2xl bg-[#0f1428] border border-cyan-500/30 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                Fournisseurs d'IA & Clés API Multi-Moteurs
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 font-mono">
                  Anti-Quota 429
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Configurez vos clés OpenAI, Gemini, build.nvidia.com et OpenRouter pour une continuité sans interruption
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchProviders}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Rafraîchir les statuts"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Engine Summary Banner */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/40 to-cyan-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Moteur actuellement actif pour CHLOÉ</span>
              <span className="text-white font-semibold capitalize">
                {activeProvider === 'nvidia' ? 'NVIDIA NIM (build.nvidia.com)' : activeProvider} — <span className="font-mono text-purple-300">{activeModel}</span>
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/70 text-slate-300 border border-slate-600/40 font-semibold">
            Moteur sélectionné
          </span>
        </div>

        {providersError && (
          <div role="alert" className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs leading-relaxed">
            {providersError}
          </div>
        )}

        {/* Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {providers.map(p => {
            const isActive = activeProvider === p.id;
            const inputVal = keyInputs[p.id] || '';
            const isShowingKey = !!showKeys[p.id];
            const testResult = testResults[p.id];
            const isTesting = testingId === p.id;
            const isSaving = savingKeyId === p.id;

            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                  isActive
                    ? 'bg-[#121832] border-purple-500/60 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/30'
                    : 'bg-[#0a0d1c] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-white text-xs">{p.name}</h4>
                      {isActive && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-purple-600 text-white font-bold">
                          Actif
                        </span>
                      )}
                    </div>
                    <a
                      href={p.keyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-0.5"
                    >
                      <span>Obtenir une clé</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      p.hasKey
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-600/40'
                        : 'bg-slate-900 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    {p.hasKey ? (p.maskedKey ? p.maskedKey : 'Connecté') : 'Non configuré'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {p.description}
                </p>

                {/* Model Selector */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Modèle sélectionné :
                  </label>
                  <select
                    value={p.selectedModel}
                    onChange={e => handleSetProviderModel(p.id, e.target.value)}
                    className="w-full bg-[#141933] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  >
                    {p.models.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Key Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {p.hasKey ? 'Mettre à jour la clé API :' : 'Saisir la clé API :'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type={isShowingKey ? 'text' : 'password'}
                        placeholder={p.maskedKey || (p.id === 'openai' ? 'sk-...' : p.id === 'nvidia' ? 'nvapi-...' : 'Clé API...')}
                        value={inputVal}
                        onChange={e => setKeyInputs({ ...keyInputs, [p.id]: e.target.value })}
                        className="w-full bg-[#141933] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 pr-8 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, [p.id]: !isShowingKey })}
                        className="absolute right-2 top-2 text-slate-400 hover:text-white"
                        title={isShowingKey ? 'Masquer' : 'Afficher'}
                      >
                        {isShowingKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveKey(p.id)}
                      disabled={isSaving || !inputVal.trim()}
                      className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition-colors shrink-0 shadow-sm"
                    >
                      {isSaving ? '...' : 'Sauvegarder'}
                    </button>
                  </div>
                </div>

                {/* Actions: Test & Activate */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestProvider(p.id)}
                    disabled={isTesting || !p.hasKey}
                    className="text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-40"
                  >
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span>{isTesting ? 'Test...' : 'Tester le ping'}</span>
                  </button>

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleSelectProvider(p.id, p.selectedModel)}
                      disabled={!p.hasKey}
                      className="text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                      Activer ce moteur
                    </button>
                  )}
                </div>

                {/* Test Feedback */}
                {testResult && (
                  <div
                    className={`p-2 rounded-lg text-[11px] flex items-start gap-1.5 ${
                      testResult.success
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                        : 'bg-red-950/40 text-red-300 border border-red-800/40'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-tight">{testResult.message}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Identité & Avatar */}
        <div className="p-4 rounded-2xl bg-[#0f1428] border border-slate-800/80 space-y-3">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
            Identité de l'assistante
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Nom de l'IA :</label>
              <input
                type="text"
                value={form.assistantName}
                onChange={e => setForm({ ...form, assistantName: e.target.value })}
                className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Langue principale :</label>
              <select
                value={form.language}
                onChange={e => setForm({ ...form, language: e.target.value })}
                className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="fr">Français (France)</option>
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Personnalité & Ton (System Instruction) :</label>
            <textarea
              rows={3}
              value={form.personality}
              onChange={e => setForm({ ...form, personality: e.target.value })}
              className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Voix et Synthèse */}
        <div className="p-4 rounded-2xl bg-[#0f1428] border border-slate-800/80 space-y-3">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-400" />
            Synthèse vocale & Audio
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Vitesse d'élocution : {form.voiceSpeed}x
              </label>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={form.voiceSpeed}
                onChange={e => setForm({ ...form, voiceSpeed: parseFloat(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Tonalité de la voix : {form.voicePitch}
              </label>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={form.voicePitch}
                onChange={e => setForm({ ...form, voicePitch: parseFloat(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Moteur IA & Limites */}
        <div className="p-4 rounded-2xl bg-[#0f1428] border border-slate-800/80 space-y-3">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            Moteur Gemini & Limites quotidiennes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Modèle d'IA :</label>
              <select
                value={form.model}
                onChange={e => setForm({ ...form, model: e.target.value })}
                className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Standard équilibré)</option>
                <option value="gemini-4-argon">gemini-4-argon (Raisonnement poussé)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Éco / ultra-rapide)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Plafond requêtes/jour :</label>
              <input
                type="number"
                min="10"
                max="1000"
                value={form.dailyRequestLimit}
                onChange={e => setForm({ ...form, dailyRequestLimit: parseInt(e.target.value) || 100 })}
                className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="font-medium text-slate-200 block">Mode Économique</span>
              <span className="text-[11px] text-slate-400">Minimise les tokens et privilégie les réponses courtes</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.ecoMode}
                onChange={e => setForm({ ...form, ecoMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Phase 12: Génération d'Images directement dans le Chat */}
        <div className="p-4 rounded-2xl bg-[#0f1428] border border-fuchsia-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-fuchsia-400" />
              Génération d'Images dans le Chat
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-500/40 font-mono">
              Phase 12
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            CHLOÉ détecte automatiquement les demandes de création visuelle et fait appel aux véritables moteurs d'images configurés.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Moteur d'image préféré :</label>
              <select
                value={form.imageProvider || 'auto'}
                onChange={e => setForm({ ...form, imageProvider: e.target.value as any })}
                className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="auto">Automatique (Meilleur disponible avec clé)</option>
                <option value="gemini">Google Gemini (gemini-3.1-flash-lite-image)</option>
                <option value="openai">OpenAI (DALL·E 3)</option>
                <option value="openrouter">OpenRouter (FLUX.1 Schnell / SDXL)</option>
                <option value="nvidia">NVIDIA NIM (SDXL 1.0)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Format de ratio d'aspect par défaut :</label>
              <select
                defaultValue="1:1"
                className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="1:1">Carré (1:1 - Recommandé)</option>
                <option value="16:9">Paysage (16:9)</option>
                <option value="9:16">Portrait (9:16 - Samsung S24)</option>
                <option value="4:3">Standard (4:3)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Phase 13: Apprentissage Continu & Mémoire des Compétences */}
        <div className="p-4 rounded-2xl bg-[#0f1428] border border-purple-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Apprentissage Continu & Mémoire des Compétences
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/70 text-purple-300 border border-purple-500/40 font-mono">
              Phase 13
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            CHLOÉ analyse vos conversations pour identifier et mémoriser de manière structurée les méthodes, étapes et procédures de travail que vous lui partagez.
          </p>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-medium text-slate-200 block">Apprentissage continu actif</span>
                <span className="text-[11px] text-slate-400">Détection contextuelle des nouvelles procédures et compétences réutilisables</span>
              </div>
              <input
                type="checkbox"
                checked={form.continuousLearningEnabled !== false}
                onChange={e => setForm({ ...form, continuousLearningEnabled: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-medium text-slate-200 block">Enregistrement et enrichissement automatique</span>
                <span className="text-[11px] text-slate-400">Fusionne et améliore les compétences similaires sans créer de doublons</span>
              </div>
              <input
                type="checkbox"
                checked={form.autoSaveSkills !== false}
                onChange={e => setForm({ ...form, autoSaveSkills: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded"
              />
            </label>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Bouclier de confidentialité strict :</strong> Les mots de passe, jetons d'accès, secrets et clés API ne sont <em>jamais</em> enregistrés comme compétences ou mémoires.
              </span>
            </div>
          </div>
        </div>


        {/* Bouton de sauvegarde */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-purple-950/60"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>

      {/* Section Application Android Samsung Galaxy S24 */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-800/50 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-400" />
            Application Android – Samsung Galaxy S24
          </h3>
          <span className="text-[10px] font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-600/40 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> APK Prêt
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Le paquet natif APK pour Samsung Galaxy S24 (Android 14+ / One UI 6.1) a été compilé avec succès via Gradle. Vous pouvez le télécharger directement sur votre appareil ou le compiler via GitHub Actions.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href="/CHLOE-AI-Android-v1.0.0.apk"
            download="CHLOE-AI-Android-v1.0.0.apk"
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-purple-950/60 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Télécharger CHLOE-AI-Android-v1.0.0.apk (5.0 Mo)
          </a>
          <span className="text-[11px] text-slate-400 font-mono">
            Package: ai.chloe.assistant • v1.0.0
          </span>
        </div>
      </div>

      {/* Zone Danger : RGPD Export & Effacement */}
      <div className="mt-6 p-4 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-3">
        <h3 className="font-semibold text-red-300 text-sm flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-400" />
          Données personnelles & RGPD
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Propriétaire légitime : <strong>{settings.ownerEmail}</strong> (Samsung Galaxy S24).
          Vous disposez d'un contrôle souverain sur vos informations conformément aux tests 19 et 20.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onExportData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter toutes mes données (JSON)
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm("ATTENTION : Cette action supprimera définitivement l'ensemble de votre compte, mémoires, documents et conversations. Confirmer ?")) {
                onWipeAccount();
              }
            }}
            className="bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700/60 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Supprimer tout mon compte
          </button>
        </div>
      </div>
    </div>
  );
};
