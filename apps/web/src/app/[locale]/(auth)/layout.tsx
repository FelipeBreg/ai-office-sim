import { AppShell } from '@/components/layout/app-shell';
import { FeedbackWidget } from '@/components/feedback-widget';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <FeedbackWidget />
    </AppShell>
  );
}
