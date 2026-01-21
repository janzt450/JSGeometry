
export type ShapeType = 'sphere' | 'box' | 'cylinder' | 'cone' | 'torus' | 'torusKnot' | 'dodecahedron' | 'tetrahedron' | 'capsule' | 'plane' | 'triangle' | 'pentagon' | 'octagon' | 'star' | 'diamond' | 'icosahedron' | 'rhombus' | 'pyramid' | 'disc' | 'discHole' | 'egg' | 'moon' | 'tube' | 'knot2' | 'spiral' | 'particles' | 'text' | 'starDavid' | 'cross';
export type RenderMode = 'additive' | 'csg';
export type CSGOperation = 'add' | 'subtract' | 'intersect';
export type TexturePreset = 'none' | 'grid' | 'checker' | 'lines' | 'noise';

export interface MaterialConfig {
  type: 'standard' | 'physical';
  color?: string; // Optional per-face color override
  roughness: number; 
  metalness: number;
  opacity: number;
  transmission: number;
  ior: number;
  texturePreset?: TexturePreset;
  mapUrl?: string; // Custom texture URL
  wireframe?: boolean;
  transparent?: boolean; // Added to fix TS error
}

export interface PhysicsConfig {
    type: 'none' | 'solid' | 'container';
    enabled: boolean;
}

export interface LiquidConfig {
    filled: boolean;
    type: 'water' | 'oil' | 'slime' | 'rain';
    color: string;
}

export interface ParticleConfig {
    count: number;
    size: number;
    speed: number;
    lifeTime: number;
    spread: number;
    gravity: number;
    colorStart: string;
    colorEnd: string;
    opacity: number;
    blending: 'additive' | 'normal';
    jsonRaw?: string; // Stores the original imported JSON if needed
}

export interface ObjectData {
  id: string;
  type: ShapeType;
  text?: string; // Content for text shapes
  fontUrl?: string; // URL for 3D font
  renderMode?: RenderMode;
  operation?: CSGOperation;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  initialRotation?: [number, number, number];
  initialScale?: [number, number, number];
  color: string;
  material?: MaterialConfig;
  faceMaterials?: MaterialConfig[]; // For shapes like Box (6) or Cylinder (3)
  physics?: PhysicsConfig;
  liquid?: LiquidConfig;
  particleConfig?: ParticleConfig;
  name: string;
  children?: ObjectData[];
  createdAt?: number;
}

export interface GenerationRequest {
  prompt: string;
  mode: RenderMode;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

export interface FaceConfig {
    url: string | null;
    rotation: 0 | 90 | 180 | 270;
    flipX: boolean;
    flipY: boolean;
}

export interface EnvironmentConfig {
  floor: FaceConfig;
  ceiling: FaceConfig;
  north: FaceConfig;
  south: FaceConfig;
  east: FaceConfig;
  west: FaceConfig;
  reflectionPreset?: 'city' | 'dawn' | 'lobby' | 'night' | 'park' | 'studio' | 'sunset' | 'warehouse' | 'forest' | 'apartment' | 'none' | 'custom';
  customReflectionUrl?: string | null;
}

export interface SessionData {
  version: number;
  timestamp: number;
  objects: ObjectData[];
  savedObjects: ObjectData[];
  camera: CameraState;
  gridConfig?: { sectionColor: string; cellColor: string; };
  environmentConfig?: EnvironmentConfig;
}
