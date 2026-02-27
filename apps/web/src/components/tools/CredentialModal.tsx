'use client';

import { useState, useEffect, useId } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LucideIcon } from 'lucide-react';

interface ToolDef {
  name: string;
  description: string;
  requiresApproval: boolean;
  credentialType?: string;
}

interface ToolCategory {
  key: string;
  icon: LucideIcon;
  credentialType?: string;
  tutorialUrl?: string;
  tools: ToolDef[];
}

type Provider = 'zapi' | 'twilio' | 'meta_cloud';

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'zapi', label: 'Z-API' },
  { id: 'twilio', label: 'Twilio' },
  { id: 'meta_cloud', label: 'Meta Cloud API' },
];

const EMPTY_CREDENTIALS = {
  instanceId: '',
  token: '',
  accountSid: '',
  authToken: '',
  phoneNumberId: '',
  accessToken: '',
};

function filterCredentials(
  provider: Provider,
  creds: Record<string, string>,
): Record<string, string> {
  switch (provider) {
    case 'zapi':
      return { instanceId: creds.instanceId ?? '', token: creds.token ?? '' };
    case 'twilio':
      return { accountSid: creds.accountSid ?? '', authToken: creds.authToken ?? '' };
    case 'meta_cloud':
      return { phoneNumberId: creds.phoneNumberId ?? '', accessToken: creds.accessToken ?? '' };
  }
}

function validateCredentials(provider: Provider, creds: Record<string, string>): boolean {
  const filtered = filterCredentials(provider, creds);
  return Object.values(filtered).every((v) => v.trim().length > 0);
}

// ── WhatsApp credential form ───────────────────────────────────────
function WhatsAppForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('settings.whatsapp');
  const tTools = useTranslations('toolsPage');
  const utils = trpc.useUtils();
  const formId = useId();

  const connectionQuery = trpc.whatsapp.getConnection.useQuery();
  const agentsQuery = trpc.agents.list.useQuery();

  const saveMutation = trpc.whatsapp.saveConnection.useMutation({
    onSuccess: () => {
      utils.whatsapp.getConnection.invalidate();
      setFeedback({ type: 'success', message: t('saveSuccess') });
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: err.message });
    },
  });

  const statusMutation = trpc.whatsapp.updateConnectionStatus.useMutation({
    onSuccess: () => {
      utils.whatsapp.getConnection.invalidate();
      setFeedback({ type: 'success', message: t('verifySuccess') });
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: `${t('verifyFailed')}: ${err.message}` });
    },
  });

  const [provider, setProvider] = useState<Provider>('zapi');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [handlerAgentId, setHandlerAgentId] = useState('');
  const [credentials, setCredentials] = useState(EMPTY_CREDENTIALS);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const connection = connectionQuery.data;

  useEffect(() => {
    if (connection) {
      if (['zapi', 'twilio', 'meta_cloud'].includes(connection.provider)) {
        setProvider(connection.provider as Provider);
      }
      setPhoneNumber(connection.phoneNumber ?? '');
      setHandlerAgentId(connection.handlerAgentId ?? '');
    }
  }, [connection]);

  useEffect(() => {
    setCredentials(EMPTY_CREDENTIALS);
  }, [provider]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const isMutating = saveMutation.isPending || statusMutation.isPending;

  const handleSave = () => {
    setFeedback(null);
    if (!validateCredentials(provider, credentials)) return;
    saveMutation.mutate({
      provider,
      phoneNumber: phoneNumber || undefined,
      apiCredentials: filterCredentials(provider, credentials),
      handlerAgentId: handlerAgentId || undefined,
    });
  };

  const handleVerify = () => {
    setFeedback(null);
    statusMutation.mutate({ status: 'connected' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Provider selector */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('provider')}
        </label>
        <div className="flex gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={isMutating}
              onClick={() => setProvider(p.id)}
              className={`border px-3 py-1 text-[10px] transition-colors ${
                provider === p.id
                  ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                  : 'border-border-default text-text-muted hover:border-border-hover'
              } disabled:pointer-events-none disabled:opacity-50`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Credential fields */}
      <div className="flex flex-col gap-3">
        {provider === 'zapi' && (
          <>
            <div>
              <label htmlFor={`${formId}-instanceId`} className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('instanceId')}
              </label>
              <Input
                id={`${formId}-instanceId`}
                value={credentials.instanceId}
                onChange={(e) => setCredentials((c) => ({ ...c, instanceId: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
                disabled={isMutating}
              />
            </div>
            <div>
              <label htmlFor={`${formId}-token`} className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('token')}
              </label>
              <Input
                id={`${formId}-token`}
                type="password"
                value={credentials.token}
                onChange={(e) => setCredentials((c) => ({ ...c, token: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
                disabled={isMutating}
              />
            </div>
          </>
        )}
        {provider === 'twilio' && (
          <>
            <div>
              <label htmlFor={`${formId}-accountSid`} className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('accountSid')}
              </label>
              <Input
                id={`${formId}-accountSid`}
                value={credentials.accountSid}
                onChange={(e) => setCredentials((c) => ({ ...c, accountSid: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
                disabled={isMutating}
              />
            </div>
            <div>
              <label htmlFor={`${formId}-authToken`} className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('authToken')}
              </label>
              <Input
                id={`${formId}-authToken`}
                type="password"
                value={credentials.authToken}
                onChange={(e) => setCredentials((c) => ({ ...c, authToken: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
                disabled={isMutating}
              />
            </div>
          </>
        )}
        {provider === 'meta_cloud' && (
          <>
            <div>
              <label htmlFor={`${formId}-phoneNumberId`} className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('phoneNumberId')}
              </label>
              <Input
                id={`${formId}-phoneNumberId`}
                value={credentials.phoneNumberId}
                onChange={(e) => setCredentials((c) => ({ ...c, phoneNumberId: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
                disabled={isMutating}
              />
            </div>
            <div>
              <label htmlFor={`${formId}-accessToken`} className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('accessToken')}
              </label>
              <Input
                id={`${formId}-accessToken`}
                type="password"
                value={credentials.accessToken}
                onChange={(e) => setCredentials((c) => ({ ...c, accessToken: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
                disabled={isMutating}
              />
            </div>
          </>
        )}
      </div>

      {/* Phone number */}
      <div>
        <label htmlFor={`${formId}-phoneNumber`} className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('phoneNumber')}
        </label>
        <Input
          id={`${formId}-phoneNumber`}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={t('phoneNumberHint')}
          disabled={isMutating}
        />
      </div>

      {/* Handler agent */}
      <div>
        <label htmlFor={`${formId}-handlerAgent`} className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('handlerAgent')}
        </label>
        <select
          id={`${formId}-handlerAgent`}
          value={handlerAgentId}
          onChange={(e) => setHandlerAgentId(e.target.value)}
          disabled={isMutating}
          className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none disabled:pointer-events-none disabled:opacity-50 [&>option]:bg-bg-base [&>option]:text-text-primary"
        >
          <option value="">{t('noAgent')}</option>
          {agentsQuery.data?.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={isMutating} size="sm">
          {saveMutation.isPending ? t('saving') : tTools('saveCredentials')}
        </Button>
        {connection && connection.status !== 'connected' && (
          <Button variant="secondary" onClick={handleVerify} disabled={isMutating} size="sm">
            {statusMutation.isPending ? t('verifying') : t('verify')}
          </Button>
        )}
      </div>

      {feedback && (
        <p className={`text-[10px] ${feedback.type === 'success' ? 'text-status-success' : 'text-status-error'}`}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}

// ── OAuth connect form ─────────────────────────────────────────────
function OAuthForm({ toolType, serviceName, onClose }: { toolType: string; serviceName: string; onClose: () => void }) {
  const tTools = useTranslations('toolsPage');
  const utils = trpc.useUtils();
  const { data: credentials } = trpc.toolCredentials.list.useQuery();

  const isConnected = credentials?.some((c) => c.toolType === toolType) ?? false;

  const authUrlMutation = trpc.toolCredentials.getAuthUrl.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
  });

  const disconnectMutation = trpc.toolCredentials.disconnect.useMutation({
    onSuccess: () => {
      utils.toolCredentials.list.invalidate();
    },
  });

  const handleConnect = () => {
    authUrlMutation.mutate({ toolType: toolType as any });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate({ toolType: toolType as any });
  };

  return (
    <div className="flex flex-col gap-4">
      {isConnected ? (
        <>
          <p className="text-[10px] text-status-success">
            {serviceName} — {tTools('connected')}
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnectMutation.isPending}
          >
            {tTools('disconnect')}
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          onClick={handleConnect}
          disabled={authUrlMutation.isPending}
        >
          {tTools('connectWith', { service: serviceName })}
        </Button>
      )}
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────
export function CredentialModal({
  category,
  onClose,
}: {
  category: ToolCategory;
  onClose: () => void;
}) {
  const t = useTranslations('toolsPage');
  const Icon = category.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md border border-border-default bg-bg-deepest p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={14} strokeWidth={1.5} className="text-accent-cyan" />
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-text-primary">
              {t(`categories.${category.key}`)} — {t('configure')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-5 w-5 items-center justify-center text-text-muted transition-colors hover:text-text-primary"
          >
            <X size={12} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body — varies by category */}
        {category.key === 'whatsapp' && (
          <WhatsAppForm onClose={onClose} />
        )}

        {category.key === 'email' && (
          <OAuthForm toolType="google_gmail" serviceName="Google (Gmail)" onClose={onClose} />
        )}

        {category.key === 'sheets' && (
          <OAuthForm toolType="google_sheets" serviceName="Google (Sheets)" onClose={onClose} />
        )}

        {category.key === 'crm' && (
          <OAuthForm toolType="rdstation_crm" serviceName="RD Station" onClose={onClose} />
        )}

        {(category.key === 'webSearch' || category.key === 'finance' || category.key === 'devops') && (
          <p className="text-[10px] text-text-muted">{t('envVarNote')}</p>
        )}
      </div>
    </div>
  );
}
