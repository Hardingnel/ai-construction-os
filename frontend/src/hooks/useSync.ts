import { useState, useEffect } from 'react';
import { syncEngine, type SyncStatus } from '@/services/syncEngine';

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>(syncEngine.getStatus());

  useEffect(() => {
    const unsubscribe = syncEngine.onStatusChange(setStatus);
    syncEngine.startAutoSync();
    return () => {
      unsubscribe();
      syncEngine.stopAutoSync();
    };
  }, []);

  return {
    ...status,
    enqueue: syncEngine.enqueue.bind(syncEngine),
    retryFailed: syncEngine.retryFailed.bind(syncEngine),
    clearFailed: syncEngine.clearFailed.bind(syncEngine),
    syncSnapshot: syncEngine.syncSnapshot.bind(syncEngine),
    isOnline: navigator.onLine,
  };
}
