import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Brain, PenTool, Box, Map, Calculator,
  FolderKanban, Store, Users, Settings, ChevronLeft, ChevronRight, Construction, LogOut, Shield, Leaf, GraduationCap, GitCompare, Bell, ShieldCheck, Building2, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NAV_ITEMS, SUPER_ADMIN_ITEMS } from '@/lib/constants';
import { useAppStore } from '@/store/appStore';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';

const iconMap: Record<string, any> = {
  LayoutDashboard, Brain, PenTool, Box, Map, Calculator,
  FolderKanban, Store, Users, Settings, Shield, Leaf, GraduationCap, GitCompare, ShieldCheck, Building2
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppStore(s => s.user);
  const role = user?.role || '';
  const isSuperAdmin = role === 'super_admin';

  const [tenants, setTenants] = useState<any[]>([]);
  const [activeTenant, setActiveTenant] = useState<any>(null);
  const [showTenantMenu, setShowTenantMenu] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('aicos-active-tenant');
    if (stored) {
      try { setActiveTenant(JSON.parse(stored)); } catch { }
    }
    if (isSuperAdmin) {
      const token = localStorage.getItem('aicos-token');
      fetch('/api/admin/tenants', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(data => { setTenants(data); if (!activeTenant && data.length > 0) { setActiveTenant(data[0]); localStorage.setItem('aicos-active-tenant', JSON.stringify(data[0])); } })
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  const switchTenant = (t: any) => {
    setActiveTenant(t);
    localStorage.setItem('aicos-active-tenant', JSON.stringify(t));
    setShowTenantMenu(false);
    window.location.reload();
  };

  return (
    <div
      className={cn(
        'flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out relative',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Construction className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold leading-tight">AI COS</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Construction OS</p>
          </div>
        )}
        <NotificationsPanel />
      </div>

      {!collapsed && activeTenant && !isSuperAdmin && (
        <div className="px-3 pt-2 pb-1">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-zinc-800/50 border border-zinc-700/50">
            <Building2 className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
            <span className="text-xs font-medium text-zinc-300 truncate">{activeTenant.name}</span>
          </div>
        </div>
      )}

      {!collapsed && isSuperAdmin && (
        <div className="px-3 pt-2 pb-1 relative">
          <button onClick={() => setShowTenantMenu(!showTenantMenu)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-blue-900/30 border border-blue-800/50 hover:bg-blue-900/50 transition-colors">
            <Building2 className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
            <span className="text-xs font-medium text-blue-300 truncate">{activeTenant?.name || 'Select Tenant'}</span>
            <ChevronDown className="h-3 w-3 text-blue-400 ml-auto flex-shrink-0" />
          </button>
          {showTenantMenu && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
              {tenants.map(t => (
                <button key={t.id} onClick={() => switchTenant(t)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 transition-colors ${activeTenant?.id === t.id ? 'text-blue-400 bg-zinc-800' : 'text-zinc-300'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 py-2 space-y-1 px-2 overflow-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
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
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          );
        })}
        {isSuperAdmin && !collapsed && <div className="border-t border-zinc-700/50 my-2" />}
        {isSuperAdmin && SUPER_ADMIN_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] || ShieldCheck;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                  : 'text-sidebar-foreground/70'
              )}
              title={item.label}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0 text-amber-400', isActive && 'text-amber-300')} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-2 border-t space-y-1">
        {!collapsed && user && (
          <div className="px-3 py-2 text-xs text-zinc-500 truncate">
            {user.name} · {user.role}
          </div>
        )}
        <button
          onClick={() => { useAppStore.getState().logout(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/70"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="truncate">Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
