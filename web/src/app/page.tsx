'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Construction, ArrowRight, Sparkles, Building2, Box, Map, Calculator, Brain, LayoutDashboard, PenTool, FolderKanban, Users, Menu, X, Moon, Sun } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'AI Generator', icon: Brain, href: '/generator' },
  { label: 'Design Studio', icon: PenTool, href: '/design' },
  { label: 'BIM Viewer', icon: Box, href: '/bim' },
  { label: 'GIS Analysis', icon: Map, href: '/gis' },
  { label: 'BOQ & Cost', icon: Calculator, href: '/boq' },
  { label: 'Projects', icon: FolderKanban, href: '/projects' },
  { label: 'Team', icon: Users, href: '/team' },
];

const stats = [
  { label: 'Projects', value: '12', icon: Building2 },
  { label: 'Designs', value: '48', icon: Brain },
  { label: 'Estimates', value: '156', icon: Calculator },
  { label: 'Team', value: '8', icon: Users },
];

export default function HomePage() {
  const router = useRouter();
  const { user, token, theme, setTheme } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Construction className="w-6 h-6 text-primary" />
            <span className="font-bold">AI COS</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg hover:bg-accent">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {token && user ? (
              <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20">
                <span>{user.name}</span>
              </button>
            ) : (
              <button onClick={() => router.push('/login')} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90">
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="relative w-64 h-full bg-background border-r p-4 pt-16" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <button key={item.href} onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors">
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </aside>
        </div>
      )}

      <main className="pt-14">
        <section className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs mb-6">
            <Sparkles className="w-3 h-3" /> AI-Native Construction Platform
          </div>
          <h1 className="text-5xl font-bold mb-4 text-gradient-primary">
            AI Construction<br />Operating System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            An AI-native architecture and engineering ecosystem. Generate building designs, analyze sites, manage projects, and collaborate in realtime.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => router.push(token ? '/dashboard' : '/login')}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => router.push('/generator')}
              className="px-6 py-3 rounded-xl border border-input hover:bg-accent transition-colors flex items-center gap-2">
              <Brain className="w-4 h-4" /> Try AI Generator
            </button>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-4 gap-4 mb-16">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-5 text-center">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-center mb-8">Platform Capabilities</h2>
          <div className="grid grid-cols-4 gap-4">
            {navItems.map((item) => (
              <button key={item.href} onClick={() => router.push(item.href)}
                className="glass-card rounded-xl p-5 text-left hover:border-primary/50 transition-all group">
                <item.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">AI-powered tools & analytics</p>
              </button>
            ))}
          </div>
        </section>

        <footer className="border-t py-8 text-center text-sm text-muted-foreground">
          <Construction className="w-5 h-5 text-primary mx-auto mb-2" />
          <p>AI Construction Operating System v1.0</p>
          <p>AI-Native Architecture & Engineering Ecosystem</p>
        </footer>
      </main>
    </div>
  );
}
