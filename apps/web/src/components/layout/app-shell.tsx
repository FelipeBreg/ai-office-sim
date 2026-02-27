'use client';

import { useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ThemeProvider } from './theme-provider';
import { useProjectStore } from '@/stores/project-store';
import { useUIStore } from '@/stores/ui-store';
import { trpc } from '@/lib/trpc/client';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Rehydrate persisted stores on client mount
  useEffect(() => {
    useProjectStore.persist.rehydrate();
    useUIStore.persist.rehydrate();
  }, []);

  // Fetch projects and org from API and populate the store
  const projectsQuery = trpc.projects.list.useQuery();
  const store = useProjectStore();

  useEffect(() => {
    if (projectsQuery.data && projectsQuery.data.length > 0) {
      const projects = projectsQuery.data.map((p) => ({
        id: p.id,
        orgId: p.orgId,
        name: p.name,
        slug: p.slug,
        color: p.color ?? '#00C8E0',
        isActive: p.isActive,
      }));
      store.setProjects(projects);

      // Auto-select first project if none selected
      if (!store.currentProjectId || !projects.find((p) => p.id === store.currentProjectId)) {
        store.setCurrentProject(projects[0].id);
      }

      // Set org from the first project
      if (!store.currentOrgId) {
        store.setCurrentOrg(projects[0].orgId);
      }
    }
  }, [projectsQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-bg-deepest">
      <ThemeProvider />
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
