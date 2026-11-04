import React from 'react';
import {
  MessageSquare,
  MessagesSquare,
  Brain,
  Bookmark,
  Menu,
  X,
  Link2,
  FileText,
  Workflow,
  Sparkles,
  History,
  Settings,
  Shield,
  BarChart3,
  CheckCircle2,
  Smartphone,
  Users,
  Server
} from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: number | string;
}

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  pendingApprovalsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  isMenuOpen,
  onToggleMenu,
  pendingApprovalsCount,
}) => {
  const PRIMARY_TABS: TabItem[] = [
    { id: 'chat', label: 'Accueil', icon: MessageSquare },
    { id: 'conversations', label: 'Discussions', icon: MessagesSquare },
    { id: 'skills', label: 'Compétences', icon: Brain },
    { id: 'memory', label: 'Mémoire', icon: Bookmark },
  ];

  const ALL_RUBRIQUES: TabItem[] = [
    { id: 'chat', label: '1. Accueil (Chat & IA)', icon: MessageSquare },

    { id: 'conversations', label: '2. Conversations', icon: MessagesSquare },
    { id: 'avatar', label: 'Avatar 3D & Présence Chloé', icon: Sparkles },
    { id: 'skills', label: '3. Compétences (Skills)', icon: Brain },
    { id: 'mcp', label: 'MCP Manager (Protocole)', icon: Server },
    { id: 'connectors', label: '4. Connecteurs Externes', icon: Link2 },
    { id: 'memory', label: '5. Mémoire Personnelle', icon: Bookmark },
    { id: 'documents', label: '6. Documents & RAG', icon: FileText },
    { id: 'automations', label: '7. Automatisations', icon: Workflow },
    { id: 'creativity', label: '8. Créativité & Studio', icon: Sparkles },
    { id: 'history', label: '9. Historique & Audits', icon: History },
    { id: 'settings', label: '10. Paramètres', icon: Settings },
    {
      id: 'security',
      label: '11. Sécurité (Access Control)',
      icon: Shield,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'usage', label: '12. Coûts & Utilisation', icon: BarChart3 },
    { id: 'agents', label: 'Système Multi-Agents', icon: Users },
    { id: 'tests', label: 'Espace Admin · Tests (20/20)', icon: CheckCircle2 },
  ];


  return (
    <>
      {/* Mobile Top Header (Sticky 52px) */}
      <header className="sticky top-0 z-30 bg-[#090C19]/90 backdrop-blur-md border-b border-purple-900/30 px-4 h-13 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('chat')}
            className="flex items-center gap-2 text-left"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-purple-500/40 bg-purple-950/40 shrink-0">
              <img
                src="/chloe-avatar-fullbody.webp"
                alt="CHLOÉ"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
                    target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
                  }
                }}
              />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight block">CHLOÉ AI</span>
              <span className="text-[10px] text-purple-300 font-medium block leading-none">
                Galaxy S24 Edition
              </span>
            </div>
          </button>
        </div>

        {/* Current View Indicator / Menu Trigger */}
        <div className="flex items-center gap-2">
          {pendingApprovalsCount > 0 && (
            <button
              onClick={() => onSelectTab('security')}
              className="bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg px-2 py-1 text-xs font-semibold flex items-center gap-1 animate-pulse"
            >
              <span>{pendingApprovalsCount}</span>
              <Shield className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={onToggleMenu}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 flex items-center justify-center active:scale-95 transition-all"
            title="Menu complet des rubriques"
            aria-label="Ouvrir le menu complet"
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Full 12 Rubriques Navigation Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0D1122] border-t border-purple-500/30 rounded-t-3xl max-h-[85vh] overflow-y-auto p-4 space-y-3 pb-safe shadow-2xl">
            {/* Drawer handle */}
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Menu Principal CHLOÉ</h3>
                <p className="text-xs text-slate-400">Accédez aux rubriques et au panneau avatar</p>
              </div>
              <button
                onClick={onToggleMenu}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Featured Assistant Portrait Card */}
            <div
              onClick={() => {
                onSelectTab('avatar');
                onToggleMenu();
              }}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-[#0e1224] border border-purple-500/40 flex items-center justify-between cursor-pointer hover:border-purple-400 transition-all shadow-lg active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 rounded-xl overflow-hidden bg-black/60 border border-purple-400/50 shrink-0 shadow-md">
                  <img
                    src="/chloe-avatar-fullbody.webp"
                    alt="Chloé"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
                        target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
                      }
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">CHLOÉ AI</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-medium">
                      En ligne
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-200 mt-0.5">Assistante Virtuelle Incarnée</p>
                  <p className="text-[10px] text-slate-400">3D WebGL · Synchronisation vocale</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] shadow-sm">
                Voir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">

              {ALL_RUBRIQUES.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onToggleMenu();
                    }}
                    className={`p-3 rounded-2xl flex items-center justify-between text-left transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-950/50'
                        : 'bg-[#12162B] text-slate-300 hover:bg-slate-800 border border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Samsung Galaxy S24 Fixed Bottom Thumb Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090C19]/95 backdrop-blur-md border-t border-purple-900/30 pb-safe">
        <div className="grid grid-cols-5 items-center h-15 max-w-lg mx-auto px-2">
          {PRIMARY_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-all ${
                  isActive ? 'text-purple-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-purple-950/60 border border-purple-500/40 scale-105' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              </button>
            );
          })}

          {/* 5th Tab: Plus / Rubriques Drawer Toggle */}
          <button
            onClick={onToggleMenu}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-all ${
              isMenuOpen ? 'text-purple-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isMenuOpen ? 'bg-purple-950/60 border border-purple-500/40' : ''}`}>
              <Menu className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Rubriques</span>
          </button>
        </div>
      </nav>
    </>
  );
};
