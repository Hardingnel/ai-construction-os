import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export interface RemoteCursor {
  userId: string;
  userName: string;
  avatar?: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface DocChange {
  userId: string;
  userName: string;
  documentId: string;
  content: string;
  version: number;
  timestamp: number;
}

export interface CollabUser {
  userId: string;
  userName: string;
  avatar?: string;
}

interface UseCollaborationOptions {
  projectId: string | null;
  userId: string;
  userName: string;
  avatar?: string;
  enabled?: boolean;
}

export function useCollaboration({ projectId, userId, userName, avatar, enabled = true }: UseCollaborationOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const [collabUsers, setCollabUsers] = useState<CollabUser[]>([]);
  const [lastDocChange, setLastDocChange] = useState<DocChange | null>(null);
  const cursorsRef = useRef<Map<string, RemoteCursor>>(new Map());
  const cursorsTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!enabled || !projectId) return;
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register-user', { userId, userName, avatar });
      socket.emit('collab-join', { projectId });
      socket.emit('join-project', projectId);
    });

    socket.on('cursor-update', (cursor: RemoteCursor) => {
      if (cursor.userId === userId) return;
      setRemoteCursors(prev => { const m = new Map(prev); m.set(cursor.userId, cursor); return m; });
      cursorsRef.current.set(cursor.userId, cursor);
      const existing = cursorsTimers.current.get(cursor.userId);
      if (existing) clearTimeout(existing);
      cursorsTimers.current.set(cursor.userId, setTimeout(() => {
        setRemoteCursors(prev => { const m = new Map(prev); m.delete(cursor.userId); return m; });
        cursorsRef.current.delete(cursor.userId);
        cursorsTimers.current.delete(cursor.userId);
      }, 5000));
    });

    socket.on('user-joined', (user: CollabUser) => {
      if (user.userId === userId) return;
      setCollabUsers(prev => { if (prev.find(u => u.userId === user.userId)) return prev; return [...prev, user]; });
    });

    socket.on('user-left', (user: { userId: string }) => {
      setCollabUsers(prev => prev.filter(u => u.userId !== user.userId));
      setRemoteCursors(prev => { const m = new Map(prev); m.delete(user.userId); return m; });
    });

    socket.on('doc-changed', (change: DocChange) => {
      if (change.userId === userId) return;
      setLastDocChange(change);
    });

    return () => {
      socket.emit('collab-leave', { projectId });
      socket.emit('leave-project', projectId);
      socket.disconnect();
      socketRef.current = null;
      setRemoteCursors(new Map());
      setCollabUsers([]);
      setLastDocChange(null);
      cursorsTimers.current.forEach(t => clearTimeout(t));
      cursorsTimers.current.clear();
    };
  }, [projectId, userId, userName, avatar, enabled]);

  const sendCursorMove = useCallback((x: number, y: number) => {
    if (socketRef.current?.connected && projectId) {
      socketRef.current.emit('cursor-move', { projectId, x, y });
    }
  }, [projectId]);

  const sendDocEdit = useCallback((documentId: string, content: string, version: number) => {
    if (socketRef.current?.connected && projectId) {
      socketRef.current.emit('doc-edit', { projectId, documentId, content, version });
    }
  }, [projectId]);

  return { remoteCursors: Array.from(remoteCursors.values()), collabUsers, lastDocChange, sendCursorMove, sendDocEdit };
}
