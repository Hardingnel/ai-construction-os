import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Building2, Calculator, Users, Plus, ArrowRight,
  TrendingUp, Clock, Sparkles, Activity, Map, Box, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const stats = [
  { label: 'Active Projects', value: '12', icon: Briefcase, trend: '+2 this week', color: 'from-blue-500 to-blue-600' },
  { label: 'Designs Generated', value: '48', icon: Building2, trend: '+8 this week', color: 'from-purple-500 to-purple-600' },
  { label: 'BOQ Estimates', value: '156', icon: Calculator, trend: '+23 this week', color: 'from-emerald-500 to-emerald-600' },
  { label: 'Team Members', value: '8', icon: Users, trend: '3 online now', color: 'from-amber-500 to-amber-600' },
];

const recentProjects = [
  { id: '1', name: 'Modern Villa - Freetown', type: 'Residential', status: 'active', updated: '2 hours ago' },
  { id: '2', name: 'Commercial Complex - Bo', type: 'Commercial', status: 'active', updated: '5 hours ago' },
  { id: '3', name: 'School Infrastructure', type: 'Institutional', status: 'draft', updated: '1 day ago' },
  { id: '4', name: 'Bridge Design - River No.2', type: 'Infrastructure', status: 'completed', updated: '3 days ago' },
];

const quickActions = [
  { label: 'New Project', icon: Plus, path: '/projects', color: 'from-blue-600 to-purple-600' },
  { label: 'AI Generator', icon: Brain, path: '/generator', color: 'from-purple-600 to-pink-600' },
  { label: 'BIM Viewer', icon: Box, path: '/bim', color: 'from-cyan-500 to-blue-600' },
  { label: 'GIS Analysis', icon: Map, path: '/gis', color: 'from-emerald-500 to-teal-600' },
];

const activities = [
  { id: '1', action: 'New design generated', project: 'Modern Villa', time: '10 min ago', icon: Sparkles },
  { id: '2', action: 'BOQ estimate completed', project: 'Commercial Complex', time: '1 hour ago', icon: Calculator },
  { id: '3', action: 'GIS analysis updated', project: 'School Infrastructure', time: '3 hours ago', icon: Map },
  { id: '4', action: 'Project milestone reached', project: 'Bridge Design', time: '5 hours ago', icon: TrendingUp },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">
            AI Construction Operating System
          </h1>
          <p className="text-muted-foreground mt-1">
            Your AI-native architecture and engineering ecosystem
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Sparkles className="w-4 h-4 mr-2" />
          New Design
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="glass-card overflow-hidden group hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center', stat.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs">{stat.trend}</Badge>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
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
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={project.status === 'active' ? 'success' : project.status === 'draft' ? 'warning' : 'secondary'} className="text-[10px]">
                        {project.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{project.updated}</span>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                {activities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.project} • {activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
