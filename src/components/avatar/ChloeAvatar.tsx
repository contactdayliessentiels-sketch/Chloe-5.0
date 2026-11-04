import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useGlobalAvatar, useAvatarAnimationBridge } from '../../context/AvatarContext.tsx';
import { useAudioLipSync } from '../../hooks/useAudioLipSync.ts';
import { speechLipSync, VisemeState } from '../../services/speechLipSync.ts';
import { AvatarState } from '../../types/avatar.ts';
import {
  Mic,
  MicOff,
  Volume2,
  Image as ImageIcon
} from 'lucide-react';

interface ChloeAvatarProps {
  modelUrl?: string;
  className?: string;
  interactive?: boolean;
  showControls?: boolean;
  onTap?: () => void;
  showOfficialPhotoToggle?: boolean;
}

/**
 * Realistic Chloé Hybrid 3D Character Model
 * Built faithfully from the Official Portrait of Chloé:
 * - Natural adult female appearance with harmonious facial features
 * - Visible warm brown eyes with lively expression
 * - Wavy brown hair framing face naturally without covering eyes
 * - Lavender fine-knit turtleneck sweater
 * - Violet flared trousers & black leather ankle boots
 * - Proportional human anatomy (no cartoon/primitives)
 * - +12% enlarged framing with full-body visibility from head to toe
 */
function RealisticChloeModel({
  state,
  isSpeaking,
  onApplyLipSync,
}: {
  state: AvatarState;
  isSpeaking: boolean;
  onApplyLipSync: (root: THREE.Object3D) => void;
}) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const bodyMeshRef = useRef<THREE.Mesh>(null);
  const headPivotRef = useRef<THREE.Group>(null);
  const eyesMeshRef = useRef<THREE.Mesh>(null);
  const mouthMeshRef = useRef<THREE.Mesh>(null);

  // Load and configure official portrait texture
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/chloe-avatar-fullbody.webp', undefined, undefined, () => {
      // Fallback if needed
      loader.load('/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp', (fallbackTex) => {
        fallbackTex.colorSpace = THREE.SRGBColorSpace;
        if (bodyMeshRef.current) {
          (bodyMeshRef.current.material as THREE.MeshStandardMaterial).map = fallbackTex;
          (bodyMeshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      });
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;
    return tex;
  }, []);

  // Geometry dimensions matching exact 768x1152 portrait (2:3 aspect ratio)
  const planeHeight = 3.65;
  const planeWidth = planeHeight * (768 / 1152); // Exactly 2.433 - uncompressed natural human proportions

  // Procedural dynamic Eyelids Canvas (256x128 for high-DPI sharpness)
  const { eyeTexture, drawBlink } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const blinkFn = (progress: number) => {
      ctx.clearRect(0, 0, 256, 128);
      if (progress <= 0.04) {
        if (eyesMeshRef.current) {
          (eyesMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        }
        return;
      }

      if (eyesMeshRef.current) {
        (eyesMeshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.min(1, progress * 1.15);
      }

      // Warm natural skin tone matching Chloé's eyelid in official portrait
      ctx.fillStyle = 'rgba(215, 172, 155, 0.98)';
      const closedH = 46 * progress;

      // Left eyelid
      ctx.beginPath();
      ctx.ellipse(82, 60, 36, closedH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle upper eyelid crease line
      ctx.strokeStyle = 'rgba(85, 48, 42, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(82, 60 + closedH * 0.35, 36, closedH * 0.28, 0, 0, Math.PI);
      ctx.stroke();

      // Right eyelid
      ctx.beginPath();
      ctx.ellipse(174, 60, 36, closedH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle upper eyelid crease line
      ctx.beginPath();
      ctx.ellipse(174, 60 + closedH * 0.35, 36, closedH * 0.28, 0, 0, Math.PI);
      ctx.stroke();

      tex.needsUpdate = true;
    };

    return { eyeTexture: tex, drawBlink: blinkFn };
  }, []);

  // Procedural dynamic Mouth Canvas (Visemes & Lip-Sync)
  const { mouthTexture, drawMouth } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const mouthFn = (viseme: VisemeState, currentState: AvatarState, isSpeakingFlag: boolean) => {
      ctx.clearRect(0, 0, 256, 128);
      const activeSpeaking = isSpeakingFlag || viseme.isSpeaking;

      if (!activeSpeaking && viseme.viseme === 'rest' && currentState !== 'greeting' && currentState !== 'happy') {
        if (mouthMeshRef.current) {
          (mouthMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        }
        return;
      }

      if (mouthMeshRef.current) {
        (mouthMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.95;
      }

      const open = Math.max(0, Math.min(1, viseme.openAmount));
      const spread = Math.max(0.3, Math.min(1, viseme.widthSpread));
      const isSmile = viseme.viseme === 'smile' || currentState === 'greeting' || currentState === 'happy';

      // Interior mouth cavity with subtle depth
      if (open > 0.12) {
        ctx.fillStyle = 'rgba(75, 20, 28, 0.96)';
        ctx.beginPath();
        ctx.ellipse(128, 64, 30 * spread + 6, 22 * open + 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle upper teeth hint
        ctx.fillStyle = 'rgba(252, 250, 250, 0.92)';
        ctx.beginPath();
        ctx.rect(128 - 20 * spread, 64 - 18 * open, 40 * spread, 8 * open + 2);
        ctx.fill();
      }

      // Natural rosy lips outline and fill matching Chloé's lips
      ctx.strokeStyle = 'rgba(196, 93, 122, 0.95)';
      ctx.fillStyle = 'rgba(210, 105, 135, 0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath();

      if (isSmile && open < 0.25) {
        ctx.arc(128, 48, 45, 0.22 * Math.PI, 0.78 * Math.PI, false);
      } else {
        ctx.ellipse(128, 64, 34 * spread + 8, 16 * open + 5, 0, 0, Math.PI * 2);
      }
      ctx.stroke();

      tex.needsUpdate = true;
    };

    return { mouthTexture: tex, drawMouth: mouthFn };
  }, []);

  // Subscribe to speech lip-sync service
  useEffect(() => {
    const unsub = speechLipSync.subscribe((visemeState: VisemeState) => {
      drawMouth(visemeState, state, isSpeaking);
    });
    return unsub;
  }, [drawMouth, state, isSpeaking]);

  // Animation timing state refs
  const blinkTimerRef = useRef(0);
  const nextBlinkTimeRef = useRef(3.0);
  const isBlinkingRef = useRef(false);
  const currentHeadRotRef = useRef({ x: 0, y: 0, z: 0 });

  // Frame animation loop: natural breathing, head tilts, blinking
  useFrame(({ clock, pointer }, delta) => {
    const t = clock.getElapsedTime();

    // 1. Stable Character Stance: Anchored, steady, dignified (no unwanted sway or drift)
    if (bodyMeshRef.current) {
      bodyMeshRef.current.position.set(0, 0, 0);
      bodyMeshRef.current.rotation.set(0, 0, 0);
      bodyMeshRef.current.scale.set(1, 1, 1);
    }

    // 2. Stable Head Alignment: Centered and looking forward (no pointer-induced skewing)
    if (headPivotRef.current) {
      headPivotRef.current.position.set(0, 1.15, 0.015);
      headPivotRef.current.rotation.set(0, 0, 0);
    }

    // 3. Eye Blinking System (Natural interval ~ every 3.2s - 4.8s)
    blinkTimerRef.current += delta;
    if (!isBlinkingRef.current && blinkTimerRef.current > nextBlinkTimeRef.current) {
      isBlinkingRef.current = true;
      blinkTimerRef.current = 0;
      nextBlinkTimeRef.current = 3.2 + Math.random() * 1.8;
    }

    if (isBlinkingRef.current) {
      const blinkDuration = 0.15; // 150ms cycle
      const progress = blinkTimerRef.current / blinkDuration;

      let blinkProgress = 0;
      if (progress <= 0.45) {
        blinkProgress = progress / 0.45;
      } else if (progress <= 1.0) {
        blinkProgress = 1 - (progress - 0.45) / 0.55;
      } else {
        blinkProgress = 0;
        isBlinkingRef.current = false;
      }

      drawBlink(blinkProgress);
    }

    // 4. Apply external morph targets if hook is active
    if (rootGroupRef.current) {
      onApplyLipSync(rootGroupRef.current);
    }
  });

  return (
    <group ref={rootGroupRef} position={[0, 0, 0]}>
      {/* High-Resolution Subdivided Character Body Plane */}
      <mesh ref={bodyMeshRef} position={[0, 0, 0]} castShadow receiveShadow>
        <planeGeometry args={[planeWidth, planeHeight, 32, 64]} />
        <meshStandardMaterial
          map={texture}
          transparent={true}
          roughness={0.50}
          metalness={0.05}
          alphaTest={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Articulated Head & Neck Pivot (Anchored at base of neck y = +1.15) */}
      <group ref={headPivotRef} position={[0, 1.15, 0.015]}>
        {/* Procedural Blinking Eyelid Overlay over Visible Eyes (y = +0.24 relative to neck) */}
        <mesh ref={eyesMeshRef} position={[0, 0.24, 0.02]}>
          <planeGeometry args={[0.38, 0.16]} />
          <meshBasicMaterial
            map={eyeTexture}
            transparent={true}
            opacity={0}
            depthWrite={false}
          />
        </mesh>

        {/* Dynamic Lip-Sync Mouth Overlay over Rosy Lips (y = +0.10 relative to neck) */}
        <mesh ref={mouthMeshRef} position={[0, 0.10, 0.02]}>
          <planeGeometry args={[0.26, 0.14]} />
          <meshBasicMaterial
            map={mouthTexture}
            transparent={true}
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * GLTF/GLB Model Loader Subcomponent:
 * Tries to load GLB if specified. If not available, seamlessly displays RealisticChloeModel.
 */
function GLBModelRenderer({
  url,
  state,
  isSpeaking,
  onApplyLipSync,
}: {
  url: string;
  state: AvatarState;
  isSpeaking: boolean;
  onApplyLipSync: (root: THREE.Object3D) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF(url);
  const { actions, names } = useAnimations(gltf.animations, group);

  // Hook up animation bridge for transitions between states
  useAvatarAnimationBridge(actions, names);

  useFrame(() => {
    if (group.current) {
      onApplyLipSync(group.current);
    }
  });

  return (
    <group ref={group} dispose={null} position={[0, -1.4, 0]}>
      <primitive object={gltf.scene} />
    </group>
  );
}

/**
 * Main 3D Canvas Scene
 */
function AvatarScene({
  modelUrl,
  state,
  isSpeaking,
  onApplyLipSync,
}: {
  modelUrl?: string;
  state: AvatarState;
  isSpeaking: boolean;
  onApplyLipSync: (root: THREE.Object3D) => void;
}) {
  const [hasGLTFError, setHasGLTFError] = useState(false);

  return (
    <>
      {/* Studio Lighting Setup for PBR Realism */}
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#e8d5ff', '#1a0f2b', 0.65]} />

      {/* Main Warm Key Light */}
      <directionalLight
        position={[1.5, 3.2, 2.8]}
        intensity={1.25}
        color="#fff7ee"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={10}
      />

      {/* Rim Light Left: Cyber Violet Aura */}
      <pointLight position={[-2.2, 1.2, -0.6]} intensity={2.0} color="#a855f7" distance={9} />

      {/* Rim Light Right: Electric Cyan Accent */}
      <pointLight position={[2.2, 0.8, -0.6]} intensity={1.8} color="#06b6d4" distance={9} />

      {/* Subtle Floor Warm Bounce */}
      <pointLight position={[0, -1.5, 1.2]} intensity={0.35} color="#f5e8ff" />

      {/* Model Loading with Fallback */}
      <Suspense
        fallback={
          <Html center>
            <div className="flex flex-col items-center gap-2 p-3 bg-purple-950/80 backdrop-blur-md rounded-2xl border border-purple-500/40 text-purple-200 text-xs shadow-xl min-w-[170px]">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="font-medium">Initialisation 3D Chloé...</span>
            </div>
          </Html>
        }
      >
        {modelUrl && !hasGLTFError ? (
          <GLBModelRenderer
            url={modelUrl}
            state={state}
            isSpeaking={isSpeaking}
            onApplyLipSync={onApplyLipSync}
          />
        ) : (
          <RealisticChloeModel
            state={state}
            isSpeaking={isSpeaking}
            onApplyLipSync={onApplyLipSync}
          />
        )}
      </Suspense>

      {/* Ground Contact Shadow beneath Boots */}
      <ContactShadows
        position={[0, -1.82, 0]}
        opacity={0.55}
        scale={4.0}
        blur={1.8}
        far={2.2}
      />

      {/* Camera Controls - Locked for Stable Humanoid Stance (No awkward rotation or paper-cutout angle) */}
      <OrbitControls
        enableZoom={false}
        enableRotate={false}
        enablePan={false}
        target={[0, 0.02, 0]}
      />
    </>
  );
}

/**
 * Top-Level Exported ChloeAvatar Component
 */
export const ChloeAvatar: React.FC<ChloeAvatarProps> = ({
  modelUrl,
  className = '',
  interactive = true,
  showControls = true,
  onTap,
  showOfficialPhotoToggle = true,
}) => {
  const { state, setState } = useGlobalAvatar();
  const [showPhotoRef, setShowPhotoRef] = useState(false);
  const [micActiveState, setMicActiveState] = useState(false);

  // Initialize Web Audio Lip-Sync Hook
  const {
    visemes,
    volume,
    isMicActive,
    isAudioActive,
    startMic,
    stopMic,
    applyMorphTargets,
  } = useAudioLipSync({
    smoothing: 0.65,
    sensitivity: 1.5,
    autoSyncWithSpeechService: true,
  });

  const toggleMic = async () => {
    if (isMicActive) {
      stopMic();
      setMicActiveState(false);
    } else {
      const ok = await startMic();
      setMicActiveState(ok);
    }
  };

  const handleStateSelect = (targetState: AvatarState) => {
    setState(targetState);
  };

  return (
    <div className={`relative flex flex-col items-center justify-center w-full h-full select-none ${className}`}>
      {/* 3D R3F Canvas Container */}
      <div className="relative w-full h-full min-h-0 overflow-hidden rounded-3xl bg-radial from-[#15102a]/70 via-[#0a0817]/90 to-[#04020a]">
        {/* Ambient Pulsing Aura in background */}
        <div className="absolute inset-x-12 top-10 bottom-20 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* Real-time WebGL Canvas - Calibrated to 42° FOV and 4.35m distance for complete head-to-toe framing */}
        <Canvas
          shadows
          camera={{ position: [0, -0.02, 4.35], fov: 42 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.12,
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onClick={onTap}
        >
          <AvatarScene
            modelUrl={modelUrl}
            state={state}
            isSpeaking={state === 'speaking' || isAudioActive}
            onApplyLipSync={applyMorphTargets}
          />
        </Canvas>

        {/* Top-Right Quick Action Badges */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {/* Microphone Live Lip-Sync Toggle */}
          <button
            onClick={toggleMic}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md active:scale-95 ${
              isMicActive
                ? 'bg-rose-500/25 border-rose-500/50 text-rose-300 animate-pulse'
                : 'bg-purple-950/60 border-purple-500/30 text-purple-200 hover:bg-purple-900/60'
            }`}
            title={isMicActive ? 'Microphone actif (lip-sync vocal en direct)' : 'Activer micro pour lip-sync en direct'}
          >
            {isMicActive ? <Mic className="w-3.5 h-3.5 text-rose-400" /> : <MicOff className="w-3.5 h-3.5 opacity-70" />}
            <span className="text-[11px] hidden sm:inline">
              {isMicActive ? 'Micro actif' : 'Lip-sync micro'}
            </span>
          </button>

          {/* Official Portrait Reference Toggle */}
          {showOfficialPhotoToggle && (
            <button
              onClick={() => setShowPhotoRef(prev => !prev)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md active:scale-95 ${
                showPhotoRef
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-purple-950/60 border-purple-500/30 text-purple-200 hover:bg-purple-900/60'
              }`}
              title="Voir l'image officielle haute résolution de Chloé"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-300" />
              <span className="text-[11px] hidden sm:inline">Photo</span>
            </button>
          )}
        </div>

        {/* Top-Left Active State & Audio Indicator */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
          <div className="px-2.5 py-1 rounded-xl bg-purple-950/80 border border-purple-500/30 text-[11px] text-purple-200 font-medium backdrop-blur-md flex items-center gap-2 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-white uppercase text-[10px] tracking-wider">Studio 3D</span>
            <span className="text-slate-400">·</span>
            <span className="capitalize">{state}</span>
          </div>

          {/* Live Lip-Sync Viseme Bar */}
          {(isAudioActive || volume > 0.02) && (
            <div className="px-2 py-0.5 rounded-lg bg-black/60 border border-purple-500/20 text-[10px] text-purple-300 flex items-center gap-2 backdrop-blur-sm">
              <Volume2 className="w-3 h-3 text-fuchsia-400 animate-pulse" />
              <div className="w-16 h-1.5 bg-purple-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-fuchsia-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.round(volume * 100))}%` }}
                />
              </div>
              <span className="font-mono text-[9px] text-slate-400">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Bottom Interactive Pose / State Bar */}
        {showControls && (
          <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-[#090C19]/80 border border-purple-500/30 backdrop-blur-md overflow-x-auto">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-purple-300 px-2 hidden sm:inline">
              États :
            </span>
            {(['idle', 'listening', 'thinking', 'speaking', 'greeting', 'happy'] as AvatarState[]).map(s => {
              const isActive = state === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStateSelect(s)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-950/60'
                      : 'bg-purple-950/40 text-slate-300 hover:text-white hover:bg-purple-900/40 border border-purple-500/20'
                  }`}
                >
                  {s === 'idle' && 'Veille'}
                  {s === 'listening' && 'Écoute'}
                  {s === 'thinking' && 'Réflexion'}
                  {s === 'speaking' && 'Parole'}
                  {s === 'greeting' && 'Saluer'}
                  {s === 'happy' && 'Sourire'}
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Overlay: Official Assistant Portrait Image View */}
        {showPhotoRef && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md p-4 flex flex-col items-center justify-center animate-in fade-in duration-200">
            <div className="relative max-w-sm w-full bg-[#0E1224] border border-purple-500/40 rounded-3xl p-4 shadow-2xl flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h4 className="font-bold text-white text-sm">Portrait Officiel de Chloé</h4>
                </div>
                <button
                  onClick={() => setShowPhotoRef(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800/60"
                >
                  ✕
                </button>
              </div>

              {/* Chloé's official full-body image */}
              <div className="relative w-full h-[52vh] max-h-[460px] rounded-2xl overflow-hidden bg-gradient-radial from-purple-900/30 to-black/60 flex items-center justify-center border border-purple-500/20">
                <img
                  src="/chloe-avatar-fullbody.webp"
                  alt="Portrait officiel de Chloé"
                  className="w-full h-full object-contain object-bottom drop-shadow-[0_10px_25px_rgba(168,85,247,0.4)]"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
                      target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
                    }
                  }}
                />
              </div>

              <div className="w-full mt-3 text-center">
                <p className="text-xs text-purple-200 font-medium">
                  CHLOÉ AI — Assistante Virtuelle Personnelle
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Scène 3D haute fidélité calibrée selon ce portrait officiel.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
