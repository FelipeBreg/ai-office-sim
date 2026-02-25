import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { agentArchetypeEnum, triggerTypeEnum } from './enums.js';

/** Predefined agent archetype templates */
export const agentArchetypes = pgTable(
  'agent_archetypes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    archetype: agentArchetypeEnum('archetype').notNull(),
    nameEn: text('name_en').notNull(),
    namePtBr: text('name_pt_br').notNull(),
    descriptionEn: text('description_en').notNull(),
    descriptionPtBr: text('description_pt_br').notNull(),
    defaultSystemPromptEn: text('default_system_prompt_en').notNull(),
    defaultSystemPromptPtBr: text('default_system_prompt_pt_br').notNull(),
    defaultTools: text('default_tools').array().notNull(),
    defaultTriggerType: triggerTypeEnum('default_trigger_type').notNull().default('manual'),
    icon: text('icon').notNull().default('bot'),
    category: text('category').notNull().default('general'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('archetype_type_idx').on(table.archetype),
  ],
);
