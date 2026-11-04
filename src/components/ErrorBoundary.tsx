import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CHLOÉ AI] Uncaught React rendering error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center bg-[#070913] text-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-950/40">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {this.props.fallbackTitle || 'Incident d’affichage intercepté'}
          </h2>
          <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
            CHLOÉ a sécurisé l'interface pour empêcher l'apparition d'un écran blanc. Vos conversations et mémoires sont préservées.
          </p>
          {this.state.error?.message && (
            <div className="mt-3 p-3 bg-black/60 border border-slate-800 rounded-xl max-w-md text-left overflow-x-auto text-[11px] font-mono text-amber-300/80">
              {this.state.error.message}
            </div>
          )}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-purple-950/50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Réinitialiser la vue
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-xs flex items-center gap-2 transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              Retour à l’accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
