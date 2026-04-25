import {
  AccumulativeShadows,
  Billboard,
  ContactShadows,
  Environment,
  Grid,
  Line,
  OrbitControls,
  RandomizedLight,
  RoundedBox,
  Text,
} from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { getMaterialSettings } from '../utils/sofaEngine';

function getSceneFootprint(config) {
  const width = (config.type === 'L-Shape' ? Math.max(config.mainLength, config.sideLength) : config.length) / 24;
  const depth = (config.type === 'L-Shape' ? config.sideLength : config.depth) / 24;
  const height = config.height / 24;
  return {
    width: Math.max(width, 3.5),
    depth: Math.max(depth, 1.8),
    height: Math.max(height, 1.2),
  };
}

function getViewPreset(footprint, viewMode) {
  const span = Math.max(footprint.width, footprint.depth);
  const target = new THREE.Vector3(0, footprint.height * 0.45, -0.28);

  if (viewMode === 'top') {
    return {
      position: new THREE.Vector3(0, Math.max(footprint.width, footprint.depth) * 1.5 + 1.8, 0.001),
      target,
      fov: 24,
    };
  }

  if (viewMode === 'front') {
    return {
      position: new THREE.Vector3(0, footprint.height * 1.32 + 0.8, span * 1.85),
      target,
      fov: 26,
    };
  }

  if (viewMode === 'back') {
    return {
      position: new THREE.Vector3(0, footprint.height * 1.32 + 0.8, -span * 1.9),
      target,
      fov: 26,
    };
  }

  if (viewMode === 'side') {
    return {
      position: new THREE.Vector3(span * 2, footprint.height * 1.2 + 0.65, -0.24),
      target,
      fov: 28,
    };
  }

  return {
    position: new THREE.Vector3(span * 0.95, footprint.height * 2.15 + 1.2, span * 1.08),
    target,
    fov: 30,
  };
}

function SofaMesh({ part, materialSettings }) {
  const material = useMemo(() => {
    const multiplier = part.variant === 'cushion' ? 1.08 : part.variant === 'frame' ? 0.86 : 0.96;
    const color = part.variant === 'leg' ? '#5b4633' : part.variant === 'seam' ? '#1f2937' : materialSettings.color;

    return {
      ...materialSettings,
      color,
      roughness: Math.min(1, materialSettings.roughness + (part.variant === 'cushion' ? 0.04 : 0)),
      emissive: '#000000',
      envMapIntensity: multiplier,
    };
  }, [materialSettings, part.variant]);

  return (
    <mesh castShadow receiveShadow position={part.position} rotation={part.rotation || [0, 0, 0]}>
      {part.shape === 'cylinder' ? (
        <cylinderGeometry args={[part.radius, part.radius, part.height, 18]} />
      ) : (
        <boxGeometry args={part.size} />
      )}
      <meshPhysicalMaterial {...material} />
    </mesh>
  );
}

function DimensionAnnotation({ annotation }) {
  if (annotation.type === 'text') {
    return (
      <Billboard position={annotation.position} follow>
        <Text
          fontSize={annotation.size || 0.16}
          color={annotation.color || '#0f172a'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#ffffff"
        >
          {annotation.text}
        </Text>
      </Billboard>
    );
  }

  return (
    <group>
      <Line points={annotation.points} color="#2563eb" lineWidth={2.8} />
      {annotation.points.map((point, index) => (
        <mesh key={`${annotation.id}-cap-${index}`} position={point}>
          <sphereGeometry args={[0.055, 14, 14]} />
          <meshBasicMaterial color="#2563eb" />
        </mesh>
      ))}
      <Billboard position={annotation.labelPosition} follow>
        <Text
          fontSize={0.18}
          color="#1d4ed8"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.014}
          outlineColor="#ffffff"
        >
          {annotation.text}
        </Text>
      </Billboard>
    </group>
  );
}

function ShowroomStage({ footprint }) {
  return (
    <group>
      <RoundedBox
        args={[footprint.width + 2.2, 0.16, footprint.depth + 2.4]}
        radius={0.12}
        smoothness={4}
        position={[0, -0.08, -0.35]}
        receiveShadow
      >
        <meshStandardMaterial color="#e8eef7" roughness={0.92} metalness={0.02} />
      </RoundedBox>

      <mesh position={[0, footprint.height * 0.65, -footprint.depth * 0.8 - 1.2]} receiveShadow>
        <planeGeometry args={[footprint.width + 4.8, footprint.height + 4.6]} />
        <meshStandardMaterial color="#f6f7fb" roughness={1} metalness={0} />
      </mesh>

      <mesh position={[0, footprint.height + 1.3, -footprint.depth * 0.8 - 1.18]}>
        <planeGeometry args={[footprint.width + 4, 0.7]} />
        <meshBasicMaterial color="#dbeafe" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

function Scene({ config, sofaModel, showMeasurements }) {
  const materialSettings = useMemo(() => getMaterialSettings(config.material, config.color), [config.material, config.color]);
  const footprint = useMemo(() => getSceneFootprint(config), [config]);

  return (
    <>
      <color attach="background" args={['#edf3fb']} />
      <fog attach="fog" args={['#edf3fb', 10, 22]} />
      <ambientLight intensity={0.8} />
      <hemisphereLight intensity={0.7} color="#ffffff" groundColor="#dbe4f0" />
      <directionalLight castShadow position={[5, 8, 5]} intensity={1.8} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight position={[-5, 6, 4]} angle={0.4} penumbra={0.5} intensity={65} color="#dbeafe" />
      <pointLight position={[4, 3, -4]} intensity={24} distance={18} color="#fde68a" />

      <ShowroomStage footprint={footprint} />

      <group position={[0, 0, -0.4]}>
        {sofaModel.parts.map((part) => (
          <SofaMesh key={part.id} part={part} materialSettings={materialSettings} />
        ))}
        {showMeasurements
          ? sofaModel.annotations.map((annotation) => (
              <DimensionAnnotation key={annotation.id} annotation={annotation} />
            ))
          : null}
      </group>

      <Grid
        position={[0, -0.01, -0.35]}
        args={[16, 12]}
        cellSize={0.45}
        cellThickness={0.7}
        cellColor="#cbd5e1"
        sectionSize={2}
        sectionThickness={1.2}
        sectionColor="#94a3b8"
        fadeDistance={18}
        infiniteGrid={false}
      />

      <AccumulativeShadows position={[0, 0, -0.35]} frames={80} alphaTest={0.8} scale={12} opacity={0.55} color="#98a9c7">
        <RandomizedLight amount={7} radius={4.5} ambient={0.4} intensity={0.9} position={[5, 5, -1]} bias={0.001} />
      </AccumulativeShadows>
      <ContactShadows position={[0, 0.04, -0.35]} opacity={0.26} scale={11} blur={2.1} far={6} />
      <Environment resolution={128}>
        <mesh position={[0, 5, -4]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[4, 3, 2]}>
          <sphereGeometry args={[0.6, 24, 24]} />
          <meshBasicMaterial color="#dbeafe" />
        </mesh>
        <mesh position={[-4, 2, 1]}>
          <sphereGeometry args={[0.6, 24, 24]} />
          <meshBasicMaterial color="#fde68a" />
        </mesh>
      </Environment>
    </>
  );
}

function CameraRig({ config, viewMode, controlsRef, isInteracting }) {
  const { camera } = useThree();
  const footprint = useMemo(() => getSceneFootprint(config), [config]);
  const preset = useMemo(() => getViewPreset(footprint, viewMode), [footprint, viewMode]);
  const animatedPosition = useRef(preset.position.clone());
  const animatedTarget = useRef(preset.target.clone());
  const transitionActive = useRef(true);
  const holdPreset = useRef(viewMode !== '3d');

  useEffect(() => {
    camera.fov = preset.fov;
    camera.updateProjectionMatrix();
    animatedPosition.current.copy(camera.position);
    animatedTarget.current.copy(controlsRef.current?.target || preset.target);
    transitionActive.current = true;
    holdPreset.current = viewMode !== '3d';
  }, [camera, controlsRef, preset, viewMode]);

  useFrame(() => {
    if (isInteracting.current) {
      return;
    }

    if (!transitionActive.current && !holdPreset.current) {
      return;
    }

    animatedPosition.current.lerp(preset.position, 0.1);
    animatedTarget.current.lerp(preset.target, 0.1);

    camera.position.copy(animatedPosition.current);
    if (controlsRef.current) {
      controlsRef.current.target.copy(animatedTarget.current);
      controlsRef.current.update();
    } else {
      camera.lookAt(animatedTarget.current);
    }

    if (
      camera.position.distanceTo(preset.position) < 0.03 &&
      animatedTarget.current.distanceTo(preset.target) < 0.03
    ) {
      animatedPosition.current.copy(preset.position);
      animatedTarget.current.copy(preset.target);
      transitionActive.current = false;
    }
  });

  return null;
}

function ViewerPill({ label, value }) {
  return (
    <div className="rounded-full border border-white/80 bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

export default function SofaViewer({ config, sofaModel, viewMode, onViewModeChange }) {
  const [autoRotate, setAutoRotate] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const controlsRef = useRef(null);
  const isInteracting = useRef(false);

  useEffect(() => {
    if (viewMode !== '3d') {
      setAutoRotate(false);
    }
  }, [viewMode]);

  return (
    <main className="relative h-[620px] min-h-[560px] touch-pan-y bg-[linear-gradient(180deg,_rgba(248,250,252,0.82)_0%,_rgba(226,232,240,0.96)_100%)] sm:h-[64vh] sm:min-h-[520px] md:h-[68vh] xl:h-[72vh]">
      <Canvas
        shadows
        camera={{ position: [5.8, 4.8, 7.6], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          <CameraRig config={config} viewMode={viewMode} controlsRef={controlsRef} isInteracting={isInteracting} />
          <Scene config={config} sofaModel={sofaModel} showMeasurements={showMeasurements || viewMode !== '3d'} />
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.12}
            rotateSpeed={0.9}
            zoomSpeed={0.9}
            minDistance={4}
            maxDistance={13}
            autoRotate={autoRotate && viewMode === '3d'}
            autoRotateSpeed={0.8}
            enablePan={false}
            maxPolarAngle={Math.PI / 2.03}
            minPolarAngle={Math.PI / 7}
            touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
            onStart={() => {
              isInteracting.current = true;
              setAutoRotate(false);
            }}
            onEnd={() => {
              window.setTimeout(() => {
                isInteracting.current = false;
              }, 120);
            }}
          />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,_rgba(255,255,255,0.92)_0%,_rgba(255,255,255,0)_100%)]" />

      <div className="pointer-events-none absolute left-3 top-3 right-3 flex flex-col gap-3 sm:left-5 sm:top-5 sm:right-auto sm:max-w-[320px]">
        <div className="rounded-2xl border border-white/70 bg-white/78 px-3 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:rounded-[22px] sm:px-4 sm:py-4">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-700">
            {config.sofaCategory} / {config.material}
          </p>
          <p className="mt-2 text-lg font-black text-slate-950 sm:text-2xl">{sofaModel.seats.label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{sofaModel.dimensions}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ViewerPill label="Theme" value={config.theme} />
            <ViewerPill label="Recliner" value={config.reclinerMode === 'None' ? 'Standard' : config.reclinerMode} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-3 right-3 flex flex-col gap-3 sm:left-5 sm:right-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {[
            ['3d', 'Main View'],
            ['top', 'Top View'],
            ['front', 'Front'],
            ['back', 'Back'],
            ['side', 'Side'],
          ].map(([mode, label]) => (
            <button
              key={mode}
              className={`h-10 rounded-full px-3 text-sm font-black shadow-sm backdrop-blur transition sm:px-4 ${
                viewMode === mode
                  ? 'border border-sky-600 bg-sky-600 text-white'
                  : 'border border-white/80 bg-white/88 text-slate-700 hover:bg-white'
              }`}
              type="button"
              onClick={() => onViewModeChange(mode)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
          <button
            className={`h-10 rounded-full px-3 text-sm font-black shadow-sm backdrop-blur transition sm:px-4 ${
              autoRotate ? 'border border-slate-900 bg-slate-900 text-white' : 'border border-white/80 bg-white/88 text-slate-700 hover:bg-white'
            }`}
            type="button"
            onClick={() => {
              onViewModeChange('3d');
              setAutoRotate((current) => !current || viewMode !== '3d');
            }}
          >
            Auto Spin
          </button>
          <button
            className={`h-10 rounded-full px-3 text-sm font-black shadow-sm backdrop-blur transition sm:px-4 ${
              showMeasurements ? 'border border-slate-900 bg-slate-900 text-white' : 'border border-white/80 bg-white/88 text-slate-700 hover:bg-white'
            }`}
            type="button"
            onClick={() => setShowMeasurements((current) => !current)}
          >
            Size Guide
          </button>
        </div>
      </div>
    </main>
  );
}
