/**
 * Static knowledge base — curated domain expertise per agent archetype.
 * Used by RAG search to provide agents with baseline domain knowledge.
 */
import { LEGAL_RESEARCH_KNOWLEDGE } from './legal_research.js';
import { FINANCE_KNOWLEDGE } from './finance.js';
import { SALES_KNOWLEDGE } from './sales.js';
import { MARKETING_KNOWLEDGE } from './marketing.js';
import { CEO_STRATEGIST_KNOWLEDGE } from './ceo_strategist.js';

export interface StaticKnowledgeDoc {
  title: string;
  content: string;
}

const ARCHETYPE_KNOWLEDGE: Record<string, StaticKnowledgeDoc[]> = {
  legal_research: LEGAL_RESEARCH_KNOWLEDGE,
  finance: FINANCE_KNOWLEDGE,
  sales: SALES_KNOWLEDGE,
  marketing: MARKETING_KNOWLEDGE,
  ceo_strategist: CEO_STRATEGIST_KNOWLEDGE,
};

/**
 * Get all static knowledge documents for a given archetype slug.
 * Returns empty array if no knowledge base exists for the archetype.
 */
export function getArchetypeKnowledge(archetypeSlug: string): StaticKnowledgeDoc[] {
  return ARCHETYPE_KNOWLEDGE[archetypeSlug] ?? [];
}

/**
 * Get all archetype slugs that have knowledge bases available.
 */
export function getKnowledgeArchetypes(): string[] {
  return Object.keys(ARCHETYPE_KNOWLEDGE);
}
