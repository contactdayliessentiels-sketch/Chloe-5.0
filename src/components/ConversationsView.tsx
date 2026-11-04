import React from 'react';
import { Conversation } from '../../shared/types.ts';
import { MessageSquare, Plus, Trash2, Calendar, ChevronRight } from 'lucide-react';

interface ConversationsViewProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export const ConversationsView: React.FC<ConversationsViewProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
}) => {
  const convList = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Conversations</h2>
          <p className="text-xs text-slate-400">Historique des sessions avec CHLOÉ</p>
        </div>
        <button
          onClick={onCreateConversation}
          className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/50"
        >
          <Plus className="w-4 h-4" />
          Nouvelle discussion
        </button>
      </div>

      {convList.length === 0 ? (
        <div className="p-8 text-center bg-[#101426] border border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">Aucune conversation enregistrée</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Démarrez une nouvelle session avec CHLOÉ pour discuter, dicter ou partager des fichiers depuis votre terminal Android.
          </p>
          <button
            onClick={onCreateConversation}
            className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/50"
          >
            <Plus className="w-4 h-4" />
            Créer ma première discussion
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {convList.map(conv => {
            const isActive = conv && conv.id === activeConversationId;
            if (!conv) return null;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-purple-950/40 border-purple-500/50 shadow-md shadow-purple-950/30'
                    : 'bg-[#101426] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-purple-200' : 'text-slate-200'}`}>
                      {conv.title || 'Discussion sans titre'}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString('fr-FR') : 'Aujourd’hui'}
                      </span>
                      <span>·</span>
                      <span>{conv.messageCount || 0} message{(conv.messageCount || 0) > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {convList.length > 1 && (
                    <button
                      onClick={() => onDeleteConversation(conv.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Supprimer la conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
