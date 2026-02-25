'use client';

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Upload,
  FileText,
  Globe,
  Cpu,
  Bot,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  Database,
  Brain,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button, Input, Badge, Skeleton, Separator } from '@/components/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'documents' | 'agentMemory';

type SourceType = 'upload' | 'web' | 'api' | 'agent';

interface SearchResult {
  content: string;
  documentTitle: string;
  sourceType: SourceType;
  score: number;
}

interface Document {
  id: string;
  title: string;
  sourceType: SourceType;
  chunkCount: number;
  createdAt: Date;
}

interface MemoryEntry {
  key: string;
  value: unknown;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SOURCE_TYPE_CONFIG: Record<SourceType, { icon: typeof FileText; variant: 'default' | 'cyan' | 'warning' | 'success' }> = {
  upload: { icon: Upload, variant: 'default' },
  web: { icon: Globe, variant: 'cyan' },
  api: { icon: Cpu, variant: 'warning' },
  agent: { icon: Bot, variant: 'success' },
};

function SourceBadge({ type, t }: { type: SourceType; t: (key: string) => string }) {
  const config = SOURCE_TYPE_CONFIG[type];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon size={8} strokeWidth={1.5} className="mr-0.5" />
      {t(type)}
    </Badge>
  );
}

function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatJson(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SearchResultCard({ result, t }: { result: SearchResult; t: (key: string) => string }) {
  const scorePercent = Math.round(result.score * 100);
  return (
    <div className="border border-border-default bg-bg-base p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-text-primary">{result.documentTitle}</span>
          <SourceBadge type={result.sourceType} t={t} />
        </div>
        <span className="text-[9px] text-text-muted">
          {t('relevance')}: {scorePercent}%
        </span>
      </div>
      <p className="text-[10px] leading-relaxed text-text-secondary">{result.content}</p>
    </div>
  );
}

function DocumentRow({
  doc,
  t,
  onDelete,
  isDeleting,
}: {
  doc: Document;
  t: (key: string) => string;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center justify-between border border-border-default bg-bg-base px-3 py-2">
      <div className="flex items-center gap-3">
        <FileText size={14} strokeWidth={1.5} className="shrink-0 text-text-muted" />
        <div>
          <div className="text-[10px] font-medium text-text-primary">{doc.title}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[9px] text-text-muted">
            <SourceBadge type={doc.sourceType} t={t} />
            <span>
              {doc.chunkCount} {t('chunks')}
            </span>
            <span>{formatDate(doc.createdAt)}</span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(doc.id)}
        disabled={isDeleting}
        aria-label={t('deleteDocument')}
      >
        <Trash2 size={12} strokeWidth={1.5} />
      </Button>
    </div>
  );
}

function DropZone({
  t,
  onFiles,
  isUploading,
}: {
  t: (key: string) => string;
  onFiles: (files: FileList) => void;
  isUploading: boolean;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
      }
    },
    [onFiles],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFiles(e.target.files);
      }
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center border border-dashed px-4 py-8 transition-colors ${
        isDragOver
          ? 'border-accent-cyan bg-accent-cyan/5'
          : 'border-border-default hover:border-text-muted'
      } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
    >
      <Upload
        size={20}
        strokeWidth={1.5}
        className={isDragOver ? 'text-accent-cyan' : 'text-text-muted'}
      />
      <p className="mt-2 text-[10px] text-text-secondary">
        {isUploading ? t('uploading') : t('dropzoneLabel')}
      </p>
      <p className="mt-0.5 text-[9px] text-text-muted">{t('dropzoneHint')}</p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.csv"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

function MemoryEntryRow({
  entry,
  t,
  onSave,
}: {
  entry: MemoryEntry;
  t: (key: string) => string;
  onSave: (key: string, value: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const startEdit = () => {
    setEditValue(formatJson(entry.value));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const saveEdit = () => {
    onSave(entry.key, editValue);
    setIsEditing(false);
  };

  return (
    <div className="border border-border-default bg-bg-base p-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold tracking-wide text-accent-cyan">{entry.key}</div>
          {isEditing ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="mt-1.5 w-full border border-border-default bg-bg-deepest px-2 py-1.5 font-mono text-[10px] text-text-primary focus:border-accent-cyan focus:outline-none"
            />
          ) : (
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-text-secondary">
              {formatJson(entry.value)}
            </pre>
          )}
          <div className="mt-1 text-[8px] text-text-muted">
            {t('lastUpdated')}: {formatDate(entry.updatedAt)}
          </div>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={saveEdit} aria-label={t('save')}>
                <Check size={12} strokeWidth={1.5} />
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelEdit} aria-label={t('cancel')}>
                <X size={12} strokeWidth={1.5} />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={startEdit} aria-label={t('edit')}>
              <Pencil size={12} strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Company Documents
// ---------------------------------------------------------------------------

function CompanyDocumentsTab() {
  const t = useTranslations('memory');
  const tCommon = useTranslations('common');

  const [searchQuery, setSearchQuery] = useState('');

  // tRPC hooks — these call hypothetical routers (will error at runtime until routers exist)
  const documentsQuery = trpc.documents.list.useQuery(undefined, {
    retry: false,
  });

  const searchMutation = trpc.documents.search.useMutation();
  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      documentsQuery.refetch();
    },
  });
  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      documentsQuery.refetch();
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    searchMutation.mutate({ query: searchQuery });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const handleFiles = useCallback(
    (files: FileList) => {
      // Placeholder: In a real implementation this would use FormData or presigned URLs.
      // For now we call the mutation with file metadata only.
      Array.from(files).forEach((file) => {
        uploadMutation.mutate({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      });
    },
    [uploadMutation],
  );

  const searchResults = (searchMutation.data ?? []) as SearchResult[];
  const documents = (documentsQuery.data ?? []) as Document[];

  return (
    <div className="flex flex-col gap-4">
      {/* Semantic search bar */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('semanticSearch')}
        </label>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={searchMutation.isPending || !searchQuery.trim()}
            size="md"
          >
            <Search size={12} strokeWidth={1.5} className="mr-1" />
            {searchMutation.isPending ? t('searching') : tCommon('search')}
          </Button>
        </div>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('searchResults')} ({searchResults.length})
          </div>
          {searchResults.map((result, idx) => (
            <SearchResultCard key={idx} result={result} t={t} />
          ))}
          <Separator />
        </div>
      )}

      {searchMutation.isSuccess && searchResults.length === 0 && (
        <p className="text-[10px] text-text-muted">{tCommon('noResults')}</p>
      )}

      {/* Upload drop zone */}
      <div>
        <div className="mb-1.5 text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('uploadDocuments')}
        </div>
        <DropZone t={t} onFiles={handleFiles} isUploading={uploadMutation.isPending} />
      </div>

      <Separator />

      {/* Ingested documents list */}
      <div>
        <div className="mb-2 text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('ingestedDocuments')} {documents.length > 0 && `(${documents.length})`}
        </div>

        {documentsQuery.isLoading && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {documentsQuery.isError && (
          <p className="text-[10px] text-status-error">{tCommon('error')}</p>
        )}

        {!documentsQuery.isLoading && documents.length === 0 && !documentsQuery.isError && (
          <p className="text-[10px] text-text-muted">{t('noDocuments')}</p>
        )}

        {documents.length > 0 && (
          <div className="flex flex-col gap-1">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                t={t}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Agent Memory
// ---------------------------------------------------------------------------

function AgentMemoryTab() {
  const t = useTranslations('memory');
  const tCommon = useTranslations('common');

  const [selectedAgentId, setSelectedAgentId] = useState('');

  const agentsQuery = trpc.agents.list.useQuery();
  const memoryQuery = trpc.agentMemory.list.useQuery(
    { agentId: selectedAgentId },
    { enabled: !!selectedAgentId, retry: false },
  );

  const updateMutation = trpc.agentMemory.update.useMutation({
    onSuccess: () => {
      memoryQuery.refetch();
    },
  });

  const handleSave = (key: string, value: string) => {
    if (!selectedAgentId) return;
    updateMutation.mutate({ agentId: selectedAgentId, key, value });
  };

  const agents = agentsQuery.data ?? [];
  const memoryEntries = (memoryQuery.data ?? []) as MemoryEntry[];

  return (
    <div className="flex flex-col gap-4">
      {/* Agent selector */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('selectAgent')}
        </label>
        <div className="relative">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={agentsQuery.isLoading}
            className="w-full appearance-none border border-border-default bg-bg-base px-2.5 py-1.5 pr-8 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none disabled:pointer-events-none disabled:opacity-50 [&>option]:bg-bg-base [&>option]:text-text-primary"
          >
            <option value="">{t('chooseAgent')}</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            strokeWidth={1.5}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
          />
        </div>
      </div>

      {/* Loading */}
      {agentsQuery.isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {/* Agent not selected hint */}
      {!selectedAgentId && !agentsQuery.isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Brain size={24} strokeWidth={1} className="text-text-muted" />
          <p className="mt-2 text-[10px] text-text-muted">{t('selectAgentHint')}</p>
        </div>
      )}

      {/* Memory loading */}
      {selectedAgentId && memoryQuery.isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {/* Memory error */}
      {selectedAgentId && memoryQuery.isError && (
        <p className="text-[10px] text-status-error">{tCommon('error')}</p>
      )}

      {/* Empty memory */}
      {selectedAgentId && !memoryQuery.isLoading && memoryEntries.length === 0 && !memoryQuery.isError && (
        <p className="text-[10px] text-text-muted">{t('noMemoryEntries')}</p>
      )}

      {/* Memory entries */}
      {memoryEntries.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('memoryEntries')} ({memoryEntries.length})
          </div>
          {memoryEntries.map((entry) => (
            <MemoryEntryRow key={entry.key} entry={entry} t={t} onSave={handleSave} />
          ))}
        </div>
      )}

      {/* Save feedback */}
      {updateMutation.isSuccess && (
        <p className="text-[10px] text-status-success">{t('memorySaved')}</p>
      )}
      {updateMutation.isError && (
        <p className="text-[10px] text-status-error">{updateMutation.error.message}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs config
// ---------------------------------------------------------------------------

const TABS: { id: Tab; labelKey: string; icon: typeof Database }[] = [
  { id: 'documents', labelKey: 'tabDocuments', icon: Database },
  { id: 'agentMemory', labelKey: 'tabAgentMemory', icon: Brain },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function MemoryPage() {
  const t = useTranslations('memory');
  const [activeTab, setActiveTab] = useState<Tab>('documents');

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div>
          <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
        </div>
        {/* Tab switcher */}
        <div className="flex gap-1" role="tablist" aria-label={t('title')}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 border px-3 py-1.5 text-[10px] transition-colors ${
                  isActive
                    ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                    : 'border-border-default text-text-muted hover:border-border-hover hover:text-text-secondary'
                }`}
              >
                <Icon size={12} strokeWidth={1.5} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto p-4"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
      >
        <div className="mx-auto max-w-2xl">
          {activeTab === 'documents' && <CompanyDocumentsTab />}
          {activeTab === 'agentMemory' && <AgentMemoryTab />}
        </div>
      </div>
    </div>
  );
}
