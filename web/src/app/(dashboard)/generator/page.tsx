'use client';
import { useState } from 'react';
import { Wand2, Building2, Loader2, Sparkles, Zap, Home } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const BUILDING_STYLES = ['Modern', 'Contemporary', 'African Contemporary', 'Minimalist', 'Mediterranean', 'Colonial', 'Tropical Modern', 'Industrial', 'Sustainable/Green'];
const BUILDING_TYPES = ['Residential', 'Commercial', 'Mixed-Use', 'Institutional', 'Industrial', 'Infrastructure'];
const ROOM_COUNTS = ['1', '2', '3', '4', '5', '6', '7', '8+'];
const FLOORS = ['1', '2', '3', '4', '5', '6+'];

const samplePrompts = [
  'A modern 4-bedroom duplex with African roofing, natural lighting, and flood-resistant foundation',
  'Sustainable office complex with green roof, solar panels, and rainwater harvesting',
];

export default function GeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Modern');
  const [type, setType] = useState('Residential');
  const [bedrooms, setBedrooms] = useState('3');
  const [floors, setFloors] = useState('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const res: any = await api.post('/generations', { prompt: prompt.trim(), type, style, bedrooms: parseInt(bedrooms), floors: parseInt(floors) });
      setResult(JSON.parse(res.result));
      toast.success('Design generated!');
    } catch (e: any) { toast.error(e.message); }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">AI Building Generator</h1><p className="text-muted-foreground mt-1">Describe your dream building in natural language</p></div>
      <div className="glass-card p-6 rounded-xl space-y-4">
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
          placeholder="Describe your building project in detail..."
          className="w-full min-h-[100px] rounded-xl border border-input bg-background/50 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
        <div className="grid grid-cols-4 gap-4">
          <Select options={BUILDING_STYLES} value={style} onChange={setStyle} label="Style" />
          <Select options={BUILDING_TYPES} value={type} onChange={setType} label="Type" />
          <Select options={ROOM_COUNTS} value={bedrooms} onChange={setBedrooms} label="Bedrooms" />
          <Select options={FLOORS} value={floors} onChange={setFloors} label="Floors" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">{samplePrompts.map((s, i) => (<button key={i} onClick={() => setPrompt(s)} className="px-3 py-1.5 rounded-lg bg-accent/50 hover:bg-accent text-xs">{s.slice(0, 40)}...<Home className="w-3 h-3 inline ml-1" /></button>))}</div>
          <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50">
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Wand2 className="w-4 h-4" />Generate Design</>}
          </button>
        </div>
      </div>
      {isGenerating && (
        <div className="glass-card p-8 rounded-xl flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 animate-pulse flex items-center justify-center"><Sparkles className="w-8 h-8 text-white" /></div>
          <p className="font-semibold">AI is generating your design...</p>
        </div>
      )}
      {result && (
        <div className="glass-card rounded-xl p-6 space-y-3">
          <h2 className="text-xl font-semibold">{result.name}</h2>
          <p className="text-sm text-muted-foreground">{result.bedrooms} bed · {result.floors} floor(s) · {result.area_sqm} m²</p>
          {result.features && <div className="flex flex-wrap gap-2">{result.features.map((f: string, i: number) => <span key={i} className="px-2 py-1 rounded-full bg-accent text-xs">{f}</span>)}</div>}
          {result.room_layout && <div className="grid grid-cols-2 gap-2 text-sm">{[...Object.entries(result.room_layout)].slice(0, 6).map(([room, dim]: any) => <div key={room} className="flex justify-between px-3 py-2 rounded-lg bg-accent/30"><span className="capitalize">{room.replace(/_/g, ' ')}</span><span className="font-mono">{dim}</span></div>)}</div>}
          {result.recommendations && <div className="space-y-1">{result.recommendations.map((r: string, i: number) => <p key={i} className="text-xs text-muted-foreground">• {r}</p>)}</div>}
        </div>
      )}
    </div>
  );
}

function Select({ options, value, onChange, label }: { options: string[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">{options.map(o => <option key={o} value={o}>{o}</option>)}</select>
    </div>
  );
}
