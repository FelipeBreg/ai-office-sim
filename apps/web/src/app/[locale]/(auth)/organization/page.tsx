'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Network,
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  X,
  List,
  GitFork,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type TeamPriority = 'critical' | 'high' | 'normal' | 'low';
type MemberRole = 'lead' | 'member' | 'observer';

const PRIORITY_COLOR: Record<TeamPriority, string> = {
  critical: 'text-status-error',
  high: 'text-status-warning',
  normal: 'text-text-muted',
  low: 'text-text-muted',
};

const ROLE_ICON: Record<MemberRole, typeof Crown> = {
  lead: Crown,
  member: User,
  observer: Eye,
};

/* -------------------------------------------------------------------------- */
/*  Create / Edit Team Modal                                                   */
/* -------------------------------------------------------------------------- */

function TeamFormModal({
  team,
  onClose,
  onSaved,
}: {
  team?: { id: string; name: string; slug: string; description: string | null; priority: TeamPriority; maxConcurrency: number };
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('organization');
  const isEdit = !!team;

  const [name, setName] = useState(team?.name ?? '');
  const [slug, setSlug] = useState(team?.slug ?? '');
  const [description, setDescription] = useState(team?.description ?? '');
  const [priority, setPriority] = useState<TeamPriority>(team?.priority ?? 'normal');
  const [maxConcurrency, setMaxConcurrency] = useState(team?.maxConcurrency ?? 3);

  const createMutation = trpc.teams.create.useMutation({
    onSuccess: () => { onSaved(); onClose(); },
  });
  const updateMutation = trpc.teams.update.useMutation({
    onSuccess: () => { onSaved(); onClose(); },
  });

  const handleSubmit = () => {
    if (!name.trim()) return;
    const finalSlug = slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (isEdit) {
      updateMutation.mutate({ id: team!.id, name, description: description || undefined, priority, maxConcurrency });
    } else {
      createMutation.mutate({ name, slug: finalSlug, description: description || undefined, priority, maxConcurrency });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md border border-border-default bg-bg-raised p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
            {isEdit ? t('editTeam') : t('createTeam')}
          </h3>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('teamName')}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales Team" />
          </div>
          {!isEdit && (
            <div>
              <label className="mb-1 block text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('teamSlug')}</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="sales-team" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('teamDescription')}</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Handles sales pipeline..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('priority')}</label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TeamPriority)}
                  className="w-full appearance-none border border-border-default bg-bg-base px-2.5 py-1.5 pr-8 text-xs text-text-primary focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base"
                >
                  {(['critical', 'high', 'normal', 'low'] as const).map((p) => (
                    <option key={p} value={p}>{t(`priority${p[0].toUpperCase()}${p.slice(1)}` as any)}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('maxConcurrency')}</label>
              <Input type="number" min={1} max={50} value={maxConcurrency} onChange={(e) => setMaxConcurrency(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending ? '...' : isEdit ? t('editTeam') : t('createTeam')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Add Member Modal                                                           */
/* -------------------------------------------------------------------------- */

function AddMemberModal({
  teamId,
  existingMemberIds,
  onClose,
  onSaved,
}: {
  teamId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('organization');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [role, setRole] = useState<MemberRole>('member');

  const agentsQuery = trpc.agents.list.useQuery();
  const addMutation = trpc.teams.addMember.useMutation({
    onSuccess: () => { onSaved(); onClose(); },
  });

  const availableAgents = (agentsQuery.data ?? []).filter((a) => !existingMemberIds.includes(a.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm border border-border-default bg-bg-raised p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">{t('addMember')}</h3>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('selectAgent')}</label>
            <div className="relative">
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full appearance-none border border-border-default bg-bg-base px-2.5 py-1.5 pr-8 text-xs text-text-primary focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base"
              >
                <option value="">{t('selectAgent')}</option>
                {availableAgents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('selectRole')}</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as MemberRole)}
                className="w-full appearance-none border border-border-default bg-bg-base px-2.5 py-1.5 pr-8 text-xs text-text-primary focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base"
              >
                <option value="lead">{t('lead')}</option>
                <option value="member">{t('member')}</option>
                <option value="observer">{t('observer')}</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => addMutation.mutate({ teamId, agentId: selectedAgentId, role })} disabled={!selectedAgentId || addMutation.isPending}>
            {addMutation.isPending ? '...' : t('addMember')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Team Card                                                                  */
/* -------------------------------------------------------------------------- */

function TeamCard({
  team,
  onEdit,
  onDelete,
}: {
  team: { id: string; name: string; slug: string; description: string | null; priority: TeamPriority; maxConcurrency: number; memberCount: number; leadCount: number };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('organization');
  const [expanded, setExpanded] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const membersQuery = trpc.teams.listMembers.useQuery(
    { teamId: team.id },
    { enabled: expanded },
  );

  const removeMutation = trpc.teams.removeMember.useMutation({
    onSuccess: () => membersQuery.refetch(),
  });

  const utils = trpc.useUtils();

  return (
    <div className="border border-border-default bg-bg-raised">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-base"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-bg-base">
          <Users size={14} strokeWidth={1.5} className="text-accent-cyan" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-text-primary">{team.name}</span>
            <span className="text-[9px] text-text-muted">{team.slug}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge variant="default">{team.memberCount} {t('members').toLowerCase()}</Badge>
            <span className={`text-[9px] ${PRIORITY_COLOR[team.priority]}`}>
              {t(`priority${team.priority[0].toUpperCase()}${team.priority.slice(1)}` as any)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            Edit
          </Button>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              className="text-text-muted transition-colors hover:text-status-error"
            >
              <Trash2 size={12} />
            </button>
          ) : (
            <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              Confirm
            </Button>
          )}
          {expanded ? <ChevronDown size={12} className="text-text-muted" /> : <ChevronRight size={12} className="text-text-muted" />}
        </div>
      </button>

      {/* Expanded: members list */}
      {expanded && (
        <div className="border-t border-border-default px-4 py-3">
          {team.description && (
            <p className="mb-3 text-[10px] text-text-muted">{team.description}</p>
          )}

          <div className="mb-2 flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('members')}</span>
            <Button variant="secondary" size="sm" onClick={() => setShowAddMember(true)}>
              <Plus size={10} className="mr-1" />
              {t('addMember')}
            </Button>
          </div>

          {membersQuery.isLoading ? (
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (membersQuery.data?.length ?? 0) === 0 ? (
            <p className="text-[10px] text-text-muted">No members yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {membersQuery.data?.map(({ membership, agent }) => {
                const RoleIcon = ROLE_ICON[membership.role as MemberRole] ?? User;
                return (
                  <div key={membership.id} className="flex items-center gap-2 border border-border-default bg-bg-base px-2.5 py-1.5">
                    <RoleIcon size={10} strokeWidth={1.5} className={membership.role === 'lead' ? 'text-accent-cyan' : 'text-text-muted'} />
                    <span className="flex-1 text-[10px] text-text-primary">{agent.name}</span>
                    <Badge variant={membership.role === 'lead' ? 'success' : 'default'}>
                      {t(membership.role as any)}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate({ teamId: team.id, agentId: membership.agentId })}
                      className="text-text-muted transition-colors hover:text-status-error"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {showAddMember && (
            <AddMemberModal
              teamId={team.id}
              existingMemberIds={membersQuery.data?.map((m) => m.membership.agentId) ?? []}
              onClose={() => setShowAddMember(false)}
              onSaved={() => {
                membersQuery.refetch();
                utils.teams.listWithCounts.invalidate();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status Dot                                                                 */
/* -------------------------------------------------------------------------- */

const STATUS_COLOR: Record<string, string> = {
  idle: 'bg-text-muted',
  working: 'bg-status-success',
  awaiting_approval: 'bg-status-warning',
  error: 'bg-status-error',
  offline: 'bg-border-default',
};

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 ${STATUS_COLOR[status] ?? 'bg-text-muted'} ${
        status === 'working' ? 'animate-pulse' : ''
      }`}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Org Chart Node                                                             */
/* -------------------------------------------------------------------------- */

function ChartNode({
  icon,
  label,
  sublabel,
  status,
  variant = 'default',
  children,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  status?: string;
  variant?: 'ceo' | 'team' | 'agent' | 'default';
  children?: React.ReactNode;
}) {
  const borderClass =
    variant === 'ceo'
      ? 'border-accent-cyan bg-accent-cyan/5'
      : variant === 'team'
        ? 'border-border-hover bg-bg-raised'
        : 'border-border-default bg-bg-base';

  return (
    <div className="flex flex-col items-center">
      <div className={`flex items-center gap-2 border px-3 py-2 ${borderClass}`}>
        {icon}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {status && <StatusDot status={status} />}
            <span
              className={`text-[10px] font-medium ${
                variant === 'ceo' ? 'text-accent-cyan' : 'text-text-primary'
              }`}
            >
              {label}
            </span>
          </div>
          {sublabel && <span className="text-[8px] text-text-muted">{sublabel}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Org Chart View                                                             */
/* -------------------------------------------------------------------------- */

function OrgChartView({ t }: { t: (key: string, values?: Record<string, string | number>) => string }) {
  const orgQuery = trpc.teams.orgChart.useQuery();

  if (orgQuery.isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-px w-px" />
        <div className="flex gap-8">
          <Skeleton className="h-32 w-40" />
          <Skeleton className="h-32 w-40" />
          <Skeleton className="h-32 w-40" />
        </div>
      </div>
    );
  }

  const data = orgQuery.data;
  if (!data) return null;

  const hasTeams = data.teams.length > 0;
  const hasUnassigned = data.unassigned.length > 0;

  return (
    <div className="overflow-auto p-6">
      <div className="flex min-w-max flex-col items-center gap-0">
        {/* CEO Node */}
        <ChartNode
          icon={<Crown size={14} strokeWidth={1.5} className="text-accent-cyan" />}
          label={data.ceo?.name ?? 'CEO Agent'}
          sublabel={t('level', { level: 0 })}
          status={data.ceo?.status ?? 'offline'}
          variant="ceo"
        />

        {/* Trunk line from CEO down */}
        {(hasTeams || hasUnassigned) && (
          <div className="h-6 w-px bg-accent-cyan/40" />
        )}

        {/* Horizontal connector + team branches */}
        {hasTeams && (
          <>
            {/* Horizontal bar */}
            <div className="relative flex items-start">
              {/* The horizontal connector line */}
              {data.teams.length > 1 && (
                <div
                  className="absolute top-0 h-px bg-border-hover"
                  style={{
                    left: `calc(${100 / (2 * data.teams.length)}%)`,
                    right: `calc(${100 / (2 * data.teams.length)}%)`,
                  }}
                />
              )}

              {/* Teams */}
              <div className="flex gap-6">
                {data.teams.map((team) => {
                  const lead = team.members.find((m) => m.role === 'lead');
                  const members = team.members.filter((m) => m.role !== 'lead');

                  return (
                    <div key={team.id} className="flex flex-col items-center">
                      {/* Vertical line into team */}
                      <div className="h-4 w-px bg-border-hover" />

                      {/* Team node */}
                      <ChartNode
                        icon={<Users size={12} strokeWidth={1.5} className="text-accent-cyan" />}
                        label={team.name}
                        sublabel={`${team.members.length} ${t('members').toLowerCase()}`}
                        variant="team"
                      />

                      {/* Members below */}
                      {team.members.length > 0 && (
                        <>
                          <div className="h-3 w-px bg-border-default" />

                          <div className="flex flex-col items-center gap-1">
                            {/* Lead first */}
                            {lead && (
                              <div className="flex items-center gap-2 border border-accent-cyan/30 bg-accent-cyan/5 px-2.5 py-1.5">
                                <Crown size={9} strokeWidth={1.5} className="text-accent-cyan" />
                                <StatusDot status={lead.status} />
                                <span className="text-[9px] font-medium text-accent-cyan">
                                  {lead.name}
                                </span>
                                <Badge variant="success">{t('lead')}</Badge>
                              </div>
                            )}

                            {/* Other members */}
                            {members.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center gap-2 border border-border-default bg-bg-base px-2.5 py-1.5"
                              >
                                <Bot size={9} strokeWidth={1.5} className="text-text-muted" />
                                <StatusDot status={member.status} />
                                <span className="text-[9px] text-text-primary">{member.name}</span>
                                <Badge variant="default">{t(member.role as any)}</Badge>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Unassigned agents */}
        {hasUnassigned && (
          <div className="mt-8 w-full">
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle size={10} className="text-status-warning" />
              <span className="text-[9px] uppercase tracking-[0.12em] text-status-warning">
                {t('unassigned')} ({data.unassigned.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.unassigned.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-1.5 border border-border-default border-dashed bg-bg-base px-2 py-1"
                >
                  <Bot size={9} strokeWidth={1.5} className="text-text-muted" />
                  <StatusDot status={agent.status} />
                  <span className="text-[9px] text-text-muted">{agent.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasTeams && !hasUnassigned && !data.ceo && (
          <div className="mt-8 text-center">
            <Network size={32} strokeWidth={1} className="mx-auto mb-3 text-text-muted" />
            <p className="text-[11px] text-text-muted">{t('noTeams')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

type ViewMode = 'list' | 'chart';

export default function OrganizationPage() {
  const t = useTranslations('organization');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chart');

  const teamsQuery = trpc.teams.listWithCounts.useQuery();
  const deleteMutation = trpc.teams.delete.useMutation({
    onSuccess: () => teamsQuery.refetch(),
  });
  const utils = trpc.useUtils();

  const handleSaved = useCallback(() => {
    teamsQuery.refetch();
    utils.teams.listWithCounts.invalidate();
    utils.teams.orgChart.invalidate();
  }, [teamsQuery, utils]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Network size={14} strokeWidth={1.5} className="text-accent-cyan" />
            <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
              {t('title')}
            </h1>
          </div>
          <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex border border-border-default">
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.1em] transition-colors ${
                viewMode === 'chart'
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <GitFork size={10} />
              {t('chartView')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 border-l border-border-default px-2.5 py-1.5 text-[9px] uppercase tracking-[0.1em] transition-colors ${
                viewMode === 'list'
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <List size={10} />
              {t('listView')}
            </button>
          </div>

          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={12} className="mr-1" />
            {t('createTeam')}
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'chart' ? (
        <div className="flex-1 overflow-auto">
          <OrgChartView t={t} />
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {/* CEO Agent indicator */}
          <div className="mb-4 flex items-center gap-3 border border-accent-cyan/20 bg-accent-cyan/5 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-accent-cyan/30 bg-bg-base">
              <Crown size={14} strokeWidth={1.5} className="text-accent-cyan" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-accent-cyan">{t('ceoAgent')}</div>
              <div className="text-[9px] text-text-muted">{t('level', { level: 0 })} — System Agent</div>
            </div>
          </div>

          {/* Teams */}
          {teamsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (teamsQuery.data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Network size={32} strokeWidth={1} className="mb-3 text-text-muted" />
              <p className="text-[11px] text-text-muted">{t('noTeams')}</p>
              <p className="mt-1 text-[9px] text-text-muted">{t('noTeamsDescription')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {teamsQuery.data?.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team as any}
                  onEdit={() => setEditingTeam(team)}
                  onDelete={() => deleteMutation.mutate({ id: team.id })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <TeamFormModal onClose={() => setShowCreateModal(false)} onSaved={handleSaved} />
      )}
      {editingTeam && (
        <TeamFormModal team={editingTeam} onClose={() => setEditingTeam(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
