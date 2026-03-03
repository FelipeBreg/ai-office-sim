'use client';

import { trpc } from '@/lib/trpc/client';

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  manager: 1,
  admin: 2,
  owner: 3,
};

/**
 * Hook for role-based UI gating.
 * Returns the current user's role and helper functions.
 */
export function useRole() {
  const { data: user } = trpc.users.getCurrent.useQuery();
  const role = user?.role ?? 'viewer';
  const level = ROLE_HIERARCHY[role] ?? 0;

  return {
    role,
    isViewer: level >= 0,
    isManager: level >= 1,
    isAdmin: level >= 2,
    isOwner: level >= 3,
    /** Check if user has at least the given role */
    hasRole: (minimumRole: 'viewer' | 'manager' | 'admin' | 'owner') =>
      level >= (ROLE_HIERARCHY[minimumRole] ?? 0),
  };
}
