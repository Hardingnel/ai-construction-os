import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Map, Layers, Mountain, Sun, Wind, Droplets,
  Thermometer, Navigation, Download, Eye, Plus, Search,
  TrendingUp, Activity, Compass, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const analysisLayers = [
  { id: 'flood', label: 'Flood Zones', icon: AlertTriangle, active: true, color: 'text-blue-500' },
  { id: 'elevation', label: 'Elevation', icon: Mountain, active: true, color: 'text-emerald-500' },
  { id: 'sunlight', label: 'Sunlight', icon: Sun, active: false, color: 'text-yellow-500' },
  { id: 'drainage', label: 'Drainage', icon: Droplets, active: false, color: 'text-cyan-500' },
  { id: 'wind', label: 'Wind Patterns', icon: Wind, active: false, color: 'text-indigo-500' },
];

const siteData = {
  elevation: '42m',
  floodRisk: 'Low',
  avgTemp: '27°C',
  annualRainfall: '3,200mm',
  soilType: 'Lateritic',
  seismicZone: 'Zone 2',
};

export function GISAnalysis() {
  const [layers, setLayers] = useState(analysisLayers);
  const [location, setLocation] = useState('');

  const toggleLayer = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, active: !l.active } : l));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">GIS & Land Analysis</h1>
          <p className="text-muted-foreground mt-1">Terrain analysis, flood mapping, and environmental intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export Report</Button>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600"><Plus className="w-4 h-4 mr-2" /> New Analysis</Button>
        </div>
      </div>

      <div className="grid grid-cols-[280px_1fr_300px] gap-4 h-[calc(100vh-200px)]">
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" /> Analysis Layers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {layers.map((layer) => {
              const Icon = layer.icon;
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                    layer.active ? 'bg-accent/50' : 'opacity-40 hover:opacity-60'
                  )}
                >
                  <Icon className={cn('w-4 h-4', layer.color)} />
                  <span className="flex-1 text-left">{layer.label}</span>
                  <Eye className={cn('w-3.5 h-3.5', layer.active ? 'text-primary' : 'text-muted-foreground')} />
                </button>
              );
            })}
          </CardContent>
          <div className="p-3 border-t">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Search location..."
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        </Card>

        <Card className="glass-card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Map className="w-24 h-24 text-primary/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Interactive Map Viewport</h3>
                <p className="text-sm text-muted-foreground/60 mb-4">Mapbox integration for terrain visualization</p>
                <Button variant="outline" className="mx-auto">
                  <Compass className="w-4 h-4 mr-2" /> Locate Site
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" /> Site Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(siteData).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <Badge variant="secondary" className="text-[10px]">{value}</Badge>
              </div>
            ))}
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs font-medium text-emerald-500 mb-1">AI Assessment</p>
              <p className="text-xs text-muted-foreground">Site shows favorable conditions for construction. Low flood risk with good drainage potential.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
