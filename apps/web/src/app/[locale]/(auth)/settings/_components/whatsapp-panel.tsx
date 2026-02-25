'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button, Input, Badge, Skeleton, Separator } from '@/components/ui';

type Provider = 'zapi' | 'twilio' | 'meta_cloud';

const VALID_PROVIDERS: Provider[] = ['zapi', 'twilio', 'meta_cloud'];

const PROVIDERS: { id: Provider; labelKey: string }[] = [
  { id: 'zapi', labelKey: 'zapi' },
  { id: 'twilio', labelKey: 'twilio' },
  { id: 'meta_cloud', labelKey: 'metaCloud' },
];

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

function StatusBadge({ status, t }: { status: string | null; t: (key: string) => string }) {
  if (!status) return null;
  const variant =
    status === 'connected'
      ? 'success'
      : status === 'pending'
        ? 'warning'
        : status === 'disconnected'
          ? 'error'
          : 'default';
  return <Badge variant={variant}>{t(status)}</Badge>;
}

/** Filter credentials to only include fields relevant to the selected provider */
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

/** Check if required credential fields for the provider are filled */
function validateCredentials(provider: Provider, creds: Record<string, string>): boolean {
  const filtered = filterCredentials(provider, creds);
  return Object.values(filtered).every((v) => v.trim().length > 0);
}

const EMPTY_CREDENTIALS = {
  instanceId: '',
  token: '',
  accountSid: '',
  authToken: '',
  phoneNumberId: '',
  accessToken: '',
};

export function WhatsAppPanel() {
  const t = useTranslations('settings.whatsapp');
  const tCommon = useTranslations('common');
  const utils = trpc.useUtils();
  const formId = useId();

  // Queries
  const connectionQuery = trpc.whatsapp.getConnection.useQuery();
  const agentsQuery = trpc.agents.list.useQuery();

  // Single mutation for status updates (fixes duplicate useMutation race condition)
  const statusMutation = trpc.whatsapp.updateConnectionStatus.useMutation({
    onSuccess: (_data, variables) => {
      utils.whatsapp.getConnection.invalidate();
      if (variables.status === 'connected') {
        setFeedback({ type: 'success', message: t('verifySuccess') });
      } else {
        setFeedback({ type: 'success', message: t('disconnected') });
      }
    },
    onError: (err, variables) => {
      if (variables.status === 'connected') {
        setFeedback({ type: 'error', message: `${t('verifyFailed')}: ${err.message}` });
      } else {
        setFeedback({ type: 'error', message: err.message });
      }
    },
  });

  const saveMutation = trpc.whatsapp.saveConnection.useMutation({
    onSuccess: () => {
      utils.whatsapp.getConnection.invalidate();
      setCredentials(EMPTY_CREDENTIALS);
      setFeedback({ type: 'success', message: t('saveSuccess') });
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: err.message });
    },
  });

  // Form state
  const [provider, setProvider] = useState<Provider>('zapi');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [handlerAgentId, setHandlerAgentId] = useState('');
  const [credentials, setCredentials] = useState(EMPTY_CREDENTIALS);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Auto-dismiss feedback after 5 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Populate form from server data (only on first load)
  const hasHydrated = useRef(false);
  const connection = connectionQuery.data;
  useEffect(() => {
    if (connection && !hasHydrated.current) {
      hasHydrated.current = true;
      if (VALID_PROVIDERS.includes(connection.provider as Provider)) {
        setProvider(connection.provider as Provider);
      }
      setPhoneNumber(connection.phoneNumber ?? '');
      setHandlerAgentId(connection.handlerAgentId ?? '');
    }
  }, [connection]);

  // Reset credentials when switching providers
  useEffect(() => {
    setCredentials(EMPTY_CREDENTIALS);
    setValidationError(null);
  }, [provider]);

  const handleSave = () => {
    setFeedback(null);
    setValidationError(null);

    // Client-side validation
    if (!validateCredentials(provider, credentials)) {
      setValidationError(
        provider === 'zapi'
          ? `${t('instanceId')} and ${t('token')} are required`
          : provider === 'twilio'
            ? `${t('accountSid')} and ${t('authToken')} are required`
            : `${t('phoneNumberId')} and ${t('accessToken')} are required`,
      );
      return;
    }

    if (phoneNumber && !E164_REGEX.test(phoneNumber)) {
      setValidationError(`${t('phoneNumber')}: +5511999999999`);
      return;
    }

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

  const handleDisconnect = () => {
    setFeedback(null);
    statusMutation.mutate({ status: 'disconnected' });
  };

  const isMutating = saveMutation.isPending || statusMutation.isPending;

  // Loading state
  if (connectionQuery.isLoading || agentsQuery.isLoading) {
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

  // Error state
  if (connectionQuery.isError) {
    return (
      <p className="text-[10px] text-status-error">
        {tCommon('error')}
      </p>
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

      {/* Not configured hint */}
      {!connection && (
        <p className="text-[10px] text-text-muted">{t('notConfigured')}</p>
      )}

      <Separator />

      {/* Provider selector */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('provider')}
        </label>
        <div className="flex gap-2" role="radiogroup" aria-label={t('provider')}>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={provider === p.id}
              disabled={isMutating}
              onClick={() => setProvider(p.id)}
              className={`border px-3 py-1 text-[10px] transition-colors ${
                provider === p.id
                  ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                  : 'border-border-default text-text-muted hover:border-border-hover'
              } disabled:pointer-events-none disabled:opacity-50`}
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
              <label
                htmlFor={`${formId}-instanceId`}
                className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted"
              >
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
              <label
                htmlFor={`${formId}-token`}
                className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted"
              >
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
              <label
                htmlFor={`${formId}-accountSid`}
                className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted"
              >
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
              <label
                htmlFor={`${formId}-authToken`}
                className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted"
              >
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
              <label
                htmlFor={`${formId}-phoneNumberId`}
                className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted"
              >
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
              <label
                htmlFor={`${formId}-accessToken`}
                className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted"
              >
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
        <label
          htmlFor={`${formId}-phoneNumber`}
          className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted"
        >
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
        <label
          htmlFor={`${formId}-handlerAgent`}
          className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted"
        >
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

      <Separator />

      {/* Validation error */}
      {validationError && (
        <p className="text-[10px] text-status-error">{validationError}</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={isMutating} size="sm">
          {saveMutation.isPending ? t('saving') : t('save')}
        </Button>
        {connection && connection.status !== 'connected' && (
          <Button variant="secondary" onClick={handleVerify} disabled={isMutating} size="sm">
            {statusMutation.isPending && statusMutation.variables?.status === 'connected'
              ? t('verifying')
              : t('verify')}
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
