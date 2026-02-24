import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { db } from '@ai-office/db';
import { users, projects, organizations } from '@ai-office/db';
import { eq, and, sql } from 'drizzle-orm';

export interface TRPCContext {
  clerkUserId: string | null;
  user: {
    id: string;
    clerkUserId: string;
    email: string;
    name: string;
    orgId: string;
    role: string;
  } | null;
  project: {
    id: string;
    orgId: string;
    name: string;
    slug: string;
  } | null;
  org: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  } | null;
}

export const createTRPCContext = async (opts: {
  clerkUserId: string | null;
  projectId?: string;
}): Promise<TRPCContext> => {
  const { clerkUserId, projectId } = opts;

  if (!clerkUserId) {
    return { clerkUserId: null, user: null, project: null, org: null };
  }

  // Look up internal user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (!user) {
    return { clerkUserId, user: null, project: null, org: null };
  }

  // Look up org
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.orgId))
    .limit(1);

  // Look up project if projectId provided
  let project: TRPCContext['project'] = null;
  if (projectId) {
    const [p] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.orgId, user.orgId)))
      .limit(1);

    if (p) {
      project = { id: p.id, orgId: p.orgId, name: p.name, slug: p.slug };
    }
  }

  return {
    clerkUserId,
    user: {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      orgId: user.orgId,
      role: user.role,
    },
    project,
    org: org
      ? { id: org.id, name: org.name, slug: org.slug, plan: org.plan }
      : null,
  };
};

// Narrowed types for use after middleware validation
type AuthUser = NonNullable<TRPCContext['user']>;
type AuthOrg = NonNullable<TRPCContext['org']>;
type AuthProject = NonNullable<TRPCContext['project']>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const middleware = t.middleware;

// Public procedure — no auth required
export const publicProcedure = t.procedure;

// Protected procedure — requires authenticated user + org
const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  if (!ctx.org) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Organization not found for user',
    });
  }

  const user: AuthUser = ctx.user;
  const org: AuthOrg = ctx.org;
  return next({ ctx: { user, org } });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

// Project procedure — requires auth + valid project context
const enforceProject = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  if (!ctx.org) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Organization not found for user',
    });
  }
  if (!ctx.project) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Project context required. Set x-project-id header.',
    });
  }

  // Set PostgreSQL session variable for RLS (parameterized to prevent SQL injection)
  await db.execute(
    sql`SELECT set_config('app.current_project_id', ${ctx.project.id}, true)`,
  );

  const user: AuthUser = ctx.user;
  const org: AuthOrg = ctx.org;
  const project: AuthProject = ctx.project;
  return next({ ctx: { user, org, project } });
});

export const projectProcedure = t.procedure.use(enforceProject);

// Role-based access middleware factory
const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  manager: 1,
  admin: 2,
  owner: 3,
};

export const requireRole = (minimumRole: 'viewer' | 'manager' | 'admin' | 'owner') =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const userLevel = ROLE_HIERARCHY[ctx.user.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;

    if (userLevel < requiredLevel) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Minimum role required: ${minimumRole}. Your role: ${ctx.user.role}`,
      });
    }

    return next({ ctx });
  });

// Convenience procedures with role checks
export const adminProcedure = projectProcedure.use(requireRole('admin'));
export const ownerProcedure = projectProcedure.use(requireRole('owner'));
