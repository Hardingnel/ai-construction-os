'use client';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Brain, PenTool, Box, Map, Calculator,
  FolderKanban, Store, Users, Settings, ChevronLeft, ChevronRight,
  Construction, LogOut, Shield, Leaf, GraduationCap, GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { useAppStore } from '@/store/appStore';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'AI Generator', icon: Brain, href: '/generator' },
  { label: 'Design Studio', icon: PenTool, href: '/design' },
  { label: 'BIM Viewer', icon: Box, href: '/bim' },
  { label: 'GIS Analysis', icon: Map, href: '/gis' },
  { label: 'BOQ & Cost', icon: Calculator, href: '/boq' },
  { label: 'Projects', icon: FolderKanban, href: '/projects' },
  { label: 'Marketplace', icon: Store, href: '/marketplace' },
  { label: 'Team', icon: Users, href: '/team' },
  { label: 'Compliance', icon: Shield, href: '/compliance' },
  { label: 'Sustainability', icon: Leaf, href: '/sustainability' },
  { label: 'AI Tutor', icon: GraduationCap, href: '/tutor' },
  { label: 'Interoperability', icon: GitBranch, href: '/interoperability' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, logout } = useAppStore();

  return (
    <div className={cn(
      'flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out relative',
      sidebarOpen ? 'w-56' : 'w-16'
    )}>
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Construction className="h-4 w-4 text-white" />
        </div>
        {sidebarOpen && (
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold leading-tight">AI COS</p>
            <p className="text-[10px] text-sidebar-foreground/60 leading-tight">Construction OS</p>
          </div>
        )}
        <NotificationsPanel />
      </div>

      <div className="flex-1 py-2 space-y-1 px-2 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                  : 'text-sidebar-foreground/70'
              )}
              title={item.label}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      <div className="p-2 border-t space-y-1">
        <button
          onClick={() => { logout(); router.push('/'); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/70"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {sidebarOpen && <span className="truncate">Sign Out</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
