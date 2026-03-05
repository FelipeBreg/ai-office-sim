/**
 * Smart Onboarding types — used across API, worker, and frontend.
 */

export interface CompanyProfile {
  description: string;
  products: string[];
  targetAudience: string;
  brandVoice: string;
  channels: string[];
  teamSize: string;
  techStack: string[];
  competitors: string[];
  contentThemes: string[];
}

export interface OnboardingCompanyInput {
  companyName: string;
  sector: string;
  companySize: '1-10' | '11-50' | '51-200' | '200+';
  websiteUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  xUrl?: string;
  tiktokUrl?: string;
  language: 'pt-BR' | 'en-US';
}

export interface OnboardingStrategyInput {
  primaryGoal: string;
  kpis: Array<{ name: string; target: number; unit: string }>;
  timelineMonths: 3 | 6 | 12;
}

export interface FleetRecommendation {
  teams: Array<{
    name: string;
    slug: string;
    description: string;
  }>;
  agents: Array<{
    name: string;
    namePtBr: string;
    slug: string;
    archetype: string;
    team: string;
    tools: string[];
    triggerType: string;
    heartbeatIntervalMin?: number;
    enabled: boolean;
  }>;
  approvalMode: 'manual' | 'supervised' | 'autonomous';
  estimatedMonthlyCostUsd: number;
}

export interface ScrapeResult {
  url: string;
  success: boolean;
  title?: string;
  description?: string;
  textContent?: string;
  error?: string;
}

export type OnboardingStep = 'company' | 'scraping' | 'strategy' | 'fleet' | 'deploy';
