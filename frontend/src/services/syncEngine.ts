import { api } from '@/lib/api';

interface SyncOperation {
  id: string;
  action: 'create' | 'update' | 'delete';
  model: string;
  data: any;
  timestamp: string;
  retries: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  error?: string;
}

interface SyncQueue {
  operations: SyncOperation[];
  lastSync: string | null;
  isSyncing: boolean;
}

class SyncEngine {
  private queue: SyncQueue = {
    operations: [],
    lastSync: null,
    isSyncing: false,
  };
  private syncInterval: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem('aicos-sync-queue');
      if (saved) this.queue = JSON.parse(saved);
    } catch {}
  }

  private saveQueue() {
    try {
      localStorage.setItem('aicos-sync-queue', JSON.stringify(this.queue));
    } catch {}
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((fn) => fn(status));
  }

  enqueue(action: SyncOperation['action'], model: string, data: any, id?: string) {
    const op: SyncOperation = {
      id: id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      model,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
      status: 'pending',
    };
    this.queue.operations.push(op);
    this.saveQueue();
    this.notify();
    this.processQueue();
  }

  private async processQueue() {
    if (this.queue.isSyncing) return;
    this.queue.isSyncing = true;
    this.notify();

    while (this.queue.operations.length > 0) {
      const op = this.queue.operations[0];
      if (op.status === 'completed') {
        this.queue.operations.shift();
        continue;
      }

      op.status = 'syncing';
      this.notify();

      try {
        await api.post('/sync', {
          action: op.action,
          model: op.model,
          id: op.id,
          data: op.data,
          timestamp: op.timestamp,
        });
        op.status = 'completed';
        op.retries = 0;
        this.queue.operations.shift();
        this.queue.lastSync = new Date().toISOString();
        this.saveQueue();
        this.notify();
      } catch (error: any) {
        op.retries++;
        op.status = 'failed';
        op.error = error.message;

        if (op.retries >= this.maxRetries) {
          this.queue.operations.shift();
        }
        this.saveQueue();
        this.notify();
        break;
      }
    }

    this.queue.isSyncing = false;
    this.notify();
  }

  async syncSnapshot() {
    try {
      const snapshot = await api.post<{ timestamp: string; projects: any[]; designs: any[]; tasks: any[] }>('/sync/snapshot', {
        lastSync: this.queue.lastSync,
      });
      this.queue.lastSync = snapshot.timestamp;
      this.saveQueue();
      return snapshot;
    } catch (error) {
      console.error('Snapshot sync failed:', error);
      return null;
    }
  }

  startAutoSync(intervalMs = 30000) {
    if (this.syncInterval) return;
    this.syncInterval = setInterval(() => {
      if (!this.queue.isSyncing) {
        this.processQueue();
        this.syncSnapshot();
      }
    }, intervalMs);
    this.syncSnapshot();
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  onStatusChange(callback: (status: SyncStatus) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }

  getStatus(): SyncStatus {
    return {
      pendingCount: this.queue.operations.filter((o) => o.status === 'pending').length,
      failedCount: this.queue.operations.filter((o) => o.status === 'failed').length,
      isSyncing: this.queue.isSyncing,
      lastSync: this.queue.lastSync,
      operations: this.queue.operations,
    };
  }

  clearFailed() {
    this.queue.operations = this.queue.operations.filter((o) => o.status !== 'failed');
    this.saveQueue();
    this.notify();
  }

  retryFailed() {
    this.queue.operations.forEach((o) => {
      if (o.status === 'failed') {
        o.status = 'pending';
        o.retries = 0;
        o.error = undefined;
      }
    });
    this.saveQueue();
    this.notify();
    this.processQueue();
  }
}

export interface SyncStatus {
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  lastSync: string | null;
  operations: SyncOperation[];
}

export const syncEngine = new SyncEngine();
