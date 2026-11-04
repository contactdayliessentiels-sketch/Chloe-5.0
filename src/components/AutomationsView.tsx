import React, { useState } from 'react';
import { AutomationTask, AccessLevel } from '../../shared/types.ts';
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  FileCode,
  X
} from 'lucide-react';

interface AutomationsViewProps {
  automations: AutomationTask[];
  onToggleStatus: (id: string, status: 'active' | 'paused') => Promise<void>;
  onRunAutomation: (id: string) => Promise<{ success: boolean; message: string }>;
  onCreateAutomation: (data: Omit<AutomationTask, 'id' | 'userId' | 'executionCount' | 'logs'>) => Promise<void>;
}

export const AutomationsView: React.FC<AutomationsViewProps> = ({
  automations,
  onToggleStatus,
  onRunAutomation,
  onCreateAutomation,
}) => {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerDetail, setTriggerDetail] = useState('');
  const [conditions, setConditions] = useState('');
  const [action, setAction] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('LEVEL_2_PREPARATION');

  const handleRun = async (id: string) => {
    setRunningId(id);
    setFeedback(null);
    try {
      const res = await onRunAutomation(id);
      setFeedback(res.message);
    } catch (e: any) {
      setFeedback(`Erreur : ${e.message}`);
    } finally {
      setRunningId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !action) return;

    await onCreateAutomation({
      name,
      description,
      trigger: 'schedule',
      triggerDetail: triggerDetail || 'Quotidien',
      conditions: conditions || 'Actif',
      action,
      accessLevel,
      status: 'active',
    });

    setIsModalOpen(false);
    setName('');
    setDescription('');
    setTriggerDetail('');
    setConditions('');
    setAction('');
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Automatisations & Workflows</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
              {automations.filter(a => a.status === 'active').length} Actifs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Orchestration de scénarios avec conditions, journalisation et barrière de sécurité Niveau 3
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/50 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouveau workflow
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Automations list */}
      <div className="space-y-3.5">
        {automations.map(auto => {
          const isActive = auto.status === 'active';

          return (
            <div
              key={auto.id}
              className={`p-4 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-[#0f1428] border-purple-900/40'
                  : 'bg-[#0a0d1a] border-slate-800/60 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Workflow className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{auto.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{auto.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    isActive
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isActive ? 'Actif' : 'En pause'}
                  </span>
                </div>
              </div>

              {/* Workflow details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">1. Déclencheur</span>
                  <p className="text-slate-300 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-purple-400" />
                    {auto.triggerDetail}
                  </p>
                </div>

                <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">2. Conditions</span>
                  <p className="text-slate-300 truncate font-medium">{auto.conditions}</p>
                </div>

                <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">3. Action & Niveau</span>
                  <p className="text-slate-300 truncate font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3 text-indigo-400" />
                    {auto.accessLevel.replace('LEVEL_', 'Niv. ')}
                  </p>
                </div>
              </div>

              {/* Action content */}
              <div className="mt-2.5 p-2 rounded-lg bg-slate-900/60 text-xs text-slate-300 flex items-center justify-between">
                <span className="truncate pr-2">Action : {auto.action}</span>
                <span className="text-[10px] text-slate-500 shrink-0">{auto.executionCount} exécutions</span>
              </div>

              {/* Footer controls & logs */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onToggleStatus(auto.id, isActive ? 'paused' : 'active')}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 py-1 px-2 rounded-lg transition-colors"
                >
                  {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isActive ? 'Mettre en pause' : 'Réactiver'}</span>
                </button>

                <button
                  onClick={() => handleRun(auto.id)}
                  disabled={runningId === auto.id}
                  className="bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{runningId === auto.id ? 'Exécution...' : 'Lancer maintenant'}</span>
                </button>
              </div>

              {/* Execution log snippet */}
              {auto.logs && auto.logs.length > 0 && (
                <div className="mt-2 text-[10px] font-mono text-slate-400 bg-black/40 p-2 rounded-lg border border-slate-800">
                  {auto.logs[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Automation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f1428] border border-purple-500/30 p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Workflow className="w-4 h-4 text-purple-400" />
                Créer un nouveau workflow
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nom du workflow :</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex : Récapitulatif hebdomadaire"
                  className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description :</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Objectif de la tâche"
                  className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Déclencheur (Horaire ou événement) :</label>
                <input
                  type="text"
                  required
                  value={triggerDetail}
                  onChange={e => setTriggerDetail(e.target.value)}
                  placeholder="Ex : Tous les vendredis à 18:00"
                  className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Action à accomplir :</label>
                <textarea
                  required
                  rows={2}
                  value={action}
                  onChange={e => setAction(e.target.value)}
                  placeholder="Ex : Compiler les documents créés et générer une synthèse"
                  className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Niveau d'accès requis :</label>
                <select
                  value={accessLevel}
                  onChange={e => setAccessLevel(e.target.value as AccessLevel)}
                  className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="LEVEL_1_CONSULTATION">Niveau 1 (Consultation / Lecture)</option>
                  <option value="LEVEL_2_PREPARATION">Niveau 2 (Préparation / Brouillon)</option>
                  <option value="LEVEL_3_EXECUTION">Niveau 3 (Exécution avec confirmation)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-white transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
