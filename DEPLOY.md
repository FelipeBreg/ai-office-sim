# AI Office Sim — Free Deployment Guide

All services use free tiers. No credit card needed.

## Step 1: Create Accounts (3 sites)

### 1a. Vercel (Web hosting)
1. Go to https://vercel.com/signup
2. Sign up with your GitHub account (FelipeBreg)
3. This automatically links your repos

### 1b. Clerk (Authentication)
1. Go to https://clerk.com/
2. Click "Start building for free"
3. Create an application called "AI Office"
4. Choose "Email" as sign-in method (simplest)
5. Copy these values from the API Keys page:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_`)
6. Go to Webhooks → Add Endpoint:
   - URL: `https://YOUR-VERCEL-URL/api/webhooks/clerk` (set after Vercel deploy)
   - Events: `user.created`, `user.updated`, `organization.created`
   - Copy the Signing Secret → `CLERK_WEBHOOK_SECRET`

### 1c. Neon (PostgreSQL + pgvector)
1. Go to https://neon.tech/
2. Sign up (GitHub login works)
3. Create a project called "ai-office"
4. Region: pick closest to you (e.g. São Paulo or US East)
5. Copy the connection string → `DATABASE_URL`
   - It looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

### 1d. Upstash (Redis)
1. Go to https://upstash.com/
2. Sign up (GitHub login works)
3. Create a Redis database called "ai-office"
4. Region: same as Neon
5. Copy the connection string → `REDIS_URL`
   - It looks like: `rediss://default:xxx@xxx.upstash.io:6379`

---

## Step 2: Enable pgvector on Neon

In the Neon dashboard → SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Step 3: Push DB Schema

From this project directory, run:
```bash
DATABASE_URL="your-neon-connection-string" pnpm db:push
```

This creates all tables. Then seed demo data:
```bash
DATABASE_URL="your-neon-connection-string" pnpm --filter @ai-office/db seed
```

---

## Step 4: Deploy Web to Vercel

1. Go to https://vercel.com/new
2. Import the `ai-office-sim` repository
3. Framework: Next.js (auto-detected)
4. Root Directory: `apps/web`
5. Build Command: `cd ../.. && pnpm turbo build --filter=web`
6. Install Command: `pnpm install --frozen-lockfile`
7. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (from Neon) |
| `REDIS_URL` | (from Upstash) |
| `CLERK_SECRET_KEY` | (from Clerk) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | (from Clerk) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/pt-BR/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/pt-BR/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/pt-BR` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/pt-BR` |
| `CLERK_WEBHOOK_SECRET` | (from Clerk, set after adding webhook) |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_SOCKET_URL` | (Render worker URL, set after worker deploy) |

8. Click Deploy!

---

## Step 5: Deploy Worker to Render

1. Go to https://render.com/ → sign up with GitHub
2. New → Web Service → Connect the `ai-office-sim` repo
3. Settings:
   - Name: `ai-office-worker`
   - Runtime: Docker
   - Dockerfile Path: `apps/worker/Dockerfile`
   - Docker Context: `.` (root)
   - Instance Type: Free
4. Add Environment Variables:
   - `DATABASE_URL` = (from Neon)
   - `REDIS_URL` = (from Upstash)
   - `CLERK_SECRET_KEY` = (from Clerk)
   - `NODE_ENV` = `production`
5. Deploy!
6. Copy the Render URL (e.g. `https://ai-office-worker.onrender.com`)
7. Go back to Vercel → Settings → Environment Variables → set `NEXT_PUBLIC_SOCKET_URL` to the Render URL
8. Redeploy Vercel

---

## Step 6: Configure Clerk Webhook

1. Go to Clerk Dashboard → Webhooks → Add Endpoint
2. URL: `https://YOUR-VERCEL-URL.vercel.app/api/webhooks/clerk`
3. Subscribe to: `user.created`, `user.updated`, `organization.created`
4. Copy the Signing Secret → update `CLERK_WEBHOOK_SECRET` in Vercel

---

## Notes

- **Render free tier** spins down after 15 min of inactivity. First request takes ~30s to cold start. Fine for testing.
- **Neon free tier**: 0.5 GB storage, auto-suspends after 5 min idle, auto-resumes on connection.
- **Upstash free tier**: 10K commands/day, 256MB. More than enough for testing.
- **Clerk free tier**: 10K monthly active users.
- **Vercel free tier**: 100GB bandwidth, serverless functions, edge network.

Optional (not needed for testing):
- `ANTHROPIC_API_KEY` — needed for actual AI agent execution
- `HELICONE_API_KEY` — LLM observability
- `SENTRY_*` — error tracking
- `STRIPE_*` — payment processing
