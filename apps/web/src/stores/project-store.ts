import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface Project {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
}

interface ProjectState {
  currentOrgId: string | null;
  currentProjectId: string | null;
  userRole: string | null;
  organizations: Organization[];
  projects: Project[];
  setCurrentOrg: (orgId: string) => void;
  setCurrentProject: (projectId: string) => void;
  setUserRole: (role: string) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setProjects: (projects: Project[]) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentOrgId: null,
      currentProjectId: null,
      userRole: null,
      organizations: [],
      projects: [],
      setCurrentOrg: (orgId) => set({ currentOrgId: orgId }),
      setCurrentProject: (projectId) => set({ currentProjectId: projectId }),
      setUserRole: (role) => set({ userRole: role }),
      setOrganizations: (organizations) => set({ organizations }),
      setProjects: (projects) => set({ projects }),
      reset: () =>
        set({
          currentOrgId: null,
          currentProjectId: null,
          userRole: null,
          organizations: [],
          projects: [],
        }),
    }),
    {
      name: 'ai-office-project',
      partialize: (state) => ({
        currentOrgId: state.currentOrgId,
        currentProjectId: state.currentProjectId,
      }),
      // Skip auto-hydration to prevent SSR mismatch.
      // Call useProjectStore.persist.rehydrate() in a client-side useEffect.
      skipHydration: true,
    },
  ),
);

// Selectors
export const useActiveProject = () =>
  useProjectStore((state) => {
    const project = state.projects.find((p) => p.id === state.currentProjectId);
    return project ?? null;
  });

export const useProjects = () => useProjectStore((state) => state.projects);

export const useUserRole = () => useProjectStore((state) => state.userRole);

export const useActiveOrg = () =>
  useProjectStore((state) => {
    const org = state.organizations.find((o) => o.id === state.currentOrgId);
    return org ?? null;
  });
