import React, { useState } from 'react';
import { ConnectorConfig, ConnectorStatus } from '../../shared/types.ts';
import {
  Link2,
  Mail,
  Calendar,
  HardDrive,
  Database,
  MessageCircle,
  Music,
  Globe2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Settings,
  Sparkles,
  ShieldCheck,
  X,
  Cpu
} from 'lucide-react';

interface ConnectorsViewProps {
  connectors: ConnectorConfig[];
  onTestConnector: (id: string) => Promise<{ success: boolean; message: string }>;
  onUpdateConnector: (id: string, updates: Partial<ConnectorConfig>) => Promise<void>;
}

const CONNECTOR_ICONS: Record<string, React.FC<{ className?: string }>> = {
  gemini: Cpu,
  google: Link2,
  gmail: Mail,
  calendar: Calendar,
  drive: HardDrive,
  firebase: Database,
  whatsapp: MessageCircle,
  spotify: Music,
  custom_api: Globe2,
};

const STATUS_BADGES: Record<ConnectorStatus, { label: string; bg: string; text: string; border: string }> = {
  connected_and_tested: {
    label: 'Connecté & Testé',
    bg: 'bg-emerald-950/50',
    text: 'text-emerald-300',
    border: 'border-emerald-600/50',
  },
  configured_untested: {
    label: 'Configuré (Non testé)',
    bg: 'bg-blue-950/50',
    text: 'text-blue-300',
    border: 'border-blue-600/50',
  },
  simulation: {
    label: 'Simulation / Sandbox',
    bg: 'bg-purple-950/50',
    text: 'text-purple-300',
    border: 'border-purple-600/50',
  },
  expired: {
    label: 'Jeton Expiré',
    bg: 'bg-amber-950/50',
    text: 'text-amber-300',
    border: 'border-amber-600/50',
  },
  not_configured: {
    label: 'Non configuré',
    bg: 'bg-slate-900',
    text: 'text-slate-400',
    border: 'border-slate-700/60',
  },
  error: {
    label: 'Erreur',
    bg: 'bg-red-950/50',
    text: 'text-red-300',
    border: 'border-red-600/50',
  },
};

export const ConnectorsView: React.FC<ConnectorsViewProps> = ({
  connectors,
  onTestConnector,
  onUpdateConnector,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string; success: boolean } | null>(null);
  const [modalConnector, setModalConnector] = useState<ConnectorConfig | null>(null);

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await onTestConnector(id);
      setTestResult({ id, message: res.message, success: res.success });
    } catch (e: any) {
      setTestResult({ id, message: e.message || 'Erreur lors du test', success: false });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">Connector Manager</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
            {connectors.filter(c => c.status === 'connected_and_tested').length} Testés & Actifs
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Vérité des statuts d’intégration : distinction stricte entre connecté & testé, sandbox et non configuré
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {connectors.map(c => {
          const Icon = CONNECTOR_ICONS[c.id] || Link2;
          const badge = STATUS_BADGES[c.status] || STATUS_BADGES.not_configured;

          return (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-800/80 bg-[#0e1326] p-4 transition-all hover:border-slate-700 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{c.name}</h3>
                    <p className="text-[11px] font-mono text-slate-400">Auth: {c.authType}</p>
                  </div>
                </div>

                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                  {badge.label}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {c.description}
              </p>

              {/* Health message */}
              {c.healthMessage && (
                <div className="p-2 rounded-lg bg-black/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">{c.healthMessage}</span>
                </div>
              )}

              {/* Permissions */}
              <div className="flex flex-wrap gap-1 text-[10px]">
                {c.permissions.map((p, idx) => (
                  <span key={idx} className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                    {p}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setModalConnector(c)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Détails & S24</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(c.id)}
                    disabled={testingId === c.id}
                    className="bg-purple-950/50 hover:bg-purple-900/50 text-purple-200 border border-purple-500/40 text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1 disabled:opacity-40 transition-colors shadow-sm"
                  >
                    <Play className="w-3 h-3" />
                    <span>{testingId === c.id ? 'Test...' : 'Tester le flux'}</span>
                  </button>
                </div>
              </div>

              {/* Test feedback */}
              {testResult && testResult.id === c.id && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                    : 'bg-red-950/40 text-red-300 border border-red-800/40'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Guide & Configuration Modal for Samsung Galaxy S24 */}
      {modalConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f1428] border border-purple-500/30 p-5 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400" />
                Détails du connecteur : {modalConnector.name}
              </h3>
              <button
                onClick={() => setModalConnector(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold">Statut réel :</span>
                <p className="font-bold text-white">{modalConnector.status.toUpperCase()}</p>
                <p className="text-slate-400 text-[11px]">{modalConnector.healthMessage}</p>
              </div>

              {modalConnector.id === 'whatsapp' && (
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                  <p className="font-semibold text-emerald-300">Configuration WhatsApp Cloud API (Mobile S24) :</p>
                  <p>1. Rendez-vous sur <code>developers.facebook.com</code> depuis Google Chrome sur votre téléphone.</p>
                  <p>2. Créez une app Meta Business et activez le produit WhatsApp.</p>
                  <p>3. Enregistrez un numéro de téléphone d'entreprise compatible.</p>
                </div>
              )}

              {modalConnector.id === 'spotify' && (
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                  <p className="font-semibold text-emerald-300">Configuration Spotify Web API (Mobile S24) :</p>
                  <p>1. Rendez-vous sur <code>developer.spotify.com/dashboard</code>.</p>
                  <p>2. Obtenez votre Client ID et configurez la redirection vers CHLOÉ.</p>
                  <p>3. Activez le flux OAuth PKCE pour une sécurité totale sans exposer le secret.</p>
                </div>
              )}

              {modalConnector.id === 'custom_api' && (
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                  <p className="font-semibold text-cyan-300">Filtre anti-SSRF serveur :</p>
                  <p>Les requêtes vers les adresses locales (`127.0.0.1`, `localhost`) et réseaux privés (`10.x`, `192.168.x`) sont strictement bloquées par le serveur pour protéger l'infrastructure.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setModalConnector(null)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-white text-xs transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
