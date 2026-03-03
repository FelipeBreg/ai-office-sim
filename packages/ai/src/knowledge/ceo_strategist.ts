/**
 * Static knowledge base for ceo_strategist archetype.
 * Strategic management, OKRs, organizational leadership.
 */
export const CEO_STRATEGIST_KNOWLEDGE = [
  {
    title: 'Strategic Planning & OKR Framework',
    content: `## Strategic Planning Process

**Vision → Strategy → Execution Flow:**
1. **Vision** (3–5 year): Where we want to be. Qualitative, aspirational.
2. **Mission**: Why we exist. Core purpose and value delivered.
3. **Strategic Pillars** (annual): 3–5 key themes that drive toward vision.
4. **OKRs** (quarterly): Objectives + Key Results per pillar.
5. **Initiatives** (weekly/monthly): Projects and tasks that move key results.

**OKR Best Practices:**
- 3–5 Objectives per team per quarter (qualitative, inspirational)
- 2–4 Key Results per Objective (quantitative, measurable, time-bound)
- Scoring: 0.0–1.0 scale. Target 0.6–0.7 average (ambitious but achievable)
- Cadence: Set quarterly, review weekly, score at quarter-end
- Cascade: Company OKRs → Department OKRs → Individual OKRs (aligned, not cascaded)

**Example OKR:**
- Objective: Become the market leader in AI-powered office automation
  - KR1: Achieve $500K ARR by Q4 (currently $180K)
  - KR2: Reach 90% customer NPS score (currently 72)
  - KR3: Launch 3 enterprise partnerships
  - KR4: Reduce churn to <3% monthly (currently 5.2%)

**Strategy Frameworks:**
- **Porter's Five Forces**: Industry competition analysis
- **SWOT**: Internal strengths/weaknesses + external opportunities/threats
- **Blue Ocean Strategy**: Create uncontested market space (value innovation)
- **Jobs to Be Done**: Understand what customers hire your product to do
- **Wardley Mapping**: Visualize value chain and component evolution`,
  },
  {
    title: 'Organizational Leadership & Decision-Making',
    content: `## Leadership Frameworks

**Decision-Making Models:**
- **RAPID**: Recommend, Agree, Perform, Input, Decide — clarifies decision roles
- **DACI**: Driver, Approver, Contributor, Informed — lighter version of RAPID
- **Eisenhower Matrix**: Urgent/Important quadrants for prioritization
- **Reversible vs Irreversible**: Type 1 (irreversible, deliberate) vs Type 2 (reversible, fast)
- **CEO Rule**: Only escalate to CEO decisions that are Type 1 AND cross-functional

**Meeting Cadence:**
- Daily standup (15 min): Blockers, progress, priorities
- Weekly leadership sync (60 min): Metrics review, decisions, alignment
- Monthly all-hands (30 min): Company updates, wins, strategic direction
- Quarterly OKR review (2–4 hours): Score previous, set new, resource allocation
- Annual strategy offsite (1–2 days): Vision refresh, market analysis, annual plan

**Communication Principles:**
- Radical transparency: Share financials, metrics, challenges with the team
- Written culture: Major decisions documented with context, alternatives, rationale
- Disagree and commit: Debate vigorously, then execute with full commitment
- No-meeting blocks: Protect 4+ hour blocks for deep work (engineers, creators)

**Hiring & Team Structure:**
- A-players hire A-players (involve top performers in hiring)
- Span of control: 5–8 direct reports per manager optimal
- Two-pizza teams: Autonomous units that can be fed with two pizzas (6–10 people)
- Skill vs Will matrix: High skill + high will = delegate; High will + low skill = coach

**Performance Management:**
- Continuous feedback > annual reviews
- 360-degree feedback quarterly for leadership
- Clear career ladders with expectations per level
- Performance improvement plan: 30/60/90 day structure with specific, measurable goals`,
  },
  {
    title: 'Fleet Management — AI Agent Orchestration',
    content: `## AI Agent Fleet Best Practices

**Agent Lifecycle:**
1. **Deploy**: Define role, archetype, tools, system prompt
2. **Configure**: Set heartbeat interval, budget, approval thresholds
3. **Monitor**: Watch execution logs, cost trends, error rates
4. **Optimize**: Adjust prompts, tools, intervals based on performance
5. **Scale/Retire**: Expand successful patterns, sunset underperforming agents

**Budget Management:**
- Set daily spend limits per project (prevent runaway costs)
- Monitor cost-per-action trends (rising costs may indicate prompt degradation)
- Use Haiku for routine tasks, Sonnet for standard, Opus for complex/strategic only
- Review agent cost reports weekly and adjust model selection

**Orchestration Patterns:**
- **Hub and Spoke**: CEO agent coordinates, specialist agents execute
- **Pipeline**: Sequential agent chain (research → analyze → write → review)
- **Parallel**: Multiple agents work simultaneously on independent tasks
- **Escalation**: Lower-tier agent escalates to higher-tier when confidence is low

**Health Indicators:**
- Agent error rate >5%: Investigate prompts, tools, or data quality
- Stalled agents (>15 min): Likely API timeout or infinite loop — auto-recovery kicks in
- Approval queue growing: Either threshold too low or agents making risky decisions
- Budget consumption rate: Track daily burn vs. projected monthly limit

**Optimization Techniques:**
- Review session summaries weekly for prompt improvement opportunities
- Consolidate agents with overlapping responsibilities
- Use heartbeat instructions to guide proactive behavior without manual triggers
- Enable KPI triggers for reactive agent activation (reduce unnecessary polling)
- Set appropriate max_actions_per_session to prevent runaway executions`,
  },
];
