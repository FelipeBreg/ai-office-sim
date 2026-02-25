'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Building2, Users, CreditCard, Bell, Puzzle, Trash2, Plus, Send, Check, ExternalLink, Download, FileText } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { WhatsAppPanel } from './_components/whatsapp-panel';
import { trpc } from '@/lib/trpc/client';
import { useActiveProject, useActiveOrg, useProjectStore } from '@/stores/project-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PLAN_PRICING, PLAN_FEATURES, formatPrice, type PlanPricing } from '@ai-office/shared';

// ---------------------------------------------------------------------------
// Plan limits fallback (shared package may not export this yet)
// ---------------------------------------------------------------------------
const PLAN_LIMITS_FALLBACK = {
  starter: { maxProjects: 1, maxAgents: 3, maxWorkflows: 5 },
  growth: { maxProjects: 5, maxAgents: 10, maxWorkflows: 25 },
  pro: { maxProjects: 20, maxAgents: 50, maxWorkflows: 100 },
  enterprise: { maxProjects: -1, maxAgents: -1, maxWorkflows: -1 },
} as const;

type PlanKey = keyof typeof PLAN_LIMITS_FALLBACK;

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
const tabs = [
  { id: 'general', labelKey: 'general', icon: Building2 },
  { id: 'members', labelKey: 'members', icon: Users },
  { id: 'billing', labelKey: 'billing', icon: CreditCard },
  { id: 'notifications', labelKey: 'notifications', icon: Bell },
  { id: 'integrations', labelKey: 'integrations', icon: Puzzle },
] as const;

type Tab = (typeof tabs)[number]['id'];

// ---------------------------------------------------------------------------
// Sector options
// ---------------------------------------------------------------------------
const SECTORS = [
  'technology',
  'ecommerce',
  'saas',
  'finance',
  'healthcare',
  'education',
  'legal',
  'real_estate',
  'marketing',
  'other',
] as const;

const SECTOR_LABEL_MAP: Record<string, string> = {
  technology: 'sectorTechnology',
  ecommerce: 'sectorEcommerce',
  saas: 'sectorSaas',
  finance: 'sectorFinance',
  healthcare: 'sectorHealthcare',
  education: 'sectorEducation',
  legal: 'sectorLegal',
  real_estate: 'sectorRealEstate',
  marketing: 'sectorMarketing',
  other: 'sectorOther',
};

// ---------------------------------------------------------------------------
// Color presets
// ---------------------------------------------------------------------------
const COLOR_PRESETS = [
  { value: '#00C8E0', label: 'Cyan' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EC4899', label: 'Pink' },
] as const;

// ---------------------------------------------------------------------------
// Notification definitions
// ---------------------------------------------------------------------------
const NOTIFICATION_KEYS = [
  'notifAgentComplete',
  'notifAgentError',
  'notifApproval',
  'notifWorkflow',
  'notifMember',
  'notifReport',
] as const;

// ===========================================================================
// Tab: General
// ===========================================================================
function GeneralTab() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const project = useActiveProject();
  const utils = trpc.useUtils();
  const setProjects = useProjectStore((s) => s.setProjects);

  const [name, setName] = useState(project?.name ?? '');
  const [sector, setSector] = useState('');
  const [color, setColor] = useState(project?.color ?? '#00C8E0');
  const [timezone, setTimezone] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // Hydrate from project
  useEffect(() => {
    if (project) {
      setName(project.name);
      setColor(project.color || '#00C8E0');
    }
  }, [project]);

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: (updated) => {
      utils.projects.list.invalidate();
      // Update the project store too
      const current = useProjectStore.getState().projects;
      setProjects(current.map((p) => (p.id === updated.id ? { ...p, name: updated.name, color: updated.color } : p)));
      setFeedback(t('saved'));
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const handleSave = useCallback(() => {
    if (!project) return;
    updateMutation.mutate({
      id: project.id,
      name: name.trim() || project.name,
      color,
      sector: sector || undefined,
    });
  }, [project, name, color, sector, updateMutation]);

  if (!project) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Project Name */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('projectName')}
        </label>
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={updateMutation.isPending}
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending || !name.trim()}
          >
            {updateMutation.isPending ? t('saving') : tCommon('save')}
          </Button>
        </div>
      </div>

      {/* Sector */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('sector')}
        </label>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base [&>option]:text-text-primary"
        >
          <option value="">--</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {t(SECTOR_LABEL_MAP[s]!)}
            </option>
          ))}
        </select>
      </div>

      {/* Color */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('color')}
        </label>
        <div className="flex gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setColor(preset.value)}
              aria-label={preset.label}
              className={`h-7 w-7 transition-all ${
                color === preset.value
                  ? 'ring-2 ring-text-primary ring-offset-2 ring-offset-bg-deepest'
                  : 'hover:opacity-80'
              }`}
              style={{ backgroundColor: preset.value }}
            />
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('language')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className="border border-accent-cyan bg-accent-cyan/5 px-3 py-1 text-[10px] text-accent-cyan"
          >
            en-US
          </button>
          <button
            type="button"
            className="border border-border-default px-3 py-1 text-[10px] text-text-muted hover:border-border-hover"
          >
            pt-BR
          </button>
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('timezone')}
        </label>
        <Input
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder={t('timezonePlaceholder')}
        />
      </div>

      {/* Feedback */}
      {feedback && (
        <p className="text-[10px] text-status-success">{feedback}</p>
      )}

      {/* Danger Zone */}
      <div className="mt-4 border border-status-error/30 p-4">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-status-error">
          {t('dangerZone')}
        </h3>
        {!showDeleteConfirm ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={10} strokeWidth={1.5} className="mr-1" />
            {t('deleteProject')}
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-text-muted">
              {t('deleteConfirmHint')}
            </p>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={project.name}
            />
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                disabled={deleteInput !== project.name}
              >
                {t('deleteConfirmButton')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteInput('');
                }}
              >
                {tCommon('cancel')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Tab: Members
// ===========================================================================
function MembersTab() {
  const t = useTranslations('settings');
  const { user } = useUser();
  const userRole = useProjectStore((s) => s.userRole);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'viewer'>('viewer');

  // Current user as the only "member" for now
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User';
  const displayEmail = user?.primaryEmailAddress?.emailAddress || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="border border-accent-cyan/20 bg-accent-cyan/10 px-1.5 py-0.5 text-[9px] font-medium text-accent-cyan">
            {t('owner')}
          </span>
        );
      case 'admin':
        return (
          <span className="border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-400">
            {t('admin')}
          </span>
        );
      default:
        return (
          <span className="border border-border-default bg-bg-overlay px-1.5 py-0.5 text-[9px] font-medium text-text-muted">
            {t('viewer')}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold text-text-primary">{t('members')}</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowInvite(!showInvite)}
        >
          <Plus size={10} strokeWidth={1.5} className="mr-1" />
          {t('inviteMember')}
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="flex flex-col gap-3 border border-border-default p-3">
          <div>
            <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
              {t('inviteEmail')}
            </label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="member@company.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
              {t('inviteRole')}
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'admin' | 'viewer')}
              className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base [&>option]:text-text-primary"
            >
              <option value="admin">{t('admin')}</option>
              <option value="viewer">{t('viewer')}</option>
            </select>
          </div>
          <Button size="sm" disabled={!inviteEmail.trim()}>
            <Send size={10} strokeWidth={1.5} className="mr-1" />
            {t('sendInvite')}
          </Button>
        </div>
      )}

      {/* Member list */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 border border-border-default p-3">
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-bg-overlay text-[10px] font-semibold text-text-primary">
            {initials}
          </div>
          {/* Info */}
          <div className="flex-1">
            <div className="text-[11px] font-medium text-text-primary">{displayName}</div>
            <div className="text-[10px] text-text-muted">{displayEmail}</div>
          </div>
          {/* Role */}
          {roleBadge(userRole ?? 'owner')}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tab: Billing
// ===========================================================================

const PLAN_TIERS = ['starter', 'growth', 'pro', 'enterprise'] as const;

function BillingTab() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const activeOrg = useActiveOrg();
  const projectsQuery = trpc.projects.list.useQuery();
  const agentsQuery = trpc.agents.list.useQuery();
  const subscriptionQuery = trpc.billing.currentSubscription.useQuery();
  const invoicesQuery = trpc.billing.invoiceHistory.useQuery({ limit: 10 });

  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  const currency = locale === 'pt-BR' ? 'brl' : 'usd';

  const planKey = ((activeOrg?.plan ?? 'starter') as string).toLowerCase() as PlanKey;
  const limits = PLAN_LIMITS_FALLBACK[planKey] ?? PLAN_LIMITS_FALLBACK.starter;
  const subscription = subscriptionQuery.data;

  const projectCount = projectsQuery.data?.length ?? 0;
  const agentCount = agentsQuery.data?.length ?? 0;
  const workflowCount = 0;

  const bars: { labelKey: string; used: number; max: number }[] = [
    { labelKey: 'projects', used: projectCount, max: limits.maxProjects },
    { labelKey: 'agents', used: agentCount, max: limits.maxAgents },
    { labelKey: 'workflows', used: workflowCount, max: limits.maxWorkflows },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Current plan + subscription status */}
      <div className="border border-border-default p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
              {t('currentPlan')}
            </span>
            <Badge variant="cyan">{planKey.toUpperCase()}</Badge>
          </div>
          {subscription && (
            <span className={`text-[9px] ${
              subscription.status === 'active' ? 'text-status-success' :
              subscription.status === 'past_due' ? 'text-status-warning' :
              'text-text-muted'
            }`}>
              {t(
                subscription.status === 'active' ? 'subscriptionActive' :
                subscription.status === 'past_due' ? 'subscriptionPastDue' :
                subscription.status === 'canceled' ? 'subscriptionCanceled' :
                'subscriptionTrialing'
              )}
            </span>
          )}
        </div>
        {subscription?.currentPeriodEnd && (
          <p className="mt-2 text-[9px] text-text-muted">
            {t('nextBilling')}: {new Date(subscription.currentPeriodEnd).toLocaleDateString(locale)}
          </p>
        )}
      </div>

      {/* Usage meters */}
      <div>
        <h3 className="mb-3 text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('usage')}
        </h3>
        <div className="flex flex-col gap-4">
          {bars.map((bar) => {
            const isUnlimited = bar.max === -1;
            const pct = isUnlimited ? 0 : bar.max > 0 ? Math.min((bar.used / bar.max) * 100, 100) : 0;
            return (
              <div key={bar.labelKey}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary">{t(bar.labelKey)}</span>
                  <span className="text-[10px] text-text-muted">
                    {bar.used} / {isUnlimited ? t('unlimited') : bar.max}
                  </span>
                </div>
                <div className="h-2 w-full bg-bg-overlay">
                  <div
                    className="h-full bg-accent-cyan transition-all"
                    style={{ width: isUnlimited ? '0%' : `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan comparison + interval toggle */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('upgradePlan')}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={`px-2 py-0.5 text-[9px] transition-colors ${
                interval === 'monthly'
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t('monthly')}
            </button>
            <button
              type="button"
              onClick={() => setInterval('annual')}
              className={`px-2 py-0.5 text-[9px] transition-colors ${
                interval === 'annual'
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t('annual')}
              <span className="ml-1 text-[7px] text-status-success">{t('savePercent')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {PLAN_TIERS.map((tier) => {
            const pricing = PLAN_PRICING[tier];
            const features = PLAN_FEATURES[tier] ?? [];
            const isCurrent = planKey === tier;
            const isEnterprise = tier === 'enterprise';
            const price = pricing ? pricing[interval][currency] : 0;

            return (
              <div
                key={tier}
                className={`flex flex-col border p-3 ${
                  isCurrent ? 'border-accent-cyan bg-accent-cyan/5' : 'border-border-default bg-bg-base'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-text-primary">{tier}</span>
                  {isCurrent && (
                    <span className="bg-accent-cyan px-1.5 py-0.5 text-[7px] font-bold text-bg-deepest">
                      {t('currentPlanBadge')}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-sm font-bold text-text-primary">
                    {isEnterprise ? t('contactSales') : formatPrice(price, currency as 'brl' | 'usd')}
                  </span>
                  {!isEnterprise && price > 0 && (
                    <span className="text-[8px] text-text-muted">
                      {interval === 'monthly' ? t('perMonth') : t('perYear')}
                    </span>
                  )}
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-1 text-[8px] text-text-muted">
                      <Check size={8} strokeWidth={2} className="mt-0.5 shrink-0 text-accent-cyan" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <Button
                    variant={isEnterprise ? 'secondary' : 'primary'}
                    size="sm"
                    className="mt-3"
                    disabled
                  >
                    {isEnterprise ? t('contactSales') : t('subscribe')}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment methods (BR gets Pix + Boleto) */}
      {locale === 'pt-BR' && (
        <div>
          <h3 className="mb-2 text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('paymentMethods')}
          </h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 border border-border-default px-3 py-2 text-[9px] text-text-secondary">
              <CreditCard size={12} strokeWidth={1.2} />
              {t('creditCard')}
            </div>
            <div className="flex items-center gap-1.5 border border-border-default px-3 py-2 text-[9px] text-text-secondary">
              <FileText size={12} strokeWidth={1.2} />
              {t('pix')}
            </div>
            <div className="flex flex-col items-start gap-0.5 border border-border-default px-3 py-2">
              <span className="flex items-center gap-1.5 text-[9px] text-text-secondary">
                <FileText size={12} strokeWidth={1.2} />
                {t('boleto')}
              </span>
              <span className="text-[7px] text-text-muted">{t('boletoAnnualOnly')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Invoice history */}
      <div>
        <h3 className="mb-2 text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('invoiceHistory')}
        </h3>
        {invoicesQuery.data && invoicesQuery.data.length > 0 ? (
          <div className="flex flex-col gap-0">
            {/* Header */}
            <div className="flex items-center border border-border-default bg-bg-overlay px-3 py-1.5">
              <span className="flex-1 text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('invoiceDate')}</span>
              <span className="w-24 text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('invoiceAmount')}</span>
              <span className="w-16 text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('invoiceStatus')}</span>
              <span className="w-16 text-right text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('invoiceDownload')}</span>
            </div>
            {invoicesQuery.data.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center border border-t-0 border-border-default px-3 py-2"
              >
                <span className="flex-1 text-[10px] text-text-primary">
                  {new Date(inv.createdAt).toLocaleDateString(locale)}
                </span>
                <span className="w-24 text-[10px] text-text-primary">
                  {formatPrice(inv.amountPaid, inv.currency as 'brl' | 'usd')}
                </span>
                <span className={`w-16 text-[9px] ${
                  inv.status === 'paid' ? 'text-status-success' : 'text-text-muted'
                }`}>
                  {inv.status}
                </span>
                <span className="w-16 text-right">
                  {inv.invoicePdf && (
                    <a
                      href={inv.invoicePdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-cyan hover:underline"
                    >
                      <Download size={10} strokeWidth={1.5} />
                    </a>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-text-muted">{t('noInvoices')}</p>
        )}
      </div>

      {/* Manage subscription link (Stripe Portal) */}
      {subscription && (
        <div>
          <Button variant="secondary" size="sm" disabled>
            <ExternalLink size={10} strokeWidth={1.5} className="mr-1" />
            {t('manageSubscription')}
          </Button>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Tab: Notifications
// ===========================================================================
function NotificationsTab() {
  const t = useTranslations('settings');

  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NOTIFICATION_KEYS.forEach((key) => {
      initial[key] = true;
    });
    return initial;
  });

  const handleToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-1">
      {NOTIFICATION_KEYS.map((key) => (
        <div
          key={key}
          className="flex items-center justify-between border-b border-border-default px-1 py-3 last:border-b-0"
        >
          <div>
            <div className="text-[11px] font-medium text-text-primary">{t(key)}</div>
            <div className="text-[10px] text-text-muted">{t(`${key}Desc`)}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={toggles[key]}
            onClick={() => handleToggle(key)}
            className={`relative h-5 w-9 shrink-0 transition-colors ${
              toggles[key] ? 'bg-accent-cyan' : 'bg-bg-overlay'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 bg-bg-deepest transition-transform ${
                toggles[key] ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

// ===========================================================================
// Main Page
// ===========================================================================
export default function SettingsPage() {
  const t = useTranslations('settings');
  const [activeTab, setActiveTab] = useState<Tab>('general');

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="border-b border-border-default px-4 py-3">
        <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('title')}
        </h1>
        <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tab sidebar */}
        <div
          className="flex w-44 shrink-0 flex-col border-r border-border-default py-2"
          role="tablist"
          aria-label={t('title')}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-l-2 px-4 py-2 text-left text-[10px] transition-colors ${
                  isActive
                    ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon size={12} strokeWidth={1.5} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4" role="tabpanel" id={`tabpanel-${activeTab}`}>
          <div className="max-w-lg">
            {activeTab === 'general' && <GeneralTab />}
            {activeTab === 'members' && <MembersTab />}
            {activeTab === 'billing' && <BillingTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'integrations' && <WhatsAppPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
