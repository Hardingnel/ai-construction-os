'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  company?: string;
}

interface Project {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  description?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

interface AppState {
  user: User | null;
  token: string | null;
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  isAuthenticated: boolean;
  projects: Project[];
  currentProject: Project | null;
  aiAssistantOpen: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  setAiAssistantOpen: (open: boolean) => void;
  toggleAiAssistant: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function authRequest(endpoint: string, data: any): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      theme: 'dark',
      sidebarOpen: true,
      isAuthenticated: false,
      projects: [],
      currentProject: null,
      aiAssistantOpen: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        if (token) localStorage.setItem('aicos-token', token);
        else localStorage.removeItem('aicos-token');
        set({ token });
      },
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setCurrentProject: (currentProject) => set({ currentProject }),
      addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
      setAiAssistantOpen: (aiAssistantOpen) => set({ aiAssistantOpen }),
      toggleAiAssistant: () => set((s) => ({ aiAssistantOpen: !s.aiAssistantOpen })),

      login: async (email, password) => {
        const { token, user } = await authRequest('/auth/login', { email, password });
        localStorage.setItem('aicos-token', token);
        set({ token, user, isAuthenticated: true });
      },

      register: async (name, email, password, role = 'architect') => {
        const { token, user } = await authRequest('/auth/register', { name, email, password, role });
        localStorage.setItem('aicos-token', token);
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('aicos-token');
        set({ user: null, token: null, isAuthenticated: false, projects: [] });
      },
    }),
    { name: 'aicos-web-store', partialize: (state) => ({ user: state.user, token: state.token, theme: state.theme, isAuthenticated: state.isAuthenticated }) }
  )
);
