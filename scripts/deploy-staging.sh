#!/usr/bin/env bash
# =============================================================================
# deploy-staging.sh — Build, push schema, seed, and deploy to staging
# =============================================================================
# Usage:
#   ./scripts/deploy-staging.sh
#
# Prerequisites:
#   - DATABASE_URL pointing to Supabase staging PostgreSQL
#   - REDIS_URL pointing to Upstash staging Redis
#   - pnpm installed globally
#   - Vercel CLI installed (for web deploy)
#   - Railway CLI installed (for worker deploy)
# =============================================================================

set -euo pipefail

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()   { echo -e "${CYAN}[staging]${NC} $1"; }
ok()    { echo -e "${GREEN}[staging]${NC} $1"; }
warn()  { echo -e "${YELLOW}[staging]${NC} $1"; }
error() { echo -e "${RED}[staging]${NC} $1"; }

# ── Step 0: Check required environment variables ──
log "Checking required environment variables..."

REQUIRED_VARS=(
  "DATABASE_URL"
  "REDIS_URL"
  "CLERK_SECRET_KEY"
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  "NEXT_PUBLIC_APP_URL"
)

MISSING=0
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR:-}" ]; then
    error "Missing required env var: $VAR"
    MISSING=1
  fi
done

if [ "$MISSING" -eq 1 ]; then
  error "Set the missing variables and try again."
  error "See apps/web/.env.staging.example and apps/worker/.env.staging.example for reference."
  exit 1
fi

ok "All required environment variables are set."

# ── Step 1: Install dependencies ──
log "Installing dependencies..."
pnpm install --frozen-lockfile
ok "Dependencies installed."

# ── Step 2: Build all packages and apps ──
log "Building monorepo with Turbo..."
pnpm turbo build
ok "Build succeeded."

# ── Step 3: Push database schema to staging ──
log "Pushing database schema to staging (drizzle-kit push)..."
pnpm --filter @ai-office/db db:push
ok "Database schema pushed."

# ── Step 4: Run staging demo seed ──
log "Seeding staging demo data..."
pnpm tsx packages/db/src/seed/staging-demo.ts
ok "Staging demo data seeded."

# ── Step 5: Deploy web to Vercel (if CLI available) ──
if command -v vercel &> /dev/null; then
  log "Deploying web to Vercel staging..."
  vercel --prod --cwd apps/web
  ok "Web deployed to Vercel."
else
  warn "Vercel CLI not found — skipping web deploy."
  warn "Install with: pnpm add -g vercel"
fi

# ── Step 6: Deploy worker to Railway (if CLI available) ──
if command -v railway &> /dev/null; then
  log "Deploying worker to Railway staging..."
  railway up --service worker --cwd apps/worker
  ok "Worker deployed to Railway."
else
  warn "Railway CLI not found — skipping worker deploy."
  warn "Install with: pnpm add -g @railway/cli"
fi

# ── Done ──
echo ""
ok "============================================="
ok "  Staging deployment complete!"
ok "============================================="
echo ""
log "Web:    ${NEXT_PUBLIC_APP_URL}"
log "Worker: Check Railway dashboard for URL"
log "DB:     Supabase — schema pushed + demo data seeded"
echo ""
log "Demo organization: Acme Demo Ltda"
log "Demo agents:       Ana (support), Carlos (sales), Julia (content_writer)"
echo ""
