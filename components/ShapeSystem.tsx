
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { extend, useLoader } from '@react-three/fiber';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

extend({ TextGeometry });

// Fix: Use declare global to add textGeometry to the IntrinsicElements namespace.
// This resolves the 'module not found' error during augmentation and avoids property-access errors 
// that occur when trying to reference a shadowed ThreeElements interface.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      textGeometry: any;
    }
  }
}

// Default font if none is specified
const DEFAULT_FONT_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json';

const TextRenderer: React.FC<{ text: string; fontUrl?: string }> = ({ text, fontUrl }) => {
    const url = fontUrl || DEFAULT_FONT_URL;
    const font = useLoader(FontLoader, url);
    const config = useMemo(() => ({
        font,
        size: 0.5,
        height: 0.15, // Depth
        curveSegments: 6,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.01,
        bevelOffset: 0,
        bevelSegments: 3
    }), [font]);

    return (
        // center() aligns the geometry bounding box center to (0,0,0)
        <textGeometry args={[text, config]} onUpdate={(self: any) => self.center()} />
    );
};

export const StarGeometry: React.FC = () => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const points = 5;
        const outer = 1;
        const inner = 0.4;
        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? outer : inner;
            const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) s.moveTo(x, y);
            else s.lineTo(x, y);
        }
        s.closePath();
        return s;
    }, []);
    return <extrudeGeometry args={[shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 }]} />;
};

export const StarDavidGeometry: React.FC = () => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const points = 6;
        const outer = 1;
        const inner = 0.577; // 1/sqrt(3) makes perfect triangles
        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? outer : inner;
            const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) s.moveTo(x, y);
            else s.lineTo(x, y);
        }
        s.closePath();
        return s;
    }, []);
    return <extrudeGeometry args={[shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 }]} />;
};

export const CrossGeometry: React.FC = () => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const w = 0.3; // stem width
        const armWidth = 1.4;
        const crossbarY = 0.4; // centered relative to origin for better rotation

        // We center the cross vertically so origin (0,0) is near the junction
        const top = 0.6;
        const bottom = -1.4;
        const left = -0.7;
        const right = 0.7;

        s.moveTo(-w/2, top); // 1. Top left
        s.lineTo(w/2, top);  // 2. Top right
        s.lineTo(w/2, crossbarY + w/2); // 3. Right arm notch top
        s.lineTo(right, crossbarY + w/2); // 4. Right arm end top
        s.lineTo(right, crossbarY - w/2); // 5. Right arm end bottom
        s.lineTo(w/2, crossbarY - w/2); // 6. Right arm notch bottom
        s.lineTo(w/2, bottom); // 7. Stem bottom right
        s.lineTo(-w/2, bottom); // 8. Stem bottom left
        s.lineTo(-w/2, crossbarY - w/2); // 9. Left arm notch bottom
        s.lineTo(left, crossbarY - w/2); // 10. Left arm end bottom
        s.lineTo(left, crossbarY + w/2); // 11. Left arm end top
        s.lineTo(-w/2, crossbarY + w/2); // 12. Left arm notch top
        s.closePath();
        return s;
    }, []);
    return <extrudeGeometry args={[shape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 }]} />;
};

export const RhombusGeometry: React.FC = () => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(0, 1);
        s.lineTo(0.7, 0);
        s.lineTo(0, -1);
        s.lineTo(-0.7, 0);
        s.closePath();
        return s;
    }, []);
    return <extrudeGeometry args={[shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 }]} />;
};

export const DiscHoleGeometry: React.FC = () => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.absarc(0, 0, 1, 0, Math.PI * 2, false);
        const hole = new THREE.Path();
        hole.absarc(0, 0, 0.3, 0, Math.PI * 2, true);
        s.holes.push(hole);
        return s;
    }, []);
    return <extrudeGeometry args={[shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, steps: 1, curveSegments: 32 }]} />;
};

export const EggGeometry: React.FC = () => {
    const points = useMemo(() => {
        const pts = [];
        for (let deg = 0; deg <= 180; deg += 4) {
            const rad = Math.PI * deg / 180;
            const point = new THREE.Vector2((0.72 + 0.08 * Math.cos(rad)) * Math.sin(rad), -Math.cos(rad));
            pts.push(point);
        }
        return pts;
    }, []);
    return <latheGeometry args={[points, 32]} />;
};

export const MoonGeometry: React.FC = () => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.absarc(0, 0, 1, Math.PI * 0.5, Math.PI * 1.5, true);
        const inner = new THREE.Path();
        inner.absarc(0.5, 0, 0.9, Math.PI * 1.5, Math.PI * 0.5, false);
        s.curves.push(...inner.curves);
        s.closePath();
        return s;
    }, []);
    return <extrudeGeometry args={[shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, steps: 1, curveSegments: 32 }]} />;
};

export const TubeGeometry: React.FC = () => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.absarc(0, 0, 1, 0, Math.PI * 2, false);
        const hole = new THREE.Path();
        hole.absarc(0, 0, 0.8, 0, Math.PI * 2, true);
        s.holes.push(hole);
        return s;
    }, []);
    return <extrudeGeometry args={[shape, { depth: 2, bevelEnabled: false, curveSegments: 32 }]} />;
};

export const SpiralGeometry: React.FC = () => {
    const path = useMemo(() => {
        const points = [];
        const turns = 10;
        const height = 2;
        const radius = 0.5;
        const segments = 250;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * turns * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (t - 0.5) * height;
            points.push(new THREE.Vector3(x, y, z));
        }
        return new THREE.CatmullRomCurve3(points);
    }, []);
    return <tubeGeometry args={[path, 250, 0.08, 16, false]} />;
};

export const ShapeGeometryRenderer: React.FC<{ type: string; text?: string; fontUrl?: string }> = ({ type, text, fontUrl }) => {
    switch (type) {
      case 'text': return <TextRenderer text={text || "Text"} fontUrl={fontUrl} />;
      case 'sphere': return <sphereGeometry args={[1, 32, 32]} />;
      case 'box': return <boxGeometry args={[1, 1, 1]} />;
      case 'cylinder': return <cylinderGeometry args={[1, 1, 1, 32]} />;
      case 'cone': return <coneGeometry args={[1, 1, 32]} />;
      case 'pyramid': return <coneGeometry args={[1, 1, 4]} />;
      case 'disc': return <cylinderGeometry args={[1, 1, 0.1, 32]} />;
      case 'discHole': return <DiscHoleGeometry />;
      case 'egg': return <EggGeometry />;
      case 'moon': return <MoonGeometry />;
      case 'tube': return <TubeGeometry />;
      case 'spiral': return <SpiralGeometry />;
      case 'torus': return <torusGeometry args={[1, 0.4, 16, 100]} />;
      case 'torusKnot': return <torusKnotGeometry args={[1, 0.3, 100, 16]} />;
      case 'knot2': return <torusKnotGeometry args={[1, 0.15, 128, 32, 3, 2]} />;
      case 'dodecahedron': return <dodecahedronGeometry args={[1, 0]} />;
      case 'tetrahedron': return <tetrahedronGeometry args={[1, 0]} />;
      case 'capsule': return <capsuleGeometry args={[0.5, 1, 4, 32]} />;
      case 'plane': return <planeGeometry args={[1, 1]} />;
      case 'triangle': return <cylinderGeometry args={[1, 1, 0.2, 3]} />;
      case 'pentagon': return <cylinderGeometry args={[1, 1, 0.5, 5]} />;
      case 'octagon': return <cylinderGeometry args={[1, 1, 0.5, 8]} />;
      case 'diamond': return <octahedronGeometry args={[1, 0]} />;
      case 'icosahedron': return <icosahedronGeometry args={[1, 0]} />;
      case 'star': return <StarGeometry />;
      case 'starDavid': return <StarDavidGeometry />;
      case 'cross': return <CrossGeometry />;
      case 'rhombus': return <RhombusGeometry />;
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
};
