
import React, { useRef, useMemo, forwardRef, useEffect, useState } from 'react';
import { useFrame, extend, ThreeEvent } from '@react-three/fiber';
import { Geometry, Base, Subtraction, Addition, Intersection } from '@react-three/csg';
import { Brush } from 'three-bvh-csg';
import { RigidBody, InstancedRigidBodies } from '@react-three/rapier';
import { ObjectData, TexturePreset, ParticleConfig, MaterialConfig, LiquidConfig } from '../types';
import { ShapeGeometryRenderer } from './ShapeSystem';
import * as THREE from 'three';

extend({ Brush });

export interface DynamicObjectProps {
  data: ObjectData;
  isRoot?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void;
  isSelected?: boolean;
  showHelpers?: boolean;
  isPhysicsRunning?: boolean;
}

// Helper to sanitize vector data to ensure it's always an array [x,y,z]
// This prevents React Invariant Error #31 by ensuring we never pass objects like {x,y,z} 
// into props that might cause them to be treated as children or rendered incorrectly.
const sanitizeVector = (v: any, defaultVal: [number, number, number] = [0, 0, 0]): [number, number, number] => {
    if (!v) return defaultVal;
    if (Array.isArray(v)) return [Number(v[0]) || 0, Number(v[1]) || 0, Number(v[2]) || 0];
    if (typeof v === 'object') return [Number(v.x) || 0, Number(v.y) || 0, Number(v.z) || 0];
    return defaultVal;
};

const ParticleSystem: React.FC<{ config?: ParticleConfig; color: string }> = ({ config, color }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const geomRef = useRef<THREE.BufferGeometry>(null);
    
    const c = useMemo(() => {
        const safeNum = (v: any, def: number) => {
            // Robust check: if value is an object (vector), prefer Y component (gravity) or X/Z if Y missing.
            // This handles legacy or raw JSON imports where gravity might be {x,y,z}
            if (typeof v === 'object' && v !== null) {
                return Number(v.y) || Number(v.x) || Number(v.z) || def;
            }
            const n = Number(v);
            return Number.isFinite(n) ? n : def;
        };

        const resolveColor = (val: any) => {
             if (typeof val === 'string' && val.trim().length > 0) {
                 let col = val.trim();
                 // Strip alpha from 8-digit hex if present
                 if (col.startsWith('#') && col.length === 9) {
                    return col.substring(0, 7);
                 }
                 return col;
             }
             return null;
        }

        let start = resolveColor(config?.colorStart);
        if (!start) start = (color || '#ffffff');
        
        let end = resolveColor(config?.colorEnd);
        if (!end) end = start;

        return {
            count: Math.floor(safeNum(config?.count, 1000)),
            size: safeNum(config?.size, 0.2), 
            speed: safeNum(config?.speed, 1),
            lifeTime: Math.max(0.1, safeNum(config?.lifeTime, 1.5)),
            spread: safeNum(config?.spread, 1),
            gravity: safeNum(config?.gravity, 0),
            colorStart: new THREE.Color(start),
            colorEnd: new THREE.Color(end),
            blending: config?.blending || 'additive',
            opacity: safeNum(config?.opacity, 0.8)
        };
    }, [config, color]);

    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
            grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
            grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }, []);

    const particles = useMemo(() => {
        const positions = new Float32Array(c.count * 3);
        const colors = new Float32Array(c.count * 3);
        const velocities = new Float32Array(c.count * 3);
        const lifetimes = new Float32Array(c.count);
        
        const startR = c.colorStart.r; 
        const startG = c.colorStart.g; 
        const startB = c.colorStart.b;

        const resetParticle = (i: number, isInitial = false) => {
            const r = Math.random() * 0.2; 
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            positions[i * 3] = isNaN(x) ? 0 : x;
            positions[i * 3 + 1] = isNaN(y) ? 0 : y;
            positions[i * 3 + 2] = isNaN(z) ? 0 : z;
            
            const vDir = new THREE.Vector3(0, 1, 0);
            const randomDir = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
            vDir.lerp(randomDir, c.spread);
            if (vDir.lengthSq() < 0.0001) vDir.set(0, 1, 0); 
            vDir.normalize().multiplyScalar(c.speed);
            
            velocities[i * 3] = vDir.x;
            velocities[i * 3 + 1] = vDir.y;
            velocities[i * 3 + 2] = vDir.z;
            
            lifetimes[i] = c.lifeTime * (0.8 + Math.random() * 0.4); 
            
            colors[i*3] = startR; 
            colors[i*3+1] = startG; 
            colors[i*3+2] = startB;

            if (isInitial) {
                lifetimes[i] = Math.random() * c.lifeTime;
                const timePassed = c.lifeTime - lifetimes[i];
                if (!isNaN(timePassed)) {
                    positions[i*3] += velocities[i*3] * timePassed;
                    positions[i*3+1] += (velocities[i*3+1] * timePassed) + (0.5 * c.gravity * timePassed * timePassed);
                    positions[i*3+2] += velocities[i*3+2] * timePassed;
                    velocities[i*3+1] += c.gravity * timePassed;
                }
            }
        };
        for (let i = 0; i < c.count; i++) resetParticle(i, true);
        return { positions, colors, velocities, lifetimes, resetParticle };
    }, [c]); 

    useFrame((state, delta) => {
        if (!geomRef.current) return;
        const posAttr = geomRef.current.attributes.position;
        const colAttr = geomRef.current.attributes.color;
        const { positions, colors, velocities, lifetimes, resetParticle } = particles;
        const dt = Math.min(delta, 0.05);
        for (let i = 0; i < c.count; i++) {
            lifetimes[i] -= dt;
            if (lifetimes[i] <= 0) resetParticle(i);
            else {
                velocities[i * 3 + 1] += c.gravity * dt;
                positions[i * 3] += velocities[i * 3] * dt;
                positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
                positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;
            }
            const lifeRatio = 1.0 - (lifetimes[i] / c.lifeTime);
            
            let alpha = 1.0;
            if (lifeRatio < 0.1) alpha = lifeRatio / 0.1;
            else if (lifeRatio > 0.8) alpha = (1.0 - lifeRatio) / 0.2;
            alpha = Math.max(0, Math.min(1, alpha));
            
            const r = THREE.MathUtils.lerp(c.colorStart.r, c.colorEnd.r, lifeRatio);
            const g = THREE.MathUtils.lerp(c.colorStart.g, c.colorEnd.g, lifeRatio);
            const b = THREE.MathUtils.lerp(c.colorStart.b, c.colorEnd.b, lifeRatio);
            
            colors[i * 3] = r * alpha; 
            colors[i * 3 + 1] = g * alpha; 
            colors[i * 3 + 2] = b * alpha;
        }
        if (posAttr) posAttr.needsUpdate = true;
        if (colAttr) colAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} frustumCulled={false}>
            <bufferGeometry ref={geomRef} key={c.count}>
                <bufferAttribute attach="attributes-position" count={particles.positions.length / 3} array={particles.positions} itemSize={3} usage={THREE.DynamicDrawUsage} />
                <bufferAttribute attach="attributes-color" count={particles.colors.length / 3} array={particles.colors} itemSize={3} usage={THREE.DynamicDrawUsage} />
            </bufferGeometry>
            <pointsMaterial map={texture} size={c.size} transparent vertexColors={true} opacity={c.opacity} blending={c.blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending} depthWrite={false} sizeAttenuation={true} alphaTest={0.001} />
        </points>
    );
};

const useProceduralTexture = (preset?: TexturePreset) => {
    return useMemo(() => {
        if (!preset || preset === 'none') return null;
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#222222'; ctx.strokeStyle = '#222222';
        if (preset === 'grid') {
            ctx.lineWidth = 8; const step = 64;
            for(let i=0; i<=size; i+=step) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
            }
        } else if (preset === 'checker') {
            const step = 64;
            for(let y=0; y<size; y+=step) {
                for(let x=0; x<size; x+=step) {
                    if ((x/step + y/step) % 2 === 0) ctx.fillRect(x, y, step, step);
                }
            }
        } else if (preset === 'lines') {
            ctx.lineWidth = 16; const step = 64;
            for(let i=0; i<=size; i+=step) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
            }
        } else if (preset === 'noise') {
             const idata = ctx.createImageData(size, size);
             for(let i=0; i<idata.data.length; i+=4) {
                 const v = 150 + Math.random() * 105;
                 idata.data[i] = v; idata.data[i+1] = v; idata.data[i+2] = v; idata.data[i+3] = 255;
             }
             ctx.putImageData(idata, 0, 0);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2); texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
    }, [preset]); 
};

// Replaced unsafe useTexture with manual loading to prevent crashes on invalid URLs
const TextureMap: React.FC<{ url: string; attach?: string }> = ({ url, attach }) => {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        if (!url) {
            setTexture(null);
            return;
        }
        const loader = new THREE.TextureLoader();
        loader.load(
            url,
            (tex) => {
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.needsUpdate = true;
                setTexture(tex);
            },
            undefined,
            (err) => {
                console.warn(`Failed to load object texture: ${url}`, err);
                setTexture(null);
            }
        );
    }, [url]);

    if (!texture) return null;
    return <primitive object={texture} attach={attach} />;
};

const SingleMaterial: React.FC<{ mat: MaterialConfig; defaultColor: string; isSelected?: boolean; attach?: string }> = ({ mat, defaultColor, isSelected, attach }) => {
    const proceduralTex = useProceduralTexture(mat.texturePreset);
    const mapElement = mat.mapUrl ? <TextureMap url={mat.mapUrl} attach="map" /> : (proceduralTex ? <primitive object={proceduralTex} attach="map" /> : null);
    
    const materialKey = `${mat.type}-${mat.texturePreset}-${mat.mapUrl ? 'custom' : 'none'}-${mat.transparent ? 't' : 'f'}`;

    const commonProps = {
        key: materialKey,
        color: mat.color || defaultColor,
        roughness: mat.roughness,
        metalness: mat.metalness,
        transparent: mat.opacity < 1 || mat.transmission > 0,
        opacity: mat.opacity,
        wireframe: mat.wireframe,
        emissive: isSelected ? '#444444' : '#000000',
        emissiveIntensity: isSelected ? 0.2 : 0,
        side: THREE.DoubleSide,
        attach: attach
    };
    if (mat.transmission > 0 || mat.type === 'physical') {
        return <meshPhysicalMaterial {...commonProps} transmission={mat.transmission} ior={mat.ior} thickness={1.0}>{mapElement}</meshPhysicalMaterial>;
    }
    return <meshStandardMaterial {...commonProps}>{mapElement}</meshStandardMaterial>;
};

const SmartMaterial: React.FC<{ data: ObjectData; isSelected?: boolean }> = ({ data, isSelected }) => {
    const defaultMat: MaterialConfig = data.material || {
        type: 'standard', roughness: 0.5, metalness: 0, opacity: 1, transmission: 0, ior: 1.5, texturePreset: 'none', wireframe: false
    };

    if (data.faceMaterials && Array.isArray(data.faceMaterials) && data.faceMaterials.length > 0) {
        return (
            <>
                {data.faceMaterials.map((fm, i) => (
                    <SingleMaterial key={i} mat={fm} defaultColor={data.color} isSelected={isSelected} attach={`material-${i}`} />
                ))}
            </>
        );
    }
    return <SingleMaterial mat={defaultMat} defaultColor={data.color} isSelected={isSelected} />;
};

const CSGChild: React.FC<{ data: ObjectData }> = ({ data }) => {
    if (!data || typeof data !== 'object') return null;

    const OpComponent = data.operation === 'subtract' ? Subtraction : data.operation === 'intersect' ? Intersection : Addition;
    const pos = sanitizeVector(data.position, [0,0,0]);
    const rot = sanitizeVector(data.rotation, [0,0,0]);
    const scl = sanitizeVector(data.scale, [1,1,1]);

    return (
        <OpComponent position={pos} rotation={rot} scale={scl}>
            <ShapeGeometryRenderer type={data.type} text={data.text} fontUrl={data.fontUrl} />
            {Array.isArray(data.children) && data.children.map((child, i) => (
                child && typeof child === 'object' ? <CSGChild key={child.id || i} data={child} /> : null
            ))}
        </OpComponent>
    );
};

const LiquidSystem = ({ config, count = 200, scale = [1,1,1], isPhysicsRunning = false }: { config: LiquidConfig, count?: number, scale?: [number, number, number], isPhysicsRunning?: boolean }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    
    // Ensure scale is array
    const safeScale = useMemo(() => sanitizeVector(scale, [1,1,1]), [scale]);

    const instances = useMemo(() => {
        const bodies = [];
        for (let i = 0; i < count; i++) {
            bodies.push({
                key: `liquid_${i}`,
                position: [(Math.random() - 0.5) * 0.8 * safeScale[0], (Math.random() - 0.5) * 0.8 * safeScale[1], (Math.random() - 0.5) * 0.8 * safeScale[2]] as [number, number, number],
                rotation: [0, 0, 0] as [number, number, number],
                scale: [0.08, 0.08, 0.08] as [number, number, number]
            });
        }
        return bodies;
    }, [count, safeScale]);

    useEffect(() => {
        if (!isPhysicsRunning && meshRef.current) {
            const tempObj = new THREE.Object3D();
            instances.forEach((inst, i) => {
                tempObj.position.set(inst.position[0], inst.position[1], inst.position[2]);
                tempObj.rotation.set(0,0,0);
                tempObj.scale.set(0.08, 0.08, 0.08);
                tempObj.updateMatrix();
                meshRef.current?.setMatrixAt(i, tempObj.matrix);
            });
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [isPhysicsRunning, instances]);

    const content = (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
            <sphereGeometry args={[0.8, 8, 8]} />
            <meshStandardMaterial color={config.color} roughness={0.1} metalness={0.1} transparent opacity={0.8} emissive={config.color} emissiveIntensity={0.2} />
        </instancedMesh>
    );

    if (isPhysicsRunning) {
        return (
            <InstancedRigidBodies instances={instances} colliders="ball" friction={0} restitution={0.2}>
                {content}
            </InstancedRigidBodies>
        );
    }

    return content;
};

const DynamicObject = forwardRef<THREE.Object3D, DynamicObjectProps>(({ data, isRoot = false, onClick, onContextMenu, isSelected, showHelpers = true, isPhysicsRunning = false }, ref) => {
  if (!data || typeof data !== 'object') return null;

  const handlePointerDown = (e: ThreeEvent<MouseEvent>) => { if (onClick) { e.stopPropagation(); onClick(e); } };
  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => { if (onContextMenu) { e.stopPropagation(); onContextMenu(e); } };

  // Use memoization to strictly ensure transforms are always arrays
  // This prevents any malformed object data (like {x:0, y:0, z:0} from AI) from breaking R3F
  const safePos = useMemo(() => sanitizeVector(data.position, [0,0,0]), [data.position]);
  const safeRot = useMemo(() => sanitizeVector(data.rotation, [0,0,0]), [data.rotation]);
  const safeScale = useMemo(() => sanitizeVector(data.scale, [1,1,1]), [data.scale]);

  if (data.type === 'particles') {
      return (
          <group ref={ref as React.Ref<THREE.Group>} position={isRoot ? safePos : [0,0,0]} rotation={isRoot ? safeRot : [0,0,0]} scale={isRoot ? safeScale : [1,1,1]} onPointerDown={isRoot ? handlePointerDown : undefined} onContextMenu={isRoot ? handleContextMenu : undefined}>
              <ParticleSystem config={data.particleConfig} color={data.color} />
              {isSelected && showHelpers && <mesh><sphereGeometry args={[0.3, 16, 16]} /><meshBasicMaterial color="white" wireframe transparent opacity={0.3} /></mesh>}
          </group>
      );
  }

  const physicsEnabled = data.physics?.enabled ?? false;
  const physicsType = data.physics?.type ?? 'none';
  const liquidEnabled = data.liquid?.filled ?? false;

  const shouldActivatePhysics = isRoot && physicsEnabled && isPhysicsRunning;
  const physicsKey = `${data.id}-${isPhysicsRunning ? 'sim' : 'static'}-${safePos.join(',')}`;

  const GeometryContent = (
      <>
          {data.renderMode === 'csg' ? (
             <mesh 
                ref={!shouldActivatePhysics ? (ref as React.Ref<THREE.Mesh>) : undefined} 
                position={!shouldActivatePhysics && isRoot ? safePos : [0,0,0]} 
                rotation={!shouldActivatePhysics && isRoot ? safeRot : [0,0,0]} 
                scale={!shouldActivatePhysics && isRoot ? safeScale : [1,1,1]} 
                castShadow 
                receiveShadow 
                onPointerDown={isRoot ? handlePointerDown : undefined} 
                onContextMenu={isRoot ? handleContextMenu : undefined}
             >
                 <Geometry>
                    <Base><ShapeGeometryRenderer type={data.type} text={data.text} fontUrl={data.fontUrl} /></Base>
                    {Array.isArray(data.children) && data.children.map((child, i) => (
                        child && typeof child === 'object' ? <CSGChild key={child.id || i} data={child} /> : null
                    ))}
                 </Geometry>
                 <SmartMaterial data={data} isSelected={isSelected} />
             </mesh>
          ) : (
            <group 
                ref={!shouldActivatePhysics ? (ref as React.Ref<THREE.Group>) : undefined} 
                position={!shouldActivatePhysics && isRoot ? safePos : [0,0,0]} 
                rotation={!shouldActivatePhysics && isRoot ? safeRot : [0,0,0]} 
                scale={!shouldActivatePhysics && isRoot ? safeScale : [1,1,1]} 
                onPointerDown={isRoot ? handlePointerDown : undefined} 
                onContextMenu={isRoot ? handleContextMenu : undefined}
            >
              <mesh castShadow receiveShadow>
                <ShapeGeometryRenderer type={data.type} text={data.text} fontUrl={data.fontUrl} />
                <SmartMaterial data={data} isSelected={isSelected} />
              </mesh>
              {Array.isArray(data.children) && data.children.map((child, i) => (
                  child && typeof child === 'object' ? <DynamicObject key={child.id || i} data={child} /> : null
              ))}
            </group>
          )}
          {liquidEnabled && data.liquid && <LiquidSystem config={data.liquid} scale={safeScale} isPhysicsRunning={isPhysicsRunning} />}
      </>
  );

  if (shouldActivatePhysics && physicsType !== 'none') {
    return (
        <group ref={ref as React.Ref<THREE.Group>} position={safePos} rotation={safeRot} scale={safeScale}>
            <RigidBody 
                key={physicsKey}
                colliders={physicsType === 'container' ? 'trimesh' : 'hull'} 
                type={physicsType === 'container' ? 'fixed' : 'dynamic'} 
                position={[0,0,0]} 
                rotation={[0,0,0]} 
                scale={[1,1,1]} 
                includeInvisible
            >
               {GeometryContent}
            </RigidBody>
        </group>
    );
  }
  return GeometryContent;
});

export default DynamicObject;
