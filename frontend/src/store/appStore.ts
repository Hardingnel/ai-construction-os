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
  role: 'admin' | 'architect' | 'engineer' | 'project-manager' | 'viewer';
}

interface AppState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  currentProject: Project | null;
  user: User | null;
  projects: Project[];
  aiAssistantOpen: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentProject: (project: Project | null) => void;
  setUser: (user: User | null) => void;
  addProject: (project: Project) => void;
  setAiAssistantOpen: (open: boolean) => void;
  toggleAiAssistant: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      currentProject: null,
      user: null,
      projects: [],
      aiAssistantOpen: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setCurrentProject: (currentProject) => set({ currentProject }),
      setUser: (user) => set({ user }),
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
      }),
    }
  )
);
