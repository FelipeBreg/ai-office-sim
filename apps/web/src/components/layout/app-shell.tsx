'use client';

import { useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ProjectRail, RailExpandButton } from './project-rail';
import { useProjectStore } from '@/stores/project-store';
import { useUIStore } from '@/stores/ui-store';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Rehydrate persisted stores on client mount
  useEffect(() => {
    useProjectStore.persist.rehydrate();
    useUIStore.persist.rehydrate();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-deepest">
      {/* Far-left: project rail (collapsed by default) */}
      <ProjectRail />
      <RailExpandButton />

      {/* Left: sidebar navigation */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-bg-deepest">{children}</main>
      </div>
    </div>
  );
}
