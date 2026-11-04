import React from 'react';
import { PendingApproval } from '../../shared/types.ts';
import { ShieldAlert, Check, X, AlertTriangle } from 'lucide-react';

interface ApprovalModalProps {
  approval: PendingApproval;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ approval, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#0F1322] border border-amber-500/40 p-5 shadow-2xl text-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Niveau 3 · Exécution sensible
              </span>
            </div>
            <h3 className="text-base font-semibold text-white mt-1">Autorisation requise</h3>
          </div>
        </div>

        {/* Warning callout */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            CHLOÉ a préparé cette opération mais ne l'exécutera pas sans votre accord explicite.
          </p>
        </div>

        {/* Action Details */}
        <div className="space-y-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-400 font-medium">Action demandée :</span>
            <p className="font-semibold text-white text-sm mt-0.5">{approval.action}</p>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Service concerné :</span>
            <p className="text-purple-300 font-medium mt-0.5">{approval.service}</p>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Données transmises :</span>
            <pre className="mt-1 p-2 bg-black/40 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-24">
              {JSON.stringify(approval.payload, null, 2)}
            </pre>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Résultat attendu :</span>
            <p className="text-slate-300 mt-0.5">{approval.expectedResult}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onCancel}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <X className="w-4 h-4" />
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-900/30"
          >
            <Check className="w-4 h-4" />
            Confirmer l'action
          </button>
        </div>
      </div>
    </div>
  );
};
