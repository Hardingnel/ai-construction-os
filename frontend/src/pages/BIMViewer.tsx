import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Box, Layers, Eye, Move3d, RotateCw,
  ZoomIn, ZoomOut, Grid3x3, Maximize2, Download, Upload,
  Sun, Moon, Home, Building2, SlidersHorizontal, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const bimLayers = [
  { id: 'structural', label: 'Structural', visible: true, color: '#3b82f6' },
  { id: 'architectural', label: 'Architectural', visible: true, color: '#8b5cf6' },
  { id: 'mechanical', label: 'Mechanical', visible: false, color: '#f59e0b' },
  { id: 'electrical', label: 'Electrical', visible: false, color: '#10b981' },
  { id: 'plumbing', label: 'Plumbing', visible: false, color: '#06b6d4' },
  { id: 'fire', label: 'Fire Protection', visible: false, color: '#ef4444' },
];

const objectProperties = [
  { label: 'Type', value: 'Concrete Column' },
  { label: 'Material', value: 'Reinforced Concrete' },
  { label: 'Dimensions', value: '400mm x 400mm' },
  { label: 'Height', value: '3.2m' },
  { label: 'Volume', value: '0.512 m³' },
  { label: 'IFC Class', value: 'IfcColumn' },
  { label: 'ID', value: 'CL-001-004' },
];

export function BIMViewer() {
  const [activeTab, setActiveTab] = useState('viewer');
  const [layers, setLayers] = useState(bimLayers);

  const toggleLayer = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">BIM Viewer</h1>
          <p className="text-muted-foreground mt-1">3D Building Information Model viewer with IFC support</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" /> Import IFC
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[280px_1fr_280px] gap-4 h-[calc(100vh-200px)]">
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" /> Layers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                  layer.visible ? 'bg-accent/50' : 'opacity-40 hover:opacity-60'
                )}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: layer.color }} />
                <span className="flex-1 text-left">{layer.label}</span>
                <Eye className={cn('w-3.5 h-3.5', layer.visible ? 'text-primary' : 'text-muted-foreground')} />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Box className="w-24 h-24 text-primary/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">3D BIM Viewport</h3>
                <p className="text-sm text-muted-foreground/60 mb-4">Import an IFC file to view the 3D model</p>
                <Button variant="outline" className="mx-auto">
                  <Upload className="w-4 h-4 mr-2" /> Load IFC Model
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur rounded-lg p-1 border">
            <Button variant="ghost" size="icon" className="h-8 w-8"><Move3d className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><RotateCw className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomIn className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomOut className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><Maximize2 className="w-4 h-4" /></Button>
          </div>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="w-4 h-4" /> Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {objectProperties.map((prop) => (
                <div key={prop.label} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-xs text-muted-foreground">{prop.label}</span>
                  <span className="text-xs font-medium">{prop.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
