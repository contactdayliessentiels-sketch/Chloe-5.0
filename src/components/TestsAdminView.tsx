import React, { useState } from 'react';
import { TestResult, UserSettings } from '../../shared/types.ts';
import {
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Terminal,
  FileCheck
} from 'lucide-react';

interface TestsAdminViewProps {
  tests: TestResult[];
  onRunTests: () => Promise<TestResult[]>;
  settings: UserSettings;
}

export const TestsAdminView: React.FC<TestsAdminViewProps> = ({ tests, onRunTests, settings }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTests, setCurrentTests] = useState<TestResult[]>(tests);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const handleRunAll = async () => {
    setIsRunning(true);
    try {
      const results = await onRunTests();
      setCurrentTests(results);
    } catch (e: any) {
      alert(`Erreur d'exécution des tests : ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = currentTests.filter(t => t.status === 'passed').length;
  const failedCount = currentTests.filter(t => t.status === 'failed').length;

  const filteredTests = currentTests.filter(t => {
    if (selectedFilter === 'passed') return t.status === 'passed';
    if (selectedFilter === 'failed') return t.status === 'failed';
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Espace Admin · Suite de Tests (20/20)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
              Partie 17 Officielle
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Validation rigoureuse des 20 scénarios fonctionnels et sécuritaires avec exécution réelle
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={isRunning}
          className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-950/60 disabled:opacity-50 shrink-0"
        >
          {isRunning ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Exécution de la suite...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Lancer les 20 tests</span>
            </>
          )}
        </button>
      </div>

      {/* Progress & Summary Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#101428] to-[#0a0d1a] border border-purple-900/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Résultats d'exécution :</span>
            <span className="text-emerald-400 font-bold">{passedCount} Réussi{passedCount > 1 ? 's' : ''}</span>
            {failedCount > 0 && (
              <span className="text-red-400 font-bold">· {failedCount} Échoué{failedCount > 1 ? 's' : ''}</span>
            )}
          </div>
          <span className="font-mono text-purple-300 font-bold">
            {passedCount} / {currentTests.length || 20}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${(passedCount / (currentTests.length || 20)) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Propriétaire authentifié : {settings.ownerEmail}</span>
          <span>Environnement : Samsung Galaxy S24 / Node.js</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition-colors ${
            selectedFilter === 'all'
              ? 'bg-purple-600 text-white font-semibold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Tous ({currentTests.length})
        </button>
        <button
          onClick={() => setSelectedFilter('passed')}
          className={`px-3 py-1.5 rounded-xl transition-colors ${
            selectedFilter === 'passed'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Réussis ({passedCount})
        </button>
        {failedCount > 0 && (
          <button
            onClick={() => setSelectedFilter('failed')}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              selectedFilter === 'failed'
                ? 'bg-red-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Échoués ({failedCount})
          </button>
        )}
      </div>

      {/* Tests Grid */}
      <div className="space-y-2.5">
        {filteredTests.map(test => {
          const isPassed = test.status === 'passed';
          return (
            <div
              key={test.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isPassed
                  ? 'bg-[#0e1326] border-emerald-950/60 hover:border-emerald-800/60'
                  : 'bg-[#150d18] border-red-950/60 hover:border-red-800/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isPassed ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/50 text-red-400 border border-red-800/40'
                  }`}>
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-400 font-bold text-xs">TEST {test.id}</span>
                      <h4 className="font-semibold text-white text-xs sm:text-sm truncate">{test.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 hidden sm:inline">
                        {test.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5">{test.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-[11px]">
                  {test.durationMs !== undefined && (
                    <span className="text-slate-500 font-mono text-[10px]">
                      {test.durationMs}ms
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
                    isPassed
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                      : 'bg-red-950/40 text-red-400 border-red-800/40'
                  }`}>
                    {isPassed ? 'Succès' : 'Échec'}
                  </span>
                </div>
              </div>

              {/* Details of execution */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                {test.method && (
                  <div>
                    <span className="text-slate-500 font-medium">Méthode : </span>
                    <span className="text-slate-300 font-mono text-[10px]">{test.method}</span>
                  </div>
                )}
                {test.expectedResult && (
                  <div>
                    <span className="text-slate-500 font-medium">Attendu : </span>
                    <span className="text-purple-300">{test.expectedResult}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 font-medium">Résultat réel : </span>
                  <span className={isPassed ? 'text-emerald-300' : 'text-red-300'}>
                    {test.actualResult || test.output}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
