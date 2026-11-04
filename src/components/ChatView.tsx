import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  UserSettings,
  PendingApproval
} from '../../shared/types.ts';
import {
  Send,
  Mic,
  MicOff,
  Camera,
  Paperclip,
  Globe,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  Wrench,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Sliders,
  UserCheck,
  Download,
  RefreshCw,
  Edit3,
  BookmarkCheck,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle,
  Layout,
  Maximize2,
  MessageSquare
} from 'lucide-react';

import { AvatarPresence } from './avatar/AvatarPresence.tsx';
import { AvatarControlsModal } from './avatar/AvatarControlsModal.tsx';
import { useAvatarState } from '../hooks/useAvatarState.ts';
import { speechLipSync } from '../services/speechLipSync.ts';

/**
 * Clean markdown content parser:
 * Formats **bold**, *italic*, `code`, - bullet points, 1. numbered lists, and paragraph breaks.
 */
function renderFormattedContent(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const parseInline = (lineText: string, keyPrefix: string): React.ReactNode[] => {
    // Matches **bold**, *italic*, and `code`
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const parts = lineText.split(regex);

    return parts.map((part, idx) => {
      const k = `${keyPrefix}-${idx}`;
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return <strong key={k} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return <em key={k} className="text-purple-200 not-italic font-medium">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code key={k} className="px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 font-mono text-[12px] border border-purple-500/30">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={k}>{part}</span>;
    });
  };

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-1.5 space-y-1 pl-1">
          {currentList.items.map((it, idx) => (
            <li key={idx} className="flex items-start gap-2 text-slate-200 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
              <div className="flex-1 leading-relaxed">{it}</div>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-1.5 space-y-1 pl-1">
          {currentList.items.map((it, idx) => (
            <li key={idx} className="flex items-start gap-2 text-slate-200 text-sm">
              <span className="text-purple-400 font-mono text-xs font-semibold shrink-0 mt-0.5">{idx + 1}.</span>
              <div className="flex-1 leading-relaxed">{it}</div>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Bullet list: - or *
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(parseInline(bulletMatch[1], `li-${lineIdx}`));
      return;
    }

    // Numbered list: 1. or 2.
    const numMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(parseInline(numMatch[1], `num-${lineIdx}`));
      return;
    }

    flushList();

    if (!trimmed) {
      elements.push(<div key={`sp-${lineIdx}`} className="h-1.5" />);
      return;
    }

    elements.push(
      <p key={`p-${lineIdx}`} className="leading-relaxed">
        {parseInline(line, `p-${lineIdx}`)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

interface ChatViewProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string, image?: string, enableSearch?: boolean) => Promise<void>;
  settings: UserSettings;
  approvals: PendingApproval[];
  onOpenApproval: (approval: PendingApproval) => void;
  onSelectTab: (tabId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  loading,
  onSendMessage,
  settings,
  approvals,
  onOpenApproval,
  onSelectTab,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchEnabled, setSearchEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [isAvatarControlsOpen, setIsAvatarControlsOpen] = useState(false);
  const [chatLayout, setChatLayout] = useState<'stage' | 'immersive' | 'compact'>(() => {
    try {
      const saved = localStorage.getItem('chloe_chat_layout_mode');
      if (saved === 'stage' || saved === 'immersive' || saved === 'compact') return saved;
    } catch {}
    return 'stage';
  });

  const handleLayoutChange = (mode: 'stage' | 'immersive' | 'compact') => {
    setChatLayout(mode);
    try {
      localStorage.setItem('chloe_chat_layout_mode', mode);
    } catch {}
  };

  const messageList = Array.isArray(messages) ? messages : [];
  const approvalList = Array.isArray(approvals) ? approvals : [];

  // Hook for avatar virtual presence synchronization
  const avatar = useAvatarState({
    isListening: isListening || isHoldingMic,
    isLoading: loading,
    isSpeaking,
    hasError: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');
  const isStartingRef = useRef<boolean>(false);
  const pressStartTimeRef = useRef<number>(0);
  const latestTranscriptRef = useRef<string>('');
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageList.length, loading]);

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = settings.language === 'en' ? 'en-US' : 'fr-FR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isStartingRef.current = false;
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscripts = '';
        let interim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscripts += res[0]?.transcript || '';
          } else {
            interim += res[0]?.transcript || '';
          }
        }

        const sessionText = (finalTranscripts + (interim ? ' ' + interim : '')).trim();
        setInterimTranscript(interim.trim());

        const base = baseTextRef.current.trim();
        const full = base ? (sessionText ? `${base} ${sessionText}` : base) : sessionText;
        setInputText(full);
        latestTranscriptRef.current = full;
      };

      recognition.onerror = (event: any) => {
        console.warn('[CHLOÉ Voice] Événement d’erreur vocale:', event?.error);
        isStartingRef.current = false;
        setIsListening(false);
        setIsHoldingMic(false);
        setInterimTranscript('');

        if (event?.error === 'not-allowed') {
          setSpeechError("Accès au microphone refusé. Veuillez autoriser le microphone dans votre navigateur.");
        } else if (event?.error === 'no-speech') {
          // No speech detected, quietly reset
        } else if (event?.error === 'audio-capture') {
          setSpeechError("Aucun microphone actif détecté sur cet appareil.");
        } else if (event?.error === 'network') {
          setSpeechError("Erreur réseau du service vocal.");
        }
      };

      recognition.onend = () => {
        isStartingRef.current = false;
        setIsListening(false);
        setIsHoldingMic(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('[CHLOÉ Voice] Initialisation SpeechRecognition:', err);
    }

    return () => {
      try {
        if (autoSendTimeoutRef.current) {
          clearTimeout(autoSendTimeoutRef.current);
        }
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      } catch {
        // ignore cleanup abort error
      }
    };
  }, [settings.language]);

  const startListening = () => {
    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("La reconnaissance vocale Web Speech n'est pas supportée sur ce navigateur. Vous pouvez utiliser le clavier ou la dictée vocale de votre système.");
      return;
    }

    if (!recognitionRef.current) return;

    try {
      baseTextRef.current = inputText;
      setInterimTranscript('');
      latestTranscriptRef.current = inputText;
      isStartingRef.current = true;
      recognitionRef.current.start();
    } catch (err: any) {
      isStartingRef.current = false;
      if (err?.name === 'InvalidStateError') {
        setIsListening(true);
      } else {
        console.error('[CHLOÉ Voice] Erreur démarrage écoute :', err);
        setSpeechError("Impossible de démarrer la reconnaissance vocale. Réessayez dans un instant.");
      }
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (err) {
      console.warn('[CHLOÉ Voice] Erreur arrêt écoute :', err);
    }
    setIsListening(false);
    setInterimTranscript('');
    isStartingRef.current = false;
  };

  const toggleListening = () => {
    if (isListening || isStartingRef.current) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Push-to-Talk (PTT) Pointer Handlers
  const handleMicPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }

    pressStartTimeRef.current = Date.now();
    setIsHoldingMic(true);

    if (!isListening) {
      startListening();
    }
  };

  const handleMicPointerUp = async () => {
    if (!isHoldingMic) return;
    const holdDuration = Date.now() - pressStartTimeRef.current;
    setIsHoldingMic(false);

    // If held for longer than 350ms, this is a Push-to-Talk release -> auto-send query to Chloé!
    if (holdDuration > 350) {
      stopListening();

      autoSendTimeoutRef.current = setTimeout(async () => {
        const textToSend = latestTranscriptRef.current.trim() || inputText.trim();
        if (textToSend) {
          setInputText('');
          setSelectedImage(null);
          setInterimTranscript('');
          latestTranscriptRef.current = '';
          await onSendMessage(textToSend, selectedImage || undefined, searchEnabled);
        }
      }, 260);
    } else {
      // Short click: standard toggle
      if (isListening) {
        stopListening();
      }
    }
  };

  const handleMicPointerCancel = () => {
    if (isHoldingMic) {
      setIsHoldingMic(false);
      stopListening();
    }
  };

  // Text-To-Speech (Web Speech Synthesis with dynamic lip-sync)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      speechLipSync.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    speechLipSync.stopSpeaking();
    const cleanText = text.replace(/[*_#`\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = settings.language === 'en' ? 'en-US' : 'fr-FR';
    utterance.rate = settings.voiceSpeed || 1.0;
    utterance.pitch = settings.voicePitch || 1.05;

    // Apply voice expressivity to dynamic lip-sync engine
    if (settings.voiceExpressivity !== undefined) {
      speechLipSync.setExpressivity(settings.voiceExpressivity);
    }

    // Pick selected voice or fallback to language preference
    const voices = window.speechSynthesis.getVoices();
    if (settings.voiceUri && voices.length > 0) {
      const match = voices.find(v => v.voiceURI === settings.voiceUri);
      if (match) utterance.voice = match;
    } else {
      const frenchVoice =
        voices.find(v => v.lang.startsWith('fr') && /female|femme|amelie|julie|hortense|celia/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }
    }

    // Connect real-time lip-sync to the utterance
    speechLipSync.attachUtterance(utterance, cleanText);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      speechLipSync.stopSpeaking();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      speechLipSync.stopSpeaking();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || loading) return;

    const text = inputText.trim();
    const img = selectedImage || undefined;

    setInputText('');
    setSelectedImage(null);
    setInterimTranscript('');
    if (isListening) {
      stopListening();
    }

    await onSendMessage(text, img, searchEnabled);
  };

  const toggleToolExpand = (msgId: string) => {
    setExpandedTools(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Check if side panel layout should be active on wide desktop
  const isSideModeActive = avatar.preferences.mode === 'side';

  return (
    <div className="flex flex-col h-full bg-[#070913] text-slate-100 relative overflow-hidden">
      {/* Streamlined Top Bar with View Mode Switcher */}
      <div className="border-b border-purple-900/30 bg-gradient-to-b from-[#0e1224] to-[#070913] px-3 sm:px-4 py-2 shrink-0 z-20">
        <div className="flex items-center justify-between gap-2">
          {/* Assistant Info & State Pill */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsAvatarControlsOpen(true)}
              className="relative group text-left cursor-pointer focus:outline-none shrink-0"
              title="Ajuster la présence virtuelle de CHLOÉ"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-purple-500/40 shadow-md bg-purple-950/40 transition-transform group-hover:scale-105">
                <img
                  src="/chloe-avatar-fullbody.webp"
                  alt="Avatar de CHLOÉ"
                  className="w-full h-full object-cover [object-position:50%_12%]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
                      target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
                    }
                  }}
                />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#070913] ${
                  avatar.state === 'listening'
                    ? 'bg-cyan-400 animate-ping'
                    : avatar.state === 'speaking'
                    ? 'bg-fuchsia-400 animate-pulse'
                    : avatar.state === 'thinking'
                    ? 'bg-purple-400 animate-pulse'
                    : 'bg-emerald-500'
                }`}
              />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                  {settings.assistantName} AI
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 rounded bg-purple-600/30 text-purple-300 border border-purple-500/30 shrink-0">
                  S24
                </span>
              </div>
              <p className="text-[10px] text-purple-300/80 truncate">
                {avatar.state === 'listening' ? 'À votre écoute' :
                 avatar.state === 'speaking' ? 'Lecture vocale en cours' :
                 avatar.state === 'thinking' ? 'Réflexion IA' :
                 'Présence active · 10 compétences'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons & Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Segmented Switch */}
            <div className="flex items-center gap-0.5 bg-[#12162e]/90 p-0.5 rounded-xl border border-purple-900/40 text-[11px]">
              <button
                type="button"
                onClick={() => handleLayoutChange('stage')}
                className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                  chatLayout === 'stage'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-purple-200'
                }`}
                title="Mode Scène 3D : Chloé toujours visible en haut sans être masquée"
              >
                <Layout className="w-3 h-3" />
                <span className="hidden sm:inline">Scène 3D</span>
                <span className="sm:hidden">Scène</span>
              </button>
              <button
                type="button"
                onClick={() => handleLayoutChange('immersive')}
                className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                  chatLayout === 'immersive'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-purple-200'
                }`}
                title="Mode Immersion : Chloé en arrière-plan plein écran"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Immersion</span>
              </button>
              <button
                type="button"
                onClick={() => handleLayoutChange('compact')}
                className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                  chatLayout === 'compact'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-purple-200'
                }`}
                title="Mode Discussions : Texte prioritaire"
              >
                <MessageSquare className="w-3 h-3" />
                <span className="hidden sm:inline">Chat</span>
              </button>
            </div>

            {/* Quick Avatar Controls Button */}
            <button
              onClick={() => setIsAvatarControlsOpen(true)}
              className="text-xs bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 rounded-xl p-1.5 sm:px-2 sm:py-1.5 flex items-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Ajuster la présence et les réglages de CHLOÉ"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline font-medium text-[11px]">Présence</span>
            </button>
          </div>
        </div>

        {/* Pending approvals alert badge */}
        {approvalList.filter(a => a.status === 'pending').length > 0 && (
          <div className="mt-2 p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Action Niveau 3 en attente de validation</span>
            </div>
            <button
              onClick={() => {
                const pending = approvalList.find(a => a.status === 'pending');
                if (pending) onOpenApproval(pending);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-2 py-0.5 rounded text-[11px] transition-colors"
            >
              Vérifier
            </button>
          </div>
        )}
      </div>

      {/* Main Conversation & Avatar Composition Area */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Dedicated 3D Stage (Visible and completely unblocked) */}
        {chatLayout === 'stage' && avatar.preferences.enabled && (
          <div className="h-[34vh] sm:h-[38vh] min-h-[220px] max-h-[350px] shrink-0 border-b md:border-b-0 md:border-r border-purple-900/40 md:w-80 lg:w-96 md:h-full relative bg-gradient-to-b from-[#0c0f24] via-[#080b18] to-[#060812] flex items-center justify-center overflow-hidden">
            <AvatarPresence
              state={avatar.state}
              preferences={avatar.preferences}
              onOpenControls={() => setIsAvatarControlsOpen(true)}
              isStage={true}
              className="w-full h-full"
            />

            {/* Stage Live Status Chip */}
            <div className="absolute top-2.5 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/70 backdrop-blur-md border border-purple-500/30 text-[11px] text-purple-200 shadow-md pointer-events-none">
              <span className={`w-2 h-2 rounded-full ${
                avatar.state === 'listening' ? 'bg-cyan-400 animate-ping' :
                avatar.state === 'speaking' ? 'bg-fuchsia-400 animate-pulse' :
                avatar.state === 'thinking' ? 'bg-purple-400 animate-pulse' :
                'bg-emerald-400'
              }`} />
              <span className="font-medium">
                {avatar.state === 'listening' ? 'Écoute active...' :
                 avatar.state === 'speaking' ? 'Lecture vocale...' :
                 avatar.state === 'thinking' ? 'Réflexion IA...' :
                 'CHLOÉ attentive'}
              </span>
            </div>

            {/* Stage Quick Settings */}
            <div className="absolute top-2.5 right-3 z-20 flex items-center gap-1">
              <button
                onClick={() => setIsAvatarControlsOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 backdrop-blur-md border border-purple-500/30 text-[11px] text-purple-200 flex items-center gap-1 shadow-md transition-all active:scale-95"
                title="Paramètres de présence de Chloé"
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-medium hidden xs:inline">Réglages</span>
              </button>
            </div>
          </div>
        )}

        {/* Background Fullscreen Presence (When user chooses Immersion mode) */}
        {chatLayout === 'immersive' && avatar.preferences.enabled && (
          <div className={`absolute inset-0 z-0 pointer-events-none flex items-end justify-center pb-12 sm:pb-16 overflow-hidden ${isSideModeActive ? 'md:hidden' : ''}`}>
            <AvatarPresence
              state={avatar.state}
              preferences={avatar.preferences}
              onOpenControls={() => setIsAvatarControlsOpen(true)}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Side Panel Layout (When user explicitly chooses side mode on desktop) */}
        {isSideModeActive && avatar.preferences.enabled && chatLayout !== 'stage' && (
          <div className="hidden md:flex w-72 lg:w-80 shrink-0 border-r border-purple-900/30 bg-[#090d1c]/80 backdrop-blur-md z-10 flex-col items-center justify-center p-4">
            <AvatarPresence
              state={avatar.state}
              preferences={avatar.preferences}
              onOpenControls={() => setIsAvatarControlsOpen(true)}
              isSidePanel={true}
              className="w-full"
            />
            <div className="mt-4 text-center px-4">
              <h3 className="font-semibold text-white text-xs">{settings.assistantName} AI</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Assistante personnelle connectée</p>
            </div>
          </div>
        )}

        {/* Message Stream (Foreground Layer) */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-4 py-3.5 space-y-3.5 relative z-10 min-h-0 bg-[#070913]/90">
          {messageList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-xl shadow-purple-950/50">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Bonjour, je suis CHLOÉ.
              </h2>
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                Votre assistante personnelle intelligente. Posez une question, dictez vocalement ou partagez une photo depuis votre Samsung Galaxy S24.
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center pt-1.5 max-w-md">
                {[
                  'Fais-moi un point sur mes rendez-vous',
                  'Génère une synthèse de mes notes',
                  'Planifie ma journée avec un rappel',
                  'Aide-moi à rédiger un email'
                ].map((sugg, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(sugg, undefined, searchEnabled)}
                    className="text-[11px] bg-[#121733]/90 hover:bg-[#1c234a] text-purple-200 border border-purple-500/25 rounded-xl px-2.5 py-1 transition-all shadow-sm active:scale-95"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messageList.map(msg => {
            const isUser = msg.role === 'user';
            const isExpanded = !!expandedTools[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
              >
                <div
                  className={`flex gap-2.5 max-w-[92%] sm:max-w-[85%] ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl overflow-hidden border border-purple-500/30 bg-purple-950/40 shrink-0 mt-1 shadow-md">
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
                  )}

                  <div
                    className={`rounded-2xl p-3.5 text-sm backdrop-blur-md ${
                      isUser
                        ? 'bg-gradient-to-r from-purple-700/90 to-indigo-700/90 text-white shadow-lg shadow-purple-950/30 rounded-tr-sm border border-purple-400/20'
                        : 'bg-[#101426]/90 border border-slate-800/90 text-slate-200 shadow-xl shadow-black/40 rounded-tl-sm'
                    }`}
                  >
                    {/* Images if attached or generated */}
                    {msg.images && msg.images.length > 0 && (
                      <div className="mb-3 space-y-2.5">
                        {msg.images.map((img, idx) => (
                          <div key={idx} className="relative group rounded-2xl overflow-hidden border border-purple-500/30 bg-black/40 shadow-xl">
                            <img
                              src={img}
                              alt="Visuel CHLOÉ"
                              className="max-h-72 w-full object-contain rounded-2xl"
                            />
                            {/* Action toolbar for generated images */}
                            {!isUser && (
                              <div className="p-2 bg-[#090d1f]/95 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                                <span className="text-purple-300 font-medium flex items-center gap-1">
                                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                                  <span>{msg.imageGeneration?.model || 'Image IA'}</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <a
                                    href={img}
                                    download={`chloe-image-${Date.now()}.png`}
                                    className="px-2 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-200 flex items-center gap-1 transition-all"
                                    title="Télécharger l'image"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Télécharger</span>
                                  </a>
                                  <button
                                    onClick={() => onSendMessage(`Régénère une variante de cette image : ${msg.imageGeneration?.prompt || 'création visuelle'}`)}
                                    className="px-2 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-200 flex items-center gap-1 transition-all"
                                    title="Générer une nouvelle variante"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Régénérer</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setInputText(`Modifie cette image pour : `);
                                      setSelectedImage(img);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-200 flex items-center gap-1 transition-all"
                                    title="Demander une modification"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Modifier</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Text with rich markdown rendering */}
                    <div className="leading-relaxed">
                      {renderFormattedContent(msg.content)}
                    </div>

                    {/* Learned Skill Card (Continuous Learning) */}
                    {msg.learnedSkill && (
                      <div className="mt-3 p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-between text-xs text-purple-200 shadow-md">
                        <div className="flex items-center gap-2">
                          <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-white block">
                              {msg.learnedSkill.action === 'created' ? '💡 Nouvelle compétence mémorisée' : '💡 Compétence enrichie'} :
                            </span>
                            <span className="text-[11px] text-purple-300">{msg.learnedSkill.name}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onSelectTab('skills')}
                          className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] flex items-center gap-1 transition-colors shrink-0"
                          title="Consulter la fiche Skill"
                        >
                          <span>Consulter</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}


                    {/* Tool Invocations Badge / Expansion */}
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                        <button
                          onClick={() => toggleToolExpand(msg.id)}
                          className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 font-medium"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>
                            {msg.toolsUsed.length} outil{msg.toolsUsed.length > 1 ? 's' : ''} exécuté{msg.toolsUsed.length > 1 ? 's' : ''}
                          </span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 text-[11px] font-mono bg-black/50 p-2 rounded-lg border border-purple-500/20">
                            {msg.toolsUsed.map((t, idx) => (
                              <div key={idx} className="border-b border-slate-800/80 pb-1 last:border-none last:pb-0">
                                <span className="text-purple-400 font-semibold">{t.name}</span>
                                {t.args && (
                                  <p className="text-slate-400 truncate">Args: {JSON.stringify(t.args)}</p>
                                )}
                                {t.result && (
                                  <p className="text-emerald-300 truncate">Résultat: {JSON.stringify(t.result)}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sources from Google Grounding */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800 text-xs">
                        <p className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-cyan-400" />
                          Sources vérifiées :
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:underline bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded"
                            >
                              <span className="truncate max-w-[140px]">{src.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Approval Button if attached */}
                    {msg.approvalId && (
                      <div className="mt-3 pt-2">
                        <button
                          onClick={() => {
                            const a = approvalList.find(x => x.id === msg.approvalId);
                            if (a) onOpenApproval(a);
                          }}
                          className="w-full py-1.5 px-3 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Examiner la confirmation Niveau 3
                        </button>
                      </div>
                    )}

                    {/* Actions Bar (Voice synthesis, timestamp) */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'À l’instant'}</span>

                      {!isUser && (
                        <button
                          onClick={() => speakText(msg.content)}
                          className="p-1 hover:text-purple-300 text-slate-400 transition-colors"
                          title="Écouter la réponse oralement"
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-purple-300 bg-[#11162B]/90 backdrop-blur-md border border-purple-500/30 p-3 rounded-2xl w-fit shadow-lg shadow-purple-950/30">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>CHLOÉ réfléchit et prépare sa réponse...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Image Preview Bar */}
      {selectedImage && (
        <div className="px-4 py-2 bg-[#0c1020] border-t border-purple-900/30 flex items-center gap-3 z-20">
          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-purple-500/40">
            <img src={selectedImage} alt="Aperçu" className="w-full h-full object-cover" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px]"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-300">
            Image prête à être envoyée. Posez votre question sur cette photo.
          </p>
        </div>
      )}

      {/* Speech Recognition Error Notice */}
      {speechError && (
        <div className="px-4 py-2 bg-red-950/90 border-t border-red-500/40 flex items-center justify-between text-xs text-red-200 z-20 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">{speechError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSpeechError(null)}
            className="p-1 hover:text-white text-red-300 ml-2 shrink-0 transition-colors"
            title="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Voice Listening Bar with Animated Audio Wave */}
      {isListening && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-purple-950/95 via-fuchsia-950/90 to-purple-950/95 border-t border-fuchsia-500/40 flex items-center justify-between text-xs text-purple-100 backdrop-blur-md z-20 shadow-lg shadow-purple-950/60">
          <div className="flex items-center gap-3 min-w-0">
            {/* Animated Audio Equalizer Bars */}
            <div className="flex items-end gap-1 h-5 shrink-0 px-1">
              <span className="w-1 bg-cyan-400 rounded-full animate-pulse h-3.5" />
              <span className="w-1 bg-fuchsia-400 rounded-full animate-bounce h-5" />
              <span className="w-1 bg-purple-400 rounded-full animate-pulse h-3" />
              <span className="w-1 bg-cyan-300 rounded-full animate-bounce h-4" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 font-medium text-white">
                <span>CHLOÉ vous écoute...</span>
                <span className="text-[10px] text-fuchsia-300/90 uppercase font-semibold tracking-wider px-1.5 py-0.2 rounded bg-fuchsia-900/40 border border-fuchsia-500/30">
                  {settings.language === 'en' ? 'EN-US' : 'FR-FR'}
                </span>
              </div>
              <p className="text-[11px] text-purple-200/90 truncate mt-0.5">
                {interimTranscript ? `« ${interimTranscript} »` : 'Parlez clairement à votre micro, vos paroles sont transcrites en temps réel.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={stopListening}
              className="text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 px-2.5 py-1 rounded-xl font-medium transition-colors"
              title="Terminer la dictée vocale"
            >
              Terminer
            </button>
            {inputText.trim() && (
              <button
                type="button"
                onClick={handleSubmit}
                className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-2.5 py-1 rounded-xl font-medium shadow-md transition-all flex items-center gap-1"
                title="Envoyer la requête dictée à CHLOÉ"
              >
                <Send className="w-3 h-3" />
                <span>Envoyer</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Push-to-Talk Active HUD Overlay */}
      {isHoldingMic && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-red-950/95 via-fuchsia-950/95 to-purple-950/95 border-t border-fuchsia-400/60 flex items-center justify-between text-xs text-white backdrop-blur-md z-30 shadow-2xl animate-pulse">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="font-semibold text-fuchsia-200 shrink-0">Push-to-Talk :</span>
            <span className="text-slate-200 truncate">Parlez à CHLOÉ... Relâchez le bouton pour envoyer directement.</span>
          </div>
          <span className="text-[10px] text-fuchsia-300 font-mono uppercase px-2 py-0.5 rounded bg-fuchsia-900/50 border border-fuchsia-500/40 shrink-0 ml-2">
            Relâcher = Envoyer
          </span>
        </div>
      )}

      {/* Samsung Galaxy S24 Thumb Ergonomic Input Area */}
      <div className="border-t border-purple-900/30 bg-[#090C19]/95 backdrop-blur-md px-3 py-2.5 pb-safe z-20">
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,.pdf,.txt,.md,.docx,.csv"
          onChange={handleImageUpload}
          className="hidden"
        />

        <form onSubmit={handleSubmit} className="flex items-end gap-1.5">
          {/* Quick Action Buttons Group */}
          <div className="flex items-center gap-0.5 pb-1">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-purple-300 hover:bg-purple-950/40 active:scale-95 transition-all"
              title="Prendre une photo avec l'appareil photo du S24"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-purple-300 hover:bg-purple-950/40 active:scale-95 transition-all"
              title="Joindre un fichier ou image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSearchEnabled(prev => !prev)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                searchEnabled
                  ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={searchEnabled ? 'Recherche Google Search activée' : 'Recherche désactivée'}
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={isListening ? 'Dictée en cours...' : 'Écrivez à CHLOÉ ou activez le micro...'}
              rows={1}
              className="w-full bg-[#12162B] text-slate-100 placeholder-slate-500 text-sm rounded-2xl px-3.5 py-2.5 border border-slate-700/60 focus:outline-none focus:border-purple-500 resize-none max-h-24 leading-snug"
            />
          </div>

          {/* Voice-to-Text Microphone Button (Web Speech Recognition API with Push-to-Talk) */}
          <button
            type="button"
            onPointerDown={handleMicPointerDown}
            onPointerUp={handleMicPointerUp}
            onPointerCancel={handleMicPointerCancel}
            onPointerLeave={handleMicPointerCancel}
            onClick={() => {
              if (Date.now() - pressStartTimeRef.current < 350) {
                toggleListening();
              }
            }}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center active:scale-95 transition-all shrink-0 relative select-none touch-manipulation ${
              isHoldingMic
                ? 'bg-gradient-to-br from-red-500 via-fuchsia-500 to-indigo-600 text-white shadow-xl shadow-red-900/80 ring-4 ring-fuchsia-400 scale-110'
                : isListening
                ? 'bg-gradient-to-br from-red-500 via-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-950/70 ring-2 ring-fuchsia-400/80 ring-offset-2 ring-offset-[#090C19]'
                : 'bg-slate-800/80 hover:bg-purple-950/60 text-slate-300 hover:text-purple-300 border border-slate-700/60 shadow-sm'
            }`}
            title={
              isHoldingMic
                ? 'Push-to-Talk en cours... Relâchez pour envoyer le message'
                : isListening
                ? 'Écoute active (Cliquez pour arrêter)'
                : 'Maintenez enfoncé pour Push-to-Talk (ou cliquez pour dicter)'
            }
            aria-label="Microphone Push-to-Talk CHLOÉ"
          >
            {isHoldingMic ? (
              <>
                <Mic className="w-4 h-4 animate-bounce text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              </>
            ) : isListening ? (
              <>
                <MicOff className="w-4 h-4 animate-pulse text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              </>
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || loading}
            className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-purple-950/60 shrink-0"
            title="Envoyer le message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Avatar Customization Modal / Drawer */}
      <AvatarControlsModal
        isOpen={isAvatarControlsOpen}
        onClose={() => setIsAvatarControlsOpen(false)}
        preferences={avatar.preferences}
        onUpdatePreferences={avatar.updatePreferences}
        currentState={avatar.state}
        onPreviewState={avatar.triggerStatePreview}
        onClearPreview={avatar.clearPreview}
        isOverridden={avatar.isOverridden}
      />
    </div>
  );
};
