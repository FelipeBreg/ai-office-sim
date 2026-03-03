'use client';

import { useTranslations } from 'next-intl';
import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Download, Check, LogIn, AlertTriangle } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface InstallButtonProps {
  listingId: string;
  type: 'agent' | 'workflow';
}

export function InstallButton({ listingId, type }: InstallButtonProps) {
  const t = useTranslations('community');
  const { isSignedIn } = useUser();

  const installAgentMutation = trpc.community.installAgent.useMutation();
  const installWorkflowMutation = trpc.community.installWorkflow.useMutation();

  const mutation = type === 'agent' ? installAgentMutation : installWorkflowMutation;

  if (!isSignedIn) {
    return (
      <Link href="/sign-in">
        <Button variant="primary" size="sm">
          <LogIn size={10} strokeWidth={2} className="mr-1" />
          {t('signInToInstall')}
        </Button>
      </Link>
    );
  }

  if (mutation.isSuccess) {
    return (
      <Button variant="secondary" size="sm" disabled>
        <Check size={10} strokeWidth={2} className="mr-1" />
        {t('installed')}
      </Button>
    );
  }

  if (mutation.isError) {
    return (
      <Button variant="danger" size="sm" onClick={() => mutation.mutate({ listingId })}>
        <AlertTriangle size={10} strokeWidth={2} className="mr-1" />
        {t('installError')}
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={() => mutation.mutate({ listingId })}
      disabled={mutation.isPending}
    >
      <Download size={10} strokeWidth={2} className="mr-1" />
      {mutation.isPending ? t('installing') : t('install')}
    </Button>
  );
}
