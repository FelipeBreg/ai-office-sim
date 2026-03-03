'use client';

import { useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ThemeProvider } from './theme-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import { useProjectStore } from '@/stores/project-store';
import { useUIStore } from '@/stores/ui-store';
import { useConnectionStatus } from '@/stores/realtime-store';
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

  const connectionStatus = useConnectionStatus();
  const showOfflineBanner = connectionStatus === 'disconnected' || connectionStatus === 'reconnecting';

  return (
    <div className="flex h-screen overflow-hidden bg-bg-deepest">
      <ThemeProvider />
      <SocketProvider projectId={store.currentProjectId} />
      {/* Left: sidebar navigation */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        {showOfflineBanner && (
          <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5">
            <WifiOff size={12} strokeWidth={1.5} className="text-amber-400" />
            <span className="text-[9px] text-amber-400">
              {connectionStatus === 'reconnecting'
                ? 'Reconnecting to server...'
                : 'Connection lost. Real-time updates paused.'}
            </span>
          </div>
        )}
        <main className="flex-1 overflow-auto bg-bg-deepest">{children}</main>
      </div>
    </div>
  );
}
