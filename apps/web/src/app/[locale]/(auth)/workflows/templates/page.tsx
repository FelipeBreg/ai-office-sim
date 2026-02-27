'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Headphones,
  Filter,
  BarChart2,
  FileCheck,
  AlertTriangle,
  Megaphone,
  Eye,
  Package,
  Archive,
  UserPlus,
  Shield,
  Receipt,
  LayoutGrid,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useRouter } from '@/i18n/navigation';

/* -------------------------------------------------------------------------- */
/*  Icon map                                                                  */
/* -------------------------------------------------------------------------- */

const ICON_MAP: Record<string, LucideIcon> = {
  headphones: Headphones,
  filter: Filter,
  'bar-chart-2': BarChart2,
  'file-check': FileCheck,
  'alert-triangle': AlertTriangle,
  megaphone: Megaphone,
  eye: Eye,
  package: Package,
  archive: Archive,
  'user-plus': UserPlus,
  shield: Shield,
  receipt: Receipt,
};

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

const CATEGORIES = ['all', 'universal', 'marketing', 'ecommerce', 'saas', 'finance'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABEL_KEY: Record<Category, string> = {
  all: 'categoryAll',
  universal: 'categoryUniversal',
  marketing: 'categoryMarketing',
  ecommerce: 'categoryEcommerce',
  saas: 'categorySaas',
  finance: 'categoryFinance',
};

/* -------------------------------------------------------------------------- */
/*  Node-type colors (for dot indicators)                                     */
/* -------------------------------------------------------------------------- */

const NODE_TYPE_COLORS: Record<string, string> = {
  trigger: 'bg-emerald-500',
  agent: 'bg-cyan-400',
  condition: 'bg-amber-400',
  approval: 'bg-violet-400',
  output: 'bg-rose-400',
  delay: 'bg-blue-400',
};

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function TemplateCardSkeleton() {
  return (
    <div className="border border-border-default bg-bg-raised p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8" />
        <div className="flex-1">
          <Skeleton className="mb-1 h-3 w-28" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <Skeleton className="mt-3 h-2.5 w-full" />
      <Skeleton className="mt-1.5 h-2.5 w-3/4" />
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Template card                                                             */
/* -------------------------------------------------------------------------- */

interface TemplateCardProps {
  template: {
    id: string;
    nameEn: string;
    namePtBr: string;
    descriptionEn: string;
    descriptionPtBr: string;
    category: string;
    icon: string;
    nodeCount: number;
    definition: { nodes: Array<{ data?: { nodeType?: string } }>; edges: unknown[] } | null;
  };
  onUse: (id: string) => void;
  isUsing: boolean;
  t: ReturnType<typeof useTranslations<'workflowTemplates'>>;
}

function TemplateCard({ template, onUse, isUsing, t }: TemplateCardProps) {
  const Icon: LucideIcon = ICON_MAP[template.icon] ?? LayoutGrid;

  // Collect unique node types for dot indicators
  const nodeTypes = new Set<string>();
  if (template.definition?.nodes) {
    for (const n of template.definition.nodes) {
      const nt = (n as { data?: { nodeType?: string } }).data?.nodeType;
      if (nt) nodeTypes.add(nt);
    }
  }

  const categoryLabelKey = CATEGORY_LABEL_KEY[template.category as Category] ?? template.category;

  return (
    <div className="group flex flex-col border border-border-default bg-bg-raised transition-colors hover:border-accent-cyan/40">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-bg-base">
          <Icon size={14} strokeWidth={1.5} className="text-accent-cyan" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-medium text-text-primary">{template.nameEn}</h3>
          <Badge variant="default" className="mt-0.5">
            {t(categoryLabelKey as any)}
          </Badge>
        </div>
      </div>

      {/* Description */}
      <p className="flex-1 px-4 text-[10px] leading-relaxed text-text-muted">
        {template.descriptionEn}
      </p>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-border-default px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted">
            {t('nodeCount', { count: template.nodeCount })}
          </span>
          <div className="flex items-center gap-1">
            {Array.from(nodeTypes).map((nt) => (
              <span
                key={nt}
                className={`inline-block h-1.5 w-1.5 ${NODE_TYPE_COLORS[nt] ?? 'bg-text-muted'}`}
                title={nt}
              />
            ))}
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onUse(template.id)}
          disabled={isUsing}
        >
          {isUsing ? (
            <>
              <Loader2 size={10} className="mr-1 animate-spin" />
              {t('using')}
            </>
          ) : (
            t('useTemplate')
          )}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function WorkflowTemplatesPage() {
  const t = useTranslations('workflowTemplates');
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [usingId, setUsingId] = useState<string | null>(null);

  const { data: templates, isLoading } = trpc.workflowTemplates.list.useQuery();
  const useMutation = trpc.workflowTemplates.use.useMutation({
    onSuccess: (workflow) => {
      router.push(`/workflows/${workflow.id}`);
    },
    onError: () => {
      setUsingId(null);
    },
  });

  const handleUse = (templateId: string) => {
    setUsingId(templateId);
    useMutation.mutate({ templateId });
  };

  // Filter by active category
  const filtered = templates?.filter(
    (tpl) => activeCategory === 'all' || tpl.category === activeCategory,
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border-default px-4 py-3">
        <Link href="/workflows">
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center text-text-muted transition-colors hover:text-text-primary"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
          </button>
        </Link>
        <div>
          <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1 border-b border-border-default px-4 py-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${
              activeCategory === cat
                ? 'border border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                : 'border border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {t(CATEGORY_LABEL_KEY[cat] as any)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <TemplateCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty filtered */}
        {!isLoading && filtered && filtered.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <LayoutGrid size={20} strokeWidth={1.2} className="text-text-muted" />
            <p className="text-xs text-text-muted">{t('noTemplates')}</p>
          </div>
        )}

        {/* Template grid */}
        {!isLoading && filtered && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template as any}
                onUse={handleUse}
                isUsing={usingId === template.id}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
