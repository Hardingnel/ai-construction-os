import { useState, useEffect } from 'react';
import { Minus, Maximize2, X, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onMaximizeChange((maximized) => {
        setIsMaximized(maximized);
      });
    }
  }, []);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  return (
    <div className="flex h-10 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 select-none">
      <div className="flex items-center gap-2">
        <Construction className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground">AI Construction OS</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground/60">AI COS v1.0</span>
        </div>
        <div className="flex ml-4">
          <button
            onClick={handleMinimize}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/90 hover:text-destructive-foreground text-muted-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
