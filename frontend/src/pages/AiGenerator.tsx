import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wand2, Image, Download, Share2, Heart, Sparkles,
  Home, Building2, Warehouse, TreePine, Castle,
  ArrowRight, Loader2, Zap, Palette, MapPin,
  Sun, Wind, Droplets
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const BUILDING_STYLES = ['Modern', 'Contemporary', 'African Contemporary', 'Minimalist', 'Mediterranean', 'Colonial', 'Tropical Modern', 'Industrial', 'Sustainable/Green'];
const BUILDING_TYPES = ['Residential', 'Commercial', 'Mixed-Use', 'Institutional', 'Industrial', 'Infrastructure'];
const ROOM_COUNTS = ['1', '2', '3', '4', '5', '6', '7', '8+'];
const FLOORS = ['1', '2', '3', '4', '5', '6+'];

const samplePrompts = [
  { text: 'A modern 4-bedroom duplex with African roofing, natural lighting, and flood-resistant foundation', icon: Home },
  { text: 'Sustainable office complex with green roof, solar panels, and rainwater harvesting', icon: Building2 },
  { text: 'Mixed-use development with retail spaces, apartments, and underground parking', icon: Warehouse },
  { text: 'Eco-friendly resort with villas, pool, and tropical landscaping on a hillside', icon: TreePine },
];

const generatedDesigns = [
  {
    id: '1',
    name: 'Modern African Villa',
    type: 'Residential',
    style: 'African Contemporary',
    area: '450 m²',
    floors: 2,
    bedrooms: 4,
    image: null,
    score: 94,
    features: ['Flood-resistant', 'Smart Home', 'Natural Lighting'],
  },
  {
    id: '2',
    name: 'Urban Commercial Hub',
    type: 'Commercial',
    style: 'Modern',
    area: '1200 m²',
    floors: 4,
    bedrooms: 0,
    image: null,
    score: 88,
    features: ['Green Roof', 'Solar Ready', 'Open Plan'],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function AiGenerator() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Modern');
  const [type, setType] = useState('Residential');
  const [bedrooms, setBedrooms] = useState('3');
  const [floors, setFloors] = useState('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2500));
    setIsGenerating(false);
    setShowResults(true);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gradient-primary">AI Building Generator</h1>
        <p className="text-muted-foreground mt-1">
          Describe your dream building in natural language and let AI generate complete designs
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6 rounded-xl space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your building project in detail... (e.g., 'I want a modern 4-bedroom duplex with African roofing, natural lighting, smart home setup, flood-resistant foundation, and parking for 3 cars')"
            className="w-full min-h-[120px] rounded-xl border border-input bg-background/50 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground/50"
            rows={4}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">{prompt.length}/500</Badge>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Building Style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUILDING_STYLES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Building Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUILDING_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Bedrooms</label>
            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROOM_COUNTS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Floors</label>
            <Select value={floors} onValueChange={setFloors}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FLOORS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-wrap gap-2">
            {samplePrompts.slice(0, 2).map((sample, i) => {
              const Icon = sample.icon;
              return (
                <button
                  key={i}
                  onClick={() => setPrompt(sample.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/50 hover:bg-accent text-xs text-muted-foreground hover:text-foreground transition-all"
                >
                  <Icon className="w-3 h-3" />
                  {sample.text.slice(0, 40)}...
                </button>
              );
            })}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Design
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {isGenerating && (
        <motion.div variants={itemVariants} className="glass-card p-8 rounded-xl flex flex-col items-center justify-center space-y-4">
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
            <p className="text-sm text-muted-foreground">Analyzing requirements • Creating floor plans • Optimizing layout • Generating recommendations</p>
          </div>
          <div className="w-64 h-1.5 bg-accent rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </motion.div>
      )}

      {showResults && !isGenerating && (
        <>
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated Designs</h2>
            <Badge variant="success" className="px-3 py-1">2 designs generated</Badge>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            {generatedDesigns.map((design) => (
              <motion.div key={design.id} variants={itemVariants}>
                <Card className="glass-card overflow-hidden group hover:border-primary/50 transition-all duration-300">
                  <div className="h-48 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-grid opacity-30" />
                    <div className="text-center relative z-10">
                      <Building2 className="w-12 h-12 text-primary/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">AI Render Preview</p>
                    </div>
                    <Badge className="absolute top-3 right-3" variant="success">
                      {design.score}% Match
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{design.name}</h3>
                        <p className="text-xs text-muted-foreground">{design.style} • {design.area}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {design.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-[10px]">{feature}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{design.floors} floor{design.floors > 1 ? 's' : ''} • {design.bedrooms > 0 ? `${design.bedrooms} bed` : 'Studio'}</span>
                      <Button size="sm" className="h-8">
                        View Details <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
