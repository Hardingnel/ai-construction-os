'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Building2, Calculator, Users, Plus, Sparkles, Brain, Box, Map, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/projects').then(setProjects).catch(() => {});
  }, []);

  const stats = [
    { label: 'Active Projects', value: projects.filter((p: any) => p.status === 'active').length.toString(), icon: Briefcase, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Designs', value: '48', icon: Building2, color: 'from-purple-500 to-purple-600' },
    { label: 'BOQ Estimates', value: '156', icon: Calculator, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Team Members', value: '8', icon: Users, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <button onClick={() => router.push('/generator')} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
          <Sparkles className="w-4 h-4" /> New Design
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold mb-4">Recent Projects</h3>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 cursor-pointer" onClick={() => router.push(`/projects?id=${p.id}`)}>
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.type} • {p.location || 'No location'}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'New Project', icon: Plus, href: '/projects' },
              { label: 'AI Generate', icon: Brain, href: '/generator' },
              { label: 'BIM View', icon: Box, href: '/bim' },
              { label: 'GIS Map', icon: Map, href: '/gis' },
            ].map((action) => (
              <button key={action.label} onClick={() => router.push(action.href)}
                className="p-4 rounded-lg border border-input hover:bg-accent transition-colors text-left">
                <action.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-medium">{action.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
