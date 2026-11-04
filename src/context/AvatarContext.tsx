import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  AvatarState,
  AvatarPreferences,
  DEFAULT_AVATAR_PREFERENCES
} from '../types/avatar.ts';

export interface StateClipMap {
  idle: string;
  listening: string;
  thinking: string;
  speaking: string;
  greeting: string;
  happy: string;
  responding: string;
  error: string;
  offline: string;
}

export const DEFAULT_STATE_CLIPS: StateClipMap = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  greeting: 'Greeting',
  happy: 'Happy',
  responding: 'Idle',
  error: 'Idle',
  offline: 'Idle',
};

export interface AnimationController {
  currentState: AvatarState;
  previousState: AvatarState | null;
  currentClipName: string;
  previousClipName: string | null;
  crossFadeDuration: number;
  setCrossFadeDuration: (seconds: number) => void;
  getClipForState: (state: AvatarState) => string;
  mapStateToClip: (state: AvatarState, clipName: string) => void;
  transitionTo: (state: AvatarState) => void;
  clipMap: StateClipMap;
}

interface AvatarContextValue {
  state: AvatarState;
  setState: (state: AvatarState) => void;
  preferences: AvatarPreferences;
  updatePreferences: (updates: Partial<AvatarPreferences>) => void;
  triggerStatePreview: (state: AvatarState, durationMs?: number) => void;
  clearPreview: () => void;
  isOverridden: boolean;
  animationController: AnimationController;
}

const STORAGE_KEY = 'chloe_avatar_prefs_v2';

const AvatarContext = createContext<AvatarContextValue | null>(null);

export const AvatarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AvatarPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_AVATAR_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load avatar preferences from localStorage:', e);
    }
    return DEFAULT_AVATAR_PREFERENCES;
  });

  const [state, setRawState] = useState<AvatarState>('idle');
  const [previousState, setPreviousState] = useState<AvatarState | null>(null);
  const [overrideState, setOverrideState] = useState<AvatarState | null>(null);
  const [crossFadeDuration, setCrossFadeDuration] = useState<number>(0.4);
  const [clipMap, setClipMap] = useState<StateClipMap>(DEFAULT_STATE_CLIPS);

  const updatePreferences = useCallback((updates: Partial<AvatarPreferences>) => {
    setPreferences(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save avatar preferences:', e);
      }
      return next;
    });
  }, []);

  const triggerStatePreview = useCallback((previewState: AvatarState, durationMs = 6000) => {
    setPreviousState(overrideState || state);
    setOverrideState(previewState);
    if (durationMs > 0) {
      setTimeout(() => {
        setOverrideState(null);
      }, durationMs);
    }
  }, [overrideState, state]);

  const clearPreview = useCallback(() => {
    setOverrideState(null);
  }, []);

  const transitionTo = useCallback((nextState: AvatarState) => {
    setPreviousState(prev => (overrideState || state));
    setRawState(nextState);
  }, [overrideState, state]);

  const mapStateToClip = useCallback((targetState: AvatarState, clipName: string) => {
    setClipMap(prev => ({
      ...prev,
      [targetState]: clipName,
    }));
  }, []);

  const getClipForState = useCallback((targetState: AvatarState): string => {
    return clipMap[targetState] || DEFAULT_STATE_CLIPS[targetState] || 'Idle';
  }, [clipMap]);

  const effectiveState = overrideState || state;
  const currentClipName = getClipForState(effectiveState);
  const previousClipName = previousState ? getClipForState(previousState) : null;

  const animationController = useMemo<AnimationController>(() => ({
    currentState: effectiveState,
    previousState,
    currentClipName,
    previousClipName,
    crossFadeDuration,
    setCrossFadeDuration,
    getClipForState,
    mapStateToClip,
    transitionTo,
    clipMap,
  }), [
    effectiveState,
    previousState,
    currentClipName,
    previousClipName,
    crossFadeDuration,
    getClipForState,
    mapStateToClip,
    transitionTo,
    clipMap,
  ]);

  return (
    <AvatarContext.Provider
      value={{
        state: effectiveState,
        setState: transitionTo,
        preferences,
        updatePreferences,
        triggerStatePreview,
        clearPreview,
        isOverridden: overrideState !== null,
        animationController,
      }}
    >
      {children}
    </AvatarContext.Provider>
  );
};

export function useGlobalAvatar(): AvatarContextValue {
  const ctx = useContext(AvatarContext);
  if (!ctx) {
    // Return safe fallback if not wrapped in provider
    const fallbackClipMap = DEFAULT_STATE_CLIPS;
    const fallbackController: AnimationController = {
      currentState: 'idle',
      previousState: null,
      currentClipName: 'Idle',
      previousClipName: null,
      crossFadeDuration: 0.4,
      setCrossFadeDuration: () => {},
      getClipForState: (s) => fallbackClipMap[s] || 'Idle',
      mapStateToClip: () => {},
      transitionTo: () => {},
      clipMap: fallbackClipMap,
    };

    return {
      state: 'idle',
      setState: () => {},
      preferences: DEFAULT_AVATAR_PREFERENCES,
      updatePreferences: () => {},
      triggerStatePreview: () => {},
      clearPreview: () => {},
      isOverridden: false,
      animationController: fallbackController,
    };
  }
  return ctx;
}

/**
 * React Three Fiber Animation Hook:
 * Bridges `AnimationController` and `useAnimations` from `@react-three/drei`.
 * Handles state changes by cross-fading Three.js AnimationActions.
 */
export function useAvatarAnimationBridge(
  actions: Record<string, THREE.AnimationAction | null>,
  names: string[]
) {
  const { animationController, state } = useGlobalAvatar();
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    if (!names || names.length === 0 || !actions) return;

    const targetClipName = animationController.getClipForState(state);
    
    // Find best match in action names (case-insensitive search)
    let matchedName = names.find(n => n.toLowerCase() === targetClipName.toLowerCase());
    
    // Fallback: search for substring match or take first available clip
    if (!matchedName) {
      matchedName = names.find(n => n.toLowerCase().includes(targetClipName.toLowerCase())) || names[0];
    }

    const nextAction = actions[matchedName];
    if (!nextAction) return;

    const prevAction = currentActionRef.current;
    const fadeDuration = animationController.crossFadeDuration;

    if (prevAction && prevAction !== nextAction) {
      nextAction.reset();
      nextAction.setEffectiveTimeScale(1);
      nextAction.setEffectiveWeight(1);
      nextAction.crossFadeFrom(prevAction, fadeDuration, true);
      nextAction.play();
    } else {
      nextAction.reset();
      nextAction.fadeIn(fadeDuration).play();
    }

    currentActionRef.current = nextAction;

    return () => {
      // Optional cleanup on unmount
    };
  }, [state, names, actions, animationController]);

  return {
    currentAction: currentActionRef.current,
    animationController,
  };
}
