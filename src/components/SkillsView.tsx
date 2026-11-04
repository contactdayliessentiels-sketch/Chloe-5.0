import React, { useState } from 'react';
import { SkillConfig, SkillCategory, AgentInfo, AgentId, AccessLevel } from '../../shared/types.ts';
import {
  Brain,
  Mic,
  Eye,
  Bookmark,
  Globe,
  Code2,
  Workflow,
  FileText,
  Languages,
  Sparkles,
  CheckCircle,
  Play,
  Shield,
  Layers,
  Settings2,
  Plus,
  Trash2,
  Copy,
  Edit,
  BarChart2,
  Search,
  Filter,
  AlertTriangle,
  History,
  Lock,
  Cpu,
  Clock,
  ExternalLink
} from 'lucide-react';

interface SkillsViewProps {
  skills: SkillConfig[];
  onToggleSkill: (id: string, enabled: boolean) => Promise<void>;
  onTestSkill: (id: string) => Promise<{ success: boolean; message: string }>;
  onCreateSkill: (skill: Partial<SkillConfig>) => Promise<SkillConfig>;
  onUpdateSkill: (id: string, updates: Partial<SkillConfig>) => Promise<SkillConfig>;
  onDeleteSkill: (id: string) => Promise<void>;
  onDuplicateSkill: (id: string) => Promise<SkillConfig>;
  agents?: AgentInfo[];
}

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  reasoning: 'Raisonnement',
  coding: 'Programmation',
  developer: 'Programmation',
  search: 'Recherche Internet',
  web_search: 'Recherche Internet',
  files: 'Analyse de fichiers',
  documents: 'Analyse de fichiers',
  creativity: 'Créativité',
  creative: 'Créativité',
  multimodal: 'Multimodal',
  vision: 'Vision',
  audio: 'Audio et voix',
  voice: 'Audio et voix',
  automation: 'Automatisation',
  memory: 'Mémoire',
  communication: 'Communication',
  custom: 'Personnalisé',
};

const SKILL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  brain: Brain,
  code: Code2,
  search: Globe,
  file: FileText,
  sparkles: Sparkles,
  mic: Mic,
  eye: Eye,
  workflow: Workflow,
  bookmark: Bookmark,
  languages: Languages,
  reasoning: Brain,
  developer: Code2,
  web_search: Globe,
  documents: FileText,
  creative: Sparkles,
  voice: Mic,
  vision: Eye,
  automation: Workflow,
  memory: Bookmark,
  translation: Languages,
};

export const SkillsView: React.FC<SkillsViewProps> = ({
  skills,
  onToggleSkill,
  onTestSkill,
  onCreateSkill,
  onUpdateSkill,
  onDeleteSkill,
  onDuplicateSkill,
  agents = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string; success: boolean } | null>(null);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillConfig | null>(null);
  const [statsSkill, setStatsSkill] = useState<SkillConfig | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<SkillCategory>('custom');
  const [formIcon, setFormIcon] = useState('sparkles');
  const [formSystemPrompt, setFormSystemPrompt] = useState('');
  const [formUserPromptTemplate, setFormUserPromptTemplate] = useState('');
  const [formRecommendedModel, setFormRecommendedModel] = useState('gemini-3.8-flash');
  const [formCompatibleApis, setFormCompatibleApis] = useState('gemini, openai, nvidia, openrouter');
  const [formAllowedAgents, setFormAllowedAgents] = useState<AgentId[]>(['chloe_orchestrator', 'dev_agent']);
  const [formAccessLevel, setFormAccessLevel] = useState<AccessLevel>('LEVEL_1_CONSULTATION');
  const [formRateLimitDaily, setFormRateLimitDaily] = useState<number>(200);
  const [formPermissions, setFormPermissions] = useState('READ_ONLY');

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await onTestSkill(id);
      setTestResult({ id, message: res.message, success: res.success });
    } catch (e: any) {
      setTestResult({ id, message: e.message || 'Erreur lors du test', success: false });
    } finally {
      setTestingId(null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSkill(null);
    setFormName('');
    setFormId('');
    setFormDescription('');
    setFormCategory('custom');
    setFormIcon('sparkles');
    setFormSystemPrompt('Vous êtes une compétence spécialisée de CHLOÉ AI. Exécutez la tâche avec rigueur et précision.');
    setFormUserPromptTemplate('{{input}}');
    setFormRecommendedModel('gemini-3.8-flash');
    setFormCompatibleApis('gemini, openai, nvidia, openrouter');
    setFormAllowedAgents(['chloe_orchestrator', 'dev_agent']);
    setFormAccessLevel('LEVEL_1_CONSULTATION');
    setFormRateLimitDaily(200);
    setFormPermissions('READ_ONLY');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (skill: SkillConfig) => {
    setEditingSkill(skill);
    setFormName(skill.name);
    setFormId(skill.id);
    setFormDescription(skill.description);
    setFormCategory(skill.category || 'custom');
    setFormIcon(skill.icon || 'brain');
    setFormSystemPrompt(skill.systemPrompt || '');
    setFormUserPromptTemplate(skill.userPromptTemplate || '');
    setFormRecommendedModel(skill.recommendedModel || 'gemini-3.8-flash');
    setFormCompatibleApis((skill.compatibleApis || ['gemini']).join(', '));
    setFormAllowedAgents(skill.allowedAgents || ['chloe_orchestrator']);
    setFormAccessLevel(skill.accessLevel || 'LEVEL_1_CONSULTATION');
    setFormRateLimitDaily(skill.rateLimitDaily || 200);
    setFormPermissions((skill.permissions || []).join(', '));
    setIsModalOpen(true);
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<SkillConfig> = {
      name: formName.trim() || 'Nouvelle Compétence',
      description: formDescription.trim(),
      category: formCategory,
      icon: formIcon,
      systemPrompt: formSystemPrompt.trim(),
      userPromptTemplate: formUserPromptTemplate.trim(),
      recommendedModel: formRecommendedModel,
      compatibleApis: formCompatibleApis.split(',').map(s => s.trim()).filter(Boolean),
      allowedAgents: formAllowedAgents,
      accessLevel: formAccessLevel,
      rateLimitDaily: Number(formRateLimitDaily) || 200,
      permissions: formPermissions.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (editingSkill) {
      await onUpdateSkill(editingSkill.id, payload);
    } else {
      payload.id = formId.trim() || `skill_${Date.now()}`;
      payload.isCustom = true;
      payload.enabled = true;
      payload.dependencies = [];
      await onCreateSkill(payload);
    }
    setIsModalOpen(false);
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeCount = skills.filter(s => s.enabled).length;
  const customCount = skills.filter(s => s.isCustom).length;

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24 text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Skill Manager Personnalisable
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/70 text-purple-300 border border-purple-500/30 font-medium">
              {activeCount} / {skills.length} Actives
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Créez, modifiez, dupliquez et contrôlez sans limite les compétences IA de CHLOÉ (10 natives protégées + personnalisées).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ajouter une compétence</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#0f1428] border border-purple-900/40 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-medium block">Total compétences</span>
          <span className="text-lg font-bold text-white mt-0.5 block">{skills.length}</span>
        </div>
        <div className="bg-[#0f1428] border border-purple-900/40 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-medium block">Compétences système</span>
          <span className="text-lg font-bold text-indigo-400 mt-0.5 block">10 natives</span>
        </div>
        <div className="bg-[#0f1428] border border-purple-900/40 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-medium block">Compétences custom</span>
          <span className="text-lg font-bold text-purple-300 mt-0.5 block">{customCount} créées</span>
        </div>
        <div className="bg-[#0f1428] border border-purple-900/40 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-medium block">Capacité maximale</span>
          <span className="text-xs font-mono text-cyan-300 mt-1.5 block">Illimitée (100+)</span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher une compétence par nom, ID ou description..."
            className="w-full pl-9 pr-3 py-2 bg-[#0b0e1c] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white font-medium'
                : 'bg-[#0f1428] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Toutes ({skills.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const count = skills.filter(s => s.category === key).length;
            if (count === 0 && key !== 'custom') return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1 rounded-lg shrink-0 transition-colors ${
                  selectedCategory === key
                    ? 'bg-purple-600 text-white font-medium'
                    : 'bg-[#0f1428] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredSkills.map(skill => {
          const Icon = SKILL_ICONS[skill.icon || skill.id] || SKILL_ICONS[skill.id] || Brain;
          const isSystem = !skill.isCustom;

          return (
            <div
              key={skill.id}
              className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                skill.enabled
                  ? 'bg-[#0f1428] border-purple-900/40 shadow-sm'
                  : 'bg-[#0a0d1a] border-slate-800/60 opacity-75'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      skill.enabled
                        ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/40 text-purple-300'
                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-white text-sm truncate">{skill.name}</h3>
                        {isSystem ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/40 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Natif
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-700/40 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-purple-400/90 truncate">{skill.id}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={skill.enabled}
                      onChange={e => onToggleSkill(skill.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-2">
                  {skill.description}
                </p>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-indigo-400" />
                    {skill.accessLevel.replace('LEVEL_', 'Niv. ')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-900/40">
                    {skill.usageCount} appels
                  </span>
                  {skill.category && (
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/40">
                      {CATEGORY_LABELS[skill.category] || skill.category}
                    </span>
                  )}
                  {skill.recommendedModel && (
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 text-cyan-300 border border-slate-700/40 font-mono">
                      {skill.recommendedModel}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(skill)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Modifier la compétence"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDuplicateSkill(skill.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition-colors"
                    title="Dupliquer la compétence"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setStatsSkill(skill)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                    title="Statistiques & Historique"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                  </button>

                  {!isSystem && (
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer la compétence personnalisée "${skill.name}" ?`)) {
                          onDeleteSkill(skill.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                      title="Supprimer la compétence"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleTest(skill.id)}
                  disabled={testingId === skill.id || !skill.enabled}
                  className="bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 disabled:opacity-40 transition-colors"
                >
                  <Play className="w-3 h-3" />
                  <span>{testingId === skill.id ? 'Test...' : 'Tester'}</span>
                </button>
              </div>

              {/* Test Result Feedback */}
              {testResult && testResult.id === skill.id && (
                <div className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                    : 'bg-red-950/40 text-red-300 border border-red-800/40'
                }`}>
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD / EDIT SKILL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-[#0b0e1c] border border-purple-900/50 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                {editingSkill ? `Modifier : ${editingSkill.name}` : 'Créer une nouvelle compétence'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSaveSkill} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nom de la compétence *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ex: Analyse Financière, Scraping Pro..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {!editingSkill && (
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Identifiant unique (ID) *</label>
                    <input
                      type="text"
                      value={formId}
                      onChange={e => setFormId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                      placeholder="Ex: custom_finance, custom_scra..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description détaillée</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Rôle, compétences spécifiques et livrables attendus..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Catégorie</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as SkillCategory)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catId, catLabel]) => (
                      <option key={catId} value={catId}>{catLabel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Icône</label>
                  <select
                    value={formIcon}
                    onChange={e => setFormIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="brain">Brain (Cerveau)</option>
                    <option value="code">Code (Programmation)</option>
                    <option value="search">Search (Recherche)</option>
                    <option value="sparkles">Sparkles (Créativité)</option>
                    <option value="file">File (Documents)</option>
                    <option value="workflow">Workflow (Automatisation)</option>
                    <option value="mic">Mic (Audio)</option>
                    <option value="eye">Eye (Vision)</option>
                    <option value="bookmark">Bookmark (Mémoire)</option>
                    <option value="languages">Languages (Traduction)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Instructions Système Spécifiques</label>
                <textarea
                  rows={3}
                  value={formSystemPrompt}
                  onChange={e => setFormSystemPrompt(e.target.value)}
                  placeholder="Directives système pour l'IA lors de l'exécution de cette compétence..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Modèle IA Recommandé</label>
                  <select
                    value={formRecommendedModel}
                    onChange={e => setFormRecommendedModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recommandé - Rapide)</option>
                    <option value="gemini-3.5-pro">Gemini 3.5 Pro (Raisonnement Complexe)</option>
                    <option value="gpt-4o">OpenAI GPT-4o</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="nvidia/llama-3.1-nemotron-70b-instruct">NVIDIA Llama 3.1 70B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Niveau de Permission</label>
                  <select
                    value={formAccessLevel}
                    onChange={e => setFormAccessLevel(e.target.value as AccessLevel)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="LEVEL_1_CONSULTATION">Niveau 1 : Lecture seule / Auto</option>
                    <option value="LEVEL_2_PREPARATION">Niveau 2 : Confirmation recommandée</option>
                    <option value="LEVEL_3_EXECUTION">Niveau 3 : Validation explicite requise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Agents autorisés à utiliser cette compétence</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  {agents.map(agent => {
                    const checked = formAllowedAgents.includes(agent.id);
                    return (
                      <button
                        type="button"
                        key={agent.id}
                        onClick={() => {
                          setFormAllowedAgents(prev =>
                            checked ? prev.filter(x => x !== agent.id) : [...prev, agent.id]
                          );
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                          checked
                            ? 'bg-purple-900/60 text-purple-200 border-purple-500/50'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700'
                        }`}
                      >
                        {agent.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md shadow-purple-900/40"
                >
                  {editingSkill ? 'Enregistrer les modifications' : 'Créer la compétence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STATS & HISTORY */}
      {statsSkill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#0b0e1c] border border-purple-900/50 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                Statistiques & Historique : {statsSkill.name}
              </h3>
              <button onClick={() => setStatsSkill(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">Exécutions</span>
                <span className="text-base font-bold text-white block mt-0.5">{statsSkill.usageCount}</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">Taux de succès</span>
                <span className="text-base font-bold text-emerald-400 block mt-0.5">
                  {statsSkill.stats?.successCalls !== undefined && statsSkill.usageCount > 0
                    ? `${Math.round((statsSkill.stats.successCalls / statsSkill.usageCount) * 100)}%`
                    : '100%'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">Latence moy.</span>
                <span className="text-base font-bold text-purple-300 block mt-0.5">
                  {statsSkill.stats?.avgLatencyMs || 340}ms
                </span>
              </div>
            </div>

            {/* History List */}
            <div className="overflow-y-auto flex-1 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Dernières exécutions :</span>
              {(!statsSkill.history || statsSkill.history.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                  Aucun appel récent enregistré pour cette compétence.
                </div>
              ) : (
                statsSkill.history.map((item, idx) => (
                  <div key={item.id || idx} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                        item.status === 'success' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.latencyMs || 0}ms</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Agent : {item.agentId || 'Système'}</span>
                      <span>{new Date(item.timestamp).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setStatsSkill(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
