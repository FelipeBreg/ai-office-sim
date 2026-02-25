'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button, Input, Badge, Skeleton, Separator } from '@/components/ui';

type Provider = 'zapi' | 'twilio' | 'meta_cloud';

const PROVIDERS: { id: Provider; labelKey: string }[] = [
  { id: 'zapi', labelKey: 'zapi' },
  { id: 'twilio', labelKey: 'twilio' },
  { id: 'meta_cloud', labelKey: 'metaCloud' },
];

function StatusBadge({ status, t }: { status: string | null; t: (key: string) => string }) {
  if (!status) return null;
  const variant =
    status === 'connected' ? 'success' : status === 'pending' ? 'warning' : 'default';
  return <Badge variant={variant}>{t(status)}</Badge>;
}

export function WhatsAppPanel() {
  const t = useTranslations('settings.whatsapp');
  const utils = trpc.useUtils();

  // Queries
  const connectionQuery = trpc.whatsapp.getConnection.useQuery();
  const agentsQuery = trpc.agents.list.useQuery();

  // Mutations
  const saveMutation = trpc.whatsapp.saveConnection.useMutation({
    onSuccess: () => {
      utils.whatsapp.getConnection.invalidate();
      setFeedback({ type: 'success', message: t('saveSuccess') });
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: err.message });
    },
  });

  const verifyMutation = trpc.whatsapp.updateConnectionStatus.useMutation({
    onSuccess: () => {
      utils.whatsapp.getConnection.invalidate();
      setFeedback({ type: 'success', message: t('verifySuccess') });
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: `${t('verifyFailed')}: ${err.message}` });
    },
  });

  const disconnectMutation = trpc.whatsapp.updateConnectionStatus.useMutation({
    onSuccess: () => {
      utils.whatsapp.getConnection.invalidate();
      setFeedback({ type: 'success', message: t('disconnected') });
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: err.message });
    },
  });

  // Form state
  const [provider, setProvider] = useState<Provider>('zapi');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [handlerAgentId, setHandlerAgentId] = useState('');
  const [credentials, setCredentials] = useState({
    instanceId: '',
    token: '',
    accountSid: '',
    authToken: '',
    phoneNumberId: '',
    accessToken: '',
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Populate form from existing connection
  const connection = connectionQuery.data;
  useEffect(() => {
    if (connection) {
      setProvider(connection.provider as Provider);
      setPhoneNumber(connection.phoneNumber ?? '');
      setHandlerAgentId(connection.handlerAgentId ?? '');
    }
  }, [connection]);

  const handleSave = () => {
    setFeedback(null);
    saveMutation.mutate({
      provider,
      phoneNumber: phoneNumber || undefined,
      apiCredentials: credentials,
      handlerAgentId: handlerAgentId || undefined,
    });
  };

  const handleVerify = () => {
    setFeedback(null);
    verifyMutation.mutate({ status: 'connected' });
  };

  const handleDisconnect = () => {
    setFeedback(null);
    disconnectMutation.mutate({ status: 'disconnected' });
  };

  const isMutating = saveMutation.isPending || verifyMutation.isPending || disconnectMutation.isPending;

  // Loading state
  if (connectionQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center border border-accent-cyan bg-accent-cyan/10">
            <MessageSquare size={12} strokeWidth={1.5} className="text-accent-cyan" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-text-primary">{t('title')}</div>
            <div className="text-[9px] text-text-muted">{t('description')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connection?.phoneNumber && (
            <span className="text-[10px] text-text-secondary">{connection.phoneNumber}</span>
          )}
          <StatusBadge status={connection?.status ?? null} t={t} />
        </div>
      </div>

      <Separator />

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
              onClick={() => setProvider(p.id)}
              className={`border px-3 py-1 text-[10px] transition-colors ${
                provider === p.id
                  ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                  : 'border-border-default text-text-muted hover:border-border-hover'
              }`}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Credential fields — conditional on provider */}
      <div className="flex flex-col gap-3">
        {provider === 'zapi' && (
          <>
            <div>
              <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('instanceId')}
              </label>
              <Input
                value={credentials.instanceId}
                onChange={(e) => setCredentials((c) => ({ ...c, instanceId: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('token')}
              </label>
              <Input
                type="password"
                value={credentials.token}
                onChange={(e) => setCredentials((c) => ({ ...c, token: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
              />
            </div>
          </>
        )}

        {provider === 'twilio' && (
          <>
            <div>
              <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('accountSid')}
              </label>
              <Input
                value={credentials.accountSid}
                onChange={(e) => setCredentials((c) => ({ ...c, accountSid: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('authToken')}
              </label>
              <Input
                type="password"
                value={credentials.authToken}
                onChange={(e) => setCredentials((c) => ({ ...c, authToken: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
              />
            </div>
          </>
        )}

        {provider === 'meta_cloud' && (
          <>
            <div>
              <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('phoneNumberId')}
              </label>
              <Input
                value={credentials.phoneNumberId}
                onChange={(e) => setCredentials((c) => ({ ...c, phoneNumberId: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('accessToken')}
              </label>
              <Input
                type="password"
                value={credentials.accessToken}
                onChange={(e) => setCredentials((c) => ({ ...c, accessToken: e.target.value }))}
                placeholder={connection ? t('credentialsHint') : ''}
              />
            </div>
          </>
        )}
      </div>

      {/* Phone number */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('phoneNumber')}
        </label>
        <Input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={t('phoneNumberHint')}
        />
      </div>

      {/* Handler agent */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('handlerAgent')}
        </label>
        <select
          value={handlerAgentId}
          onChange={(e) => setHandlerAgentId(e.target.value)}
          className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none"
        >
          <option value="">{t('noAgent')}</option>
          {agentsQuery.data?.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      <Separator />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={isMutating} size="sm">
          {saveMutation.isPending ? t('saving') : t('save')}
        </Button>
        {connection && connection.status !== 'connected' && (
          <Button variant="secondary" onClick={handleVerify} disabled={isMutating} size="sm">
            {verifyMutation.isPending ? t('verifying') : t('verify')}
          </Button>
        )}
        {connection?.status === 'connected' && (
          <Button variant="danger" onClick={handleDisconnect} disabled={isMutating} size="sm">
            {t('disconnect')}
          </Button>
        )}
      </div>

      {/* Feedback message */}
      {feedback && (
        <p
          className={`text-[10px] ${
            feedback.type === 'success' ? 'text-status-success' : 'text-status-error'
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
