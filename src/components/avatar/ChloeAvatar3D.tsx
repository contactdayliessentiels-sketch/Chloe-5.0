import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AvatarState, AvatarPreferences } from '../../types/avatar.ts';
import { speechLipSync, VisemeState } from '../../services/speechLipSync.ts';

interface ChloeAvatar3DProps {
  state: AvatarState;
  preferences: AvatarPreferences;
  isSpeaking?: boolean;
  onTap?: () => void;
  className?: string;
  isSidePanel?: boolean;
}

export const ChloeAvatar3D: React.FC<ChloeAvatar3DProps> = ({
  state,
  preferences,
  isSpeaking = false,
  onTap,
  className = '',
  isSidePanel = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGLError, setWebGLError] = useState(false);
  const [interactiveFeedback, setInteractiveFeedback] = useState<string | null>(null);

  // References for animation state to prevent recreating WebGL scene
  const stateRef = useRef<AvatarState>(state);
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const preferencesRef = useRef<AvatarPreferences>(preferences);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;

    // Check WebGL availability
    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setWebGLError(true);
        return;
      }
    } catch {
      setWebGLError(true);
      return;
    }

    // 1. Scene Setup
    scene = new THREE.Scene();

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 640;
    const aspect = width / height;

    // Perspective Camera calibrated for full-body view
    camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 100);

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
    } catch (err) {
      console.warn('WebGL init failed, switching to fallback:', err);
      setWebGLError(true);
      return;
    }

    // 2. Lighting Setup for PBR Realism
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe8d5ff, 0x1a0f2b, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ee, 1.25);
    keyLight.position.set(1.5, 3.2, 2.8);
    scene.add(keyLight);

    const rimLightLeft = new THREE.PointLight(0xa855f7, 2.0, 9);
    rimLightLeft.position.set(-2.2, 1.2, -0.6);
    scene.add(rimLightLeft);

    const rimLightRight = new THREE.PointLight(0x06b6d4, 1.8, 9);
    rimLightRight.position.set(2.2, 0.8, -0.6);
    scene.add(rimLightRight);

    // 3. Avatar Rigging Hierarchy
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // Dynamic ground shadow
    const shadowGeo = new THREE.PlaneGeometry(1.6, 0.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -1.82, 0);
    avatarGroup.add(shadowMesh);

    // 4. Character Texture and Body Mesh
    // Calibrated precisely to the 768x1152 official portrait (2:3 aspect ratio)
    const textureLoader = new THREE.TextureLoader();
    let bodyMesh: THREE.Mesh | null = null;
    let headPivot: THREE.Group = new THREE.Group();
    let eyesMesh: THREE.Mesh | null = null;
    let mouthMesh: THREE.Mesh | null = null;
    let particlesMesh: THREE.Points | null = null;

    const planeHeight = 3.65;
    const planeWidth = planeHeight * (768 / 1152); // Exactly 2.433 - uncompressed natural human proportions

    const textureUrl = '/chloe-avatar-fullbody.webp';
    textureLoader.load(
      textureUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 32, 64);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          roughness: 0.55,
          metalness: 0.08,
          alphaTest: 0.05,
        });

        bodyMesh = new THREE.Mesh(geometry, material);
        bodyMesh.position.set(0, 0, 0);
        avatarGroup.add(bodyMesh);

        // Articulated Head & Neck Pivot (at base of neck y = +1.15 in local 3D coordinates)
        headPivot = new THREE.Group();
        headPivot.position.set(0, 1.15, 0.015);
        avatarGroup.add(headPivot);

        // 5. Procedural Expressive Eyelids (Calibrated over Chloé's visible eyes)
        const eyeCanvas = document.createElement('canvas');
        eyeCanvas.width = 256;
        eyeCanvas.height = 128;
        const eyeCtx = eyeCanvas.getContext('2d')!;
        const eyeTexture = new THREE.CanvasTexture(eyeCanvas);
        eyeTexture.colorSpace = THREE.SRGBColorSpace;

        const eyeGeo = new THREE.PlaneGeometry(0.38, 0.16);
        const eyeMat = new THREE.MeshBasicMaterial({
          map: eyeTexture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        eyesMesh = new THREE.Mesh(eyeGeo, eyeMat);
        // Eye level: pixel y=140 corresponds to +0.24 relative to neck pivot
        eyesMesh.position.set(0, 0.24, 0.02);
        headPivot.add(eyesMesh);

        // 6. Dynamic Lip-Sync Mouth Mesh (Calibrated over Chloé's lips)
        const mouthCanvas = document.createElement('canvas');
        mouthCanvas.width = 256;
        mouthCanvas.height = 128;
        const mouthCtx = mouthCanvas.getContext('2d')!;
        const mouthTexture = new THREE.CanvasTexture(mouthCanvas);
        mouthTexture.colorSpace = THREE.SRGBColorSpace;

        const mouthGeo = new THREE.PlaneGeometry(0.26, 0.14);
        const mouthMat = new THREE.MeshBasicMaterial({
          map: mouthTexture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
        // Mouth level: pixel y=180 corresponds to +0.10 relative to neck pivot
        mouthMesh.position.set(0, 0.10, 0.02);
        headPivot.add(mouthMesh);

        // Helper to draw eyelid skin onto eyeCanvas during blinks
        const drawBlink = (blinkProgress: number) => {
          eyeCtx.clearRect(0, 0, 256, 128);
          if (blinkProgress <= 0.04) {
            eyeMat.opacity = 0;
            return;
          }
          eyeMat.opacity = Math.min(1, blinkProgress * 1.15);

          // Warm natural skin tone matching Chloé's eyelid in official portrait
          eyeCtx.fillStyle = 'rgba(215, 172, 155, 0.98)';
          const closedH = 46 * blinkProgress;

          // Left eyelid
          eyeCtx.beginPath();
          eyeCtx.ellipse(82, 60, 36, closedH, 0, 0, Math.PI * 2);
          eyeCtx.fill();

          // Subtle upper eyelid crease line
          eyeCtx.strokeStyle = 'rgba(85, 48, 42, 0.85)';
          eyeCtx.lineWidth = 3.5;
          eyeCtx.beginPath();
          eyeCtx.ellipse(82, 60 + closedH * 0.35, 36, closedH * 0.28, 0, 0, Math.PI);
          eyeCtx.stroke();

          // Right eyelid
          eyeCtx.beginPath();
          eyeCtx.ellipse(174, 60, 36, closedH, 0, 0, Math.PI * 2);
          eyeCtx.fill();

          // Subtle upper eyelid crease line
          eyeCtx.beginPath();
          eyeCtx.ellipse(174, 60 + closedH * 0.35, 36, closedH * 0.28, 0, 0, Math.PI);
          eyeCtx.stroke();

          eyeTexture.needsUpdate = true;
        };

        // Helper to render dynamic mouth visemes onto mouthCanvas
        const drawMouth = (viseme: VisemeState) => {
          mouthCtx.clearRect(0, 0, 256, 128);
          const currentState = stateRef.current;
          const isCurrentlySpeaking = isSpeakingRef.current || viseme.isSpeaking;

          if (!isCurrentlySpeaking && viseme.viseme === 'rest' && currentState !== 'greeting' && currentState !== 'happy') {
            mouthMat.opacity = 0;
            return;
          }

          mouthMat.opacity = 0.95;
          const open = Math.max(0, Math.min(1, viseme.openAmount));
          const spread = Math.max(0.3, Math.min(1, viseme.widthSpread));
          const isSmile = viseme.viseme === 'smile' || currentState === 'greeting' || currentState === 'happy';

          // Interior mouth cavity with subtle depth
          if (open > 0.12) {
            mouthCtx.fillStyle = 'rgba(75, 20, 28, 0.96)';
            mouthCtx.beginPath();
            mouthCtx.ellipse(128, 64, 30 * spread + 6, 22 * open + 3, 0, 0, Math.PI * 2);
            mouthCtx.fill();

            // Subtle upper teeth hint
            mouthCtx.fillStyle = 'rgba(252, 250, 250, 0.92)';
            mouthCtx.beginPath();
            mouthCtx.rect(128 - 20 * spread, 64 - 18 * open, 40 * spread, 8 * open + 2);
            mouthCtx.fill();
          }

          // Natural rosy lips outline and fill
          mouthCtx.strokeStyle = 'rgba(196, 93, 122, 0.95)';
          mouthCtx.fillStyle = 'rgba(210, 105, 135, 0.35)';
          mouthCtx.lineWidth = 4;
          mouthCtx.beginPath();

          if (isSmile && open < 0.25) {
            mouthCtx.arc(128, 48, 45, 0.22 * Math.PI, 0.78 * Math.PI, false);
          } else {
            mouthCtx.ellipse(128, 64, 34 * spread + 8, 16 * open + 5, 0, 0, Math.PI * 2);
          }
          mouthCtx.stroke();

          mouthTexture.needsUpdate = true;
        };

        // Subscribe to real-time speech viseme engine
        const unsubscribeLipSync = speechLipSync.subscribe((visemeState: VisemeState) => {
          drawMouth(visemeState);
        });

        (scene as any)._unsubscribeLipSync = unsubscribeLipSync;
        (scene as any)._drawBlink = drawBlink;
      },
      undefined,
      (err) => {
        console.warn('Failed to load primary texture, trying fallback:', err);
        // Fallback to asset studio copy
        textureLoader.load(
          '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp',
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            if (bodyMesh) {
              (bodyMesh.material as THREE.MeshStandardMaterial).map = texture;
              (bodyMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
            }
          },
          undefined,
          () => setWebGLError(true)
        );
      }
    );

    // 7. Ambient Particle Constellation (Floating Sparkles)
    const particleCount = 36;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 3.2;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      particleSpeeds[i] = 0.2 + Math.random() * 0.5;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xd8b4fe,
      size: 0.045,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    particlesMesh = new THREE.Points(particleGeo, particleMat);
    scene.add(particlesMesh);

    // 8. Animation & Physics Variables
    const clock = new THREE.Clock();
    let nextBlinkTime = 2.8;
    let blinkTimer = 0;
    let isBlinking = false;
    let blinkProgress = 0;

    let targetHeadRotX = 0;
    let targetHeadRotY = 0;
    let targetHeadRotZ = 0;
    let currentHeadRotX = 0;
    let currentHeadRotY = 0;
    let currentHeadRotZ = 0;

    let mouseX = 0;
    let mouseY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // 9. Responsive Resize Handler (+12% to +15% Apparent Scale, Complete Silhouette Visible)
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 640;
      camera.aspect = w / h;

      const vFov = (camera.fov * Math.PI) / 180;
      // Calibrated: Chloé is 3.65 units high. Desired visible frame height = 3.82 units.
      // This leaves ~5% top margin for wavy hair and ~5% bottom margin for boots,
      // resulting in a 12-14% increase in apparent size compared to previous 4.4m framing!
      const desiredHeight = 3.82;
      const distance = desiredHeight / (2 * Math.tan(vFov / 2));

      camera.position.z = distance;
      camera.position.y = isSidePanel ? 0.0 : 0.02;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);
    handleResize();

    // 10. Main Animation Render Loop (Optimized for Snapdragon 8 Gen 3)
    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible || !renderer || !scene || !camera) return;

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const currentState = stateRef.current;
      const currentPreferences = preferencesRef.current;
      const animated = currentPreferences.animated;

      // 1. Stable Character Stance: Anchored, steady, dignified (no unwanted sway or drift)
      if (bodyMesh) {
        bodyMesh.position.set(0, 0, 0);
        bodyMesh.rotation.set(0, 0, 0);
        bodyMesh.scale.set(1, 1, 1);
        shadowMesh.scale.set(1, 1, 1);
      }

      // 2. Stable Head Alignment: Centered and looking forward (no pointer-induced skewing)
      if (headPivot) {
        headPivot.position.set(0, 1.15, 0.015);
        headPivot.rotation.set(0, 0, 0);
      }

      // 3. Eye Blinking System (Natural intervals 3.2s - 4.8s)
      if (animated) {
        blinkTimer += delta;
        if (!isBlinking && blinkTimer > nextBlinkTime) {
          isBlinking = true;
          blinkTimer = 0;
          nextBlinkTime = 3.2 + Math.random() * 1.8;
        }

        if (isBlinking) {
          const blinkDuration = 0.15; // 150ms blink cycle
          const progress = blinkTimer / blinkDuration;

          if (progress <= 0.45) {
            blinkProgress = progress / 0.45;
          } else if (progress <= 1.0) {
            blinkProgress = 1 - (progress - 0.45) / 0.55;
          } else {
            blinkProgress = 0;
            isBlinking = false;
          }

          if ((scene as any)._drawBlink) {
            (scene as any)._drawBlink(blinkProgress);
          }
        }
      }

      // 4. Dynamic Lighting Modulation by State
      switch (currentState) {
        case 'listening':
          rimLightRight.color.setHex(0x06b6d4);
          rimLightRight.intensity = 2.4;
          rimLightLeft.color.setHex(0x3b82f6);
          break;
        case 'thinking':
          rimLightRight.color.setHex(0xa855f7);
          rimLightRight.intensity = 2.2 + Math.sin(time * 3) * 0.5;
          rimLightLeft.color.setHex(0x6366f1);
          break;
        case 'speaking':
          rimLightRight.color.setHex(0xec4899);
          rimLightRight.intensity = 2.4 + Math.sin(time * 6) * 0.4;
          rimLightLeft.color.setHex(0x9333ea);
          break;
        case 'greeting':
        case 'happy':
          rimLightRight.color.setHex(0xf59e0b);
          rimLightRight.intensity = 2.5;
          rimLightLeft.color.setHex(0x10b981);
          break;
        case 'idle':
        default:
          rimLightRight.color.setHex(0x8b5cf6);
          rimLightRight.intensity = 1.6;
          rimLightLeft.color.setHex(0x6366f1);
          break;
      }

      // 5. Orbiting Ambient Particles
      if (particlesMesh && currentPreferences.ambientParticles) {
        const positions = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += particleSpeeds[i] * delta * 0.35;
          if (positions[i * 3 + 1] > 2.2) {
            positions[i * 3 + 1] = -2.2;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
        particlesMesh.rotation.y = time * 0.06;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();

      if ((scene as any)._unsubscribeLipSync) {
        (scene as any)._unsubscribeLipSync();
      }

      if (renderer) {
        renderer.dispose();
      }
      scene?.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, [isSidePanel]);

  // Touch and Click Interaction (Samsung S24 Raycast & Haptic feedback)
  const handleInteraction = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([18, 25]);
      } catch {}
    }

    const quotes = [
      "Bonjour ! Je suis ravie de vous retrouver.",
      "Comment puis-je vous accompagner aujourd'hui ?",
      "Je vous écoute attentivement.",
      "Prête pour vos instructions !",
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    setInteractiveFeedback(quote);
    setTimeout(() => setInteractiveFeedback(null), 3000);

    if (onTap) onTap();
  }, [onTap]);

  if (webGLError) {
    return (
      <div className={`relative flex items-center justify-center p-4 bg-purple-950/20 rounded-3xl border border-purple-500/20 ${className}`}>
        <img
          src="/chloe-avatar-fullbody.webp"
          alt="Chloé"
          className="max-h-[85vh] object-contain drop-shadow-[0_10px_25px_rgba(168,85,247,0.3)]"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('chloe-avatar-fullbody_f3fa7d52.webp')) {
              target.src = '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp';
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleInteraction}
      className={`relative w-full h-full min-h-[380px] overflow-hidden rounded-3xl bg-radial from-[#15102a]/70 via-[#0a0817]/90 to-[#04020a] select-none cursor-pointer ${className}`}
    >
      {/* Ambient Pulsing Aura in background */}
      <div className="absolute inset-x-12 top-10 bottom-20 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

      {/* WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Interactive Speech Bubble Feedback */}
      {interactiveFeedback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-2xl bg-purple-950/90 border border-purple-500/40 text-purple-100 text-xs shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          {interactiveFeedback}
        </div>
      )}
    </div>
  );
};
