'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { AiAssistant } from '@/components/chat/AiAssistant';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navTitles: Record<string, string> = {
  '/dashboard': 'Dashboard', '/generator': 'AI Generator', '/design': 'Design Studio',
  '/bim': 'BIM Viewer', '/gis': 'GIS Analysis', '/boq': 'BOQ & Cost',
  '/projects': 'Projects', '/marketplace': 'Marketplace', '/team': 'Team',
  '/compliance': 'Compliance', '/sustainability': 'Sustainability', '/tutor': 'AI Tutor',
  '/interoperability': 'Interoperability', '/settings': 'Settings',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, theme, setTheme, isAuthenticated } = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !token && !isAuthenticated) router.push('/login');
  }, [mounted, token, isAuthenticated, router]);

  if (!mounted || !token) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b bg-background/80 backdrop-blur-xl flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold">{navTitles[pathname] || 'Dashboard'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg hover:bg-accent transition-colors">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-muted-foreground">{user?.name}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <AiAssistant />
    </div>
  );
}
