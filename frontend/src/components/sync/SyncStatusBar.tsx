import { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSync } from '@/hooks/useSync';

export function SyncStatusBar() {
  const { isSyncing, pendingCount, failedCount, lastSync, isOnline, retryFailed } = useSync();
  const [expanded, setExpanded] = useState(false);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
        <CloudOff className="w-3.5 h-3.5" />
        Offline Mode
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Syncing...
      </div>
    );
  }

  if (failedCount > 0) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs cursor-pointer hover:bg-red-500/20" onClick={retryFailed}>
        <AlertTriangle className="w-3.5 h-3.5" />
        {failedCount} sync failed - Click to retry
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        {pendingCount} pending
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs">
      <CheckCircle2 className="w-3.5 h-3.5" />
      Synced
    </div>
  );
}
