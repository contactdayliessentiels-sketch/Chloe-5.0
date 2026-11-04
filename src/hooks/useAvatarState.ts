import { useState, useEffect, useCallback } from 'react';
import {
  AvatarState,
  AvatarPreferences,
  DEFAULT_AVATAR_PREFERENCES
} from '../types/avatar.ts';

const STORAGE_KEY = 'chloe_avatar_prefs_v2';

export interface UseAvatarStateProps {
  isListening?: boolean;
  isLoading?: boolean;
  isSpeaking?: boolean;
  hasError?: boolean;
}

export function useAvatarState({
  isListening = false,
  isLoading = false,
  isSpeaking = false,
  hasError = false,
}: UseAvatarStateProps = {}) {
  // Load initial preferences from localStorage or default
  const [preferences, setPreferences] = useState<AvatarPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_AVATAR_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to read avatar preferences from localStorage', e);
    }
    return DEFAULT_AVATAR_PREFERENCES;
  });

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Manual override state for testing or direct user feedback
  const [overrideState, setOverrideState] = useState<AvatarState | null>(null);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute active state based on real system inputs
  const computeState = (): AvatarState => {
    if (overrideState) return overrideState;
    if (!isOnline) return 'offline';
    if (hasError) return 'error';
    if (isListening) return 'listening';
    if (isSpeaking && preferences.voiceSync) return 'speaking';
    if (isLoading) return 'thinking';
    return 'idle';
  };

  const currentState = computeState();

  // Save preferences updater
  const updatePreferences = useCallback((updates: Partial<AvatarPreferences>) => {
    setPreferences(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save avatar preferences', e);
      }
      return next;
    });
  }, []);

  // Reset override after 6 seconds of testing
  const triggerStatePreview = useCallback((state: AvatarState, durationMs = 6000) => {
    setOverrideState(state);
    if (durationMs > 0) {
      setTimeout(() => {
        setOverrideState(null);
      }, durationMs);
    }
  }, []);

  return {
    state: currentState,
    preferences,
    updatePreferences,
    triggerStatePreview,
    clearPreview: () => setOverrideState(null),
    isOverridden: overrideState !== null,
  };
}
