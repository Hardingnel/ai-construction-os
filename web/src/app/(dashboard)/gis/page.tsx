'use client';
import { useState } from 'react';
import { Map, Search, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function GISPage() {
  const [lat, setLat] = useState('8.4657');
  const [lng, setLng] = useState('-13.2317');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res: any = await api.post('/gis/analyze', { latitude: parseFloat(lat), longitude: parseFloat(lng) });
      setResult(res);
      toast.success('Analysis complete');
    } catch (e: any) { toast.error(e.message); }
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">GIS Analysis</h1><p className="text-muted-foreground mt-1">Geospatial site analysis and terrain evaluation</p></div>
      <div className="grid grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Location</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Latitude</label><input value={lat} onChange={e => setLat(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" /></div>
            <div><label className="text-xs text-muted-foreground">Longitude</label><input value={lng} onChange={e => setLng(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" /></div>
          </div>
          <button onClick={handleAnalyze} disabled={analyzing} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Search className="w-4 h-4" /> Analyze Site</>}
          </button>
        </div>
        <div className="glass-card rounded-xl p-5 space-y-3">
          <h3 className="font-semibold">Results</h3>
          {result ? (
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Terrain:</span> {result.analysis?.elevation?.terrain_type || 'N/A'}</p>
              <p><span className="text-muted-foreground">Flood Risk:</span> {result.analysis?.flood?.risk_level || 'N/A'}</p>
              <p><span className="text-muted-foreground">Solar Potential:</span> {result.analysis?.sunlight?.solar_potential || 'N/A'}</p>
              <p><span className="text-muted-foreground">Suitability:</span> {result.overall_suitability || 'N/A'}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Map className="w-12 h-12 mb-3 opacity-40" /><p className="text-sm">Enter coordinates and analyze</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
