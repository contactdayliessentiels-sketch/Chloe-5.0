export type AvatarState = 
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'responding'
  | 'speaking'
  | 'happy'
  | 'greeting'
  | 'error'
  | 'offline';

export type AvatarSize = 'small' | 'medium' | 'large';
export type AvatarPosition = 'left' | 'center' | 'right';
export type AvatarVisibility = 'low' | 'normal' | 'high';
export type AvatarIntensity = 'low' | 'normal' | 'high';
export type AvatarLayoutMode = 'background' | 'side' | 'hybrid';

export type AvatarRenderingEngine = 'r3f' | 'canvas' | 'photo';

export interface AvatarPreferences {
  enabled: boolean;
  engine: AvatarRenderingEngine;
  size: AvatarSize;
  position: AvatarPosition;
  visibility: AvatarVisibility;
  mode: AvatarLayoutMode;
  animated: boolean;
  intensity: AvatarIntensity;
  voiceSync: boolean;
  showStatusBadge: boolean;
  ambientParticles: boolean;
}

export const DEFAULT_AVATAR_PREFERENCES: AvatarPreferences = {
  enabled: true,
  engine: 'r3f',
  size: 'large',
  position: 'center',
  visibility: 'high',
  mode: 'hybrid',
  animated: true,
  intensity: 'normal',
  voiceSync: true,
  showStatusBadge: true,
  ambientParticles: true,
};

