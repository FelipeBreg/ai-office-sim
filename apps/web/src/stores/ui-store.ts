import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  railCollapsed: boolean;
  toggleSidebar: () => void;
  toggleRail: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRailCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      railCollapsed: true, // collapsed by default per spec
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleRail: () => set((s) => ({ railCollapsed: !s.railCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setRailCollapsed: (collapsed) => set({ railCollapsed: collapsed }),
    }),
    {
      name: 'ai-office-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        railCollapsed: state.railCollapsed,
      }),
      skipHydration: true,
    },
  ),
);
