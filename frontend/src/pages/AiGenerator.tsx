import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Wand2, Building2, ArrowRight, Loader2, Sparkles, Zap,
  Home, Heart, Download, AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api';

const BUILDING_STYLES = ['Modern', 'Contemporary', 'African Contemporary', 'Minimalist', 'Mediterranean', 'Colonial', 'Tropical Modern', 'Industrial', 'Sustainable/Green'];
const BUILDING_TYPES = ['Residential', 'Commercial', 'Mixed-Use', 'Institutional', 'Industrial', 'Infrastructure'];
const ROOM_COUNTS = ['1', '2', '3', '4', '5', '6', '7', '8+'];
const FLOORS = ['1', '2', '3', '4', '5', '6+'];

interface AIDesign {
  id: string;
  name: string;
  type: string;
  style: string;
  description?: string;
  prompt: string;
  result: string;
  model?: string;
  createdAt: string;
  pythonError?: string | null;
}

interface DesignResult {
  name: string;
  type: string;
  style: string;
  bedrooms: number;
  floors: number;
  area_sqm: number;
  features: string[];
  room_layout: Record<string, string>;
  recommendations: string[];
  _fallback?: boolean;
}

const samplePrompts = [
  'A modern 4-bedroom duplex with African roofing, natural lighting, and flood-resistant foundation',
  'Sustainable office complex with green roof, solar panels, and rainwater harvesting',
  'Mixed-use development with retail spaces, apartments, and underground parking',
  'Eco-friendly resort with villas, pool, and tropical landscaping on a hillside',
];

export function AiGenerator() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Modern');
  const [type, setType] = useState('Residential');
  const [bedrooms, setBedrooms] = useState('3');
  const [floors, setFloors] = useState('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [designs, setDesigns] = useState<AIDesign[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<AIDesign[]>('/generations');
        if (data.length > 0) {
          setDesigns(data.slice(0, 4));
          setShowResults(true);
        }
      } catch { /* no designs yet */ }
    }
    load();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await api.post<AIDesign>('/generations', {
        prompt: prompt.trim(),
        type,
        style,
        bedrooms: parseInt(bedrooms),
        floors: parseInt(floors),
      });
      setDesigns(prev => [result, ...prev].slice(0, 4));
      setShowResults(true);
      if (result.pythonError) {
        toast('Python AI unavailable — using fallback engine');
      } else {
        toast('Design generated successfully by AI engine');
      }
    } catch (e: any) {
      toast(e?.message || 'Failed to generate design');
    }
    setIsGenerating(false);
  };

  const parseResult = (d: AIDesign): DesignResult | null => {
    try { return JSON.parse(d.result); } catch { return null; }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">AI Building Generator</h1>
        <p className="text-muted-foreground mt-1">Describe your dream building in natural language and let AI generate complete designs</p>
      </div>

      <div className="glass-card p-6 rounded-xl space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your building project in detail... (e.g., 'I want a modern 4-bedroom duplex with African roofing, natural lighting, smart home setup, flood-resistant foundation, and parking for 3 cars')"
            className="w-full min-h-[120px] rounded-xl border border-input bg-background/50 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground/50"
            rows={4}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">{prompt.length}/1000</Badge>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Building Style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUILDING_STYLES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Building Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUILDING_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Bedrooms</label>
            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROOM_COUNTS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Floors</label>
            <Select value={floors} onValueChange={setFloors}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FLOORS.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-wrap gap-2">
            {samplePrompts.slice(0, 2).map((sample, i) => (
              <button
                key={i}
                onClick={() => setPrompt(sample)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/50 hover:bg-accent text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                <Home className="w-3 h-3" />
                {sample.slice(0, 40)}...
              </button>
            ))}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Wand2 className="w-4 h-4 mr-2" />Generate Design</>
            )}
          </Button>
        </div>
      </div>

      {isGenerating && (
        <div className="glass-card p-8 rounded-xl flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 animate-pulse flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold">AI is generating your design...</p>
            <p className="text-sm text-muted-foreground">Analyzing requirements • Creating floor plans • Optimizing layout</p>
          </div>
          <div className="w-64 h-1.5 bg-accent rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {showResults && !isGenerating && designs.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated Designs</h2>
            <Badge variant="success" className="px-3 py-1">{designs.length} design{designs.length !== 1 ? 's' : ''}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {designs.map((design) => {
              const r = parseResult(design);
              return (
                <Card key={design.id} className="glass-card overflow-hidden group hover:border-primary/50 transition-all duration-300">
                  <div className="h-48 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-grid opacity-30" />
                    <div className="text-center relative z-10">
                      <Building2 className="w-12 h-12 text-primary/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{r?.style || design.type}</p>
                      {r && <p className="text-xs text-muted-foreground">{r.area_sqm} m²</p>}
                    </div>
                    {r?._fallback && <Badge variant="warning" className="absolute top-2 right-2 text-[10px]">Fallback</Badge>}
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{r?.name || 'Untitled Design'}</h3>
                        <p className="text-xs text-muted-foreground">{r?.bedrooms} bed · {r?.floors} floor{(r?.floors || 0) > 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast('Added to favorites')}><Heart className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { toast('Download started'); }}><Download className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    {r?.features && r.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {r.features.slice(0, 3).map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                        ))}
                      </div>
                    )}
                    {r?.room_layout && (
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {Object.entries(r.room_layout).slice(0, 4).map(([room, dim]) => (
                          <div key={room} className="flex justify-between px-2 py-1 rounded bg-accent/30">
                            <span className="capitalize text-muted-foreground">{room.replace(/_/g, ' ')}</span>
                            <span className="font-mono">{dim}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button size="sm" className="w-full h-8" onClick={() => navigate(`/design?design=${design.id}`)}>
                      View Details <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                    {design.pythonError && (
                      <p className="text-[10px] text-amber-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{design.pythonError}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {showResults && !isGenerating && designs.length === 0 && (
        <div className="glass-card p-8 rounded-xl text-center text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No designs generated yet</p>
          <p className="text-sm">Use the form above to generate your first AI design</p>
        </div>
      )}
    </motion.div>
  );
}
