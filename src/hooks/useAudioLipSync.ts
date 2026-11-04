import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { speechLipSync, VisemeState } from '../services/speechLipSync.ts';

export interface MorphTargetWeights {
  jawOpen: number;
  mouthOpen: number;
  viseme_aa: number;
  viseme_O: number;
  viseme_E: number;
  viseme_I: number;
  viseme_CH: number;
  mouthSmile: number;
  mouthPucker: number;
  [key: string]: number;
}

export interface UseAudioLipSyncOptions {
  smoothing?: number; // 0 to 1, default 0.65
  sensitivity?: number; // default 1.4
  autoSyncWithSpeechService?: boolean; // default true
}

export interface UseAudioLipSyncReturn {
  visemes: MorphTargetWeights;
  volume: number;
  isMicActive: boolean;
  isAudioActive: boolean;
  startMic: () => Promise<boolean>;
  stopMic: () => void;
  connectAudioElement: (audioEl: HTMLAudioElement) => void;
  applyMorphTargets: (target: THREE.Object3D | null | undefined) => void;
}

const DEFAULT_VISEMES: MorphTargetWeights = {
  jawOpen: 0,
  mouthOpen: 0,
  viseme_aa: 0,
  viseme_O: 0,
  viseme_E: 0,
  viseme_I: 0,
  viseme_CH: 0,
  mouthSmile: 0.1,
  mouthPucker: 0,
};

// Aliases dictionary for standard 3D formats (ReadyPlayerMe, ARKit, Oculus, Metahuman, custom)
const MORPH_ALIASES: Record<string, string[]> = {
  jawOpen: ['jawOpen', 'jaw_open', 'jawDrop', 'mouthOpen', 'mouth_open'],
  mouthOpen: ['mouthOpen', 'mouth_open', 'jawOpen', 'viseme_aa'],
  viseme_aa: ['viseme_aa', 'viseme_A', 'mouthOpen', 'jawOpen', 'v_aa', 'v_A'],
  viseme_O: ['viseme_O', 'viseme_oh', 'mouthPucker', 'v_O', 'v_oh'],
  viseme_E: ['viseme_E', 'viseme_ee', 'mouthSmile', 'v_E', 'v_ee'],
  viseme_I: ['viseme_I', 'viseme_ih', 'v_I', 'v_ih'],
  viseme_CH: ['viseme_CH', 'viseme_ch', 'v_CH', 'viseme_SS'],
  mouthSmile: ['mouthSmile', 'mouth_smile', 'mouthSmileLeft', 'mouthSmileRight', 'smile'],
  mouthPucker: ['mouthPucker', 'mouth_pucker', 'mouthFunnel', 'pucker'],
};

export function useAudioLipSync(options: UseAudioLipSyncOptions = {}): UseAudioLipSyncReturn {
  const {
    smoothing = 0.65,
    sensitivity = 1.4,
    autoSyncWithSpeechService = true,
  } = options;

  const [visemes, setVisemes] = useState<MorphTargetWeights>(DEFAULT_VISEMES);
  const [volume, setVolume] = useState<number>(0);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  const visemesRef = useRef<MorphTargetWeights>(DEFAULT_VISEMES);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Connect Web Audio API to Microphone
  const startMic = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        console.warn('getUserMedia not supported in this environment');
        return false;
      }

      // Stop any existing stream
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      setIsMicActive(true);
      return true;
    } catch (err) {
      console.warn('Failed to access microphone for lip-sync:', err);
      setIsMicActive(false);
      return false;
    }
  }, []);

  const stopMic = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsMicActive(false);
    setIsAudioActive(false);
  }, []);

  // Connect an HTML Audio Element (e.g. for TTS playback)
  const connectAudioElement = useCallback((audioEl: HTMLAudioElement) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioCtx();
        audioContextRef.current = ctx;
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioEl);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      setIsAudioActive(true);
    } catch (err) {
      console.warn('Failed to connect audio element to lip-sync:', err);
    }
  }, []);

  // Frequency analysis loop
  useEffect(() => {
    const dataArray = new Uint8Array(256);

    const updateAudioFrequency = () => {
      const analyser = analyserRef.current;
      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);

        // Calculate frequency band energies:
        // FFT Size = 512, sampleRate ~ 44100Hz -> bin width approx ~86 Hz
        // Bin 1-4: ~86 - 350 Hz (Vowel fundamental pitch, jaw opening)
        // Bin 5-11: ~350 - 950 Hz (Vowels O / U / A)
        // Bin 12-32: ~1000 - 2800 Hz (Vowels E / I)
        // Bin 33-70: ~2800 - 6000 Hz (Consonants S / CH / T)
        let lowEnergy = 0;
        let midLowEnergy = 0;
        let midHighEnergy = 0;
        let highEnergy = 0;
        let totalEnergy = 0;

        for (let i = 1; i <= 4; i++) lowEnergy += dataArray[i];
        lowEnergy /= 4 * 255;

        for (let i = 5; i <= 11; i++) midLowEnergy += dataArray[i];
        midLowEnergy /= 7 * 255;

        for (let i = 12; i <= 32; i++) midHighEnergy += dataArray[i];
        midHighEnergy /= 21 * 255;

        for (let i = 33; i <= 70; i++) highEnergy += dataArray[i];
        highEnergy /= 38 * 255;

        for (let i = 0; i < 64; i++) totalEnergy += dataArray[i];
        const rawVol = (totalEnergy / (64 * 255)) * sensitivity;
        const currentVol = Math.min(1, rawVol);

        const active = currentVol > 0.04;
        setIsAudioActive(active);
        setVolume(currentVol);

        // Map energy bands to blendshapes with dampening
        const targetJaw = Math.min(1, (lowEnergy * 1.5 + currentVol * 0.5) * sensitivity);
        const targetAA = Math.min(1, (lowEnergy * 1.2 + midLowEnergy * 0.8) * sensitivity);
        const targetO = Math.min(1, (midLowEnergy * 1.6) * sensitivity);
        const targetE = Math.min(1, (midHighEnergy * 1.5) * sensitivity);
        const targetI = Math.min(1, (midHighEnergy * 1.2 + highEnergy * 0.6) * sensitivity);
        const targetCH = Math.min(1, (highEnergy * 1.8) * sensitivity);
        const targetSmile = active ? 0.35 + midHighEnergy * 0.3 : 0.15;
        const targetPucker = Math.min(1, midLowEnergy * 0.8);

        // Smooth damping interpolation (lerp)
        const lerpFactor = Math.min(1, delta * (1 - smoothing) * 30 + 0.15);

        const next: MorphTargetWeights = {
          jawOpen: THREE.MathUtils.lerp(visemesRef.current.jawOpen, targetJaw, lerpFactor),
          mouthOpen: THREE.MathUtils.lerp(visemesRef.current.mouthOpen, targetJaw, lerpFactor),
          viseme_aa: THREE.MathUtils.lerp(visemesRef.current.viseme_aa, targetAA, lerpFactor),
          viseme_O: THREE.MathUtils.lerp(visemesRef.current.viseme_O, targetO, lerpFactor),
          viseme_E: THREE.MathUtils.lerp(visemesRef.current.viseme_E, targetE, lerpFactor),
          viseme_I: THREE.MathUtils.lerp(visemesRef.current.viseme_I, targetI, lerpFactor),
          viseme_CH: THREE.MathUtils.lerp(visemesRef.current.viseme_CH, targetCH, lerpFactor),
          mouthSmile: THREE.MathUtils.lerp(visemesRef.current.mouthSmile, targetSmile, lerpFactor),
          mouthPucker: THREE.MathUtils.lerp(visemesRef.current.mouthPucker, targetPucker, lerpFactor),
        };

        visemesRef.current = next;
        setVisemes(next);
      }

      animationFrameRef.current = requestAnimationFrame(updateAudioFrequency);
    };

    animationFrameRef.current = requestAnimationFrame(updateAudioFrequency);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [smoothing, sensitivity]);

  // Synchronize with speechLipSync service when physical mic is not in use
  useEffect(() => {
    if (!autoSyncWithSpeechService) return;

    const unsubscribe = speechLipSync.subscribe((speechState: VisemeState) => {
      // Only drive if mic isn't actively generating audio
      if (isMicActive && analyserRef.current) return;

      if (!speechState.isSpeaking) {
        visemesRef.current = DEFAULT_VISEMES;
        setVisemes(DEFAULT_VISEMES);
        setIsAudioActive(false);
        setVolume(0);
        return;
      }

      setIsAudioActive(true);
      setVolume(speechState.amplitude);

      const target: MorphTargetWeights = {
        jawOpen: speechState.jawDrop * 0.9,
        mouthOpen: speechState.openAmount,
        viseme_aa: speechState.viseme === 'A' ? speechState.openAmount : speechState.openAmount * 0.3,
        viseme_O: speechState.viseme === 'O' ? 0.85 : 0.05,
        viseme_E: speechState.viseme === 'E' ? 0.8 : 0.1,
        viseme_I: speechState.viseme === 'E' ? 0.5 : 0.05,
        viseme_CH: speechState.viseme === 'F' || speechState.viseme === 'M' ? 0.7 : 0.05,
        mouthSmile: speechState.viseme === 'smile' ? 0.9 : 0.25,
        mouthPucker: speechState.viseme === 'O' ? 0.75 : 0.05,
      };

      visemesRef.current = target;
      setVisemes(target);
    });

    return () => {
      unsubscribe();
    };
  }, [autoSyncWithSpeechService, isMicActive]);

  // Apply weights to a Three.js mesh with morphTargetDictionary & morphTargetInfluences
  const applyMorphTargets = useCallback((root: THREE.Object3D | null | undefined) => {
    if (!root) return;

    const currentWeights = visemesRef.current;

    root.traverse((node: THREE.Object3D) => {
      const mesh = node as THREE.Mesh;
      if (
        mesh.isMesh &&
        mesh.morphTargetDictionary &&
        mesh.morphTargetInfluences
      ) {
        const dict = mesh.morphTargetDictionary;
        const influences = mesh.morphTargetInfluences;

        // Iterate through all mapped blendshapes
        Object.entries(MORPH_ALIASES).forEach(([canonicalKey, aliases]) => {
          const weight = currentWeights[canonicalKey] ?? 0;
          for (const alias of aliases) {
            const index = dict[alias];
            if (index !== undefined && influences[index] !== undefined) {
              // Smoothly blend influence
              influences[index] = THREE.MathUtils.lerp(influences[index], weight, 0.4);
              break;
            }
          }
        });
      }
    });
  }, []);

  return {
    visemes,
    volume,
    isMicActive,
    isAudioActive,
    startMic,
    stopMic,
    connectAudioElement,
    applyMorphTargets,
  };
}
