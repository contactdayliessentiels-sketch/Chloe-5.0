import React, { useState } from 'react';
import { ActivityLog } from '../../shared/types.ts';
import {
  History,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Search
} from 'lucide-react';

interface HistoryViewProps {
  logs: ActivityLog[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ logs }) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(log => {
    const matchLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.agent.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchStatus && matchSearch;
  });

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">Journal d'Activité & Audit</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {logs.length} événements
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Traçabilité intégrale des décisions, appels d’outils et validations de sécurité
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrer les événements..."
            className="w-full bg-[#101426] text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-800 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="bg-[#101426] text-slate-300 border border-slate-800 rounded-xl px-2.5 py-2 focus:outline-none"
          >
            <option value="all">Tous niveaux</option>
            <option value="LEVEL_1_CONSULTATION">Niveau 1 (Consultation)</option>
            <option value="LEVEL_2_PREPARATION">Niveau 2 (Préparation)</option>
            <option value="LEVEL_3_EXECUTION">Niveau 3 (Exécution)</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#101426] text-slate-300 border border-slate-800 rounded-xl px-2.5 py-2 focus:outline-none"
          >
            <option value="all">Tous statuts</option>
            <option value="success">Succès</option>
            <option value="warning">Avertissement</option>
            <option value="error">Erreur</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      {/* Logs Feed */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-[#0d1122] rounded-2xl border border-slate-800/60 text-slate-400 text-xs">
            Aucun événement ne correspond aux filtres.
          </div>
        ) : (
          filteredLogs.map(log => {
            const isLevel3 = log.level === 'LEVEL_3_EXECUTION';
            const isError = log.status === 'error';
            const isWarning = log.status === 'warning';

            return (
              <div
                key={log.id}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors ${
                  isError
                    ? 'bg-red-950/20 border-red-900/40 text-red-200'
                    : isLevel3
                    ? 'bg-amber-950/20 border-amber-800/40 text-slate-200'
                    : 'bg-[#0e1326] border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isError ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : isLevel3 ? (
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">{log.action}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/40 text-purple-300 border border-slate-700">
                        {log.agent}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5 truncate">{log.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 sm:self-center self-end shrink-0">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400">
                    {log.level.replace('LEVEL_', 'Niv. ')}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
