interface CacheEntry<T> {
  data: T;
  timestamp: string;
  ttl: number;
}

class OfflineCache {
  private prefix = 'aicos-cache-';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000) {
    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date().toISOString(),
      ttl: ttlMs,
    };
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache set failed:', error);
      this.cleanup();
    }
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.getKey(key));
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      const age = Date.now() - new Date(entry.timestamp).getTime();
      if (age > entry.ttl) {
        localStorage.removeItem(this.getKey(key));
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  invalidate(key: string) {
    localStorage.removeItem(this.getKey(key));
  }

  invalidatePattern(pattern: string) {
    const prefix = this.getKey(pattern);
    Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => localStorage.removeItem(k));
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(localStorage)
      .filter((k) => k.startsWith(this.prefix))
      .forEach((k) => {
        try {
          const entry = JSON.parse(localStorage.getItem(k) || '{}');
          if (now - new Date(entry.timestamp).getTime() > entry.ttl) {
            localStorage.removeItem(k);
          }
        } catch {
          localStorage.removeItem(k);
        }
      });
  }

  clear() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(this.prefix))
      .forEach((k) => localStorage.removeItem(k));
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  onOnline(callback: () => void): () => void {
    window.addEventListener('online', callback);
    return () => window.removeEventListener('online', callback);
  }

  onOffline(callback: () => void): () => void {
    window.addEventListener('offline', callback);
    return () => window.removeEventListener('offline', callback);
  }
}

export const offlineCache = new OfflineCache();
