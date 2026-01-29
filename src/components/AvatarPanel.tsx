import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Activity, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import AICoachChat from './AICoachChat';

const AVATAR_URL =
  'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Michelle.glb'; 
  // Fallback: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RobotExpressive/glTF-Binary/RobotExpressive.glb'

// Copyright-free ambient futuristic/upbeat track
const BACKGROUND_MUSIC_URL = 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3?filename=start-now-124673.mp3';


const pickGesture = (names: string[]) => {
  const lower = names.map((name) => name.toLowerCase());
  // Prefer Idle/Standing for human-like start
  for (const preferred of ['idle', 'standing', 'breathing']) {
    const matchIndex = lower.findIndex((name) => name.includes(preferred));
    if (matchIndex >= 0) {
      return names[matchIndex];
    }
  }
  return names[0];
};

const pickNextGesture = (names: string[], current: string | null) => {
  if (names.length === 0) {
    return null;
  }
  
  // Randomly pick any other gesture to show full variety of moves
  const candidates = names.filter((name) => name !== current);
  if (candidates.length === 0) {
    return current;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
};

export const AvatarPanel: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [_currentGesture, setCurrentGesture] = useState('Initializing');
  
  // Audio state
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Chat panel state
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);

  // Handle Audio
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = 0.3; // Gentle background volume
        if (!isMuted) {
            // Browser autoplay policy might block this without user interaction first
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Audio autoplay prevented:", error);
                    setIsMuted(true); // Revert UI if blocked
                });
            }
        } else {
            audioRef.current.pause();
        }
    }
  }, [isMuted]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) {
      return;
    }

    let frameId = 0;
    let mixer: THREE.AnimationMixer | null = null;
    let activeAction: THREE.AnimationAction | null = null;
    let avatarRoot: THREE.Object3D | null = null;
    let gestureTimer: number | null = null;
    let headBone: THREE.Object3D | null = null;
    let spineBone: THREE.Object3D | null = null;

    const mouse = new THREE.Vector2();
    const targetLook = new THREE.Vector3();
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX - windowHalfX) / 2; 
      mouse.y = (event.clientY - windowHalfY) / 2;
    };
    document.addEventListener( 'mousemove', onDocumentMouseMove );

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x05060a, 2, 10);
    // Anime background color (very dark blue/purple) if not transparent
    // scene.background = new THREE.Color(0x1a1a2e);

    // Adjusted camera for better framing of full body character in portrait mode
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    // Move camera closer (z=2.2) and center vertically (y=0) to focus on the character body
    camera.position.set(0, 0, 2.2); 

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Enable shadow map for depth
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Anime Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Soft global light
    const keyLight = new THREE.DirectionalLight(0xffeebb, 1.2); // Warm sunlight
    keyLight.position.set(2, 5, 5);
    keyLight.castShadow = true;
    
    // Rim light for that anime edge highlight
    const rimLight = new THREE.DirectionalLight(0x88ccff, 1.5);
    rimLight.position.set(-3, 3, -3);

    const fillLight = new THREE.PointLight(0xffaaee, 0.5, 10); // Pinkish fill
    fillLight.position.set(3, 0, 3);
    
    scene.add(ambientLight, keyLight, rimLight, fillLight);

    // Create a simple gradient map for Toon Shading if we wanted to enforce it manually,
    // but for now we'll rely on good lighting and smooth geometry.

    const loader = new GLTFLoader();
    const clock = new THREE.Clock();

    loader.load(
      AVATAR_URL,
      (gltf: GLTF) => {
        const root = gltf.scene;
        avatarRoot = root;
        
        // Center vertically:
        // Position feet at -0.9 so the center of a ~1.8m character is roughly at (0,0,0)
        root.position.set(0, -0.9, 0);
        // Michelle is huge, scale down or up depending on model
        // RobotExpressive needed 1.05. Michelle might need adjustment.
        // Usually safe to normalize scale later, but let's try 1.0 first.
        root.scale.set(1.0, 1.0, 1.0); 

        // Find bones for human behavior
        root.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Attempt to give it a more 'anime' look by tweaking materials
            if (child.material) {
                // child.material.roughness = 0.5;
                // child.material.metalness = 0.1;
            }
          }
          if (child instanceof THREE.Bone) {
             const name = child.name.toLowerCase();
             if (name.includes('head')) headBone = child;
             if (name.includes('spine') || name.includes('chest')) spineBone = child;
          }
        });
        scene.add(root);

        mixer = new THREE.AnimationMixer(root);
        const actions: Record<string, THREE.AnimationAction> = {};
        gltf.animations.forEach((clip: THREE.AnimationClip) => {
          actions[clip.name] = mixer?.clipAction(clip) as THREE.AnimationAction;
        });
        
        const names = Object.keys(actions).filter(
          (name) => !name.toLowerCase().includes('death') && !name.toLowerCase().includes('tpose')
        );

        if (names.length > 0) {
            let initial = pickGesture(names);
            // If we grabbed Michelle, 'Idle' might not exist, maybe 'mixamo.com' is the name
            if (!actions[initial]) initial = names[0];
            
            activeAction = actions[initial];
            activeAction.reset().fadeIn(0.6).play();
            setCurrentGesture(initial);

            gestureTimer = window.setInterval(() => {
              // Ensure we have gestures to pick from
              if (names.length <= 1) return;

              const next = pickNextGesture(names, activeAction?.getClip().name ?? null);
              if (!next || !actions[next]) return;
              
              const prevAction = activeAction;
              
              // Crossfade
              activeAction = actions[next];
              activeAction.reset().fadeIn(0.6).play();
              if (prevAction && prevAction !== activeAction) {
                  prevAction.fadeOut(0.6);
              }
              
              setCurrentGesture(next);
            }, 3500); // Faster transitions (3.5s) so user sees changes live
        } else {
             setCurrentGesture('Alive');
        }
      },
      undefined,
      (err) => {
        console.error('Avatar load error', err);
        setCurrentGesture('Offline');
      }
    );

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) {
        return;
      }
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixer?.update(delta);
      const t = clock.elapsedTime;

      // "Human" Behavior: Breathing and Looking
      if (avatarRoot) {
        // Subtle floating / breathing sway
        avatarRoot.position.y = -0.9 + Math.sin(t * 1.5) * 0.005;
        
        // Head Tracking
        if (headBone) {
             // Interpolate look target
             targetLook.set( mouse.x * 0.001, mouse.y * 0.001 + 1.5, 5 ); // Look at a plane in front
             
             // Simple head rotation limits
             // We want the head to turn towards the mouse slightly
             // Map mouse X/Y to angles
             const targetY = -mouse.x * 0.0005; // Yaw
             const targetX = -mouse.y * 0.0005; // Pitch
             
             // Smooth lerp
             headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, targetY, 0.1);
             headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, targetX, 0.1);
        }
        
        // Spine breathing expansion
        if (spineBone) {
             const breath = Math.sin(t * 2) * 0.02 + 1;
             spineBone.scale.set(breath, breath, breath);
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      document.removeEventListener('mousemove', onDocumentMouseMove);
      if (gestureTimer) {
        window.clearInterval(gestureTimer);
      }
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="avatar-panel flex flex-col h-full">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={BACKGROUND_MUSIC_URL} loop />

      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500 p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="avatar-dot" />
          <span>ARIA</span>
        </div>
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowAvatar(!showAvatar)} 
                className="hover:text-sky-400 transition-colors focus:outline-none"
                title={showAvatar ? "Hide Avatar" : "Show Avatar"}
             >
                {showAvatar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
             </button>
             <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="hover:text-sky-400 transition-colors focus:outline-none"
                title={isMuted ? "Play Music" : "Mute Music"}
             >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
             </button>
             <Activity size={14} className="text-sky-400" />
        </div>
      </div>

      {/* Collapsible Avatar Section */}
      {showAvatar && (
        <div className="avatar-canvas h-48 min-h-[12rem] relative border-b border-slate-800/50">
          <div ref={mountRef} className="absolute inset-0" />
        </div>
      )}

      {/* AI Coach Chat - Takes remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AICoachChat 
          isExpanded={isChatExpanded} 
          onToggleExpand={() => setIsChatExpanded(!isChatExpanded)} 
        />
      </div>
    </div>
  );
};
