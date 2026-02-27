'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import {
  Radio,
  Building2,
  Users,
  GitBranch,
  GitMerge,
  ShieldCheck,
  BarChart3,
  Target,
  DollarSign,
  BookOpen,
  Settings,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  hasBadge?: boolean;
  comingSoon?: boolean;
}

interface NavGroup {
  key: string;
  labelKey: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'monitoring',
    labelKey: 'groupMonitoring',
    items: [
      { href: '/office', labelKey: 'office', icon: Building2 },
      { href: '/approvals', labelKey: 'approvals', icon: ShieldCheck, hasBadge: true },
      { href: '/strategy', labelKey: 'strategy', icon: Target },
      { href: '/analytics', labelKey: 'analytics', icon: BarChart3 },
      { href: '/memory', labelKey: 'memory', icon: BookOpen },
    ],
  },
  {
    key: 'aiCapabilities',
    labelKey: 'groupAiCapabilities',
    items: [
      { href: '/agents', labelKey: 'agents', icon: Users },
      { href: '/workflows', labelKey: 'workflows', icon: GitBranch },
      { href: '/tools', labelKey: 'tools', icon: Wrench },
    ],
  },
  {
    key: 'sectors',
    labelKey: 'groupSectors',
    items: [
      { href: '/devops', labelKey: 'devops', icon: GitMerge },
      { href: '/finance', labelKey: 'finance', icon: DollarSign },
    ],
  },
];

interface SidebarProps {
  pendingApprovalCount?: number;
}

export function Sidebar({ pendingApprovalCount = 0 }: SidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const collapsedGroups = useUIStore((s) => s.collapsedGroups);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleGroup = useUIStore((s) => s.toggleGroup);

  // Read hidden nav items from localStorage
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('ai-office-hidden-nav-items');
        setHiddenItems(raw ? JSON.parse(raw) : []);
      } catch { setHiddenItems([]); }
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ai-office-hidden-nav-items') load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function renderNavItem(item: NavItem) {
    const isActive =
      pathname === item.href ||
      (item.href !== '/' && pathname.startsWith(item.href));
    const Icon = item.icon;
    const label = t(item.labelKey);

    const link = (
      <Link
        href={item.href}
        className={`flex items-center gap-2.5 px-2.5 py-2 text-xs tracking-wide transition-colors ${
          isActive
            ? 'border-l-2 border-accent-cyan bg-bg-overlay text-accent-cyan'
            : 'border-l-2 border-transparent text-text-secondary hover:bg-bg-overlay hover:text-text-primary'
        }`}
        title={collapsed ? label : undefined}
      >
        <Icon size={15} strokeWidth={1.5} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 uppercase">{label}</span>
            {item.comingSoon && (
              <Badge variant="default" className="ml-auto text-[8px]">
                {t('comingSoon')}
              </Badge>
            )}
            {item.hasBadge && pendingApprovalCount > 0 && (
              <Badge variant="warning">{pendingApprovalCount}</Badge>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href} content={label} side="right">
          {link}
        </Tooltip>
      );
    }
    return <div key={item.href}>{link}</div>;
  }

  // Atlas pinned item
  const atlasActive =
    pathname === '/atlas' || pathname.startsWith('/atlas');
  const atlasLabel = t('atlas');

  const atlasLink = (
    <Link
      href="/atlas"
      className={`flex items-center gap-2.5 px-2.5 py-2 text-xs tracking-wide transition-colors ${
        atlasActive
          ? 'border-l-2 border-accent-cyan bg-bg-overlay text-accent-cyan'
          : 'border-l-2 border-transparent text-text-secondary hover:bg-bg-overlay hover:text-text-primary'
      }`}
      title={collapsed ? atlasLabel : undefined}
    >
      <Radio size={15} strokeWidth={1.5} className="shrink-0" />
      {!collapsed && <span className="flex-1 uppercase">{atlasLabel}</span>}
    </Link>
  );

  // Settings pinned item
  const settingsActive =
    pathname === '/settings' || pathname.startsWith('/settings');
  const settingsLabel = t('settings');

  const settingsLink = (
    <Link
      href="/settings"
      className={`flex items-center gap-2.5 px-2.5 py-2 text-xs tracking-wide transition-colors ${
        settingsActive
          ? 'border-l-2 border-accent-cyan bg-bg-overlay text-accent-cyan'
          : 'border-l-2 border-transparent text-text-secondary hover:bg-bg-overlay hover:text-text-primary'
      }`}
      title={collapsed ? settingsLabel : undefined}
    >
      <Settings size={15} strokeWidth={1.5} className="shrink-0" />
      {!collapsed && <span className="flex-1 uppercase">{settingsLabel}</span>}
    </Link>
  );

  return (
    <div
      className="relative flex shrink-0 flex-col border-r border-border-default bg-bg-base transition-all duration-200"
      style={{ width: collapsed ? 'var(--width-sidebar-collapsed)' : 'var(--width-sidebar-expanded)' }}
    >
      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-0.5 p-1.5 pt-3">
        {/* Atlas — pinned at top */}
        {collapsed ? (
          <Tooltip content={atlasLabel} side="right">
            {atlasLink}
          </Tooltip>
        ) : (
          <div>{atlasLink}</div>
        )}

        <div className="my-1 border-t border-border-subtle" />

        {/* Grouped navigation */}
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => !hiddenItems.includes(item.href));
          if (visibleItems.length === 0) return null;
          const isGroupCollapsed = collapsedGroups[group.key] ?? false;

          return (
            <div key={group.key} className="flex flex-col">
              {/* Group header */}
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[8px] uppercase tracking-[0.15em] text-text-muted transition-colors hover:text-text-secondary"
                >
                  <ChevronDown
                    size={10}
                    strokeWidth={2}
                    className={`shrink-0 transition-transform ${isGroupCollapsed ? '-rotate-90' : ''}`}
                  />
                  {t(group.labelKey)}
                </button>
              )}

              {/* Group items */}
              {(!isGroupCollapsed || collapsed) && (
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => renderNavItem(item))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Settings — pinned at bottom */}
      <div className="border-t border-border-subtle p-1.5">
        {collapsed ? (
          <Tooltip content={settingsLabel} side="right">
            {settingsLink}
          </Tooltip>
        ) : (
          <div>{settingsLink}</div>
        )}
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-2.5 top-5 z-10 flex h-5 w-5 items-center justify-center border border-border-default bg-bg-base text-text-muted transition-colors hover:text-text-primary"
        aria-label={collapsed ? t('expandNav') : t('collapseNav')}
      >
        {collapsed ? (
          <ChevronRight size={10} strokeWidth={1.5} />
        ) : (
          <ChevronLeft size={10} strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}
