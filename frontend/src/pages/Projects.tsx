import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban, Plus, Search, MoreHorizontal, Calendar,
  Users, Clock, CheckCircle2, AlertCircle, ArrowRight,
  Filter, List, LayoutGrid
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const projects = [
  { id: '1', name: 'Modern Villa - Freetown', type: 'Residential', status: 'active', progress: 65, team: 4, deadline: 'Dec 2024', budget: '$450,000' },
  { id: '2', name: 'Commercial Complex - Bo', type: 'Commercial', status: 'active', progress: 35, team: 6, deadline: 'Mar 2025', budget: '$2.2M' },
  { id: '3', name: 'School Infrastructure', type: 'Institutional', status: 'draft', progress: 10, team: 3, deadline: 'Jun 2025', budget: '$850,000' },
  { id: '4', name: 'Bridge Design - River No.2', type: 'Infrastructure', status: 'completed', progress: 100, team: 5, deadline: 'Aug 2024', budget: '$3.5M' },
  { id: '5', name: 'Eco Resort - Tokeh', type: 'Residential', status: 'active', progress: 45, team: 8, deadline: 'Sep 2025', budget: '$5.1M' },
  { id: '6', name: 'Hospital Wing Expansion', type: 'Institutional', status: 'active', progress: 80, team: 7, deadline: 'Feb 2025', budget: '$4.8M' },
];

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

export function Projects() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your construction and architecture projects</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-10"
          />
        </div>
        <Tabs defaultValue="all">
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

      {view === 'grid' ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="glass-card group hover:border-primary/50 transition-all duration-300 cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{project.name}</h3>
                      <p className="text-xs text-muted-foreground">{project.type}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={cn('text-[10px]', statusColors[project.status])}>
                        {project.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project.team}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{project.deadline}</span>
                    <span className="font-semibold text-foreground">{project.budget}</span>
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
                  <th className="text-left p-3 font-medium text-xs text-muted-foreground">Team</th>
                  <th className="text-left p-3 font-medium text-xs text-muted-foreground">Deadline</th>
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
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-xs"><Users className="w-3 h-3" />{project.team}</span>
                    </td>
                    <td className="p-3 text-xs">{project.deadline}</td>
                    <td className="p-3 text-right font-semibold">{project.budget}</td>
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
