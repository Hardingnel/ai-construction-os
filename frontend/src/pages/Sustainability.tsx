import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Leaf, Zap, Sun, Droplets, Wind, Waves,
  Recycle, BarChart3, TrendingUp, AlertTriangle, CheckCircle2,
  Loader2, RefreshCw, ArrowRight, Building2, MapPin, History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

function downloadPDF(url: string, filename: string) {
  const token = localStorage.getItem('aicos-token');
  fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    });
}

interface ProjectSummary {
  id: string;
  name: string;
  type: string;
  location: string | null;
}

interface SustainabilityResult {
  carbonFootprint: number;
  carbonRating: string;
  energyScore: number;
  energyRating: string;
  solarPotential: string;
  solarKwhYear: number;
  waterEfficiency: number;
  waterRating: string;
  passiveCooling: string;
  floodResilience: string;
  greenMaterialScore: number;
  overallScore: number;
  overallRating: string;
  recommendations: string[];
  breakdown: Record<string, any>;
}

interface AssessmentRecord {
  id: string;
  createdAt: string;
  overallScore: number;
  overallRating: string;
  carbonFootprint: number;
  energyScore: number;
}

function getRatingColor(rating: string): string {
  switch (rating) {
    case 'A+': return 'text-emerald-500';
    case 'A': return 'text-green-500';
    case 'B': return 'text-blue-500';
    case 'C': return 'text-amber-500';
    case 'D': return 'text-orange-500';
    case 'E': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getProgressColor(score: number): string {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function ScoreGauge({ score, label, rating, size = 'md' }: { score: number; label: string; rating?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        'relative rounded-full border-4 flex items-center justify-center font-bold',
        size === 'sm' ? 'w-14 h-14 text-lg border-2' : size === 'lg' ? 'w-28 h-28 text-3xl' : 'w-20 h-20 text-2xl',
        getProgressColor(score).replace('bg-', 'border-')
      )}>
        {Math.round(score)}
        <span className={cn('absolute -top-1 -right-1', size === 'sm' ? 'text-xs' : 'text-sm', getRatingColor(rating || ''))}>
          {rating}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function Sustainability() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [result, setResult] = useState<SustainabilityResult | null>(null);
  const [history, setHistory] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function init() {
      try {
        const p = await api.get<ProjectSummary[]>('/projects');
        setProjects(p);
        if (p.length > 0) setSelectedProject(p[0].id);
      } catch (e: any) {
        setError(e.message);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    loadLatest();
  }, [selectedProject]);

  async function loadLatest() {
    setLoading(true);
    setError(null);
    try {
      const [latest, hist] = await Promise.all([
        api.get<SustainabilityResult>(`/sustainability/latest/${selectedProject}`).catch(() => null),
        api.get<AssessmentRecord[]>(`/sustainability/assessments/${selectedProject}`),
      ]);
      if (latest) setResult(latest);
      else setResult(null);
      setHistory(hist);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function runAssessment() {
    if (!selectedProject) return;
    setAssessing(true);
    setError(null);
    try {
      const res = await api.post<SustainabilityResult>(`/sustainability/assess/${selectedProject}`, {});
      setResult(res);
      setActiveTab('overview');
      const hist = await api.get<AssessmentRecord[]>(`/sustainability/assessments/${selectedProject}`);
      setHistory(hist);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAssessing(false);
    }
  }

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sustainability Intelligence</h1>
          <p className="text-muted-foreground">Carbon, energy, water, and climate resilience analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-56">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={runAssessment} disabled={!selectedProject || assessing}>
            {assessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Leaf className="h-4 w-4 mr-2" />}
            {assessing ? 'Assessing...' : 'Run Assessment'}
          </Button>
          {result && (
            <Button variant="outline" onClick={() => downloadPDF(`/api/pdf/sustainability/${selectedProject}`, `sustainability-${selectedProject}.pdf`)}>
              <BarChart3 className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={loadLatest} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && !result && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Leaf className="h-16 w-16 text-muted-foreground/40" />
            <p className="text-lg font-medium">No sustainability assessment yet</p>
            <p className="text-sm text-muted-foreground">Select a project and run an assessment to get started</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="carbon">Carbon</TabsTrigger>
            <TabsTrigger value="energy">Energy</TabsTrigger>
            <TabsTrigger value="water">Water & Climate</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="md:col-span-2">
                <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
                  <ScoreGauge score={result.overallScore} label="Overall Score" rating={result.overallRating} size="lg" />
                  <p className="text-sm text-muted-foreground">{selectedProjectData?.name}</p>
                  {selectedProjectData?.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {selectedProjectData.location}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center gap-2 h-full">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-rose-500" />
                    <span className="text-sm font-medium">Carbon</span>
                  </div>
                  <p className={cn('text-2xl font-bold', getScoreColor(100 - Math.min(result.carbonFootprint / 100, 100)))}>
                    {result.carbonRating}
                  </p>
                  <p className="text-xs text-muted-foreground">{(result.carbonFootprint / 1000).toFixed(1)} tonnes CO₂</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center gap-2 h-full">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-medium">Energy</span>
                  </div>
                  <p className={cn('text-2xl font-bold', getScoreColor(result.energyScore))}>
                    {result.energyRating}
                  </p>
                  <p className="text-xs text-muted-foreground">{result.energyScore}/100</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center gap-2 h-full">
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium">Solar</span>
                  </div>
                  <p className="text-lg font-bold">{result.solarPotential}</p>
                  <p className="text-xs text-muted-foreground">{(result.solarKwhYear / 1000).toFixed(1)} MWh/yr</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Droplets className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Water Efficiency</p>
                    <p className={cn('text-lg font-bold', getRatingColor(result.waterRating))}>{result.waterRating}</p>
                    <p className="text-xs text-muted-foreground">{result.waterEfficiency}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Wind className="h-8 w-8 text-cyan-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Passive Cooling</p>
                    <p className="text-lg font-bold">{result.passiveCooling}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Waves className="h-8 w-8 text-indigo-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Flood Resilience</p>
                    <p className="text-lg font-bold">{result.floodResilience}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Recycle className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Green Materials</p>
                    <p className="text-lg font-bold">{result.greenMaterialScore}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="carbon" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-rose-500" />
                  Carbon Footprint Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{(result.carbonFootprint / 1000).toFixed(1)} <span className="text-lg font-normal text-muted-foreground">tonnes CO₂</span></p>
                    <p className="text-sm text-muted-foreground">Total lifecycle carbon footprint</p>
                  </div>
                  <div className={cn('text-5xl font-bold', getRatingColor(result.carbonRating))}>{result.carbonRating}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Embodied Carbon</p>
                    <p className="text-lg font-bold">{(result.breakdown.embodiedCarbon / 1000).toFixed(1)} t</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Operational Carbon</p>
                    <p className="text-lg font-bold">{(result.breakdown.operationalCarbon / 1000).toFixed(1)} t</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Per m²</p>
                    <p className="text-lg font-bold">{result.breakdown.carbonPerM2} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="energy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Energy Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{result.energyScore}<span className="text-lg font-normal text-muted-foreground">/100</span></p>
                    <p className="text-sm text-muted-foreground">Energy performance score</p>
                  </div>
                  <div className={cn('text-5xl font-bold', getRatingColor(result.energyRating))}>{result.energyRating}</div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Passive Design</p>
                    <Progress value={result.breakdown.passiveScore} className="mt-1" />
                    <p className="text-sm font-medium mt-1">{result.breakdown.passiveScore}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Insulation</p>
                    <Progress value={result.breakdown.insulationScore} className="mt-1" />
                    <p className="text-sm font-medium mt-1">{result.breakdown.insulationScore}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">HVAC</p>
                    <Progress value={result.breakdown.hvacScore} className="mt-1" />
                    <p className="text-sm font-medium mt-1">{result.breakdown.hvacScore}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Lighting</p>
                    <Progress value={result.breakdown.lightingScore} className="mt-1" />
                    <p className="text-sm font-medium mt-1">{result.breakdown.lightingScore}%</p>
                  </div>
                </div>

                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Sun className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Solar PV Potential: {result.solarPotential}</p>
                      <p className="text-sm text-muted-foreground">
                        Estimated {result.solarKwhYear.toLocaleString()} kWh/year from a {Math.round(result.solarKwhYear / 1500)}kW rooftop system
                        ({Math.round(result.breakdown.roofArea)} m² available area)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="water" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Water Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">{result.waterEfficiency}<span className="text-lg font-normal text-muted-foreground">%</span></p>
                    </div>
                    <div className={cn('text-5xl font-bold', getRatingColor(result.waterRating))}>{result.waterRating}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Fixtures</p>
                      <p className="text-lg font-bold">{result.breakdown.waterFixturesScore}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Rainwater</p>
                      <p className="text-lg font-bold">{result.breakdown.rainwaterScore}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Recycling</p>
                      <p className="text-lg font-bold">{result.breakdown.recyclingScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wind className="h-5 w-5 text-cyan-500" />
                    Passive Cooling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('text-2xl font-bold', result.passiveCooling === 'Excellent' ? 'text-emerald-500' : result.passiveCooling === 'Good' ? 'text-blue-500' : 'text-amber-500')}>
                      {result.passiveCooling}
                    </div>
                    <Badge variant={result.passiveCooling === 'Excellent' ? 'default' : 'secondary'}>{result.passiveCooling}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Waves className="h-5 w-5 text-indigo-500" />
                    Flood Resilience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className={cn('text-2xl font-bold', result.floodResilience === 'High' ? 'text-emerald-500' : result.floodResilience === 'Moderate' ? 'text-amber-500' : 'text-red-500')}>
                      {result.floodResilience}
                    </div>
                    {result.breakdown.floodRisk && (
                      <Badge variant="outline">Flood risk: {result.breakdown.floodRisk}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Recycle className="h-5 w-5 text-emerald-500" />
                    Green Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{result.greenMaterialScore}%</div>
                    <Progress value={result.greenMaterialScore} className="w-1/2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Sustainability Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.recommendations.length === 0 ? (
                  <p className="text-muted-foreground">No recommendations — your project scores well across all categories.</p>
                ) : (
                  <div className="space-y-3">
                    {result.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-500">{i + 1}</span>
                        </div>
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Assessment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-muted-foreground">No previous assessments found.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((h, i) => (
                      <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">#{history.length - i}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Assessment {new Date(h.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{h.overallScore}</p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                          <div className={cn('text-lg font-bold', getRatingColor(h.overallRating))}>{h.overallRating}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
