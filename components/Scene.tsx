
import React, { Suspense, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Float, Grid, GizmoHelper, GizmoViewport, Gltf, TransformControls, CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import DynamicObject from './DynamicObject';
import { ObjectData, CameraState, EnvironmentConfig, FaceConfig } from '../types';

interface GridConfig {
  sectionColor: string;
  cellColor: string;
}

interface SceneProps {
  objects: ObjectData[];
  selectedId: string | null;
  onObjectSelect: (id: string | null) => void;
  onObjectContextMenu: (id: string, e: ThreeEvent<MouseEvent>) => void;
  onBackgroundContextMenu: (e: React.MouseEvent) => void;
  exportTrigger?: number;
  onExportComplete?: () => void;
  showAxes?: boolean;
  uploadedModelUrl?: string | null;
  gridConfig: GridConfig;
  environmentConfig?: EnvironmentConfig;
  transformMode: 'translate' | 'rotate' | 'scale';
  onTransformChange: (id: string, newData: Partial<ObjectData>) => void;
  resetCameraTrigger?: number;
  showHelpers?: boolean;
  isPhysicsRunning?: boolean;
  onEnvError?: (msg: string) => void;
}

export interface SceneRef {
  getCameraState: () => CameraState | null;
  setCameraState: (state: CameraState) => void;
  focusOnId: (id: string) => void;
  setView: (view: 'perspective' | 'top' | 'front' | 'side') => void;
}

const ExporterHelper = ({ trigger, onComplete, contentRef }: { trigger?: number; onComplete?: () => void; contentRef: React.RefObject<THREE.Group>; }) => {
  useEffect(() => {
    if (!trigger || trigger === 0 || !contentRef.current) return;
    const exporter = new GLTFExporter();
    exporter.parse(
      contentRef.current,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: 'application/octet-stream' });
          const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'scene.glb'; link.click();
        } else {
          const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'text/plain' });
          const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'scene.gltf'; link.click();
        }
        if (onComplete) onComplete();
      },
      (error) => { console.error('Export error:', error); if (onComplete) onComplete(); },
      { binary: true }
    );
  }, [trigger, contentRef, onComplete]);
  return null;
};

const SafeTransformControls: React.FC<any> = ({ object, ...props }) => {
  const [ready, setReady] = useState(false);
  const frameCount = useRef(0);
  useEffect(() => { setReady(false); frameCount.current = 0; }, [object]);
  useFrame(() => {
    if (object && object.parent) {
        if (frameCount.current > 1) { if (!ready) setReady(true); } else { frameCount.current++; }
    } else if (ready) { setReady(false); frameCount.current = 0; }
  });
  if (!ready || !object || !object.parent) return null;
  return <TransformControls object={object} {...props} />;
};

const FaceMaterial = ({ config, attach, defaultColor = '#0f172a', onError }: { config: FaceConfig; attach: string; defaultColor?: string; onError?: (msg: string) => void }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const reportedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!config.url) {
      setTexture(null);
      return;
    }
    // If we've already reported an error for this specific URL, don't try loading again immediately to prevent loops
    // But we allow if the URL changes
    if (reportedRef.current !== config.url) {
        reportedRef.current = null;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      config.url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.center.set(0.5, 0.5);
        tex.rotation = (config.rotation * Math.PI) / 180;
        tex.repeat.set(config.flipX ? -1 : 1, config.flipY ? -1 : 1);
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.warn(`Face load error for ${attach}:`, err);
        if (onError && reportedRef.current !== config.url) {
            reportedRef.current = config.url;
            onError(`Failed to load skybox face: ${config.url}`);
        }
        setTexture(null);
      }
    );
  }, [config.url, config.rotation, config.flipX, config.flipY, attach, onError]);

  return <meshBasicMaterial attach={attach} side={THREE.BackSide} map={texture} color={texture ? "white" : defaultColor} />;
};

const Room = ({ config, onError }: { config: EnvironmentConfig; onError?: (msg: string) => void }) => {
  return (
    <mesh position={[0, 49.9, 0]} receiveShadow>
       <boxGeometry args={[100, 100, 100]} />
       <FaceMaterial config={config.east} attach="material-0" onError={onError} />
       <FaceMaterial config={config.west} attach="material-1" onError={onError} />
       <FaceMaterial config={config.ceiling} attach="material-2" defaultColor="#1e293b" onError={onError} />
       <FaceMaterial config={config.floor} attach="material-3" defaultColor="#0f172a" onError={onError} />
       <FaceMaterial config={config.south} attach="material-4" onError={onError} />
       <FaceMaterial config={config.north} attach="material-5" onError={onError} />
    </mesh>
  );
};

const CustomReflection = ({ url, onError }: { url: string; onError?: (msg: string) => void }) => {
  const { scene } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const reportedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url) return;
    
    // Reset error tracking if URL changes
    if (reportedRef.current !== url) {
        reportedRef.current = null;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.warn('Reflection load error:', err);
        // Prevent infinite loops: only report error once per unique URL
        if (onError && reportedRef.current !== url) {
            reportedRef.current = url;
            onError(`Failed to load custom reflection: ${url}`);
        }
        setTexture(null);
      }
    );
  }, [url, onError]);

  useEffect(() => {
    if (texture) {
      const prevEnv = scene.environment;
      scene.environment = texture;
      return () => { 
          scene.environment = prevEnv;
          texture.dispose(); // Clean up texture memory
      };
    }
  }, [texture, scene]);

  return null;
};

const ALLOWED_PRESETS = ['apartment', 'city', 'dawn', 'forest', 'lobby', 'night', 'park', 'studio', 'sunset', 'warehouse'];

const Scene = forwardRef<SceneRef, SceneProps>(({ objects, selectedId, onObjectSelect, onObjectContextMenu, onBackgroundContextMenu, exportTrigger, onExportComplete, showAxes = true, uploadedModelUrl, gridConfig, environmentConfig, transformMode, onTransformChange, resetCameraTrigger, showHelpers = true, isPhysicsRunning = false, onEnvError }, ref) => {
  const contentRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<CameraControls>(null);
  const objectRefs = useRef<Map<string, THREE.Object3D>>(new Map());

  useImperativeHandle(ref, () => ({
    getCameraState: () => {
        if (!controlsRef.current) return null;
        const pos = controlsRef.current.getPosition(new THREE.Vector3());
        const target = controlsRef.current.getTarget(new THREE.Vector3());
        return { position: [pos.x, pos.y, pos.z], target: [target.x, target.y, target.z] };
    },
    setCameraState: (state: CameraState) => {
        if (!controlsRef.current) return;
        controlsRef.current.setLookAt(state.position[0], state.position[1], state.position[2], state.target[0], state.target[1], state.target[2], true);
    },
    focusOnId: (id: string) => {
        const obj = objectRefs.current.get(id);
        if (obj && controlsRef.current) {
            const box = new THREE.Box3().setFromObject(obj);
            controlsRef.current.fitToBox(box, true, { paddingTop: 1, paddingBottom: 1, paddingLeft: 1, paddingRight: 1 });
        }
    },
    setView: (view: 'perspective' | 'top' | 'front' | 'side') => {
        if (!controlsRef.current) return;
        switch (view) {
            case 'perspective': controlsRef.current.setLookAt(5, 5, 5, 0, 0, 0, true); break;
            case 'top': controlsRef.current.setLookAt(0, 10, 0, 0, 0, 0, true); break;
            case 'front': controlsRef.current.setLookAt(0, 2, 10, 0, 2, 0, true); break;
            case 'side': controlsRef.current.setLookAt(10, 2, 0, 0, 2, 0, true); break;
        }
    }
  }));

  useEffect(() => { if (resetCameraTrigger && resetCameraTrigger > 0 && controlsRef.current) controlsRef.current.setLookAt(5, 5, 5, 0, 0, 0, true); }, [resetCameraTrigger]);

  const handleTransformMouseUp = () => {
    if (selectedId && objectRefs.current.has(selectedId)) {
        const obj = objectRefs.current.get(selectedId);
        if (obj) onTransformChange(selectedId, { position: [obj.position.x, obj.position.y, obj.position.z], rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z], scale: [obj.scale.x, obj.scale.y, obj.scale.z] });
        setTimeout(() => { if(controlsRef.current) controlsRef.current.enabled = true; }, 50);
    }
  };

  const reflectionPreset = environmentConfig?.reflectionPreset || 'city';
  const customReflectionUrl = environmentConfig?.customReflectionUrl;

  const activeObject = selectedId && objectRefs.current.get(selectedId);

  return (
    <div className="w-full h-full bg-slate-900" onContextMenu={onBackgroundContextMenu}>
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }} onPointerMissed={() => onObjectSelect(null)}>
        <Physics gravity={[0, -9.81, 0]}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <RigidBody type="fixed" position={[0, -0.05, 0]} restitution={0.5} friction={1}>
             <CuboidCollider args={[100, 0.05, 100]} />
          </RigidBody>

          <Suspense fallback={null}>
            <group ref={contentRef} position={[0, 0, 0]}>
              {environmentConfig && <Room config={environmentConfig} onError={onEnvError} />}
              {uploadedModelUrl && <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}><Gltf src={uploadedModelUrl} scale={2} /></Float>}
              {objects.map((obj) => (
                <DynamicObject key={obj.id} ref={(el) => { if (el) objectRefs.current.set(obj.id, el); else objectRefs.current.delete(obj.id); }} data={obj} isRoot isSelected={obj.id === selectedId && !uploadedModelUrl} onClick={() => onObjectSelect(obj.id)} onContextMenu={(e) => onObjectContextMenu(obj.id, e)} showHelpers={showHelpers} isPhysicsRunning={isPhysicsRunning} />
              ))}
            </group>
            {activeObject && !uploadedModelUrl && (
                <SafeTransformControls key={selectedId} object={activeObject} mode={transformMode} onMouseUp={handleTransformMouseUp} onMouseDown={() => { if(controlsRef.current) controlsRef.current.enabled = false; }} size={1.2} visible={showHelpers && !isPhysicsRunning} />
            )}
            <group position={[0, -0.01, 0]}> 
              <Grid infiniteGrid fadeDistance={50} fadeStrength={5} sectionColor={gridConfig.sectionColor} cellColor={gridConfig.cellColor} sectionSize={5} />
            </group>
            {reflectionPreset === 'custom' && customReflectionUrl ? ( <CustomReflection url={customReflectionUrl} onError={onEnvError} /> ) : ( ALLOWED_PRESETS.includes(reflectionPreset) && <Environment preset={reflectionPreset as any} background={false} /> )}
            <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
          </Suspense>
        </Physics>
        {showAxes && <GizmoHelper alignment="bottom-right" margin={[140, 80]}><GizmoViewport labelColor="white" axisColors={['#ef4444', '#22c55e', '#3b82f6']} /></GizmoHelper>}
        <ExporterHelper trigger={exportTrigger} onComplete={onExportComplete} contentRef={contentRef} />
        <CameraControls ref={controlsRef} makeDefault smoothTime={0.25} minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
      </Canvas>
    </div>
  );
});

export default Scene;
