import { Webhook } from 'svix';
import { headers } from 'next/headers';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { db, organizations, users, projects, eq, sql } from '@ai-office/db';

export async function POST(req: Request): Promise<Response> {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET environment variable is not set');
    return new Response('Server configuration error', { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Use raw text body to preserve exact bytes for signature verification
  const body = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);

  let event: WebhookEvent;
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response('Invalid webhook signature', { status: 400 });
  }

  const payload = JSON.parse(body);

  switch (event.type) {
    case 'user.created': {
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      const email = email_addresses[0]?.email_address;
      if (!email) break;

      const name = [first_name, last_name].filter(Boolean).join(' ') || email;

      // Use clerk user ID as slug disambiguator to prevent email prefix collisions
      const slug = `personal-${id}`;
      const [org] = await db
        .insert(organizations)
        .values({
          name: `${name}'s Org`,
          slug,
          plan: 'starter',
        })
        .onConflictDoUpdate({
          target: organizations.slug,
          set: { name: `${name}'s Org` },
        })
        .returning();

      if (!org) break;

      // Create default project for the org
      await db
        .insert(projects)
        .values({
          orgId: org.id,
          name: 'Default Project',
          slug: 'default',
        })
        .onConflictDoNothing();

      // Idempotent user insert (handles webhook replays)
      await db
        .insert(users)
        .values({
          clerkUserId: id,
          email,
          name,
          avatarUrl: image_url ?? null,
          orgId: org.id,
          role: 'owner',
        })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: { email, name, avatarUrl: image_url ?? null },
        });
      break;
    }

    case 'user.updated': {
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      const email = email_addresses[0]?.email_address;
      if (!email) break;

      const name = [first_name, last_name].filter(Boolean).join(' ') || email;

      await db
        .update(users)
        .set({ email, name, avatarUrl: image_url ?? null })
        .where(eq(users.clerkUserId, id));
      break;
    }

    case 'user.deleted': {
      const { id } = event.data;
      if (!id) break;

      // Find user before deleting to clean up orphaned org
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, id))
        .limit(1);

      if (user) {
        await db.delete(users).where(eq(users.clerkUserId, id));

        // Check if org has any remaining members
        const [remaining] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(eq(users.orgId, user.orgId));

        if (remaining && remaining.count === 0) {
          await db.delete(organizations).where(eq(organizations.id, user.orgId));
        }
      }
      break;
    }

    case 'organization.created': {
      const { id, name, slug } = event.data;

      try {
        const [org] = await db
          .insert(organizations)
          .values({
            name,
            slug: slug ?? id,
            clerkOrgId: id,
          })
          .onConflictDoUpdate({
            target: organizations.clerkOrgId,
            set: { name, slug: slug ?? id },
          })
          .returning();

        if (!org) break;

        // Create default project
        await db
          .insert(projects)
          .values({
            orgId: org.id,
            name: 'Default Project',
            slug: 'default',
          })
          .onConflictDoNothing();
      } catch (err) {
        // Handle slug collision (log and return 200 so Clerk does not retry)
        console.error('Failed to create organization:', err);
      }
      break;
    }

    case 'organizationMembership.created': {
      const { organization, public_user_data, role } = event.data;
      if (!public_user_data?.user_id || !organization?.id) break;

      // Find the org
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.clerkOrgId, organization.id))
        .limit(1);

      if (!org) break;

      // Map Clerk role to internal role enum
      type UserRole = 'owner' | 'admin' | 'manager' | 'viewer';
      const roleMap: Record<string, UserRole> = {
        'org:admin': 'admin',
        'org:member': 'viewer',
      };
      const mappedRole: UserRole = roleMap[role] ?? 'viewer';

      // Update user's org membership and role
      await db
        .update(users)
        .set({ orgId: org.id, role: mappedRole })
        .where(eq(users.clerkUserId, public_user_data.user_id));
      break;
    }
  }

  return new Response('OK', { status: 200 });
}
