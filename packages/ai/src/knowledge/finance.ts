/**
 * Static knowledge base for finance archetype.
 * Brazilian accounting standards, financial analysis, tax planning.
 */
export const FINANCE_KNOWLEDGE = [
  {
    title: 'Brazilian Accounting Standards (CPC / IFRS)',
    content: `## Brazilian Accounting Framework

**Regulatory Bodies:**
- CPC (Comitê de Pronunciamentos Contábeis): Issues accounting standards aligned with IFRS
- CVM (Comissão de Valores Mobiliários): Enforces for publicly-traded companies
- CFC (Conselho Federal de Contabilidade): Professional accounting body
- BACEN (Banco Central): Banking/financial institution standards (COSIF)

**Key CPC Standards:**
- CPC 00: Conceptual Framework (qualitative characteristics, elements, recognition)
- CPC 01: Impairment of Assets (recoverable value tests)
- CPC 03: Statement of Cash Flows (direct/indirect method)
- CPC 06 R2: Leases (IFRS 16 — right-of-use asset model)
- CPC 15: Business Combinations (acquisition method, goodwill)
- CPC 25: Provisions, Contingent Liabilities (probable/possible/remote)
- CPC 27: Property, Plant & Equipment (cost model or revaluation)
- CPC 47: Revenue from Contracts (IFRS 15 — 5-step model)
- CPC 48: Financial Instruments (IFRS 9 — classification, ECL model)

**Financial Statements Required (Lei 6.404/76):**
1. Balanço Patrimonial (Balance Sheet)
2. DRE — Demonstração do Resultado (Income Statement)
3. DMPL — Demonstração das Mutações do Patrimônio Líquido
4. DFC — Demonstração dos Fluxos de Caixa (Cash Flow Statement)
5. DVA — Demonstração do Valor Adicionado (for publicly-traded S.A.)
6. Notas Explicativas (Notes to Financial Statements)

**Fiscal Calendar:**
- IRPJ/CSLL: Quarterly (Mar 31, Jun 30, Sep 30, Dec 31) or annual with monthly estimates
- DCTF: Monthly declaration of federal tax debits/credits
- EFD-Contribuições: PIS/COFINS digital bookkeeping (monthly)
- ECF: Annual corporate income tax return (due July)
- ECD: Annual digital accounting bookkeeping (due May)
- DIRF: Annual withholding tax return (due February)`,
  },
  {
    title: 'Financial Analysis & KPIs',
    content: `## Core Financial Metrics

**Profitability:**
- Gross Margin = (Revenue - COGS) / Revenue × 100
- EBITDA Margin = EBITDA / Revenue × 100
- Net Margin = Net Income / Revenue × 100
- ROE = Net Income / Shareholders' Equity × 100
- ROA = Net Income / Total Assets × 100
- ROIC = NOPLAT / Invested Capital × 100

**Liquidity:**
- Current Ratio = Current Assets / Current Liabilities (healthy: >1.5)
- Quick Ratio = (Current Assets - Inventory) / Current Liabilities (healthy: >1.0)
- Cash Ratio = Cash & Equivalents / Current Liabilities

**Leverage:**
- Debt-to-Equity = Total Debt / Shareholders' Equity
- Interest Coverage = EBITDA / Interest Expense (healthy: >3x)
- Net Debt/EBITDA (healthy: <3x for most industries)

**SaaS Metrics:**
- MRR (Monthly Recurring Revenue): Sum of all active subscription fees
- ARR = MRR × 12
- Churn Rate = Lost customers / Total customers at start of period
- Net Revenue Retention = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR
- CAC (Customer Acquisition Cost) = Sales & Marketing spend / New customers
- LTV (Lifetime Value) = ARPU × Gross Margin / Churn Rate
- LTV:CAC Ratio (healthy: >3:1)
- Payback Period = CAC / (ARPU × Gross Margin) months
- Rule of 40: Revenue Growth % + EBITDA Margin % ≥ 40%

**Cash Flow Analysis:**
- Operating Cash Flow: Cash generated from core business operations
- Free Cash Flow = Operating CF - CapEx
- FCF Yield = FCF / Market Cap (or Enterprise Value)
- Burn Rate = Monthly cash decrease (for pre-profit startups)
- Runway = Cash on Hand / Monthly Burn Rate`,
  },
  {
    title: 'Brazilian Tax Planning Essentials',
    content: `## Tax Optimization Strategies

**Regime Selection (major impact on effective rate):**

| Criteria | Simples Nacional | Lucro Presumido | Lucro Real |
|----------|-----------------|-----------------|------------|
| Revenue cap | R$4.8M/yr | R$78M/yr | No limit |
| Complexity | Low | Medium | High |
| Best for | Low-margin, small | High-margin services | High-cost, low-margin |
| Effective rate | 4%–33% | ~11%–17% (services) | Varies by actual profit |

**Lucro Presumido Margins:**
- Services: 32% presumed profit → ~14.53% effective (IR + CSLL + PIS + COFINS)
- Commerce: 8% presumed profit → ~5.93% effective
- Industry: 8% presumed profit → ~5.93% effective

**Tax Credits (Lucro Real — non-cumulative):**
- PIS: 1.65% credit on qualifying inputs
- COFINS: 7.6% credit on qualifying inputs
- ICMS: Credit on purchases for resale or production inputs
- Qualifying inputs: raw materials, electricity, depreciation, rent (subject to rules)

**Transfer Pricing:**
- IN RFB 1.312/2012 (updated by Lei 14.596/2023 — OECD arm's length)
- Applies to transactions with related parties abroad
- Methods: CUP, RPM, CPM, PRL, MCL (now OECD-aligned)

**Withholding Taxes:**
- IRRF on services: 1.5% (most services between legal entities)
- PIS/COFINS/CSLL retention: 4.65% on specified services (Lei 10.833)
- ISS retention: Varies by municipality (2%–5%)
- International remittances: IRRF 15%–25% + CIDE 10% (royalties) + PIS/COFINS Import`,
  },
];
