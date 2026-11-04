import React from 'react';
import { SystemUsage, UserSettings } from '../../shared/types.ts';
import {
  BarChart3,
  Cpu,
  Coins,
  Wrench,
  HardDrive,
  AlertCircle,
  Zap,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

interface UsageViewProps {
  usage: SystemUsage;
  settings: UserSettings;
  onToggleEcoMode: (eco: boolean) => void;
}

export const UsageView: React.FC<UsageViewProps> = ({ usage, settings, onToggleEcoMode }) => {
  const percentDaily = Math.min(100, Math.round((usage.todayRequests / settings.dailyRequestLimit) * 100));

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">Coûts & Consommation</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
            Transparence totale
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Suivi précis des requêtes, tokens estimés, appels d'outils et budget
        </p>
      </div>

      {/* Daily Quota Progress Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#11172e] to-[#0a0e1c] border border-purple-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-white">Plafond quotidien d'appels Gemini</span>
          </div>
          <span className="text-xs font-mono font-bold text-purple-300">
            {usage.todayRequests} / {settings.dailyRequestLimit} ({percentDaily}%)
          </span>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              percentDaily > 85 ? 'bg-amber-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
            }`}
            style={{ width: `${percentDaily}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Réinitialisation quotidienne à 00:00 UTC</span>
          <span>Modèle actif : {settings.model}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0f1428] border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-purple-400 text-xs font-medium">
            <Cpu className="w-4 h-4" />
            <span>Tokens estimés</span>
          </div>
          <p className="text-xl font-bold font-mono text-white tabular-nums">
            {usage.estimatedTokens.toLocaleString('fr-FR')}
          </p>
          <span className="text-[10px] text-slate-500">Volume total traité</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0f1428] border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
            <Coins className="w-4 h-4" />
            <span>Coût estimé</span>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-300 tabular-nums">
            {usage.estimatedCostEur.toFixed(3)} €
          </p>
          <span className="text-[10px] text-slate-500">Tarif Gemini 3.8 Flash</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0f1428] border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-medium">
            <Wrench className="w-4 h-4" />
            <span>Outils appelés</span>
          </div>
          <p className="text-xl font-bold font-mono text-white tabular-nums">
            {usage.toolInvocations}
          </p>
          <span className="text-[10px] text-slate-500">Function calling</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0f1428] border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-medium">
            <HardDrive className="w-4 h-4" />
            <span>Stockage RAG</span>
          </div>
          <p className="text-xl font-bold font-mono text-white tabular-nums">
            {(usage.storageBytesUsed / 1024).toFixed(1)} Ko
          </p>
          <span className="text-[10px] text-slate-500">{usage.documentsIndexed} documents</span>
        </div>
      </div>

      {/* Eco Mode Card */}
      <div className="p-4 rounded-2xl bg-[#0f1428] border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">Mode Économique Actif</h4>
            <p className="text-xs text-slate-400">
              Limite la prolixité et privilégie les réponses directes pour minimiser la consommation
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={settings.ecoMode}
            onChange={e => onToggleEcoMode(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {/* Guarantee callout */}
      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/30 text-xs text-slate-400 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <p>
          CHLOÉ n'engage jamais de dépense silencieuse. Si une API externe ou un modèle requiert un abonnement ou un forfait payant, une validation explicite est exigée avant toute activation.
        </p>
      </div>
    </div>
  );
};
