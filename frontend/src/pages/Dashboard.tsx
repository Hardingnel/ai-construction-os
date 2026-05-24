import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Building2, Calculator, Users, Plus, ArrowRight,
  TrendingUp, Sparkles, Activity, Map, Box, Brain, Loader2, AlertCircle, Inbox
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalDesigns: number;
  teamCount: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  recentProjects: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    updatedAt: string;
  }>;
}

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  updatedAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

const statConfig = [
  { label: 'Active Projects', key: 'activeProjects' as const, icon: Briefcase, trend: 'active', color: 'from-blue-500 to-blue-600' },
  { label: 'Designs Generated', key: 'totalDesigns' as const, icon: Building2, color: 'from-purple-500 to-purple-600' },
  { label: 'Total Tasks', key: 'totalTasks' as const, icon: Calculator, color: 'from-emerald-500 to-emerald-600' },
  { label: 'Team Members', key: 'teamCount' as const, icon: Users, color: 'from-amber-500 to-amber-600' },
];

const quickActions = [
  { label: 'New Project', icon: Plus, path: '/projects', color: 'from-blue-600 to-purple-600' },
  { label: 'AI Generator', icon: Brain, path: '/generator', color: 'from-purple-600 to-pink-600' },
  { label: 'BIM Viewer', icon: Box, path: '/bim', color: 'from-cyan-500 to-blue-600' },
  { label: 'GIS Analysis', icon: Map, path: '/gis', color: 'from-emerald-500 to-teal-600' },
];

const activityIcons: Record<string, typeof Sparkles> = {
  project_update: Briefcase,
  task_assigned: Activity,
  design_generated: Sparkles,
  boq_completed: Calculator,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

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

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [statsData, projectsData, notifsData] = await Promise.all([
          api.get<DashboardStats>('/stats/dashboard'),
          api.get<Project[]>('/projects'),
          api.get<Notification[]>('/notifications'),
        ]);
        if (cancelled) return;
        setStats(statsData);
        setProjects(projectsData.slice(0, 4));
        setActivities(notifsData.slice(0, 4));
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-destructive font-medium">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">
            AI Construction Operating System
          </h1>
          <p className="text-muted-foreground mt-1">
            Your AI-native architecture and engineering ecosystem
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" onClick={() => navigate('/generator')}>
          <Sparkles className="w-4 h-4 mr-2" />
          New Design
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-4">
        {statConfig.map((cfg) => {
          const Icon = cfg.icon;
          const value = stats?.[cfg.key] ?? 0;
          return (
            <Card key={cfg.label} className="glass-card overflow-hidden group hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center', cfg.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {cfg.trend === 'active' && (
                    <Badge variant="secondary" className="text-xs">
                      {stats?.activeProjects ?? 0} active
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{cfg.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="glass-card p-4 rounded-xl flex items-center gap-3 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
            >
              <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center', action.color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-sm">{action.label}</span>
              <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Projects</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Inbox className="w-8 h-8 mb-2" />
                  <p className="text-sm">No projects yet</p>
                  <Button variant="link" onClick={() => navigate('/projects')}>Create your first project</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/projects?id=${project.id}`)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={project.status === 'active' ? 'success' : project.status === 'draft' ? 'warning' : 'secondary'} className="text-[10px]">
                          {project.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{timeAgo(project.updatedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Inbox className="w-8 h-8 mb-2" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const Icon = activityIcons[activity.type] || Sparkles;
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.message || activity.title} • {timeAgo(activity.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
