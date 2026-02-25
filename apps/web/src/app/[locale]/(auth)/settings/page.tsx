'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Users, Puzzle } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';
import { WhatsAppPanel } from './_components/whatsapp-panel';

const tabs = [
  { id: 'general', labelKey: 'general', icon: Building2 },
  { id: 'team', labelKey: 'team', icon: Users },
  { id: 'integrations', labelKey: 'integrations', icon: Puzzle },
] as const;

type Tab = (typeof tabs)[number]['id'];

export default function SettingsPage() {
  const t = useTranslations('settings');
  const [activeTab, setActiveTab] = useState<Tab>('integrations');

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="border-b border-border-default px-4 py-3">
        <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('title')}
        </h1>
        <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tab sidebar */}
        <div className="flex w-44 shrink-0 flex-col border-r border-border-default py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-l-2 px-4 py-2 text-left text-[10px] transition-colors ${
                  isActive
                    ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon size={12} strokeWidth={1.5} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-lg">
            {activeTab === 'general' && <ComingSoon titleKey="general" namespace="settings" />}
            {activeTab === 'team' && <ComingSoon titleKey="team" namespace="settings" />}
            {activeTab === 'integrations' && <WhatsAppPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
