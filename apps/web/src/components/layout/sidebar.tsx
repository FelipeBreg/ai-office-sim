'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import {
  Building2,
  Radio,
  Users,
  GitBranch,
  GitMerge,
  ShieldCheck,
  Target,
  Brain,
  Wrench,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
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

const navItems: NavItem[] = [
  { href: '/office', labelKey: 'office', icon: Building2 },
  { href: '/atlas', labelKey: 'atlas', icon: Radio },
  { href: '/agents', labelKey: 'agents', icon: Users },
  { href: '/workflows', labelKey: 'workflows', icon: GitBranch },
  { href: '/devops', labelKey: 'devops', icon: GitMerge },
  { href: '/approvals', labelKey: 'approvals', icon: ShieldCheck, hasBadge: true },
  { href: '/strategy', labelKey: 'strategy', icon: Target },
  { href: '/memory', labelKey: 'memory', icon: Brain },
  { href: '/tools', labelKey: 'tools', icon: Wrench },
  { href: '/analytics', labelKey: 'analytics', icon: BarChart3 },
  { href: '/settings', labelKey: 'settings', icon: Settings },
];

interface SidebarProps {
  pendingApprovalCount?: number;
}

export function Sidebar({ pendingApprovalCount = 0 }: SidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <div
      className="relative flex shrink-0 flex-col border-r border-border-default bg-bg-base transition-all duration-200"
      style={{ width: collapsed ? 'var(--width-sidebar-collapsed)' : 'var(--width-sidebar-expanded)' }}
    >
      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-0.5 p-1.5 pt-3">
        {navItems.map((item) => {
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
        })}
      </nav>

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
