import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobalAvatar } from '../context/AvatarContext.tsx';
import {
  MessageSquare,
  Sparkles,
  Mic,
  Volume2,
  X,
  Move,
  Maximize2,
  Minimize2,
  ChevronRight,
  Eye,
  Bot
} from 'lucide-react';

interface FloatingAvatarProps {
  onOpenChat: () => void;
  onOpenAvatarStudio: () => void;
  currentTab: string;
  assistantName?: string;
}

const STORAGE_KEY_POS = 'chloe_floating_avatar_pos_v2';
const STORAGE_KEY_VISIBILITY = 'chloe_floating_avatar_visible';

export const FloatingAvatar: React.FC<FloatingAvatarProps> = ({
  onOpenChat,
  onOpenAvatarStudio,
  currentTab,
  assistantName = 'CHLOÉ',
}) => {
  const { state, preferences } = useGlobalAvatar();
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VISIBILITY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });
  const hasMovedRef = useRef(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom right with safe margins for Galaxy S24 and desktop
  useEffect(() => {
    const initPos = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_POS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (
            typeof parsed.x === 'number' &&
            typeof parsed.y === 'number' &&
            parsed.x >= 0 &&
            parsed.y >= 0
          ) {
            const clampedX = Math.min(Math.max(12, parsed.x), window.innerWidth - 76);
            const clampedY = Math.min(Math.max(12, parsed.y), window.innerHeight - 100);
            setPosition({ x: clampedX, y: clampedY });
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load floating avatar position:', e);
      }

      // Default placement: middle right edge (well above bottom input bars and keyboards)
      const defaultX = Math.max(16, window.innerWidth - 76);
      const defaultY = Math.max(90, Math.floor(window.innerHeight * 0.35));
      setPosition({ x: defaultX, y: defaultY });
    };

    initPos();

    const handleResize = () => {
      setPosition(prev => {
        if (prev.x < 0) return prev;
        return {
          x: Math.min(Math.max(12, prev.x), window.innerWidth - 76),
          y: Math.min(Math.max(12, prev.y), window.innerHeight - 100),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save visibility preference
  const toggleVisibility = useCallback((visible: boolean) => {
    setIsVisible(visible);
    try {
      localStorage.setItem(STORAGE_KEY_VISIBILITY, String(visible));
    } catch {
      // ignore
    }
  }, []);

  // Pointer drag start
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with primary mouse button or touch
    if (e.button !== 0) return;
    
    // Prevent dragging if interacting with popup buttons
    if ((e.target as HTMLElement).closest('.floating-menu-action')) return;

    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };

    if (nodeRef.current) {
      nodeRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.hypot(dx, dy) > 4) {
      hasMovedRef.current = true;
    }

    const nextX = dragStartRef.current.posX + dx;
    const nextY = dragStartRef.current.posY + dy;

    // Constrain inside viewport with 12px padding
    const clampedX = Math.min(Math.max(12, nextX), window.innerWidth - 76);
    const clampedY = Math.min(Math.max(12, nextY), window.innerHeight - 100);

    setPosition({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (nodeRef.current && nodeRef.current.hasPointerCapture(e.pointerId)) {
      nodeRef.current.releasePointerCapture(e.pointerId);
    }

    if (hasMovedRef.current) {
      // Snap to closest screen edge horizontally if close enough (< 48px)
      let finalX = position.x;
      const snapThreshold = 48;
      if (position.x < snapThreshold) {
        finalX = 14;
      } else if (window.innerWidth - (position.x + 64) < snapThreshold) {
        finalX = window.innerWidth - 76;
      }

      const finalPos = { x: finalX, y: position.y };
      setPosition(finalPos);
      try {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(finalPos));
      } catch {
        // ignore
      }
    } else {
      // Short tap without move: toggle menu
      setIsMenuOpen(prev => !prev);
    }
  };

  // State metadata for badges and visual effects
  const getStateInfo = () => {
    switch (state) {
      case 'listening':
        return {
          label: 'À votre écoute',
          statusColor: 'bg-cyan-400',
          glowRing: 'ring-cyan-400 ring-opacity-80 shadow-cyan-500/50',
          icon: Mic,
          pulse: true,
        };
      case 'thinking':
        return {
          label: 'Réflexion...',
          statusColor: 'bg-purple-400',
          glowRing: 'ring-purple-400 ring-opacity-80 shadow-purple-500/50',
          icon: Sparkles,
          pulse: true,
        };
      case 'speaking':
        return {
          label: 'Parle...',
          statusColor: 'bg-fuchsia-400',
          glowRing: 'ring-fuchsia-400 ring-opacity-90 shadow-fuchsia-500/60',
          icon: Volume2,
          pulse: true,
        };
      case 'happy':
      case 'greeting':
        return {
          label: 'Bienvenue !',
          statusColor: 'bg-emerald-400',
          glowRing: 'ring-emerald-400 ring-opacity-80 shadow-emerald-500/50',
          icon: Sparkles,
          pulse: false,
        };
      default:
        return {
          label: 'En ligne',
          statusColor: 'bg-emerald-500',
          glowRing: 'ring-purple-500/50 shadow-purple-950/70',
          icon: Bot,
          pulse: false,
        };
    }
  };

  const stateInfo = getStateInfo();

  // On chat and avatar studio tabs, Chloé is already prominently rendered as the centerpiece of the view.
  // Floating overlay is active across ALL other tabs (Conversations, Skills, MCP, Connectors, Memory, Documents, Settings, etc.)
  if (currentTab === 'chat' || currentTab === 'avatar') {
    return null;
  }

  // If hidden completely by user, render a discreet restore trigger on the bottom right
  if (!isVisible) {
    return (
      <button
        onClick={() => toggleVisibility(true)}
        className="fixed bottom-20 right-3 z-40 bg-purple-950/90 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs px-2.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all active:scale-95 group"
        title="Afficher la présence flottante de CHLOÉ"
        aria-label="Afficher Chloé"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:animate-ping" />
        <span className="font-medium text-[11px]">{assistantName}</span>
        <Eye className="w-3.5 h-3.5 text-purple-300" />
      </button>
    );
  }

  // If not yet calibrated to viewport coordinates, do not render offscreen
  if (position.x < 0) return null;

  return (
    <div
      ref={nodeRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
        userSelect: 'none',
      }}
      className={`fixed z-50 cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'scale-105 shadow-2xl opacity-95' : 'transition-transform'
      }`}
    >
      {/* Floating Avatar Sphere / Disc */}
      <div className="relative group">
        {/* Animated State Glow Ring */}
        <div
          className={`absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 opacity-75 blur-sm transition-opacity group-hover:opacity-100 ${
            stateInfo.pulse ? 'animate-pulse' : ''
          }`}
        />

        {/* Outer Circular Frame */}
        <div
          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-purple-400/80 bg-[#0c1020] shadow-xl ${stateInfo.glowRing}`}
        >
          {/* Avatar Official Portrait - Centered directly on Chloé's face */}
          <img
            src="/chloe-avatar-fullbody.webp"
            alt={assistantName}
            className="w-full h-full object-cover [object-position:50%_12%] pointer-events-none"
            draggable={false}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
                target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
              }
            }}
          />

          {/* Audio Wave Overlay when Speaking or Listening */}
          {(state === 'speaking' || state === 'listening') && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs py-0.5 flex items-center justify-center gap-0.5">
              <span className="w-0.5 bg-cyan-400 rounded-full animate-bounce h-2" />
              <span className="w-0.5 bg-fuchsia-400 rounded-full animate-pulse h-3" />
              <span className="w-0.5 bg-purple-400 rounded-full animate-bounce h-2" />
            </div>
          )}
        </div>

        {/* Live Status Pip */}
        <span
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#070913] ${stateInfo.statusColor} ${
            stateInfo.pulse ? 'animate-ping' : ''
          }`}
          title={`État : ${stateInfo.label}`}
        />
        <span
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#070913] ${stateInfo.statusColor}`}
        />
      </div>

      {/* Quick Interactive Popover Menu */}
      {isMenuOpen && !isDragging && (
        <div
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          className={`absolute bottom-full mb-3 right-0 sm:right-auto ${
            position.x > window.innerWidth / 2 ? 'right-0' : 'left-0'
          } w-64 bg-[#0d1226]/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-3 shadow-2xl shadow-purple-950/80 z-50 text-slate-100 space-y-2 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-xs text-white tracking-wide">
                {assistantName} AI
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/50 text-purple-300 border border-purple-500/30">
                {stateInfo.label}
              </span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="floating-menu-action text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Fermer"
              aria-label="Fermer le menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Action Navigation */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onOpenChat();
              }}
              className={`floating-menu-action w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                currentTab === 'chat'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                  : 'hover:bg-purple-950/60 text-slate-200 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="font-medium">Ouvrir la discussion</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                onOpenAvatarStudio();
              }}
              className={`floating-menu-action w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                currentTab === 'avatar'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                  : 'hover:bg-purple-950/60 text-slate-200 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
                <span className="font-medium">Studio Avatar 3D</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Quick Helper Note & Drag hint */}
          <div className="pt-2 border-t border-purple-900/40 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Move className="w-3 h-3 text-purple-400" />
              Glissez pour déplacer
            </span>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                toggleVisibility(false);
              }}
              className="floating-menu-action hover:text-red-300 text-slate-400 transition-colors"
            >
              Masquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
