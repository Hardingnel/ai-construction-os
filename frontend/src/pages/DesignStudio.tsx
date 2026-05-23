import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PenTool, Palette, Image, Upload, Download, Layers,
  RotateCcw, Eye, Grid3x3, Maximize2, Minus, Plus,
  Undo2, Redo2, Save, Share2, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const tools = [
  { id: 'select', label: 'Select', icon: Eye },
  { id: 'draw', label: 'Draw', icon: PenTool },
  { id: 'wall', label: 'Walls', icon: Grid3x3 },
  { id: 'room', label: 'Rooms', icon: Maximize2 },
  { id: 'measure', label: 'Measure', icon: Minus },
];

const colorPalettes = [
  { name: 'Modern Neutral', colors: ['#f5f5f0', '#d4d4c8', '#a8a89e', '#707068', '#383830'] },
  { name: 'African Earth', colors: ['#e8d5b7', '#c4a67a', '#8b6914', '#5c4033', '#2c1810'] },
  { name: 'Ocean Breeze', colors: ['#e0f7fa', '#80deea', '#26c6da', '#00acc1', '#00838f'] },
  { name: 'Sunset Warm', colors: ['#ffe0b2', '#ffcc80', '#ff9800', '#f57c00', '#e65100'] },
];

export function DesignStudio() {
  const [activeTool, setActiveTool] = useState('select');
  const [zoom, setZoom] = useState(100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Design Studio</h1>
          <p className="text-muted-foreground mt-1">2D floor plan editor with AI-assisted design tools</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Undo2 className="w-4 h-4" /></Button>
          <Button variant="outline"><Redo2 className="w-4 h-4" /></Button>
          <Button variant="outline"><Save className="w-4 h-4 mr-2" /> Save</Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600"><Sparkles className="w-4 h-4 mr-2" /> AI Assist</Button>
        </div>
      </div>

      <div className="grid grid-cols-[240px_1fr_280px] gap-4 h-[calc(100vh-200px)]">
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-3 space-y-1">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                    activeTool === tool.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-accent text-muted-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tool.label}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <div className="absolute inset-0 bg-grid opacity-30" />
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <PenTool className="w-24 h-24 text-primary/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">2D Floor Plan Canvas</h3>
                <p className="text-sm text-muted-foreground/60 mb-4">Select a tool to start designing</p>
                <Button variant="outline" className="mx-auto">
                  <Image className="w-4 h-4 mr-2" /> Import Sketch
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur rounded-lg p-1 border">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(25, zoom - 10))}>
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-xs font-medium px-2">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(200, zoom + 10))}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </Card>

        <Card className="glass-card overflow-hidden">
          <Tabs defaultValue="colors" className="p-3">
            <TabsList className="w-full">
              <TabsTrigger value="colors" className="flex-1"><Palette className="w-3 h-3 mr-1" /> Colors</TabsTrigger>
              <TabsTrigger value="layers" className="flex-1"><Layers className="w-3 h-3 mr-1" /> Layers</TabsTrigger>
            </TabsList>
            <TabsContent value="colors" className="mt-3 space-y-3">
              {colorPalettes.map((palette) => (
                <div key={palette.name}>
                  <p className="text-xs text-muted-foreground mb-1">{palette.name}</p>
                  <div className="flex gap-1">
                    {palette.colors.map((color, i) => (
                      <button
                        key={i}
                        className="w-7 h-7 rounded-lg border border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="layers" className="mt-3">
              <div className="space-y-2">
                {['Walls', 'Doors', 'Windows', 'Furniture', 'Dimensions'].map((layer) => (
                  <label key={layer} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked className="rounded border-border" />
                    {layer}
                  </label>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </motion.div>
  );
}
