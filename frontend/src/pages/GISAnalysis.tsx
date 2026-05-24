import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Map, Layers, Mountain, Sun, Wind, Droplets,
  Download, Eye, Plus, Search,
  Activity, Compass, AlertTriangle, Loader2, AlertCircle, Inbox,
  Crosshair, ZoomIn, ZoomOut, Move
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface GISRecord {
  id: string;
  latitude: number;
  longitude: number;
  elevation: number | null;
  floodRisk: string | null;
  soilType: string | null;
  projectId: string;
}

interface TerrainPoint {
  lat: number;
  lng: number;
  elev: number;
}

const analysisLayers = [
  { id: 'flood', label: 'Flood Zones', icon: AlertTriangle, active: true, color: 'text-blue-500' },
  { id: 'elevation', label: 'Elevation', icon: Mountain, active: true, color: 'text-emerald-500' },
  { id: 'sunlight', label: 'Sunlight', icon: Sun, active: false, color: 'text-yellow-500' },
  { id: 'drainage', label: 'Drainage', icon: Droplets, active: false, color: 'text-cyan-500' },
  { id: 'wind', label: 'Wind Patterns', icon: Wind, active: false, color: 'text-indigo-500' },
];

function elevationColor(elev: number): string {
  if (elev < 5) return '#a3e4d7';
  if (elev < 15) return '#76d7c4';
  if (elev < 30) return '#48c9b0';
  if (elev < 50) return '#f9e79f';
  if (elev < 80) return '#f5b041';
  if (elev < 120) return '#eb984e';
  if (elev < 200) return '#dc7633';
  if (elev < 500) return '#a04000';
  return '#ffffff';
}

function generateTerrain(
  centerLat: number, centerLng: number,
  baseElev: number, size: number
): TerrainPoint[] {
  const points: TerrainPoint[] = [];
  const step = 0.002;
  for (let i = -size; i <= size; i++) {
    for (let j = -size; j <= size; j++) {
      const lat = centerLat + i * step;
      const lng = centerLng + j * step;
      const noise =
        Math.sin(i * 0.3 + j * 0.5) * 15 +
        Math.cos(i * 0.7 - j * 0.2) * 10 +
        Math.sin(i * 1.2 + j * 0.8) * 5;
      points.push({ lat, lng, elev: Math.max(0, baseElev + noise) });
    }
  }
  return points;
}

export function GISAnalysis() {
  const [layers, setLayers] = useState(analysisLayers);
  const [location, setLocation] = useState('');
  const [gisData, setGisData] = useState<GISRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terrain, setTerrain] = useState<TerrainPoint[]>([]);
  const [viewCenter, setViewCenter] = useState<{ lat: number; lng: number }>({ lat: 8.48, lng: -13.23 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true); setError(null);
        const data = await api.get<GISRecord[]>('/gis');
        if (!cancelled) {
          setGisData(data);
          if (data.length > 0) {
            setViewCenter({ lat: data[0].latitude, lng: data[0].longitude });
            const elev = data[0].elevation || 30;
            setTerrain(generateTerrain(data[0].latitude, data[0].longitude, elev, 15));
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load GIS data');
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const drawTerrain = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width = canvas.clientWidth * window.devicePixelRatio;
    const h = canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, cw, ch);

    if (terrain.length === 0) return;

    const elevationLayer = layers.find(l => l.id === 'elevation')?.active !== false;
    const floodLayer = layers.find(l => l.id === 'flood')?.active !== false;

    const scale = 10 * zoomLevel;
    const cx = cw / 2 + panOffset.x;
    const cy = ch / 2 + panOffset.y;

    const minLng = Math.min(...terrain.map(p => p.lng));
    const maxLng = Math.max(...terrain.map(p => p.lng));
    const minLat = Math.min(...terrain.map(p => p.lat));
    const maxLat = Math.max(...terrain.map(p => p.lat));

    const lngSpan = maxLng - minLng || 0.01;
    const latSpan = maxLat - minLat || 0.01;

    if (elevationLayer) {
      for (const p of terrain) {
        const x = cx + ((p.lng - viewCenter.lng) / lngSpan) * 200 * scale;
        const y = cy - ((p.lat - viewCenter.lat) / latSpan) * 200 * scale;
        ctx.fillStyle = elevationColor(p.elev);
        ctx.fillRect(x, y, 3 * scale, 3 * scale);
      }
    }

    if (floodLayer) {
      const floodPoints = terrain.filter(p => p.elev < 10);
      for (const p of floodPoints) {
        const x = cx + ((p.lng - viewCenter.lng) / lngSpan) * 200 * scale;
        const y = cy - ((p.lat - viewCenter.lat) / latSpan) * 200 * scale;
        ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
        ctx.beginPath();
        ctx.arc(x, y, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const windLayer = layers.find(l => l.id === 'wind')?.active;
    if (windLayer) {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const sx = cw * 0.1 + Math.random() * cw * 0.8;
        const sy = ch * 0.1 + Math.random() * ch * 0.8;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        for (let t = 0; t < 6; t++) {
          ctx.lineTo(sx + t * 20 + Math.random() * 10, sy + (t % 2 === 0 ? -5 : 5) * 3);
        }
        ctx.stroke();
      }
    }

    const sunlightLayer = layers.find(l => l.id === 'sunlight')?.active;
    if (sunlightLayer) {
      const grad = ctx.createRadialGradient(cw * 0.7, ch * 0.2, 0, cw * 0.7, ch * 0.2, 120);
      grad.addColorStop(0, 'rgba(255, 200, 50, 0.3)');
      grad.addColorStop(1, 'rgba(255, 200, 50, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);
    }

    const drainageLayer = layers.find(l => l.id === 'drainage')?.active;
    if (drainageLayer) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const sx = Math.random() * cw;
        const sy = Math.random() * ch;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        for (let t = 0; t < 4; t++) {
          ctx.lineTo(sx + t * 25 + Math.random() * 15, sy + 15 + t * 8);
        }
        ctx.stroke();
      }
    }

    for (const rec of gisData) {
      const x = cx + ((rec.longitude - viewCenter.lng) / lngSpan) * 200 * scale;
      const y = cy - ((rec.latitude - viewCenter.lat) / latSpan) * 200 * scale;
      ctx.beginPath();
      ctx.arc(x, y, 6 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${rec.latitude.toFixed(4)}, ${rec.longitude.toFixed(4)}`, x, y - 10 * scale);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Scale: 1:${Math.round(5000 / zoomLevel)} | Center: ${viewCenter.lat.toFixed(4)}, ${viewCenter.lng.toFixed(4)}`, 8, ch - 8);
  }, [terrain, layers, viewCenter, zoomLevel, panOffset, gisData]);

  useEffect(() => { drawTerrain(); }, [drawTerrain]);

  const toggleLayer = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, active: !l.active } : l));
  };

  const focusOnRecord = (rec: GISRecord) => {
    setViewCenter({ lat: rec.latitude, lng: rec.longitude });
    setTerrain(generateTerrain(rec.latitude, rec.longitude, rec.elevation || 30, 15));
    toast.success(`Centered on ${rec.latitude.toFixed(4)}, ${rec.longitude.toFixed(4)}`);
  };

  const handleSearch = () => {
    if (!location.trim()) return;
    const match = location.match(/(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setViewCenter({ lat, lng });
        setTerrain(generateTerrain(lat, lng, 30, 15));
        toast.success(`Navigated to ${lat}, ${lng}`);
        return;
      }
    }
    toast.error('Enter coordinates as "lat, lng" (e.g. 8.48, -13.23)');
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleCanvasMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoomLevel(z => Math.max(0.5, Math.min(5, z + (e.deltaY > 0 ? -0.2 : 0.2))));
  };

  const exportReport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `gis-terrain-${viewCenter.lat.toFixed(2)}-${viewCenter.lng.toFixed(2)}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success('Terrain map exported as PNG');
  };

  const currentGIS = gisData[0];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">GIS & Land Analysis</h1>
          <p className="text-muted-foreground mt-1">Terrain analysis, flood mapping, and environmental intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport}><Download className="w-4 h-4 mr-2" /> Export Map</Button>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={() => { toast('New analysis: Select a project first'); }}><Plus className="w-4 h-4 mr-2" /> New Analysis</Button>
        </div>
      </div>

      <div className="grid grid-cols-[260px_1fr_280px] gap-4 h-[calc(100vh-200px)]">
        <Card className="glass-card overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4" /> Analysis Layers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 flex-1">
            {layers.map((layer) => {
              const Icon = layer.icon;
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all', layer.active ? 'bg-accent/50' : 'opacity-40 hover:opacity-60')}
                >
                  <Icon className={cn('w-4 h-4', layer.color)} />
                  <span className="flex-1 text-left">{layer.label}</span>
                  <Eye className={cn('w-3.5 h-3.5', layer.active ? 'text-primary' : 'text-muted-foreground')} />
                </button>
              );
            })}
            <hr className="my-3 border-border/50" />
            <p className="text-xs text-muted-foreground mb-2">Navigate</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="lat, lng (e.g. 8.48, -13.23)..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => setZoomLevel(z => Math.min(5, z + 0.3))}><ZoomIn className="w-3 h-3 mr-1" /> Zoom In</Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.3))}><ZoomOut className="w-3 h-3 mr-1" /> Zoom Out</Button>
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs h-7 mt-1" onClick={() => { setPanOffset({ x: 0, y: 0 }); setZoomLevel(1); }}>
              <Crosshair className="w-3 h-3 mr-1" /> Reset View
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
          />
          <div className="absolute top-3 left-3 flex gap-1">
            <Badge variant="secondary" className="text-[10px]">{zoomLevel.toFixed(1)}x</Badge>
            <Badge variant="secondary" className="text-[10px]">{gisData.length} site(s)</Badge>
          </div>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Site Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            ) : currentGIS ? (
              <>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Elevation</span>
                  <Badge variant="secondary" className="text-[10px]">{currentGIS.elevation ?? '—'}m</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Flood Risk</span>
                  <Badge className={cn('text-[10px]', currentGIS.floodRisk === 'low' ? 'bg-green-500/20 text-green-500' : currentGIS.floodRisk === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500')}>
                    {currentGIS.floodRisk ?? 'Unknown'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Soil Type</span>
                  <Badge variant="secondary" className="text-[10px]">{currentGIS.soilType ?? 'Unknown'}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Coordinates</span>
                  <span className="text-xs font-medium">{currentGIS.latitude.toFixed(4)}, {currentGIS.longitude.toFixed(4)}</span>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs font-medium text-emerald-500 mb-1">AI Assessment</p>
                  <p className="text-xs text-muted-foreground">
                    {currentGIS.floodRisk === 'low'
                      ? 'Site shows favorable conditions for construction. Low flood risk with good drainage potential.'
                      : 'Site requires additional flood mitigation measures. Consider elevated foundation design.'}
                  </p>
                </div>
                {gisData.slice(1).map(rec => (
                  <button key={rec.id} onClick={() => focusOnRecord(rec)} className="w-full text-left p-2 rounded-lg hover:bg-accent/50 transition-colors border border-border/50">
                    <p className="text-xs font-medium">{rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}</p>
                    <p className="text-[10px] text-muted-foreground">Elev: {rec.elevation ?? '—'}m | Flood: {rec.floodRisk ?? '—'}</p>
                  </button>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox className="w-8 h-8 mb-2" />
                <p className="text-xs">No GIS data available</p>
                <p className="text-[10px]">Create a project with GIS data to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
