import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Brain, PenTool, Box, Map, Calculator,
  FolderKanban, Store, Users, Settings, ChevronLeft, ChevronRight, Construction
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NAV_ITEMS } from '@/lib/constants';

const iconMap: Record<string, any> = {
  LayoutDashboard, Brain, PenTool, Box, Map, Calculator,
  FolderKanban, Store, Users, Settings
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
          <div className="overflow-hidden">
            <p className="text-sm font-bold leading-tight">AI COS</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Construction OS</p>
          </div>
        )}
      </div>

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
      </div>

      <div className="p-2 border-t">
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
