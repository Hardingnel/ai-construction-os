import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban, Plus, Search, MoreHorizontal, Calendar,
  Users, Clock, ArrowRight, Filter, List, LayoutGrid,
  Loader2, AlertCircle, Inbox
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface ProjectData {
  id: string;
  name: string;
  type: string;
  status: string;
  progress: number;
  budget: number | null;
  location: string | null;
  area: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number; designs: number; boqItems: number };
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

function formatBudget(v: number | null): string {
  if (!v) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function Projects() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<ProjectData[]>('/projects');
        if (!cancelled) setProjects(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-destructive font-medium">Failed to load projects</p>
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
          <h1 className="text-3xl font-bold text-gradient-primary">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your construction and architecture projects</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => { toast('New project dialog would open'); }}>
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="pl-10" />
        </div>
        <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex border rounded-lg p-0.5">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('grid')}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('list')}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Inbox className="w-12 h-12 mb-3" />
          <p className="font-medium">No projects found</p>
          <p className="text-sm">{search ? 'Try a different search term' : 'Create your first project to get started'}</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((project) => (
            <motion.div key={project.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="glass-card group hover:border-primary/50 transition-all duration-300 cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{project.name}</h3>
                      <p className="text-xs text-muted-foreground">{project.type} {project.location ? `• ${project.location}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={cn('text-[10px]', statusColors[project.status])}>{project.status}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast('Project options menu')}><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project._count?.tasks || 0} tasks</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(project.updatedAt)}</span>
                    <span className="font-semibold text-foreground">{formatBudget(project.budget)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-xs text-muted-foreground">Project</th>
                  <th className="text-left p-3 font-medium text-xs text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-xs text-muted-foreground">Progress</th>
                  <th className="text-left p-3 font-medium text-xs text-muted-foreground">Tasks</th>
                  <th className="text-left p-3 font-medium text-xs text-muted-foreground">Updated</th>
                  <th className="text-right p-3 font-medium text-xs text-muted-foreground">Budget</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.type}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={cn('text-[10px]', statusColors[project.status])}>{project.status}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-accent rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-xs">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs">{project._count?.tasks || 0}</td>
                    <td className="p-3 text-xs">{timeAgo(project.updatedAt)}</td>
                    <td className="p-3 text-right font-semibold">{formatBudget(project.budget)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
