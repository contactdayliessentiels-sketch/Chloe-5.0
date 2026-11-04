import React, { useState, useRef } from 'react';
import { DocumentItem } from '../../shared/types.ts';
import {
  FileText,
  Upload,
  Trash2,
  Search,
  BookOpen,
  Layers,
  CheckCircle,
  FileCode,
  Sparkles
} from 'lucide-react';

interface DocumentsViewProps {
  documents: DocumentItem[];
  onUploadDocument: (name: string, content: string, type: string) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onAskDocument: (query: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onUploadDocument,
  onDeleteDocument,
  onAskDocument,
}) => {
  const [docQuery, setDocQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      await onUploadDocument(file.name, text, file.type || 'text/plain');
    } catch (err: any) {
      alert(`Erreur de lecture du fichier : ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Bibliothèque de Connaissances (RAG)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
              {documents.length} indexé{documents.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Système RAG : importation, découpage en passages, indexation et extraction de réponses vérifiables
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.txt,.md,.csv,.json,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/50 shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>{isUploading ? 'Indexation...' : 'Importer un document'}</span>
        </button>
      </div>

      {/* RAG Search / Ask Bar */}
      <div className="p-3.5 rounded-2xl bg-[#0f1428] border border-purple-900/30 space-y-2">
        <label className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Interroger vos documents avec CHLOÉ :
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={docQuery}
              onChange={e => setDocQuery(e.target.value)}
              placeholder="Ex : Que dit l'architecture technique sur le niveau 3 ?"
              className="w-full bg-[#12162B] text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-700/80 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={() => {
              if (docQuery.trim()) {
                onAskDocument(docQuery.trim());
              }
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shrink-0 transition-all shadow-sm"
          >
            Interroger
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map(doc => (
          <div
            key={doc.id}
            className="p-4 rounded-2xl bg-[#0e1326] border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold text-white text-sm truncate">{doc.name}</h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{doc.summary || 'Document indexé pour recherche RAG.'}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-purple-400">
                    <Layers className="w-3 h-3" />
                    {doc.chunksCount} passages indexés
                  </span>
                  <span>·</span>
                  <span>{(doc.size / 1024).toFixed(1)} Ko</span>
                  <span>·</span>
                  <span>{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                onClick={() => setPreviewDoc(doc)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Passages</span>
              </button>

              <button
                onClick={() => onDeleteDocument(doc.id)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                title="Supprimer le document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Passages Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0f1428] border border-purple-500/30 p-5 shadow-2xl text-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base truncate flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                {previewDoc.name}
              </h3>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white p-1">
                Fermer
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
              <div className="p-3 bg-purple-950/30 border border-purple-900/40 rounded-xl text-purple-200">
                <strong>Résumé automatique :</strong>
                <p className="mt-1 text-slate-300">{previewDoc.summary}</p>
              </div>

              <div>
                <strong className="text-slate-400 block mb-1">Contenu indexé :</strong>
                <pre className="p-3 bg-black/50 border border-slate-800 rounded-xl text-slate-300 font-mono text-[11px] whitespace-pre-wrap">
                  {previewDoc.content || 'Contenu extrait non affichable'}
                </pre>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onAskDocument(`Résume-moi les points essentiels du document ${previewDoc.name}`);
                  setPreviewDoc(null);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
              >
                Demander un résumé complet dans le chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
