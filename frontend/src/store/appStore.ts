import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  phone?: string;
  company?: string;
}

interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

interface AppState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  currentProject: Project | null;
  user: User | null;
  projects: Project[];
  aiAssistantOpen: boolean;
  isAuthenticated: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentProject: (project: Project | null) => void;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  addProject: (project: Project) => void;
  setAiAssistantOpen: (open: boolean) => void;
  toggleAiAssistant: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
      theme: 'dark',
      sidebarCollapsed: false,
      currentProject: null,
      user: null,
      projects: [],
      aiAssistantOpen: false,
      isAuthenticated: false,

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setCurrentProject: (currentProject) => set({ currentProject }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, password) => {
        const { token, user } = await authRequest('/auth/login', { email, password });
        localStorage.setItem('aicos-token', token);
        set({ user, isAuthenticated: true });
      },

      register: async (name, email, password, role = 'architect') => {
        const { token, user } = await authRequest('/auth/register', { name, email, password, role });
        localStorage.setItem('aicos-token', token);
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('aicos-token');
        set({ user: null, isAuthenticated: false, projects: [] });
      },

      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      setAiAssistantOpen: (aiAssistantOpen) => set({ aiAssistantOpen }),
      toggleAiAssistant: () =>
        set((state) => ({ aiAssistantOpen: !state.aiAssistantOpen })),
    }),
    {
      name: 'aicos-store',
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
        projects: state.projects,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
