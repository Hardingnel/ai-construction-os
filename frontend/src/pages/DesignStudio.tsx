import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PenTool, Palette, Image, Upload, Download, Layers,
  RotateCcw, Eye, Grid3x3, Maximize2, Minus, Plus,
  Undo2, Redo2, Save, Sparkles, Trash2, Square, Minus as LineIcon,
  MousePointer, Type, Circle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface CanvasElement {
  id: string;
  type: 'rect' | 'line' | 'path' | 'text' | 'circle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: string;
  x2?: number;
  y2?: number;
  r?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  visible: boolean;
  label?: string;
  layer: string;
}

const tools = [
  { id: 'select', label: 'Select', icon: MousePointer },
  { id: 'wall', label: 'Wall', icon: Minus },
  { id: 'room', label: 'Room', icon: Square },
  { id: 'circle', label: 'Column', icon: Circle },
  { id: 'text', label: 'Label', icon: Type },
  { id: 'measure', label: 'Measure', icon: LineIcon },
];

const colorPalettes = [
  { name: 'Modern Neutral', colors: ['#f5f5f0', '#d4d4c8', '#a8a89e', '#707068', '#383830'] },
  { name: 'African Earth', colors: ['#e8d5b7', '#c4a67a', '#8b6914', '#5c4033', '#2c1810'] },
  { name: 'Ocean Breeze', colors: ['#e0f7fa', '#80deea', '#26c6da', '#00acc1', '#00838f'] },
  { name: 'Sunset Warm', colors: ['#ffe0b2', '#ffcc80', '#ff9800', '#f57c00', '#e65100'] },
];

const wallColors = ['#4a5568', '#718096', '#a0aec0', '#2d3748', '#1a202c'];
const roomColors = ['#bee3f8', '#c6f6d5', '#fefcbf', '#fed7d7', '#e9d8fd', '#feebc8', '#b2f5ea'];

function generateId() { return Math.random().toString(36).substring(2, 11); }

function getSVGPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(svg.getScreenCTM()!.inverse());
}

export function DesignStudio() {
  const [activeTool, setActiveTool] = useState('select');
  const [zoom, setZoom] = useState(100);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectedColor, setSelectedColor] = useState('#4a5568');
  const [selectedFill, setSelectedFill] = useState('#bee3f8');
  const [layerStates, setLayerStates] = useState<Record<string, boolean>>({
    Walls: true, Rooms: true, Columns: true, Labels: true, Dimensions: true,
  });
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [future, setFuture] = useState<CanvasElement[][]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [planName, setPlanName] = useState('Untitled Floor Plan');
  const [showColorPicker, setShowColorPicker] = useState<'fill' | 'stroke'>('fill');

  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedElement = elements.find(e => e.id === selectedId);

  const saveHistory = useCallback((els: CanvasElement[]) => {
    setHistory(prev => [...prev.slice(-50), els]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setFuture(f => [elements, ...f]);
    setElements(prev);
  }, [history, elements]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(f => f.slice(1));
    setHistory(h => [...h, elements]);
    setElements(next);
  }, [future, elements]);

  const addElement = useCallback((el: CanvasElement) => {
    saveHistory(elements);
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
  }, [elements, saveHistory]);

  const updateElement = useCallback((id: string, props: Partial<CanvasElement>) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...props } : e));
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    saveHistory(elements);
    setElements(prev => prev.filter(e => e.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, elements, saveHistory]);

  const handleSVGMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const pt = getSVGPoint(svgRef.current, e.clientX, e.clientY);

    if (activeTool === 'select') {
      const clicked = [...elements].reverse().find(el => {
        if (!el.visible) return false;
        if (el.type === 'rect' && el.width && el.height) {
          return pt.x >= el.x && pt.x <= el.x + el.width && pt.y >= el.y && pt.y <= el.y + el.height;
        }
        if (el.type === 'circle' && el.r) {
          const dx = pt.x - el.x, dy = pt.y - el.y;
          return dx * dx + dy * dy <= el.r * el.r;
        }
        if (el.type === 'line' && el.x2 !== undefined && el.y2 !== undefined) {
          const dx = el.x2 - el.x, dy = el.y2 - el.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len === 0) return false;
          const t = Math.max(0, Math.min(1, ((pt.x - el.x) * dx + (pt.y - el.y) * dy) / (len * len)));
          const cx = el.x + t * dx, cy = el.y + t * dy;
          return Math.sqrt((pt.x - cx) ** 2 + (pt.y - cy) ** 2) < 8;
        }
        return false;
      });
      setSelectedId(clicked?.id || null);
      if (clicked) {
        setDrawing(true);
        setStartPoint({ x: pt.x - clicked.x, y: pt.y - clicked.y });
      }
      return;
    }

    setDrawing(true);
    setStartPoint({ x: pt.x, y: pt.y });

    if (activeTool === 'wall') {
      const el: CanvasElement = {
        id: generateId(), type: 'line', x: pt.x, y: pt.y,
        x2: pt.x, y2: pt.y,
        fill: 'none', stroke: selectedColor, strokeWidth: 3, visible: true, layer: 'Walls',
      };
      setElements(prev => [...prev, el]);
      setSelectedId(el.id);
    } else if (activeTool === 'room') {
      const el: CanvasElement = {
        id: generateId(), type: 'rect', x: pt.x, y: pt.y,
        width: 0, height: 0,
        fill: selectedFill, stroke: selectedColor, strokeWidth: 1.5, visible: true, layer: 'Rooms',
      };
      setElements(prev => [...prev, el]);
      setSelectedId(el.id);
    } else if (activeTool === 'circle') {
      const el: CanvasElement = {
        id: generateId(), type: 'circle', x: pt.x, y: pt.y, r: 0,
        fill: selectedFill, stroke: selectedColor, strokeWidth: 1.5, visible: true, layer: 'Columns',
      };
      setElements(prev => [...prev, el]);
      setSelectedId(el.id);
    } else if (activeTool === 'text') {
      const el: CanvasElement = {
        id: generateId(), type: 'text', x: pt.x, y: pt.y,
        fill: selectedColor, stroke: 'none', strokeWidth: 0, visible: true, layer: 'Labels',
        label: 'Room',
      };
      setElements(prev => [...prev, el]);
      setSelectedId(el.id);
      setDrawing(false);
      toast('Double-click text to edit');
    } else if (activeTool === 'measure') {
      const el: CanvasElement = {
        id: generateId(), type: 'line', x: pt.x, y: pt.y,
        x2: pt.x, y2: pt.y,
        fill: 'none', stroke: '#e53e3e', strokeWidth: 1, visible: true, layer: 'Dimensions',
      };
      setElements(prev => [...prev, el]);
      setSelectedId(el.id);
    }
  }, [activeTool, elements, selectedColor, selectedFill]);

  const handleSVGMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawing || !svgRef.current) return;
    const pt = getSVGPoint(svgRef.current, e.clientX, e.clientY);

    if (activeTool === 'select' && selectedId && startPoint) {
      const el = elements.find(el => el.id === selectedId);
      if (el) {
        const dx = pt.x - startPoint.x - el.x;
        const dy = pt.y - startPoint.y - el.y;
        setElements(prev => prev.map(e => e.id === selectedId ? {
          ...e, x: pt.x - startPoint.x, y: pt.y - startPoint.y,
          x2: e.x2 ? e.x2 + (pt.x - startPoint.x - e.x - dx) : undefined,
          y2: e.y2 ? e.y2 + (pt.y - startPoint.y - e.y - dy) : undefined,
        } : e));
        setStartPoint({ x: pt.x - (el.x + dx), y: pt.y - (el.y + dy) });
      }
      return;
    }

    setElements(prev => prev.map(el => {
      if (el.id !== selectedId) return el;
      if (!startPoint) return el;
      if (el.type === 'line') {
        return { ...el, x2: pt.x, y2: pt.y };
      }
      if (el.type === 'rect') {
        return { ...el, width: pt.x - startPoint.x, height: pt.y - startPoint.y };
      }
      if (el.type === 'circle') {
        const r = Math.sqrt((pt.x - startPoint.x) ** 2 + (pt.y - startPoint.y) ** 2);
        return { ...el, r };
      }
      return el;
    }));
  }, [drawing, activeTool, selectedId, startPoint, elements]);

  const handleSVGMouseUp = useCallback(() => {
    if (drawing && activeTool !== 'select') {
      saveHistory(elements);
    }
    setDrawing(false);
    setStartPoint(null);
  }, [drawing, activeTool, elements, saveHistory]);

  const applyColorToSelected = useCallback((color: string, type: 'fill' | 'stroke') => {
    if (!selectedId) { setSelectedColor(color); return; }
    const el = elements.find(e => e.id === selectedId);
    if (!el) return;
    if (type === 'fill' && el.type !== 'line') {
      updateElement(selectedId, { fill: color });
      setSelectedFill(color);
    } else {
      updateElement(selectedId, { stroke: color });
      setSelectedColor(color);
    }
  }, [selectedId, elements, updateElement]);

  const exportSVG = useCallback(() => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#f8f9fa"/>
  ${elements.filter(e => e.visible).map(el => {
    if (el.type === 'rect') return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/>`;
    if (el.type === 'line' && el.x2 !== undefined) return `<line x1="${el.x}" y1="${el.y}" x2="${el.x2}" y2="${el.y2}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/>`;
    if (el.type === 'circle') return `<circle cx="${el.x}" cy="${el.y}" r="${el.r}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/>`;
    if (el.type === 'text') return `<text x="${el.x}" y="${el.y}" fill="${el.fill}" font-size="14">${el.label || ''}</text>`;
    return '';
  }).filter(Boolean).join('\n  ')}
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${planName.replace(/\s+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SVG exported');
  }, [elements, planName]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await api.post('/bim/floor-plans', {
        name: planName, width: 800, height: 600,
        elements: JSON.stringify(elements),
      });
      toast.success('Design saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  }, [planName, elements]);

  const handleImportImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBackgroundImage(ev.target?.result as string);
      toast.success('Image imported as background');
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedId) deleteSelected(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, deleteSelected, selectedId]);

  const visibleElements = elements.filter(e => layerStates[e.layer]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Design Studio</h1>
            <p className="text-muted-foreground mt-1">2D floor plan editor with real SVG canvas</p>
          </div>
          <Badge variant="outline" className="ml-4 text-xs">{elements.length} elements</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={undo} disabled={history.length === 0} title="Undo (Ctrl+Z)"><Undo2 className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Y)"><Redo2 className="w-4 h-4" /></Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImportImage} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Image className="w-4 h-4 mr-2" /> Import</Button>
          <Button variant="outline" onClick={exportSVG}><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save'}</Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => toast('AI Assist: Generating suggestions from current plan...')}><Sparkles className="w-4 h-4 mr-2" /> AI Assist</Button>
        </div>
      </div>

      <div className="grid grid-cols-[200px_1fr_260px] gap-4 h-[calc(100vh-200px)]">
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-3"><CardTitle className="text-xs flex items-center gap-2"><PenTool className="w-3 h-3" /> Tools</CardTitle></CardHeader>
          <CardContent className="p-2 space-y-0.5">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all', activeTool === tool.id ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-accent text-muted-foreground')}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tool.label}
                </button>
              );
            })}
            <hr className="my-2 border-border/50" />
            <button onClick={deleteSelected} disabled={!selectedId} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-30">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden relative">
          <svg
            ref={svgRef}
            width="100%" height="100%"
            viewBox={`0 0 ${800 * zoom / 100} ${600 * zoom / 100}`}
            preserveAspectRatio="xMidYMid meet"
            className="cursor-crosshair"
            style={{ background: '#f8f9fa', backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            onMouseDown={handleSVGMouseDown}
            onMouseMove={handleSVGMouseMove}
            onMouseUp={handleSVGMouseUp}
            onMouseLeave={handleSVGMouseUp}
          >
            {backgroundImage && <image href={backgroundImage} x="0" y="0" width="800" height="600" opacity="0.3" />}
            {visibleElements.map(el => {
              const isSelected = el.id === selectedId;
              if (el.type === 'rect' && el.width !== undefined && el.height !== undefined) {
                const w = Math.abs(el.width), h = Math.abs(el.height);
                const x = el.width < 0 ? el.x + el.width : el.x;
                const y = el.height < 0 ? el.y + el.height : el.y;
                return <rect key={el.id} x={x} y={y} width={w} height={h} fill={el.fill} stroke={isSelected ? '#3b82f6' : el.stroke} strokeWidth={isSelected ? 2 : el.strokeWidth} strokeDasharray={isSelected ? '4,2' : 'none'} rx="2" />;
              }
              if (el.type === 'circle') {
                return <circle key={el.id} cx={el.x} cy={el.y} r={el.r || 0} fill={el.fill} stroke={isSelected ? '#3b82f6' : el.stroke} strokeWidth={isSelected ? 2 : el.strokeWidth} />;
              }
              if (el.type === 'line' && el.x2 !== undefined) {
                return <line key={el.id} x1={el.x} y1={el.y} x2={el.x2} y2={el.y2} stroke={isSelected ? '#3b82f6' : el.stroke} strokeWidth={isSelected ? 2.5 : el.strokeWidth} />;
              }
              if (el.type === 'text') {
                return <text key={el.id} x={el.x} y={el.y} fill={el.fill} fontSize="14" fontFamily="sans-serif">{el.label}</text>;
              }
              return null;
            })}
            {drawing && startPoint && activeTool === 'measure' && (
              <text x={startPoint.x + 5} y={startPoint.y - 5} fill="#e53e3e" fontSize="11" fontFamily="sans-serif">
                {elements.find(e => e.id === selectedId && e.x2 !== undefined) ? (
                  <>
                    {Math.round(Math.sqrt(
                      ((elements.find(e => e.id === selectedId)?.x2 || 0) - startPoint.x) ** 2 +
                      ((elements.find(e => e.id === selectedId)?.y2 || 0) - startPoint.y) ** 2
                    ))}px
                  </>
                ) : '0px'}
              </text>
            )}
          </svg>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur rounded-lg p-1 border shadow-sm">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(Math.max(25, zoom - 10))}><Minus className="w-3 h-3" /></Button>
            <span className="text-[11px] font-medium px-2 min-w-[36px] text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(Math.min(200, zoom + 10))}><Plus className="w-3 h-3" /></Button>
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="glass-card overflow-hidden">
            <Tabs defaultValue="colors" className="p-3">
              <TabsList className="w-full h-8">
                <TabsTrigger value="colors" className="text-[11px] px-2"><Palette className="w-3 h-3 mr-1" /> Colors</TabsTrigger>
                <TabsTrigger value="layers" className="text-[11px] px-2"><Layers className="w-3 h-3 mr-1" /> Layers</TabsTrigger>
                <TabsTrigger value="props" className="text-[11px] px-2"><Eye className="w-3 h-3 mr-1" /> Props</TabsTrigger>
              </TabsList>
              <TabsContent value="colors" className="mt-2 space-y-2">
                <div className="flex gap-2 mb-1">
                  <button onClick={() => setShowColorPicker('fill')} className={cn('text-[10px] px-2 py-0.5 rounded transition-colors', showColorPicker === 'fill' ? 'bg-primary/20 text-primary' : 'text-muted-foreground')}>Fill</button>
                  <button onClick={() => setShowColorPicker('stroke')} className={cn('text-[10px] px-2 py-0.5 rounded transition-colors', showColorPicker === 'stroke' ? 'bg-primary/20 text-primary' : 'text-muted-foreground')}>Stroke</button>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {(showColorPicker === 'stroke' ? wallColors : roomColors).map((color, i) => (
                    <button key={i} onClick={() => applyColorToSelected(color, showColorPicker)} className="w-full aspect-square rounded-lg border border-border hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
                  ))}
                </div>
                {colorPalettes.map((palette) => (
                  <div key={palette.name}>
                    <p className="text-[10px] text-muted-foreground mb-0.5">{palette.name}</p>
                    <div className="flex gap-1">
                      {palette.colors.map((color, i) => (
                        <button key={i} onClick={() => applyColorToSelected(color, showColorPicker)} className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="layers" className="mt-2">
                <div className="space-y-1">
                  {['Walls', 'Rooms', 'Columns', 'Labels', 'Dimensions'].map((layer) => (
                    <label key={layer} className="flex items-center gap-2 text-[11px] py-1">
                      <input type="checkbox" checked={layerStates[layer]} onChange={() => setLayerStates(prev => ({ ...prev, [layer]: !prev[layer] }))} className="rounded border-border w-3 h-3" />
                      <span className="flex-1">{layer}</span>
                      <span className="text-[10px] text-muted-foreground">{elements.filter(e => e.layer === layer).length}</span>
                    </label>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="props" className="mt-2">
                {selectedElement ? (
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{selectedElement.type}</span></div>
                    <div><span className="text-muted-foreground">Layer:</span> <span className="font-medium">{selectedElement.layer}</span></div>
                    <div><span className="text-muted-foreground">Position:</span> <span className="font-medium">({Math.round(selectedElement.x)}, {Math.round(selectedElement.y)})</span></div>
                    {selectedElement.width && <div><span className="text-muted-foreground">Size:</span> <span className="font-medium">{Math.round(selectedElement.width)} × {Math.round(selectedElement.height || 0)}</span></div>}
                    {selectedElement.r && <div><span className="text-muted-foreground">Radius:</span> <span className="font-medium">{Math.round(selectedElement.r)}</span></div>}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Select an element to see its properties</p>
                )}
              </TabsContent>
            </Tabs>
          </Card>
          <Card className="glass-card overflow-hidden p-3">
            <p className="text-[11px] font-medium mb-1">Plan Name</p>
            <input
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" className="flex-1 text-[11px] h-7" onClick={() => { setElements([]); setHistory([]); setFuture([]); setSelectedId(null); toast.success('Canvas cleared'); }}>
                <RotateCcw className="w-3 h-3 mr-1" /> Clear
              </Button>
              <Button size="sm" className="flex-1 text-[11px] h-7" onClick={handleSave} disabled={saving}>
                <Save className="w-3 h-3 mr-1" /> Save
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
