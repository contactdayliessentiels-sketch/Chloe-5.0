import React from 'react';
import { PendingApproval, ConnectorConfig, UserSettings } from '../../shared/types.ts';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileKey,
  Smartphone
} from 'lucide-react';

interface SecurityViewProps {
  approvals: PendingApproval[];
  connectors: ConnectorConfig[];
  settings: UserSettings;
  onOpenApproval: (approval: PendingApproval) => void;
  onResolveApproval: (id: string, approve: boolean) => Promise<void>;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  approvals,
  connectors,
  settings,
  onOpenApproval,
  onResolveApproval,
}) => {
  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">CHLOÉ Access Control</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
            Sécurité Niveau 1-2-3
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Gouvernance stricte des autorisations, validation des actions sensibles et protection anti-injection
        </p>
      </div>

      {/* 3 Access Levels Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0e1326] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">NIVEAU 1</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Lecture</span>
          </div>
          <h4 className="font-semibold text-white text-sm">Consultation</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Lecture des informations autorisées, recherche sémantique, calculs et réponses analytiques sans modification.
          </p>
          <div className="pt-2 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Accès autorisé sans blocage
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1326] border border-purple-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300">NIVEAU 2</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300">Préparation</span>
          </div>
          <h4 className="font-semibold text-white text-sm">Simulation & Brouillon</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Rédaction d'un email, planification d'un rendez-vous ou préparation de code. Rien n'est envoyé ou déployé.
          </p>
          <div className="pt-2 text-[10px] text-purple-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Isolation sandbox active
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-950/30 to-[#0e1326] border border-amber-600/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">NIVEAU 3</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300">Exécution</span>
          </div>
          <h4 className="font-semibold text-white text-sm">Action Sensible</h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Envoi d'un email, modification d'agenda, suppression de données, publication ou partage d'informations.
          </p>
          <div className="pt-2 text-[10px] text-amber-400 font-semibold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Confirmation obligatoire préalable
          </div>
        </div>
      </div>

      {/* Pending Level 3 Approvals List */}
      <div className="p-4 rounded-2xl bg-[#0f1428] border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Demandes d'autorisation Niveau 3 en attente
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-400 border border-amber-800/40">
            {pendingApprovals.length} en attente
          </span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
            Aucune action sensible n'est actuellement en attente d'approbation.
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingApprovals.map(appr => (
              <div
                key={appr.id}
                className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{appr.action}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700">
                      {appr.service}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1">{appr.expectedResult}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onResolveApproval(appr.id, false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => onResolveApproval(appr.id, true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-950/50"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Malicious Instructions & Prompt Injection Shield */}
      <div className="p-4 rounded-2xl bg-[#0f1428] border border-slate-800/80 space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400" />
          Bouclier contre les instructions malveillantes (Prompt Injection)
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Les pages Web externes, documents importés et courriels sont traités comme des flux de données non fiables.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Impossible d'altérer les consignes maîtresses de CHLOÉ</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Aucune fuite possible de clé d'API vers le navigateur</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Validation d'action par code serveur, jamais sur décision du LLM seul</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Isolation hermétique des données pour {settings.ownerEmail}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
