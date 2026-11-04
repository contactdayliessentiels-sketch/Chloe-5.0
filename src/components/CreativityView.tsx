import React, { useState } from 'react';
import {
  Sparkles,
  Lightbulb,
  Feather,
  Share2,
  Palette,
  Film,
  Send,
  ArrowRight
} from 'lucide-react';

interface CreativityViewProps {
  onStartCreativeChat: (prompt: string) => void;
}

const TEMPLATES = [
  {
    icon: Lightbulb,
    title: 'Brainstorming de projets',
    desc: 'Explorer des angles novateurs, des modèles économiques et des plans d’action pour une idée.',
    prompt: 'Aide-moi à faire un brainstorming stratégique et novateur sur mon nouveau projet. Pose-moi 3 questions clés puis propose 5 pistes concrètes.',
  },
  {
    icon: Feather,
    title: 'Récits & Scénarios',
    desc: 'Écriture d’histoires captivantes, dialogues percutants et structures narratives rythmées.',
    prompt: 'Rédige un scénario court et immersif mettant en scène un dialogue intelligent et plein de suspense entre deux protagonistes.',
  },
  {
    icon: Share2,
    title: 'Contenus Réseaux Sociaux',
    desc: 'Publications LinkedIn percutantes, accroches Twitter/X et storytelling engageant.',
    prompt: 'Prépare 3 variations de publications percutantes pour LinkedIn et Twitter/X sur le futur des assistants personnels intelligents.',
  },
  {
    icon: Palette,
    title: 'Concepts Visuels & Design',
    desc: 'Descriptions riches de maquettes, palettes de couleurs harmonieuses et identités de marque.',
    prompt: 'Conçois une identité visuelle complète (couleurs, typographies, ambiance et règles ergonomiques) pour une application mobile haut de gamme.',
  },
];

export const CreativityView: React.FC<CreativityViewProps> = ({ onStartCreativeChat }) => {
  const [customPrompt, setCustomPrompt] = useState('');

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">Studio Créatif</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
            CHLOÉ Creative
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Génération d'idées, rédaction narrative, pitchs percutants et concepts visuels
        </p>
      </div>

      {/* Quick Prompt Input */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 space-y-3">
        <label className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Votre projet créatif du moment :
        </label>
        <textarea
          rows={3}
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          placeholder="Ex : Imagine une campagne de lancement percutante pour un produit tech écoresponsable..."
          className="w-full bg-[#12162B] border border-purple-900/50 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (customPrompt.trim()) {
                onStartCreativeChat(customPrompt.trim());
              }
            }}
            disabled={!customPrompt.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/60"
          >
            <span>Créer avec CHLOÉ</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Creative Templates */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          Modèles d'inspiration rapide :
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((tmpl, idx) => {
            const Icon = tmpl.icon;
            return (
              <div
                key={idx}
                onClick={() => onStartCreativeChat(tmpl.prompt)}
                className="p-4 rounded-2xl bg-[#0f1428] border border-slate-800/80 hover:border-purple-500/50 hover:bg-[#121730] transition-all cursor-pointer flex flex-col justify-between group space-y-2.5"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-semibold text-white text-sm group-hover:text-purple-200 transition-colors">
                      {tmpl.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {tmpl.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-purple-400 font-medium pt-2 border-t border-slate-800/60">
                  <span>Lancer dans le chat</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
