'use client';

import { useState, useRef, useCallback, useMemo, type DragEvent, type ChangeEvent } from 'react';
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
  ChevronRight,
  Database,
  Brain,
  BookOpen,
  Plus,
  FolderOpen,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button, Input, Badge, Skeleton, Separator } from '@/components/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'documents' | 'agentMemory' | 'wiki';

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

interface WikiCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
}

interface WikiArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content?: string;
  categoryId: string | null;
  tags: string[];
  authorId: string | null;
  createdAt: Date;
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Sub-components (Documents + Agent Memory)
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
// Wiki: Category tree sidebar
// ---------------------------------------------------------------------------

function CategoryTreeNode({
  category,
  categories,
  selectedCategoryId,
  onSelect,
  depth,
}: {
  category: WikiCategory;
  categories: WikiCategory[];
  selectedCategoryId: string | null;
  onSelect: (id: string | null) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const children = categories.filter((c) => c.parentId === category.id);
  const isSelected = selectedCategoryId === category.id;
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className={`flex w-full items-center gap-1 py-1 text-left text-[10px] transition-colors ${
          isSelected
            ? 'text-accent-cyan'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex shrink-0 items-center justify-center"
          >
            <ChevronRight
              size={10}
              strokeWidth={1.5}
              className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span className="w-[10px]" />
        )}
        <button
          type="button"
          onClick={() => onSelect(isSelected ? null : category.id)}
          className="flex items-center gap-1 text-left"
        >
          <FolderOpen size={10} strokeWidth={1.5} className="shrink-0" />
          <span className={depth === 0 ? 'font-semibold' : ''}>{category.name}</span>
        </button>
      </div>
      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wiki: New category form
// ---------------------------------------------------------------------------

function NewCategoryForm({
  categories,
  onCreated,
  onCancel,
}: {
  categories: WikiCategory[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const tw = useTranslations('wiki');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);

  const createMutation = trpc.wiki.createCategory.useMutation({
    onSuccess: () => {
      onCreated();
    },
  });

  // For parent dropdown, only show root + level-1 (not level-2) to enforce 3-level max
  const parentOptions = categories.filter((c) => {
    if (!c.parentId) return true; // root
    const parent = categories.find((p) => p.id === c.parentId);
    if (parent && !parent.parentId) return true; // level-1
    return false;
  });

  const handleNameChange = (value: string) => {
    setName(value);
    if (autoSlug) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !slug.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      parentId: parentId || undefined,
    });
  };

  return (
    <div className="border border-border-default bg-bg-raised p-3">
      <div className="mb-2 text-[8px] uppercase tracking-[0.15em] text-text-muted">
        {tw('newCategory')}
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <label className="mb-0.5 block text-[9px] text-text-muted">{tw('categoryName')}</label>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={tw('categoryName')}
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[9px] text-text-muted">{tw('categorySlug')}</label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAutoSlug(false);
            }}
            placeholder={tw('categorySlug')}
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[9px] text-text-muted">{tw('categoryDescription')}</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={tw('categoryDescription')}
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[9px] text-text-muted">{tw('categoryParent')}</label>
          <div className="relative">
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full appearance-none border border-border-default bg-bg-base px-2.5 py-1.5 pr-8 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base [&>option]:text-text-primary"
            >
              <option value="">{tw('categoryNoParent')}</option>
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parentId ? `  -- ${cat.name}` : cat.name}
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
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !name.trim() || !slug.trim()}
            size="md"
          >
            {createMutation.isPending ? tw('creating') : tw('newCategory')}
          </Button>
          <Button variant="ghost" size="md" onClick={onCancel}>
            <X size={12} strokeWidth={1.5} />
          </Button>
        </div>
        {createMutation.isError && (
          <p className="text-[10px] text-status-error">{tw('createError')}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wiki: New article form
// ---------------------------------------------------------------------------

function NewArticleForm({
  categories,
  selectedCategoryId,
  onCreated,
  onCancel,
}: {
  categories: WikiCategory[];
  selectedCategoryId: string | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const tw = useTranslations('wiki');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(selectedCategoryId ?? '');
  const [tagsInput, setTagsInput] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);

  const createMutation = trpc.wiki.createArticle.useMutation({
    onSuccess: () => {
      onCreated();
    },
  });

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (autoSlug) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !slug.trim() || !content.trim()) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    createMutation.mutate({
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim() || undefined,
      content: content.trim(),
      categoryId: categoryId || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  return (
    <div className="border border-border-default bg-bg-raised p-3">
      <div className="mb-2 text-[8px] uppercase tracking-[0.15em] text-text-muted">
        {tw('newArticle')}
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <label className="mb-0.5 block text-[9px] text-text-muted">{tw('articleTitle')}</label>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={tw('articleTitle')}
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[9px] text-text-muted">{tw('articleSlug')}</label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAutoSlug(false);
            }}
            placeholder={tw('articleSlug')}
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[9px] text-text-muted">{tw('articleCategory')}</label>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full appearance-none border border-border-default bg-bg-base px-2.5 py-1.5 pr-8 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base [&>option]:text-text-primary"
            >
              <option value="">{tw('noneCategory')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parentId ? `  -- ${cat.name}` : cat.name}
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
        <div>
          <label className="mb-0.5 block text-[9px] text-text-muted">{tw('articleSummary')}</label>
          <Input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={tw('articleSummary')}
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[9px] text-text-muted">{tw('articleContent')}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder={tw('articleContent')}
            className="w-full border border-border-default bg-bg-deepest px-2.5 py-1.5 font-mono text-[10px] text-text-primary transition-colors focus:border-accent-cyan focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[9px] text-text-muted">
            {tw('articleTags')}
            <span className="ml-1 text-text-muted">({tw('articleTagsHint')})</span>
          </label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="tag1, tag2, tag3"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !title.trim() || !slug.trim() || !content.trim()}
            size="md"
          >
            {createMutation.isPending ? tw('creating') : tw('newArticle')}
          </Button>
          <Button variant="ghost" size="md" onClick={onCancel}>
            <X size={12} strokeWidth={1.5} />
          </Button>
        </div>
        {createMutation.isError && (
          <p className="text-[10px] text-status-error">{tw('createError')}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wiki: Article detail view
// ---------------------------------------------------------------------------

function ArticleDetail({
  articleId,
  onBack,
  onDeleted,
}: {
  articleId: string;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const tw = useTranslations('wiki');
  const tCommon = useTranslations('common');

  const articleQuery = trpc.wiki.getArticle.useQuery({ id: articleId });
  const deleteMutation = trpc.wiki.deleteArticle.useMutation({
    onSuccess: () => {
      onDeleted();
    },
  });
  const aiEnhanceMutation = trpc.wiki.aiEnhance.useMutation({
    onSuccess: () => {
      articleQuery.refetch();
    },
  });

  const article = articleQuery.data as (WikiArticle & { templateKey?: string | null }) | undefined;

  if (articleQuery.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (articleQuery.isError || !article) {
    return <p className="text-[10px] text-status-error">{tCommon('error')}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[10px] text-text-muted transition-colors hover:text-accent-cyan"
      >
        <ArrowLeft size={10} strokeWidth={1.5} />
        {tw('backToList')}
      </button>

      {/* Article header */}
      <div className="border border-border-default bg-bg-base p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold text-text-primary">{article.title}</h2>
            {article.summary && (
              <p className="mt-1 text-[10px] leading-relaxed text-text-secondary">{article.summary}</p>
            )}
            <div className="mt-2 flex items-center gap-3 text-[9px] text-text-muted">
              <span>{tw('lastUpdated')}: {formatDate(article.updatedAt)}</span>
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    <Tag size={7} strokeWidth={1.5} className="mr-0.5" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {article.templateKey && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => aiEnhanceMutation.mutate({ id: article.id })}
                disabled={aiEnhanceMutation.isPending}
              >
                <Bot size={12} strokeWidth={1.5} className="mr-1" />
                <span className="text-[9px]">
                  {aiEnhanceMutation.isPending ? tw('enhancing') : tw('aiEnhance')}
                </span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm(tw('confirmDeleteArticle'))) {
                  deleteMutation.mutate({ id: article.id });
                }
              }}
              disabled={deleteMutation.isPending}
              aria-label={tw('deleteArticle')}
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>

      {/* Article content */}
      <div className="border border-border-default bg-bg-base p-4">
        <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-text-secondary">
          {article.content}
        </pre>
      </div>

      {deleteMutation.isError && (
        <p className="text-[10px] text-status-error">{tw('deleteError')}</p>
      )}
      {aiEnhanceMutation.isError && (
        <p className="text-[10px] text-status-error">{tw('enhanceError')}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wiki: Article card
// ---------------------------------------------------------------------------

function ArticleCard({
  article,
  categoryName,
  onClick,
}: {
  article: WikiArticle;
  categoryName: string | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full border border-border-default bg-bg-base p-3 text-left transition-colors hover:border-accent-cyan/30"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-medium text-text-primary">{article.title}</div>
          {article.summary && (
            <p className="mt-0.5 line-clamp-2 text-[9px] leading-relaxed text-text-secondary">
              {article.summary}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {categoryName && (
              <span className="text-[8px] text-accent-cyan">{categoryName}</span>
            )}
            {article.tags && article.tags.length > 0 && (
              <div className="flex gap-1">
                {article.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))}
                {article.tags.length > 3 && (
                  <span className="text-[8px] text-text-muted">+{article.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <span className="ml-2 shrink-0 text-[8px] text-text-muted">
          {formatDate(article.updatedAt)}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tab: Company Wiki
// ---------------------------------------------------------------------------

function CompanyWikiTab() {
  const tw = useTranslations('wiki');
  const tCommon = useTranslations('common');

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [viewingArticleId, setViewingArticleId] = useState<string | null>(null);

  const categoriesQuery = trpc.wiki.listCategories.useQuery(undefined, { retry: false });
  const articlesQuery = trpc.wiki.listArticles.useQuery(
    {
      categoryId: selectedCategoryId ?? undefined,
      search: searchQuery.trim() || undefined,
    },
    { retry: false },
  );

  const deleteCategoryMutation = trpc.wiki.deleteCategory.useMutation({
    onSuccess: () => {
      categoriesQuery.refetch();
      setSelectedCategoryId(null);
    },
  });

  const seedBlueprintsMutation = trpc.wiki.seedBlueprints.useMutation({
    onSuccess: () => {
      categoriesQuery.refetch();
      articlesQuery.refetch();
    },
  });

  const categories = (categoriesQuery.data ?? []) as (WikiCategory & { isBlueprint?: boolean })[];
  const articles = (articlesQuery.data ?? []) as WikiArticle[];

  const hasBlueprintCategory = categories.some((c) => (c as any).isBlueprint);

  // Build category tree: root categories (no parent)
  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  // Category name lookup
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // If viewing an article detail, show that instead
  if (viewingArticleId) {
    return (
      <ArticleDetail
        articleId={viewingArticleId}
        onBack={() => setViewingArticleId(null)}
        onDeleted={() => {
          setViewingArticleId(null);
          articlesQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Blueprint banner */}
      {!hasBlueprintCategory && !categoriesQuery.isLoading && (
        <div className="flex items-center justify-between border border-accent-cyan/30 bg-accent-cyan/5 px-4 py-3">
          <div>
            <p className="text-[11px] font-medium text-accent-cyan">{tw('blueprintBanner')}</p>
            <p className="text-[9px] text-text-muted">{tw('blueprintBannerDesc')}</p>
          </div>
          <Button
            size="sm"
            onClick={() => seedBlueprintsMutation.mutate()}
            disabled={seedBlueprintsMutation.isPending}
          >
            {seedBlueprintsMutation.isPending ? tw('creating') : tw('createBlueprints')}
          </Button>
        </div>
      )}

      <div className="flex gap-4">
      {/* Left sidebar: Category tree */}
      <div className="w-52 shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {tw('categories')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewCategory(!showNewCategory)}
            aria-label={tw('newCategory')}
          >
            <Plus size={10} strokeWidth={1.5} />
          </Button>
        </div>

        {/* "All" option */}
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`mb-1 flex w-full items-center gap-1.5 py-1 text-left text-[10px] transition-colors ${
            selectedCategoryId === null
              ? 'text-accent-cyan'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <BookOpen size={10} strokeWidth={1.5} />
          <span className="font-semibold">{tw('allCategories')}</span>
        </button>

        <Separator />

        {/* Category tree */}
        {categoriesQuery.isLoading && (
          <div className="mt-2 flex flex-col gap-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}

        {!categoriesQuery.isLoading && rootCategories.length === 0 && (
          <p className="mt-2 text-[9px] text-text-muted">{tw('noCategories')}</p>
        )}

        <div className="mt-1 flex flex-col">
          {rootCategories.map((cat) => (
            <CategoryTreeNode
              key={cat.id}
              category={cat}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              depth={0}
            />
          ))}
        </div>

        {/* Delete selected category */}
        {selectedCategoryId && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm(tw('confirmDeleteCategory'))) {
                  deleteCategoryMutation.mutate({ id: selectedCategoryId });
                }
              }}
              disabled={deleteCategoryMutation.isPending}
            >
              <Trash2 size={10} strokeWidth={1.5} className="mr-1" />
              <span className="text-[9px]">{tCommon('delete')}</span>
            </Button>
          </div>
        )}

        {/* New category form */}
        {showNewCategory && (
          <div className="mt-3">
            <NewCategoryForm
              categories={categories}
              onCreated={() => {
                setShowNewCategory(false);
                categoriesQuery.refetch();
              }}
              onCancel={() => setShowNewCategory(false)}
            />
          </div>
        )}
      </div>

      {/* Right content: Articles */}
      <div className="min-w-0 flex-1">
        {/* Search + New Article bar */}
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={12}
              strokeWidth={1.5}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tw('searchPlaceholder')}
              className="w-full border border-border-default bg-bg-base py-1.5 pl-7 pr-2.5 text-[10px] text-text-primary transition-colors focus:border-accent-cyan focus:outline-none"
            />
          </div>
          <Button
            size="md"
            onClick={() => setShowNewArticle(!showNewArticle)}
          >
            <Plus size={12} strokeWidth={1.5} className="mr-1" />
            {tw('newArticle')}
          </Button>
        </div>

        {/* New article form */}
        {showNewArticle && (
          <div className="mb-3">
            <NewArticleForm
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCreated={() => {
                setShowNewArticle(false);
                articlesQuery.refetch();
              }}
              onCancel={() => setShowNewArticle(false)}
            />
          </div>
        )}

        {/* Article count */}
        <div className="mb-2 text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {tw('articles')} {articles.length > 0 && `(${articles.length})`}
        </div>

        {/* Loading */}
        {articlesQuery.isLoading && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {/* Error */}
        {articlesQuery.isError && (
          <p className="text-[10px] text-status-error">{tCommon('error')}</p>
        )}

        {/* Empty */}
        {!articlesQuery.isLoading && articles.length === 0 && !articlesQuery.isError && (
          <div className="flex flex-col items-center justify-center py-12">
            <BookOpen size={24} strokeWidth={1} className="text-text-muted" />
            <p className="mt-2 text-[10px] text-text-muted">{tw('noArticles')}</p>
          </div>
        )}

        {/* Article list */}
        {articles.length > 0 && (
          <div className="flex flex-col gap-1">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                categoryName={article.categoryId ? (categoryNameMap.get(article.categoryId) ?? null) : null}
                onClick={() => setViewingArticleId(article.id)}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs config
// ---------------------------------------------------------------------------

const TABS: { id: Tab; labelKey: string; icon: typeof Database }[] = [
  { id: 'documents', labelKey: 'tabDocuments', icon: Database },
  { id: 'agentMemory', labelKey: 'tabAgentMemory', icon: Brain },
  { id: 'wiki', labelKey: 'tabWiki', icon: BookOpen },
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
        <div className={activeTab === 'wiki' ? 'mx-auto max-w-4xl' : 'mx-auto max-w-2xl'}>
          {activeTab === 'documents' && <CompanyDocumentsTab />}
          {activeTab === 'agentMemory' && <AgentMemoryTab />}
          {activeTab === 'wiki' && <CompanyWikiTab />}
        </div>
      </div>
    </div>
  );
}
