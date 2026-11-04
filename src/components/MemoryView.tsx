import React, { useState } from 'react';
import { MemoryItem, MemoryCategory } from '../../shared/types.ts';
import {
  Bookmark,
  Search,
  Plus,
  Trash2,
  Pin,
  Tag,
  Download,
  AlertTriangle,
  X,
  Edit3
} from 'lucide-react';

interface MemoryViewProps {
  memories: MemoryItem[];
  onAddMemory: (item: Omit<MemoryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onWipeMemories: () => Promise<void>;
  onExportData: () => void;
}

const CATEGORIES: { id: MemoryCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'identity_preferences', label: 'Identité & Préférences' },
  { id: 'habits', label: 'Habitudes' },
  { id: 'projects', label: 'Projets' },
  { id: 'useful_info', label: 'Infos utiles' },
  { id: 'goals', label: 'Objectifs' },
  { id: 'reminders', label: 'Rappels' },
];

export const MemoryView: React.FC<MemoryViewProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory,
  onWipeMemories,
  onExportData,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('identity_preferences');
  const [newTags, setNewTags] = useState('');

  const filteredMemories = memories.filter(m => {
    const matchCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchQuery =
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchQuery;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    await onAddMemory({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      isPinned: false,
    });

    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setIsAddOpen(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Mémoire personnelle</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
              {memories.length} souvenirs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ce que CHLOÉ sait sur vos préférences et habitudes avec contrôle total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportData}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-2.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            title="Exporter les données (RGPD)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exporter</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/50"
          >
            <Plus className="w-4 h-4" />
            Ajouter un souvenir
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher dans la mémoire..."
          className="w-full bg-[#101426] text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 border border-slate-800 focus:outline-none focus:border-purple-500 placeholder-slate-500"
        />
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium text-xs transition-colors shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Memories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredMemories.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-[#0d1122] rounded-2xl border border-slate-800/60 text-slate-400 text-xs">
            Aucun souvenir trouvé dans cette catégorie.
          </div>
        ) : (
          filteredMemories.map(m => (
            <div
              key={m.id}
              className="p-4 rounded-2xl bg-[#0f1428] border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2.5"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-purple-400 shrink-0" />
                    <h3 className="font-semibold text-white text-sm">{m.title}</h3>
                  </div>
                  {m.isPinned && (
                    <span className="p-1 text-purple-400" title="Épinglé">
                      <Pin className="w-3.5 h-3.5 fill-current" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {m.content}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex flex-wrap gap-1">
                  {m.tags.map((t, idx) => (
                    <span key={idx} className="bg-slate-800/80 text-purple-300 px-1.5 py-0.5 rounded text-[10px]">
                      #{t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => onDeleteMemory(m.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                  title="Oublier ce souvenir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Wipe All Memories Caution Bar */}
      <div className="p-3 rounded-2xl bg-red-950/20 border border-red-900/30 flex items-center justify-between text-xs text-red-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>Droit à l'oubli intégral : effacer tous les souvenirs de CHLOÉ</span>
        </div>
        <button
          onClick={() => {
            if (confirm("Voulez-vous vraiment effacer tous les souvenirs enregistrés ? Cette action est irréversible.")) {
              onWipeMemories();
            }
          }}
          className="bg-red-900/40 hover:bg-red-800/50 text-red-200 border border-red-700/50 px-2.5 py-1 rounded-lg font-medium transition-colors"
        >
          Purger tout
        </button>
      </div>

      {/* Add Memory Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f1428] border border-purple-500/30 p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-purple-400" />
                Nouveau souvenir pour CHLOÉ
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Titre de l'information :</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex : Restaurant italien préféré"
                  className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Catégorie :</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as MemoryCategory)}
                  className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="identity_preferences">Identité & Préférences</option>
                  <option value="habits">Habitudes</option>
                  <option value="projects">Projets</option>
                  <option value="useful_info">Informations utiles</option>
                  <option value="goals">Objectifs</option>
                  <option value="reminders">Rappels</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Détails à retenir :</label>
                <textarea
                  required
                  rows={3}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Ex : J'adore les pâtes fraîches à la truffe et la pizzeria Luigi à Paris."
                  className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Mots-clés (séparés par virgules) :</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="cuisine, italien, paris"
                  className="w-full bg-[#12162B] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
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
