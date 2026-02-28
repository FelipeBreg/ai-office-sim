'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutGrid, Briefcase, DollarSign, Activity, MessageSquare, Palette } from 'lucide-react';
import { GeneralTab } from './tabs/general-tab';
import { CommercialTab } from './tabs/commercial-tab';
import { FinanceTab } from './tabs/finance-tab';
import { OperationsTab } from './tabs/operations-tab';
import { MarketingTab } from './tabs/marketing-tab';
import { BrandingTab } from './tabs/branding-tab';

const tabs = [
  { id: 'general', labelKey: 'tabGeneral', icon: LayoutGrid },
  { id: 'commercial', labelKey: 'tabCommercial', icon: Briefcase },
  { id: 'finance', labelKey: 'tabFinance', icon: DollarSign },
  { id: 'operations', labelKey: 'tabOperations', icon: Activity },
  { id: 'marketing', labelKey: 'tabMarketing', icon: MessageSquare },
  { id: 'branding', labelKey: 'tabBranding', icon: Palette },
] as const;

type Tab = (typeof tabs)[number]['id'];

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const [activeTab, setActiveTab] = useState<Tab>('general');

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-sm font-semibold uppercase tracking-widest text-text-primary">
          {t('title')}
        </h1>
        <p className="mt-0.5 text-[11px] text-text-muted">{t('subtitle')}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border-default">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[11px] uppercase tracking-wider transition-colors ${
                isActive
                  ? 'border-b-2 border-accent-cyan text-accent-cyan'
                  : 'border-b-2 border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon size={13} strokeWidth={1.5} />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'commercial' && <CommercialTab />}
        {activeTab === 'finance' && <FinanceTab />}
        {activeTab === 'operations' && <OperationsTab />}
        {activeTab === 'marketing' && <MarketingTab />}
        {activeTab === 'branding' && <BrandingTab />}
      </div>
    </div>
  );
}
