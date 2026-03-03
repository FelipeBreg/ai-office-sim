/**
 * Static knowledge base for sales archetype.
 * CRM methodology, sales processes, pipeline management.
 */
export const SALES_KNOWLEDGE = [
  {
    title: 'Sales Pipeline & CRM Methodology',
    content: `## Sales Pipeline Framework

**Standard Pipeline Stages:**
1. **Prospecting** — Identify potential customers via outbound (cold calls, email, LinkedIn) or inbound (marketing leads)
2. **Qualification** — BANT framework: Budget, Authority, Need, Timeline. Disqualify early to save resources.
3. **Discovery** — Deep-dive meeting. Map pain points, decision process, stakeholders, current solutions.
4. **Proposal** — Tailored solution presentation. Address specific pain points. Include ROI projections.
5. **Negotiation** — Handle objections, discuss terms, pricing, SLA. Use anchoring and concession strategies.
6. **Closed Won / Lost** — Document outcome and reasons. Win: smooth handoff to onboarding. Loss: capture feedback.

**Lead Scoring Model:**
- Demographic fit (industry, company size, role): 0–30 points
- Behavioral signals (website visits, content downloads, email engagement): 0–40 points
- Engagement recency (last 7 days: +20, 30 days: +10, >60 days: -10)
- MQL threshold: 50 points → Sales follow-up
- SQL threshold: 70 points → Active opportunity

**Activity Metrics:**
- Calls per day target: 40–60 (SDR), 15–25 (AE)
- Emails per day: 50–100 (SDR), 20–40 (AE)
- Meetings per week: 8–15 (SDR booked), 10–20 (AE conducted)
- Pipeline coverage: 3x quota minimum
- Average deal cycle: Track by segment (SMB: 14–30 days, Mid: 30–60, Enterprise: 60–180)

**CRM Hygiene:**
- Update deal stage within 24h of status change
- Log all customer interactions (calls, emails, meetings)
- Set next action + date on every open deal
- Monthly pipeline review: remove stale deals (>2x avg cycle with no activity)
- Forecast categories: Commit (>90%), Best Case (60–90%), Pipeline (30–60%), Upside (<30%)`,
  },
  {
    title: 'Objection Handling & Closing Techniques',
    content: `## Common Objection Patterns

**Price Objections:**
- "Too expensive" → Reframe to ROI: "Based on your [metric], the payback period is [X] months"
- "Competitor is cheaper" → Differentiate on value, TCO, support: "When you factor in [feature/support], the total cost is..."
- "No budget" → Explore timeline: "When does your next budget cycle start?" or offer phased rollout

**Timing Objections:**
- "Not right now" → Create urgency with business impact: "Every month of delay costs you approximately [X] in [metric]"
- "Need to think about it" → Identify the real concern: "What specific aspect would you like to evaluate further?"
- "We're mid-contract" → Plan ahead: "Let's schedule a review 60 days before renewal"

**Authority Objections:**
- "Need to check with my boss" → Enable champion: "What information would help them decide? Can I prepare a brief?"
- "Committee decision" → Map stakeholders: "Who else is involved? Can we present to the group?"

**Closing Techniques:**
- Assumptive Close: "Shall we start with the Growth plan?"
- Summary Close: Recap agreed benefits, confirm value, ask for commitment
- Alternative Close: "Would you prefer monthly or annual billing?"
- Urgency Close: Time-limited offer or capacity constraint (use authentically)
- Trial Close: "If we can address [concern], would you be ready to move forward?"

**Post-Sale:**
- Handoff meeting with Customer Success within 48h
- Welcome email with onboarding timeline
- First check-in call at 7 days, 30 days, 90 days
- NPS survey at 30 and 90 days
- Expansion opportunity review at 6 months`,
  },
  {
    title: 'Brazilian Sales Specifics',
    content: `## Selling in Brazil — Key Considerations

**Nota Fiscal (Invoice Requirements):**
- NF-e (Nota Fiscal Eletrônica): Required for product sales. XML format, SEFAZ validation.
- NFS-e (Nota Fiscal de Serviços Eletrônica): Required for services. Municipal system varies by city.
- Must include: CNPJ of both parties, description, quantity, unit price, taxes (ICMS, IPI, PIS, COFINS, ISS)
- Issue before or at time of delivery/service completion

**Payment Methods (B2B):**
- Boleto bancário: Most common. 1–3 day clearing. Low cost. Can be protested for collection.
- PIX: Instant. Zero cost between companies. Growing rapidly for B2B.
- Transferência bancária (TED/DOC): Same-day or next-day. Small fee.
- Cartão de crédito: Less common B2B. Higher fees (2–5%). Useful for SaaS subscriptions.
- Parcelamento: Installment plans very common. 3x, 6x, 12x. Factor into pricing/cash flow.

**Sales Tax Complexity:**
- ICMS varies by state and product (7%–18%)
- ICMS-ST (substituição tributária): Tax collected upfront by manufacturer for entire chain
- Interstate ICMS: Differential rate (DIFAL) for end-consumer sales across states
- ISS for services: Municipal tax, rate varies by city (2%–5%)

**Cultural Notes:**
- Relationship-first: Invest in rapport before business discussion
- WhatsApp is primary business communication channel
- Decision cycles can be longer — multiple stakeholder approval layers
- In-person meetings still valued for large deals
- "Jeitinho brasileiro" — flexibility and creative problem-solving are expected`,
  },
];
