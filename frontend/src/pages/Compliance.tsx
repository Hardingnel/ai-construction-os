import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, FileSearch,
  Building2, MapPin, Loader2, RefreshCw, ArrowRight,
  Scale, BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface ComplianceResult {
  code: string;
  title: string;
  status: 'passed' | 'failed' | 'warning';
  category: string;
  severity: string;
  description: string;
  requirement: string;
  finding: string;
  recommendation: string;
}

interface ComplianceSummary {
  country: string;
  countryName: string;
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  score: number;
  results: ComplianceResult[];
}

interface ProjectSummary {
  id: string;
  name: string;
  type: string;
  location: string | null;
}

interface Country {
  id: string;
  name: string;
}

interface HistoryItem {
  id: string;
  country: string;
  status: string;
  score: number;
  passedItems: number;
  failedItems: number;
  warningItems: number;
  createdAt: string;
}

export function Compliance() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('sierra-leone');
  const [result, setResult] = useState<ComplianceSummary | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('check');

  useEffect(() => {
    async function init() {
      try {
        const [p, c] = await Promise.all([
          api.get<ProjectSummary[]>('/projects'),
          api.get<Country[]>('/compliance/countries'),
        ]);
        setProjects(p);
        setCountries(c);
        if (p.length > 0) setSelectedProject(p[0].id);
      } catch { /* ignore */ }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    async function loadHistory() {
      try {
        const h = await api.get<HistoryItem[]>(`/compliance/history/${selectedProject}`);
        setHistory(h);
      } catch { /* ignore */ }
    }
    loadHistory();
  }, [selectedProject]);

  const handleCheck = async () => {
    if (!selectedProject || !selectedCountry) return;
    setChecking(true);
    setError(null);
    try {
      const summary = await api.post<ComplianceSummary>(`/compliance/check/${selectedProject}`, { country: selectedCountry });
      setResult(summary);
      setActiveTab('results');
      const h = await api.get<HistoryItem[]>(`/compliance/history/${selectedProject}`);
      setHistory(h);
    } catch (err: any) {
      setError(err.message || 'Compliance check failed');
    } finally {
      setChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return null;
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Compliance Engine</h1>
          <p className="text-muted-foreground mt-1">AI-powered building code compliance checking for multiple countries</p>
        </div>
        {result && history.length > 0 && (
          <Button
            variant="outline"
            onClick={() => downloadPDF(`/api/pdf/compliance/${history[0].id}`, `compliance-${history[0].id}.pdf`)}
          >
            <FileSearch className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="check"><Shield className="w-4 h-4 mr-2" /> Compliance Check</TabsTrigger>
          <TabsTrigger value="results"><FileSearch className="w-4 h-4 mr-2" /> Results</TabsTrigger>
          <TabsTrigger value="codes"><BookOpen className="w-4 h-4 mr-2" /> Building Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="check" className="space-y-4 mt-4">
          <Card className="glass-card">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country / Region</label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCheck}
                disabled={checking || !selectedProject}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {checking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</> : <><Shield className="w-4 h-4 mr-2" /> Run Compliance Check</>}
              </Button>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>
              )}
            </CardContent>
          </Card>

          {history.length > 0 && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Check History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <div className="flex items-center gap-3">
                        <Badge variant={item.status === 'passed' ? 'success' : item.status === 'failed' ? 'destructive' : 'warning'} className="text-[10px]">{item.status}</Badge>
                        <span className="text-sm font-medium capitalize">{item.country}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className={cn('font-bold', scoreColor(item.score))}>{item.score}%</span>
                        <span>{item.passedItems}/{item.passedItems + item.failedItems + item.warningItems} passed</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4 mt-4">
          {result ? (
            <>
              <div className="grid grid-cols-4 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <p className={cn('text-3xl font-bold', scoreColor(result.score))}>{result.score}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Compliance Score</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-500">{result.passed}</p>
                    <p className="text-xs text-muted-foreground mt-1">Passed</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-red-500">{result.failed}</p>
                    <p className="text-xs text-muted-foreground mt-1">Failed</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-amber-500">{result.warnings}</p>
                    <p className="text-xs text-muted-foreground mt-1">Warnings</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {result.results.map((r) => (
                      <div key={r.code} className={cn('p-4', r.status === 'failed' ? 'bg-red-500/5' : r.status === 'warning' ? 'bg-amber-500/5' : '')}>
                        <div className="flex items-start gap-3">
                          {getStatusIcon(r.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{r.title}</span>
                              <Badge variant="secondary" className="text-[10px]">{r.code}</Badge>
                              <Badge variant={r.severity === 'mandatory' ? 'destructive' : 'secondary'} className="text-[10px]">{r.severity}</Badge>
                              <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{r.description}</p>
                            <p className="text-xs text-muted-foreground"><span className="font-medium">Requirement:</span> {r.requirement}</p>
                            <p className={cn('text-xs mt-1', r.status === 'failed' ? 'text-red-500' : r.status === 'warning' ? 'text-amber-500' : 'text-emerald-500')}>
                              <span className="font-medium">Finding:</span> {r.finding}
                            </p>
                            {r.recommendation && (
                              <p className="text-xs text-blue-500 mt-1"><span className="font-medium">Recommendation:</span> {r.recommendation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FileSearch className="w-12 h-12 mb-3" />
              <p className="font-medium">No compliance check results</p>
              <p className="text-sm">Run a compliance check to see results here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="codes" className="space-y-4 mt-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Building codes are available for Sierra Leone, Nigeria, and Ghana. Select a country and project to run a compliance check.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {countries.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCountry(c.id); setActiveTab('check'); }}
                    className="p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-accent/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{c.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.id === 'sierra-leone' && '6 building codes: Structural, Fire Safety, Environmental, Accessibility'}
                      {c.id === 'nigeria' && '4 building codes: Structural, Zoning, Fire Safety, Environmental'}
                      {c.id === 'ghana' && '3 building codes: Plumbing, Structural, Environmental'}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
