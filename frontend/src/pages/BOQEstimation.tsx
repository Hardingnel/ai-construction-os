import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator, FileSpreadsheet, Download, Wallet, TrendingUp,
  Truck, Users, Hammer, DollarSign, ClipboardList, Brain,
  Loader2, AlertCircle, Inbox
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface BOQItem {
  id: string;
  item: string;
  unit: string;
  quantity: number;
  rate: number;
  category: string;
  projectId: string;
}

interface ProjectSummary {
  id: string;
  name: string;
}

const summaryCards = [
  { label: 'Total Materials', key: 'Materials' as const, icon: Truck, color: 'from-blue-500 to-blue-600' },
  { label: 'Total Labor', key: 'Labor' as const, icon: Users, color: 'from-purple-500 to-purple-600' },
  { label: 'Equipment', key: 'Equipment' as const, icon: Hammer, color: 'from-amber-500 to-amber-600' },
  { label: 'Grand Total', key: 'grand' as const, icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
];

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function formatNumber(v: number): string {
  return new Intl.NumberFormat('en-US').format(v);
}

export function BOQEstimation() {
  const [activeTab, setActiveTab] = useState('boq');
  const [currency, setCurrency] = useState('USD');
  const [items, setItems] = useState<BOQItem[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await api.get<ProjectSummary[]>('/projects');
        setProjects(data);
        if (data.length > 0) {
          setSelectedProject(data[0].id);
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    let cancelled = false;
    async function loadBOQ() {
      try {
        const data = await api.get<BOQItem[]>(`/boq?projectId=${selectedProject}`);
        if (!cancelled) setItems(data);
      } catch { /* no items */ }
    }
    loadBOQ();
    return () => { cancelled = true; };
  }, [selectedProject]);

  const categories = [...new Set(items.map((i) => i.category))];
  const categoryTotals: Record<string, number> = {};
  for (const item of items) {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.quantity * item.rate;
  }
  const grandTotal = items.reduce((sum, i) => sum + i.quantity * i.rate, 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading BOQ data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">BOQ & Cost Estimation</h1>
          <p className="text-muted-foreground mt-1">Material takeoffs, labor estimates, and AI-powered cost intelligence</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => downloadPDF(`/api/pdf/boq/${selectedProject}`, `boq-${selectedProject}.pdf`)}><FileSpreadsheet className="w-4 h-4 mr-2" /> Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const value = card.key === 'grand' ? grandTotal : (categoryTotals[card.key] || 0);
          return (
            <Card key={card.label} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center', card.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-lg font-bold">{formatCurrency(value)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Inbox className="w-12 h-12 mb-3" />
          <p className="font-medium">No BOQ items</p>
          <p className="text-sm">This project has no bill of quantities yet</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="boq"><ClipboardList className="w-4 h-4 mr-2" /> BOQ Items</TabsTrigger>
            <TabsTrigger value="categories"><Wallet className="w-4 h-4 mr-2" /> By Category</TabsTrigger>
          </TabsList>

          <TabsContent value="boq">
            <Card className="glass-card">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium text-xs text-muted-foreground">Item</th>
                      <th className="text-left p-3 font-medium text-xs text-muted-foreground">Category</th>
                      <th className="text-right p-3 font-medium text-xs text-muted-foreground">Unit</th>
                      <th className="text-right p-3 font-medium text-xs text-muted-foreground">Qty</th>
                      <th className="text-right p-3 font-medium text-xs text-muted-foreground">Rate</th>
                      <th className="text-right p-3 font-medium text-xs text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="p-3 font-medium">{item.item}</td>
                        <td className="p-3"><Badge variant="secondary" className="text-[10px]">{item.category}</Badge></td>
                        <td className="p-3 text-right">{item.unit}</td>
                        <td className="p-3 text-right">{formatNumber(item.quantity)}</td>
                        <td className="p-3 text-right">{formatCurrency(item.rate)}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(item.quantity * item.rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30">
                      <td colSpan={5} className="p-3 text-right font-semibold">Grand Total</td>
                      <td className="p-3 text-right font-bold text-lg">{formatCurrency(grandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => {
                const catItems = items.filter((i) => i.category === cat);
                const catTotal = catItems.reduce((s, i) => s + i.quantity * i.rate, 0);
                return (
                  <Card key={cat} className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{cat}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold mb-2">{formatCurrency(catTotal)}</p>
                      <p className="text-xs text-muted-foreground">{catItems.length} items</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}
