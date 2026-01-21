
import { ObjectData } from './types';

export const PRESETS: ObjectData[] = [
  {
    "id": "sphere-preset",
    "type": "sphere",
    "renderMode": "additive",
    "position": [0, 1, 0], // Radius 1, extends -1 to 1. Center at 1 -> sits on 0.
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#3b82f6",
    "name": "Sphere"
  },
  {
    "id": "cylinder-preset",
    "type": "cylinder",
    "renderMode": "additive",
    "position": [0, 0.5, 0], // Height 1, extends -0.5 to 0.5. Center at 0.5 -> sits on 0.
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#14b8a6",
    "name": "Cylinder"
  },
  {
    "id": "spiral-preset",
    "type": "spiral",
    "renderMode": "additive",
    "position": [0, 1, 0], // Approx height 2. Center at 1 -> sits on 0.
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#ec4899",
    "name": "Spiral"
  },
  {
    "id": "tube-preset",
    "type": "tube",
    "renderMode": "additive",
    "position": [0, 1, 0], // Extruded length 2. Rotated. Approximate centering.
    "rotation": [1.5707963268, 0, 0],
    "scale": [1, 1, 1],
    "color": "#334155",
    "name": "Hollow Tube"
  },
  {
    "id": "moon-preset",
    "type": "moon",
    "renderMode": "additive",
    "position": [0, 0.5, 0],
    "rotation": [0, 0, 0.7853981634],
    "scale": [1, 1, 1],
    "color": "#fbbf24",
    "name": "Banana"
  },
  {
    "id": "pyramid-preset",
    "type": "pyramid",
    "renderMode": "additive",
    "position": [0, 0.5, 0], // Height 1.
    "rotation": [0, 0.7853981634, 0],
    "scale": [1.2, 1.2, 1.2],
    "color": "#eab308",
    "name": "Pyramid"
  },
  {
    "id": "donut-preset",
    "type": "torus",
    "renderMode": "additive",
    "position": [0, 0.4, 0], // Radius 1, Tube 0.4. Rotated flat -> Height 0.8. Center 0.4.
    "rotation": [1.5707963268, 0, 0],
    "scale": [1, 1, 1],
    "color": "#f472b6",
    "name": "Donut"
  },
  {
    "id": "star-david-preset",
    "type": "starDavid",
    "renderMode": "additive",
    "position": [0, 0.1, 0],
    "rotation": [1.5707963268, 0, 0],
    "scale": [1, 1, 1],
    "color": "#60a5fa",
    "name": "Star of David"
  },
  {
    "id": "crucifix-preset",
    "type": "cross",
    "renderMode": "additive",
    "position": [0, 1, 0],
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#b45309",
    "name": "Crucifix"
  },
  {
    "id": "disc-hole-preset",
    "type": "discHole",
    "renderMode": "additive",
    "position": [0, 0.05, 0], // Depth 0.1. Center 0.05.
    "rotation": [1.5707963268, 0, 0],
    "scale": [1, 1, 1],
    "color": "#94a3b8",
    "name": "Disc w/ Hole"
  },
  {
    "id": "egg-preset",
    "type": "egg",
    "renderMode": "additive",
    "position": [0, 1.4, 0], // Lathe usually centers around Y origin but shape might be offset.
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#fde047",
    "name": "Egg"
  },
  {
    "id": "disc-preset",
    "type": "disc",
    "renderMode": "additive",
    "position": [0, 0.05, 0], // Height 0.1.
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#cbd5e1",
    "name": "Disc"
  },
  {
    "id": "torus-knot-preset",
    "type": "torusKnot",
    "renderMode": "additive",
    "position": [0, 1.3, 0], // Radius 1 + Tube 0.3.
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#ec4899",
    "name": "Torus Knot"
  },
  {
    "id": "knot2-preset",
    "type": "knot2",
    "renderMode": "additive",
    "position": [0, 1.2, 0],
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#a855f7",
    "name": "Fancy Knot"
  },
  {
    "id": "capsule-preset",
    "type": "capsule",
    "renderMode": "additive",
    "position": [0, 1, 0], // Height ~2.
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#ef4444",
    "name": "Capsule"
  },
  {
    "id": "dodecahedron-preset",
    "type": "dodecahedron",
    "renderMode": "additive",
    "position": [0, 1, 0], // Radius 1.
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#8b5cf6",
    "name": "Dodecahedron"
  },
  {
    "id": "star-preset",
    "type": "star",
    "renderMode": "additive",
    "position": [0, 0.1, 0], // Extrude 0.2.
    "rotation": [1.5707963268, 0, 0],
    "scale": [1, 1, 1],
    "color": "#fef08a",
    "name": "5 Point Star"
  },
  {
    "id": "pentagon-preset",
    "type": "pentagon",
    "renderMode": "additive",
    "position": [0, 0.25, 0], // Height 0.5.
    "rotation": [1.5707963268, 0, 0], 
    "scale": [1, 1, 1],
    "color": "#a855f7",
    "name": "Pentagon"
  },
  {
    "id": "octagon-preset",
    "type": "octagon",
    "renderMode": "additive",
    "position": [0, 0.25, 0],
    "rotation": [1.5707963268, 0, 0],
    "scale": [1, 1, 1],
    "color": "#f97316",
    "name": "Octagon"
  },
  {
    "id": "rhombus-preset",
    "type": "rhombus",
    "renderMode": "additive",
    "position": [0, 0.1, 0], // Extrude 0.2.
    "rotation": [1.5707963268, 0, 0],
    "scale": [1, 1, 1],
    "color": "#10b981",
    "name": "Rhombus"
  },
  {
    "id": "glass-cube-preset",
    "type": "box",
    "renderMode": "additive",
    "position": [0, 0.5, 0], // Height 1.
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#a5f3fc",
    "name": "Glass Cube",
    "material": {
        "type": "physical",
        "roughness": 0.1,
        "metalness": 0.1,
        "opacity": 1,
        "transmission": 0.95,
        "ior": 1.5
    }
  },
  {
    "id": "gold-cone-preset",
    "type": "cone",
    "renderMode": "additive",
    "position": [0, 0.75, 0], // Height 1 * Scale 1.5 = 1.5. Center 0.75.
    "rotation": [0, 0, 0],
    "scale": [1, 1.5, 1],
    "color": "#fbbf24",
    "name": "Gold Cone",
    "material": {
        "type": "standard",
        "roughness": 0.1,
        "metalness": 1,
        "opacity": 1,
        "transmission": 0,
        "ior": 1.5
    }
  },
  {
    "id": "diamond-preset",
    "type": "diamond",
    "renderMode": "additive",
    "position": [0, 1, 0], // Radius 1.
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1],
    "color": "#06b6d4",
    "name": "Diamond",
    "material": {
        "type": "physical",
        "roughness": 0,
        "metalness": 0,
        "transmission": 1,
        "opacity": 1,
        "ior": 2.4
    }
  },
  {
    "id": "bowl-csg",
    "type": "sphere",
    "renderMode": "csg",
    "position": [0, 1.5, 0], // Scale 1.5 -> Radius 1.5. Center 1.5.
    "rotation": [0, 0, 0],
    "scale": [1.5, 1.5, 1.5],
    "color": "#fcd34d",
    "name": "Bowl (CSG)",
    "children": [
      {
        "id": "bowl-cutout",
        "type": "sphere",
        "operation": "subtract",
        "position": [0, 0.4, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1],
        "color": "#000000",
        "name": "Inside Cut",
        "children": []
      }
    ]
  },
  { 
    "id": "fire-particles", 
    "type": "particles", 
    "position": [0, 0, 0], // Particles start at ground.
    "rotation": [0,0,0], 
    "scale": [1,1,1], 
    "color": "#f59e0b", 
    "name": "Fire Particles", 
    "particleConfig": { 
        "count": 800, 
        "size": 0.15, 
        "speed": 2, 
        "lifeTime": 1, 
        "spread": 0.5, 
        "gravity": -2, 
        "colorStart": "#f59e0b", 
        "colorEnd": "#ef4444", 
        "opacity": 0.8, 
        "blending": "additive" 
    } 
  }
];
