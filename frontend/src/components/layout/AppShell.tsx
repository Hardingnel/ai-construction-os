import { ReactNode } from 'react';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { AiAssistant } from '@/components/chat/AiAssistant';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col bg-background">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-grid relative">
          <div className="absolute inset-0 pointer-events-none" />
          {children}
        </main>
        <AiAssistant />
      </div>
    </div>
  );
}
