import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Scene, { SceneRef } from './components/Scene';
import { ObjectData, RenderMode, MaterialConfig, ParticleConfig, EnvironmentConfig, FaceConfig } from './types';
import { PRESETS } from './presets';

type MenuTab = 'inspector' | 'active' | 'shapes' | 'particles' | 'scene';
type TransformMode = 'translate' | 'rotate' | 'scale';
type SkyboxFace = 'floor' | 'ceiling' | 'north' | 'south' | 'east' | 'west';

const DEFAULT_ENV_CONFIG: EnvironmentConfig = {
    floor: { url: null, rotation: 0, flipX: false, flipY: false },
    ceiling: { url: null, rotation: 0, flipX: false, flipY: false },
    north: { url: null, rotation: 0, flipX: false, flipY: false },
    south: { url: null, rotation: 0, flipX: false, flipY: false },
    east: { url: null, rotation: 0, flipX: false, flipY: false },
    west: { url: null, rotation: 0, flipX: false, flipY: false },
    reflectionPreset: 'city',
    customReflectionUrl: null
};

const DEFAULT_TAB_COLORS: Record<MenuTab, string> = {
    inspector: '#3b82f6',
    active: '#10b981',
    shapes: '#f59e0b',
    particles: '#a855f7',
    scene: '#f43f5e'
};

const FONT_PRESETS = [
    { name: 'Helvetiker Bold', url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json' },
    { name: 'Helvetiker Regular', url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json' },
    { name: 'Optimer Bold', url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/optimer_bold.typeface.json' },
    { name: 'Optimer Regular', url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/optimer_regular.typeface.json' },
    { name: 'Gentilis Bold', url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/gentilis_bold.typeface.json' },
    { name: 'Gentilis Regular', url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/gentilis_regular.typeface.json' },
    { name: 'Droid Sans Bold', url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_sans_bold.typeface.json' },
    { name: 'Droid Serif Bold', url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_serif_bold.typeface.json' }
];

const TabIcon = ({ type, color }: { type: MenuTab; color: string }) => {
    switch (type) {
        case 'inspector':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color }}>
                    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
                </svg>
            );
        case 'active':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color }}>
                    <path d="M4.632 3.533A2 2 0 016.577 2h6.846a2 2 0 011.945 1.533l1.976 8.234A3.489 3.489 0 0016 11.5H4c-.476 0-.93.095-1.344.267l1.976-8.234z" />
                    <path fillRule="evenodd" d="M4 13a2 2 0 100 4h12a2 2 0 100-4H4zm11.24 2a.75.75 0 01.75-.75H16a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V15zm-2.25-.75a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75H13a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75h-.01z" clipRule="evenodd" />
                </svg>
            );
        case 'shapes':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color }}>
                    <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
                </svg>
            );
        case 'particles':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color }}>
                    <circle cx="5" cy="5" r="1.5" /><circle cx="15" cy="4" r="1.2" /><circle cx="10" cy="10" r="1.8" /><circle cx="4" cy="15" r="1" /><circle cx="16" cy="14" r="1.4" /><circle cx="11" cy="4" r="0.8" /><circle cx="16" cy="9" r="0.9" /><circle cx="7" cy="16" r="1.1" />
                </svg>
            );
        case 'scene':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color }}>
                    <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5V11h18V5.5A1.5 1.5 0 0017.5 4h-15zM19 12.5H1v1A1.5 1.5 0 002.5 15h15a1.5 1.5 0 001.5-1.5v-1zM4 6a1 1 0 110 2 1 1 0 010-2zm12 0a1 1 0 110 2 1 1 0 010-2z" clipRule="evenodd" />
                </svg>
            );
        default: return null;
    }
};

interface CollapsibleSectionProps { title: string; children: React.ReactNode; defaultOpen?: boolean; }
const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30 mb-3 shadow-sm">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 transition-colors text-[10px] font-bold uppercase tracking-wider text-slate-300 border-b border-slate-700/50">
                {title}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            {isOpen && <div className="p-3 bg-slate-900/40">{children}</div>}
        </div>
    );
};

interface ItemCardProps { item: ObjectData; isSelected?: boolean; onSelect: () => void; onAdd?: () => void; onEdit?: () => void; onContextMenu: (e: React.MouseEvent) => void; onDelete?: () => void; type: 'shape' | 'scene' | 'library'; }
const ItemCard: React.FC<ItemCardProps> = ({ item, isSelected, onSelect, onAdd, onEdit, onContextMenu, onDelete }) => {
    const safeName = (item.name && typeof item.name === 'string') ? item.name : 'Object';
    const safeType = (item.type && typeof item.type === 'string') ? item.type : 'unknown';
    const safeRenderMode = (item.renderMode && typeof item.renderMode === 'string') ? item.renderMode : 'additive';
    
    return (
        <div onClick={onSelect} onContextMenu={onContextMenu} className={`group relative flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 shadow-inner flex items-center justify-center`} style={{ backgroundColor: typeof item.color === 'string' ? item.color : '#fff' }}>
                    <div className="text-[10px] text-black/50 font-bold mix-blend-overlay">{safeType === 'particles' ? '✨' : safeType.slice(0,2).toUpperCase()}</div>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-blue-200' : 'text-slate-200'}`}>{safeName}</h4>
                    <span className="text-[10px] text-slate-500 capitalize">{safeType === 'particles' ? 'Particle Emitter' : safeRenderMode}</span>
                </div>
            </div>
            <div className="flex items-center gap-1 mt-1">
                {onAdd && <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded text-[10px] font-bold transition-colors">Add</button>}
                {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex-1 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-[10px] font-bold transition-colors">Edit</button>}
                {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="py-1.5 px-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded text-[10px]">✕</button>}
            </div>
        </div>
    );
};

const ContextMenu = ({ x, y, visible, type, onClose, onAction }: { x: number, y: number, visible: boolean, type: string | null, onClose: () => void, onAction: (action: string) => void }) => {
    if (!visible) return null;
    const options = [];
    if (type === 'scene-object') {
        options.push({ label: 'Duplicate', action: 'duplicate' }, { label: 'Reset Transforms', action: 'reset' }, { label: 'Delete', action: 'delete', danger: true });
    } else if (type === 'preset' || type === 'library') {
        options.push({ label: 'Add to Scene', action: 'add' }, { label: 'Edit (Replace)', action: 'edit' });
        if (type === 'library') options.push({ label: 'Delete from Library', action: 'delete-lib', danger: true });
    } else if (type === 'tab') {
        options.push({ label: 'Tab Settings', action: 'tab-settings' });
    }
    return (
        <><div className="fixed inset-0 z-40" onClick={onClose} /><div className="fixed z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-1 w-48" style={{ top: y, left: x }}>
            {options.map((opt) => (<button key={opt.action} onClick={() => { onAction(opt.action); onClose(); }} className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-700 ${opt.danger ? 'text-red-400' : 'text-slate-200'}`}>{opt.label}</button>))}
        </div></>
    );
};

const HelpModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-blue-400">JSGeometry Documentation</h2>
                    <p className="text-xs text-slate-500 font-mono mt-1">v1.2.0 • Architecture & Features</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <section>
                        <h3 className="text-sm font-bold text-slate-200 uppercase border-b border-slate-800 pb-2 mb-2">Core Technology</h3>
                        <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                            <li><strong>Engine:</strong> Three.js (r182) via @react-three/fiber</li>
                            <li><strong>Physics:</strong> Rapier (Wasm) via @react-three/rapier</li>
                            <li><strong>CSG:</strong> Constructive Solid Geometry (three-bvh-csg)</li>
                        </ul>
                    </section>
                </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">Close Documentation</button>
            </div>
        </div>
    </div>
);

const TabSettingsModal = ({ tab, currentColor, onClose, onSave }: { tab: MenuTab, currentColor: string, onClose: () => void, onSave: (color: string) => void }) => {
    const [color, setColor] = useState(currentColor);
    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Settings: {tab}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">Icon Color</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded bg-slate-800 border-none cursor-pointer" />
                            <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 bg-slate-800 text-xs text-white border border-slate-700 rounded px-2 py-2.5 uppercase font-mono" />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded transition-colors uppercase">Cancel</button>
                    <button onClick={() => { onSave(color); onClose(); }} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded transition-colors uppercase shadow-lg">Save Settings</button>
                </div>
            </div>
        </div>
    );
};

function App() {
  const [objects, setObjects] = useState<ObjectData[]>([JSON.parse(JSON.stringify(PRESETS[0]))]);
  const [savedObjects, setSavedObjects] = useState<ObjectData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(PRESETS[0].id);
  const [envConfig, setEnvConfig] = useState<EnvironmentConfig>(DEFAULT_ENV_CONFIG);
  const [tabColors, setTabColors] = useState<Record<MenuTab, string>>(DEFAULT_TAB_COLORS);
  const [activeSkyboxFace, setActiveSkyboxFace] = useState<SkyboxFace>('north');
  const [ctxMenu, setCtxMenu] = useState<{ x: number, y: number, visible: boolean, type: string | null, targetId: string | null }>({ x: 0, y: 0, visible: false, type: null, targetId: null });
  const [activeTab, setActiveTab] = useState<MenuTab>('shapes');
  const [isLeftPanelOpen, setLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setRightPanelOpen] = useState(true);
  const [isCameraHudOpen, setCameraHudOpen] = useState(true);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingEditObject, setPendingEditObject] = useState<ObjectData | null>(null);
  const [activeTabSetting, setActiveTabSetting] = useState<MenuTab | null>(null);
  const [showHelpers, setShowHelpers] = useState(true);
  const [exportTrigger, setExportTrigger] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [isPhysicsRunning, setPhysicsRunning] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [textInput, setTextInput] = useState('');
  const [selectedFontUrl, setSelectedFontUrl] = useState(FONT_PRESETS[0].url);

  const particleJsonInputRef = useRef<HTMLInputElement>(null);
  const sceneRef = useRef<SceneRef>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('saved_models');
    if (saved) setSavedObjects(JSON.parse(saved));
    const colors = localStorage.getItem('tab_colors');
    if (colors) setTabColors(JSON.parse(colors));
  }, []);

  useEffect(() => {
    if (envError) {
        const timer = setTimeout(() => setEnvError(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [envError]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
        if (selectedId) {
          setObjects(prev => prev.filter(o => o.id !== selectedId));
          handleSelectObject(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const handleSelectObject = (id: string | null) => { setSelectedId(id); if (id) setActiveTab('inspector'); };
  
  const handleContextMenu = (e: any, type: string, targetId: string | null = null) => {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      else if (e.nativeEvent && typeof e.nativeEvent.preventDefault === 'function') e.nativeEvent.preventDefault();
      const x = e.clientX ?? e.nativeEvent?.clientX ?? 0;
      const y = e.clientY ?? e.nativeEvent?.clientY ?? 0;
      setCtxMenu({ x, y, visible: true, type, targetId });
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      handleContextMenu(e, 'background');
  };

  const handleCtxAction = (action: string) => {
      const { targetId, type } = ctxMenu;
      if (action === 'delete') { if (targetId) setObjects(p => p.filter(o => o.id !== targetId)); handleSelectObject(null); }
      else if (action === 'add') {
          const item = (type === 'preset' ? PRESETS : savedObjects).find(p => p.id === targetId);
          if (item) handleAddObject(item);
      }
      else if (action === 'reset' && targetId) {
          const obj = objects.find(o => o.id === targetId);
          if (obj) {
              const defaults = getResetValues(obj);
              handleTransformUpdate(targetId, { position: [0, defaults.position[1], 0], rotation: defaults.rotation, scale: defaults.scale });
          }
      }
      else if (action === 'duplicate' && targetId) {
          const obj = objects.find(o => o.id === targetId);
          if (obj) handleAddObject(obj);
      }
      else if (action === 'tab-settings' && targetId) {
          setActiveTabSetting(targetId as MenuTab);
      }
  };

  const handleAddObject = (obj: ObjectData) => {
      const copy = JSON.parse(JSON.stringify(obj));
      copy.id = `inst-${Date.now()}`;
      copy.initialRotation = obj.initialRotation || [...obj.rotation];
      copy.initialScale = obj.initialScale || [...obj.scale];
      copy.position = [(Math.random()-0.5)*4, obj.position[1], (Math.random()-0.5)*4];
      setObjects(prev => [...prev, copy]);
      handleSelectObject(copy.id);
  };

  const handleCreateText = () => {
    if (!textInput.trim()) return;
    const textObj: ObjectData = {
        id: `text-${Date.now()}`,
        type: 'text',
        text: textInput,
        fontUrl: selectedFontUrl,
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        initialRotation: [0, 0, 0],
        initialScale: [1, 1, 1],
        color: '#fbbf24', 
        name: `Text: ${textInput.slice(0, 10)}...`,
        renderMode: 'additive'
    };
    handleAddObject(textObj);
    setTextInput('');
  };

  const handleFontUpload = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setSelectedFontUrl(url);
        }
    };
    input.click();
  };

  const handleLoadForEditing = (obj: ObjectData) => setPendingEditObject(obj);
  const confirmEdit = () => { if (pendingEditObject) { setObjects([JSON.parse(JSON.stringify(pendingEditObject))]); setPendingEditObject(null); handleSelectObject(objects[0]?.id); } };

  const handleImportParticleJson = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              let safeGravity = 0;
              if (typeof json.gravity === 'number') safeGravity = json.gravity;
              else if (typeof json.gravity === 'object' && json.gravity !== null) safeGravity = Number(json.gravity.y) || 0;
              const safeColor = (c: any) => {
                  if (typeof c === 'string') {
                      let col = c.trim();
                      if (col.startsWith('#')) return col.length === 9 ? col.substring(0, 7) : col;
                      return col;
                  }
                  return '#ffffff';
              };
              const particleObj: ObjectData = {
                  id: `part-${Date.now()}`, type: 'particles', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], initialRotation: [0, 0, 0], initialScale: [1, 1, 1], color: safeColor(json.colorStart || json.color1), name: file.name.replace('.json', ''),
                  particleConfig: { count: typeof json.emitRate === 'number' ? Math.min(5000, Math.floor(json.emitRate * 5)) : (json.count || 1000), size: json.maxSize || json.size || 0.1, speed: json.maxEmitPower || json.speed || 1, lifeTime: json.maxLifeTime || json.lifeTime || 2, spread: 1, gravity: safeGravity, colorStart: safeColor(json.color1 || json.colorStart), colorEnd: safeColor(json.color2 || json.colorEnd), opacity: typeof json.startAlpha === 'number' ? json.startAlpha : (json.opacity || 0.8), blending: (json.blendMode === 'ADDITIVE' || json.blending === 'additive') ? 'additive' : 'normal', jsonRaw: JSON.stringify(json) }
              };
              setSavedObjects(prev => {
                  const updated = [...prev, particleObj];
                  localStorage.setItem('saved_models', JSON.stringify(updated));
                  return updated;
              });
              setActiveTab('particles');
          } catch (err) { alert("Invalid Particle JSON"); }
      };
      reader.readAsText(file);
  };

  const handleTransformUpdate = (id: string, newData: Partial<ObjectData>) => { setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, ...newData } : obj)); };
  const filteredPresets = useMemo(() => PRESETS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery]);
  const filteredSaved = useMemo(() => savedObjects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())), [savedObjects, searchQuery]);
  const shapePresets = useMemo(() => filteredPresets.filter(p => p.type !== 'particles'), [filteredPresets]);
  const particlePresets = useMemo(() => filteredPresets.filter(p => p.type === 'particles'), [filteredPresets]);
  const myShapes = useMemo(() => filteredSaved.filter(p => p.type !== 'particles'), [filteredSaved]);
  const myParticles = useMemo(() => filteredSaved.filter(p => p.type === 'particles'), [filteredSaved]);
  const selectedObject = objects.find(o => o.id === selectedId);

  const getResetValues = (obj: ObjectData) => {
      let rot = obj.initialRotation, scale = obj.initialScale, posY = obj.position[1];
      const preset = PRESETS.find(p => p.type === obj.type);
      if (preset) { if (!rot) rot = preset.rotation as [number, number, number]; if (!scale) scale = preset.scale as [number, number, number]; posY = preset.position[1]; }
      return { rotation: rot || [0, 0, 0], scale: scale || [1, 1, 1], position: [0, posY, 0] as [number, number, number] };
  };

  const handleFocusSelection = () => { if (selectedId && sceneRef.current) sceneRef.current.focusOnId(selectedId); };
  const handleSetCameraView = (view: 'perspective' | 'top' | 'front' | 'side') => { if (sceneRef.current) sceneRef.current.setView(view); };
  const updateParticleConfig = (updates: Partial<ParticleConfig>) => { if (!selectedId || !selectedObject?.particleConfig) return; handleTransformUpdate(selectedId, { particleConfig: { ...selectedObject.particleConfig, ...updates } }); };
  const updateObjectMaterial = (updates: Partial<MaterialConfig>) => { if (!selectedId || !selectedObject) return; const currentMat = selectedObject.material || { type: 'standard', roughness: 0.5, metalness: 0, opacity: 1, transmission: 0, ior: 1.5, texturePreset: 'none', wireframe: false }; handleTransformUpdate(selectedId, { material: { ...currentMat, ...updates } }); };
  const applyMaterialPreset = (preset: string) => {
    if (!selectedId) return;
    let mat: Partial<MaterialConfig> = {};
    if (preset === 'plastic') mat = { type: 'standard', roughness: 0.5, metalness: 0, transmission: 0, opacity: 1, ior: 1.5 };
    else if (preset === 'metal') mat = { type: 'standard', roughness: 0.2, metalness: 1, transmission: 0, opacity: 1, ior: 1.5 };
    else if (preset === 'wood') mat = { type: 'standard', roughness: 0.9, metalness: 0, transmission: 0, opacity: 1, ior: 1.5 };
    else if (preset === 'glass') mat = { type: 'physical', roughness: 0.05, metalness: 0.1, transmission: 1, opacity: 1, ior: 1.5 };
    else if (preset === 'water') mat = { type: 'physical', roughness: 0.1, metalness: 0, transmission: 1, opacity: 0.9, ior: 1.33 };
    else if (preset === 'ghost') mat = { type: 'standard', roughness: 0.5, metalness: 0, transmission: 0, opacity: 0.3, ior: 1.5 };
    updateObjectMaterial(mat);
  };

  const updateEnv = (updates: Partial<EnvironmentConfig>) => setEnvConfig(prev => ({ ...prev, ...updates }));
  const triggerTextureUpload = (face: SkyboxFace) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e: any) => { const file = e.target.files[0]; if (file) setEnvConfig(prev => ({ ...prev, [face]: { ...(prev[face] as FaceConfig), url: URL.createObjectURL(file) } })); };
    input.click();
  };
  const triggerMaterialTextureUpload = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e: any) => { const file = e.target.files[0]; if (file) updateObjectMaterial({ mapUrl: URL.createObjectURL(file), texturePreset: 'none' }); };
    input.click();
  };
  const triggerReflectionUpload = () => {
      const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*,.hdr';
      input.onchange = (e: any) => { const file = e.target.files[0]; if (file) updateEnv({ customReflectionUrl: URL.createObjectURL(file), reflectionPreset: 'custom' }); };
      input.click();
   };

  const handleEnvError = useCallback((msg: string) => {
      setEnvError(msg);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden text-slate-100 bg-slate-900 font-sans">
      <input type="file" ref={particleJsonInputRef} onChange={handleImportParticleJson} accept=".json" className="hidden" />
      <ContextMenu x={ctxMenu.x} y={ctxMenu.y} visible={ctxMenu.visible} type={ctxMenu.type} onClose={() => setCtxMenu(p => ({ ...p, visible: false }))} onAction={handleCtxAction} />
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {activeTabSetting && (
          <TabSettingsModal 
            tab={activeTabSetting} 
            currentColor={tabColors[activeTabSetting]} 
            onClose={() => setActiveTabSetting(null)} 
            onSave={(color) => {
                const newColors = { ...tabColors, [activeTabSetting]: color };
                setTabColors(newColors);
                localStorage.setItem('tab_colors', JSON.stringify(newColors));
            }} 
          />
      )}

      {isOffline && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-amber-600/90 text-white px-4 py-2 rounded-full shadow-2xl border border-amber-400/50 flex items-center gap-2">
              <span className="text-sm">🛜</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Offline Mode</span>
          </div>
      )}

      {envError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-red-600/90 text-white px-6 py-3 rounded-full shadow-2xl border border-red-400/50 flex items-center gap-3 animate-bounce">
              <span className="text-xl">⚠️</span>
              <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest leading-none mb-1">Environmental Fault</span>
                  <span className="text-[10px] opacity-80">{envError}</span>
              </div>
              <button onClick={() => setEnvError(null)} className="ml-2 hover:opacity-50 transition-opacity">✕</button>
          </div>
      )}

      {pendingEditObject && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-sm w-full shadow-2xl">
                <h3 className="text-lg font-bold mb-2">Confirm Edit</h3>
                <p className="text-sm text-slate-400 mb-6">ALL CURRENT SCENE DATA WILL BE LOST, CONTINUE?</p>
                <div className="flex gap-3"><button onClick={() => setPendingEditObject(null)} className="flex-1 py-2 bg-slate-700 rounded text-slate-200">Cancel</button><button onClick={confirmEdit} className="flex-1 py-2 bg-red-600 rounded text-white font-bold">Continue</button></div>
            </div>
        </div>
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setShowHelpers(!showHelpers)} className={`p-2 rounded-full transition-colors ${showHelpers ? 'text-blue-400 bg-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`} title="Toggle Helpers / Wireframes">
             {showHelpers ? (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" /></svg>
             ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" /><path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" /><path d="M6.75 12c0-.619.107-1.215.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" /></svg>
             )}
          </button>
          {selectedId && (
            <>
              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <button onClick={handleFocusSelection} className="p-2 rounded-full text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 transition-colors" title="Focus Selection (F)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" /></svg>
              </button>
            </>
          )}
      </div>

      <div className={`absolute bottom-4 z-30 flex flex-col items-end gap-2 transition-all ${isRightPanelOpen ? 'right-[420px]' : 'right-4'}`} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setCameraHudOpen(!isCameraHudOpen)} className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white shadow-lg">
              {isCameraHudOpen ? '▼' : '▲'}
          </button>
          {isCameraHudOpen && (
              <div className="flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/50 shadow-xl">
                  {['perspective', 'top', 'front', 'side'].map(view => (
                      <button key={view} onClick={() => handleSetCameraView(view as any)} className="p-2 hover:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase">{view.slice(0,5)}</button>
                  ))}
              </div>
          )}
      </div>

      <main className="absolute inset-0 z-0">
          <Scene ref={sceneRef} objects={objects} selectedId={selectedId} onObjectSelect={handleSelectObject} onObjectContextMenu={(id, e) => handleContextMenu(e, 'scene-object', id)} onBackgroundContextMenu={handleBackgroundContextMenu} gridConfig={{sectionColor:'#101725', cellColor:'#1d283a'}} transformMode={transformMode} onTransformChange={handleTransformUpdate} showHelpers={showHelpers} environmentConfig={envConfig} exportTrigger={exportTrigger} onExportComplete={() => setExportTrigger(0)} isPhysicsRunning={isPhysicsRunning} onEnvError={handleEnvError} />
      </main>

      <div className={`absolute top-4 bottom-4 left-4 z-20 w-80 transition-transform ${isLeftPanelOpen ? '' : '-translate-x-[120%]'}`} onClick={(e) => e.stopPropagation()}>
        <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
             <div className="p-4 border-b border-slate-800 flex justify-between items-center"><h1 className="text-lg font-bold">JSGeometry</h1><button onClick={() => setLeftPanelOpen(false)}>✕</button></div>
             <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                 
                 <div className="space-y-3">
                    <h3 className="text-sm font-extrabold uppercase text-white">3D Text Generator</h3>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Enter text..." 
                                value={textInput} 
                                onChange={(e) => setTextInput(e.target.value)} 
                                className="flex-1 bg-slate-800 text-xs rounded border border-slate-700 p-2 focus:border-blue-500 outline-none transition-colors"
                            />
                            <button 
                                onClick={handleCreateText} 
                                disabled={!textInput.trim()}
                                className={`px-3 py-2 rounded text-xs font-bold transition-all ${textInput.trim() ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md' : 'bg-slate-800 text-slate-600'}`}
                            >
                                Create
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <select 
                                value={selectedFontUrl} 
                                onChange={(e) => setSelectedFontUrl(e.target.value)}
                                className="flex-1 bg-slate-800 text-[10px] rounded border border-slate-700 p-1.5 focus:border-blue-500 outline-none transition-colors text-slate-300"
                            >
                                {FONT_PRESETS.map(f => <option key={f.url} value={f.url}>{f.name}</option>)}
                            </select>
                            <button 
                                onClick={handleFontUpload}
                                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded text-[10px] transition-colors"
                                title="Upload Custom Typeface.json"
                            >
                                📁
                            </button>
                        </div>
                    </div>
                 </div>

                 <div className="space-y-3 pt-4 border-t border-slate-800">
                    <h3 className="text-sm font-extrabold uppercase text-white">Babylon Particle Import</h3>
                    <button onClick={() => particleJsonInputRef.current?.click()} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"><span>✨</span> Import Particle Preset</button>
                    <p className="text-[9px] text-slate-500 text-center">Load a .json file from your Particle Generator</p>
                 </div>

                 <div className="pt-4 border-t border-slate-800 space-y-2">
                    <h3 className="text-[10px] font-bold uppercase text-slate-500">Workspace Hint</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                        Select primitives from the <span className="text-blue-400 font-bold">Shapes</span> tab on the right to build your scene manually.
                    </p>
                 </div>
             </div>
             <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                 <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Help & Documentation
                 </button>
             </div>
        </div>
      </div>

      <div className={`absolute top-4 bottom-4 right-4 z-20 w-[400px] transition-transform ${isRightPanelOpen ? '' : 'translate-x-[120%]'}`} onClick={(e) => e.stopPropagation()}>
        <div className="h-full flex flex-col bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase text-white">Workspace</h2>
                <button onClick={() => setRightPanelOpen(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-2 border-b border-slate-800">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search library..." className={`w-full bg-slate-800 text-[10px] py-1.5 px-3 rounded-lg border focus:outline-none transition-all ${searchQuery.length > 0 ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-slate-700'}`} />
            </div>
            
            <div className="flex bg-slate-900/30 border-b border-slate-800">
                {(['inspector', 'active', 'shapes', 'particles', 'scene'] as MenuTab[]).map((tab, idx, arr) => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        onContextMenu={(e) => handleContextMenu(e, 'tab', tab)}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 text-[8px] font-bold uppercase transition-all 
                            ${activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'} 
                            ${idx < arr.length - 1 ? 'border-r border-slate-800/60' : ''}`}
                    >
                        <TabIcon type={tab} color={tabColors[tab]} />
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {activeTab === 'active' && (
                    <div className="space-y-2">
                        {objects.length === 0 && <div className="text-slate-500 text-xs text-center py-4">Scene is empty</div>}
                        {objects.map(obj => (
                            <div key={obj.id} onClick={() => handleSelectObject(obj.id)} className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedId === obj.id ? 'bg-blue-600/20 border-blue-500 shadow-md' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-black/50`} style={{ backgroundColor: typeof obj.color === 'string' ? obj.color : '#fff' }}>
                                        {obj.type === 'particles' ? '✨' : obj.type.slice(0,2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`text-xs font-bold truncate ${selectedId === obj.id ? 'text-blue-200' : 'text-slate-200'}`}>{obj.name || 'Object'}</div>
                                        <div className="text-[9px] text-slate-500 capitalize">{obj.type}</div>
                                    </div>
                                </div>
                                {selectedId === obj.id ? <button onClick={(e) => { e.stopPropagation(); handleFocusSelection(); }} className="p-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded text-[9px] font-bold">Focus</button> : <button onClick={(e) => { e.stopPropagation(); setObjects(p => p.filter(o => o.id !== obj.id)); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition-all">✕</button>}
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'shapes' && (
                    <div className="space-y-4">
                        <CollapsibleSection title="Preset Shapes"><div className="space-y-2">{shapePresets.map(p => (<ItemCard key={p.id} item={p} type="shape" onSelect={() => {}} onAdd={() => handleAddObject(p)} onEdit={() => handleLoadForEditing(p)} onContextMenu={(e) => handleContextMenu(e, 'preset', p.id)} />))}</div></CollapsibleSection>
                        <CollapsibleSection title="My Shapes"><div className="space-y-2">{myShapes.map(p => (<ItemCard key={p.id} item={p} type="library" onSelect={() => {}} onAdd={() => handleAddObject(p)} onEdit={() => handleLoadForEditing(p)} onDelete={() => setSavedObjects(p2 => p2.filter(x => x.id !== p.id))} onContextMenu={(e) => handleContextMenu(e, 'library', p.id)} />))}</div></CollapsibleSection>
                    </div>
                )}
                {activeTab === 'particles' && (
                     <div className="space-y-4">
                        <CollapsibleSection title="Preset Particles"><div className="space-y-2">{particlePresets.map(p => (<ItemCard key={p.id} item={p} type="shape" onSelect={() => {}} onAdd={() => handleAddObject(p)} onEdit={() => handleLoadForEditing(p)} onContextMenu={(e) => handleContextMenu(e, 'preset', p.id)} />))}</div></CollapsibleSection>
                        <CollapsibleSection title="My Particles"><div className="space-y-2">{myParticles.map(p => (<ItemCard key={p.id} item={p} type="library" onSelect={() => {}} onAdd={() => handleAddObject(p)} onEdit={() => handleLoadForEditing(p)} onDelete={() => setSavedObjects(p2 => p2.filter(x => x.id !== p.id))} onContextMenu={(e) => handleContextMenu(e, 'library', p.id)} />))}</div></CollapsibleSection>
                     </div>
                )}
                {activeTab === 'scene' && (
                    <div className="space-y-4">
                        <CollapsibleSection title="Skybox Settings">
                            <div className="space-y-3">
                                <label className="text-[9px] uppercase font-bold text-slate-500 block">Select Face to Edit</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {['floor', 'ceiling', 'north', 'south', 'east', 'west'].map(face => (<button key={face} onClick={() => setActiveSkyboxFace(face as SkyboxFace)} className={`py-2 px-2 rounded text-[9px] capitalize border transition-all ${activeSkyboxFace === face ? 'bg-blue-600 text-white border-blue-500 shadow-sm' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>{face}</button>))}
                                </div>
                                <div className="bg-slate-800/50 p-2 rounded border border-slate-700 mt-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-blue-300 capitalize">{activeSkyboxFace} Face</span>
                                        <button onClick={() => triggerTextureUpload(activeSkyboxFace)} className="text-[9px] bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-2 py-1 rounded transition-colors">{(envConfig[activeSkyboxFace] as FaceConfig).url ? 'Replace Image' : 'Upload Image'}</button>
                                    </div>
                                    {(envConfig[activeSkyboxFace] as FaceConfig).url ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between"><span className="text-[9px] text-slate-400">Rotation</span><div className="flex bg-slate-900 rounded border border-slate-700 overflow-hidden">{[0, 90, 180, 270].map(deg => (<button key={deg} onClick={() => updateEnv({ [activeSkyboxFace]: { ...(envConfig[activeSkyboxFace] as FaceConfig), rotation: deg } })} className={`px-2 py-1 text-[8px] ${ (envConfig[activeSkyboxFace] as FaceConfig).rotation === deg ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300' }`}>{deg}°</button>))}</div></div>
                                            <div className="flex gap-2">
                                                <button onClick={() => updateEnv({ [activeSkyboxFace]: { ...(envConfig[activeSkyboxFace] as FaceConfig), flipX: !(envConfig[activeSkyboxFace] as FaceConfig).flipX } })} className={`flex-1 py-1 text-[9px] rounded border ${ (envConfig[activeSkyboxFace] as FaceConfig).flipX ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-700 text-slate-500' }`}>Flip Horizontal</button>
                                                <button onClick={() => updateEnv({ [activeSkyboxFace]: { ...(envConfig[activeSkyboxFace] as FaceConfig), flipY: !(envConfig[activeSkyboxFace] as FaceConfig).flipY } })} className={`flex-1 py-1 text-[9px] rounded border ${ (envConfig[activeSkyboxFace] as FaceConfig).flipY ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-700 text-slate-500' }`}>Flip Vertical</button>
                                            </div>
                                        </div>
                                    ) : (<div className="text-[9px] text-slate-500 italic text-center py-2">No texture uploaded for this face.</div>)}
                                </div>
                            </div>
                        </CollapsibleSection>
                         <button onClick={() => setExportTrigger(t => t + 1)} className="w-full py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded text-xs font-bold hover:bg-emerald-600 hover:text-white transition-colors">Export Scene to GLTF</button>
                    </div>
                )}
                {activeTab === 'inspector' && (
                    selectedObject ? (
                        <div className="space-y-4">
                            <div className="border-b border-slate-700 pb-3 mb-6">
                            <h2 className="text-2xl font-bold truncate text-white leading-none">{selectedObject.name}</h2>
                            <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium mt-1.5 block">{selectedObject.type}</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transform & Tools</h3>
                                <button onClick={handleFocusSelection} className="text-[9px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-bold transition-colors shadow-sm">Frame Object (F)</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button onClick={() => { const defaults = getResetValues(selectedObject); handleTransformUpdate(selectedObject.id, { position: [0, defaults.position[1], 0] }); }} className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[9px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all hover:border-slate-600 hover:text-white"><span className="opacity-50 text-[11px]">📍</span> Reset Position</button>
                                <button onClick={() => { const defaults = getResetValues(selectedObject); handleTransformUpdate(selectedObject.id, { scale: defaults.scale }); }} className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[9px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all hover:border-slate-600 hover:text-white"><span className="opacity-50 text-[11px]">📐</span> Reset Form</button>
                                <button onClick={() => { const defaults = getResetValues(selectedObject); handleTransformUpdate(selectedObject.id, { rotation: defaults.rotation }); }} className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[9px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all hover:border-slate-600 hover:text-white"><span className="opacity-50 text-[11px]">↺</span> Reset Rotate</button>
                                <button onClick={() => handleTransformUpdate(selectedObject.id, { material: undefined, faceMaterials: undefined })} className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[9px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all hover:border-slate-600 hover:text-white"><span className="opacity-50 text-[11px]">🎨</span> Reset Material</button>
                            </div>
                            <div className="grid grid-cols-3 gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                                {[ { mode: 'translate', label: 'Move' }, { mode: 'rotate', label: 'Rotate' }, { mode: 'scale', label: 'Scale' } ].map(item => (<button key={item.mode} onClick={() => setTransformMode(item.mode as any)} className={`py-1.5 text-[9px] rounded-md capitalize font-bold ${transformMode === item.mode ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>{item.label}</button>))}
                            </div>
                            {selectedObject.type !== 'particles' && (
                                <CollapsibleSection title="Material">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-1">{[ { id: 'plastic', label: 'Plastic' }, { id: 'metal', label: 'Metal' }, { id: 'wood', label: 'Rough Wood' }, { id: 'glass', label: 'Glass' }, { id: 'water', label: 'Water' }, { id: 'ghost', label: 'Ghost' } ].map(m => (<button key={m.id} onClick={() => applyMaterialPreset(m.id)} className="py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[9px] text-slate-300">{m.label}</button>))}</div>
                                        <div className="flex items-center justify-between bg-slate-800 p-1 rounded border border-slate-700"><label className="text-[9px] text-slate-400 pl-1">Color</label><input type="color" value={typeof selectedObject.color === 'string' ? selectedObject.color : '#ffffff'} onChange={(e) => handleTransformUpdate(selectedObject.id, { color: e.target.value })} className="w-8 h-5 rounded cursor-pointer bg-transparent" /></div>
                                        <div className="space-y-3">{[ { label: 'Roughness', key: 'roughness', min: 0, max: 1, step: 0.01 }, { label: 'Metalness', key: 'metalness', min: 0, max: 1, step: 0.01 }, { label: 'Transmission', key: 'transmission', min: 0, max: 1, step: 0.01 }, { label: 'Opacity', key: 'opacity', min: 0, max: 1, step: 0.01 }, { label: 'IOR (Refraction)', key: 'ior', min: 1, max: 2.33, step: 0.01 } ].map(prop => (<div key={prop.key}><div className="flex justify-between mb-1"><span className="text-[9px] text-slate-400">{prop.label}</span><span className="text-[9px] text-slate-500">{String((selectedObject.material as any)?.[prop.key] ?? (prop.key === 'ior' ? 1.5 : (prop.key === 'opacity' ? 1 : 0)))}</span></div><input type="range" min={prop.min} max={prop.max} step={prop.step} value={(selectedObject.material as any)?.[prop.key] ?? (prop.key === 'ior' ? 1.5 : (prop.key === 'opacity' ? 1 : 0))} onChange={(e) => updateObjectMaterial({ [prop.key]: parseFloat(e.target.value) })} className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" /></div>))}</div>
                                        <div className="space-y-2 pt-2 border-t border-slate-800">
                                            <div className="flex justify-between items-center gap-2"><label className="text-[9px] text-slate-400">Texture</label><select value={selectedObject.material?.texturePreset || 'none'} onChange={(e) => updateObjectMaterial({ texturePreset: e.target.value as any })} className="bg-slate-800 text-[9px] border border-slate-700 rounded px-2 py-1 outline-none flex-1"><option value="none">None</option><option value="grid">Grid</option><option value="checker">Checker</option><option value="lines">Lines</option><option value="noise">Noise</option></select><button onClick={triggerMaterialTextureUpload} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[9px] text-slate-300">Upload</button></div>
                                            <input type="text" placeholder="Paste Custom Image URL..." value={selectedObject.material?.mapUrl || ''} onChange={(e) => updateObjectMaterial({ mapUrl: e.target.value })} className="w-full bg-slate-900 text-[9px] rounded px-2 py-1 border border-slate-700 placeholder-slate-600 focus:border-blue-500 transition-colors" />
                                        </div>
                                        <div className="pt-3 border-t border-slate-800 mt-3">
                                            <label className="text-[9px] uppercase font-bold text-slate-500 mb-2 block">Reflection Environment</label>
                                            <div className="flex gap-2">
                                                <select 
                                                    value={envConfig.reflectionPreset || 'city'} 
                                                    onChange={(e) => updateEnv({ reflectionPreset: e.target.value as any })} 
                                                    className="flex-1 bg-slate-800 text-[9px] rounded px-2 py-1 border border-slate-700 outline-none"
                                                >
                                                    {['city', 'dawn', 'night', 'park', 'studio', 'sunset', 'forest', 'apartment', 'warehouse', 'lobby', 'custom'].map(p => (
                                                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                                    ))}
                                                </select>
                                                <button onClick={triggerReflectionUpload} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[9px] text-slate-300">
                                                    Upload
                                                </button>
                                            </div>
                                            {envConfig.reflectionPreset === 'custom' && (
                                                <input 
                                                    type="text" 
                                                    placeholder="Paste Image/HDRI URL..." 
                                                    value={envConfig.customReflectionUrl || ''} 
                                                    onChange={(e) => updateEnv({ customReflectionUrl: e.target.value })} 
                                                    className="w-full bg-slate-900 text-[9px] rounded px-2 py-1 border border-slate-700 mt-1 focus:border-blue-500 transition-colors" 
                                                />
                                            )}
                                        </div>
                                    </div>
                                </CollapsibleSection>
                            )}
                            <button onClick={() => { setObjects(p => p.filter(o => o.id !== selectedId)); handleSelectObject(null); }} className="w-full py-2.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-colors">Remove Object</button>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                            <div className="mb-4">
                                <TabIcon type="inspector" color="#475569" />
                            </div>
                            <p className="text-xs font-bold tracking-widest leading-relaxed uppercase">
                                SELECT AN ACTIVE SCENE ELEMENT<br/>TO VIEW PROPERTIES
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
      </div>
      
      {!isLeftPanelOpen && <button onClick={(e) => { e.stopPropagation(); setLeftPanelOpen(true); }} className="absolute top-4 left-4 z-30 p-2 bg-slate-800 border border-slate-700 rounded shadow-lg">➡️</button>}
      {!isRightPanelOpen && <button onClick={(e) => { e.stopPropagation(); setRightPanelOpen(true); }} className="absolute top-4 right-4 z-30 p-2 bg-slate-800 border border-slate-700 rounded shadow-lg">⬅️</button>}
    </div>
  );
}

export default App;