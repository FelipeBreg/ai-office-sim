/**
 * Static knowledge base for legal_research archetype.
 * Brazilian law fundamentals, contract essentials, LGPD compliance.
 */
export const LEGAL_RESEARCH_KNOWLEDGE = [
  {
    title: 'Brazilian Corporate Law Basics (Lei das S.A. & Código Civil)',
    content: `## Brazilian Corporate Law Overview

**Entity Types:**
- MEI (Microempreendedor Individual): Sole proprietor, R$81k/yr revenue cap, 1 employee max.
- ME (Microempresa): Up to R$360k/yr revenue. Simples Nacional eligible.
- EPP (Empresa de Pequeno Porte): R$360k–R$4.8M/yr revenue.
- LTDA (Sociedade Limitada): Most common. Partners liable up to capital contribution. Requires contrato social.
- S.A. (Sociedade Anônima): Open or closed. Board of directors mandatory for open S.A. Governed by Lei 6.404/76.
- EIRELI (replaced by SLU — Sociedade Limitada Unipessoal since 2021): Single-member LTDA.

**Key Registrations:**
- CNPJ (Cadastro Nacional da Pessoa Jurídica) — federal tax ID
- Inscrição Estadual — state tax registration (ICMS)
- Inscrição Municipal — municipal tax registration (ISS)
- Alvará de Funcionamento — operating license

**Labor Law (CLT — Consolidação das Leis do Trabalho):**
- Standard workweek: 44 hours (8h/day + 4h Saturday or distributed)
- 13th salary (décimo terceiro): Mandatory annual bonus paid in 2 installments
- FGTS: 8% of salary deposited monthly by employer
- Vacation: 30 days after 12 months, paid at salary + 1/3
- Notice period: 30 days + 3 days per year of service (max 90 days)
- Severance: 40% FGTS penalty on dismissal without cause

**Tax Framework:**
- Simples Nacional: Unified tax for small businesses (MEI/ME/EPP). Rates 4%–33% depending on revenue and activity.
- Lucro Presumido: Presumed profit. IR (15%) + CSLL (9%) on presumed margins.
- Lucro Real: Actual profit. Required for companies >R$78M/yr or financial institutions.
- PIS/COFINS: Federal contributions on revenue (cumulative or non-cumulative regime).
- ICMS: State value-added tax on goods and interstate transfers. Rates vary by state (7%–18%).
- ISS: Municipal tax on services. Rates 2%–5%.`,
  },
  {
    title: 'LGPD Compliance Guide (Lei Geral de Proteção de Dados)',
    content: `## LGPD — Lei 13.709/2018

**Legal Bases for Processing (Art. 7):**
1. Consent (consentimento) — explicit, informed, specific purpose
2. Legal obligation (obrigação legal)
3. Public administration (políticas públicas)
4. Research (estudos por órgão de pesquisa) — anonymized when possible
5. Contract execution (execução de contrato)
6. Exercise of rights (exercício regular de direitos)
7. Life/safety protection (proteção da vida)
8. Health protection (tutela da saúde)
9. Legitimate interest (legítimo interesse) — requires LIA (Legitimate Interest Assessment)
10. Credit protection (proteção do crédito)

**Data Subject Rights (Art. 18):**
- Confirmation of processing, access to data
- Correction of incomplete/inaccurate data
- Anonymization, blocking, or deletion of unnecessary data
- Portability to another provider
- Information about shared third parties
- Revocation of consent
- Right to file complaint with ANPD

**DPO Requirements:**
- Every controller must appoint a DPO (Encarregado)
- Contact info must be published publicly
- ANPD may simplify requirements for small businesses

**Breach Notification:**
- Report to ANPD and affected data subjects in "reasonable time"
- Must include: nature of data, affected subjects, mitigation measures, risks
- ANPD may require public disclosure

**Penalties:**
- Warning with deadline for corrective measures
- Fine: up to 2% of revenue (max R$50M per infraction)
- Daily fine until violation ceases
- Public disclosure of infraction
- Blocking or deletion of personal data
- Suspension of database or processing activity (up to 6 months)

**Key Definitions:**
- Dados pessoais: Any information related to identified/identifiable natural person
- Dados sensíveis: Racial/ethnic origin, religion, political opinion, health, sexual orientation, genetic/biometric data
- Controlador: Entity that decides on processing purposes/means
- Operador: Entity that processes on behalf of controller
- ANPD: Autoridade Nacional de Proteção de Dados (enforcement authority)`,
  },
  {
    title: 'Contract Essentials — Brazilian Law',
    content: `## Contract Fundamentals (Código Civil Arts. 421–480)

**Validity Requirements:**
- Capable parties (agentes capazes)
- Lawful, possible, and determined object (objeto lícito)
- Prescribed or non-prohibited form (forma prescrita)

**Essential Clauses:**
1. Identification of parties (CNPJ/CPF, address, legal representative)
2. Object and scope of services/goods
3. Price/compensation and payment terms
4. Duration and renewal terms
5. Termination and notice period
6. Liability and indemnification
7. Confidentiality (NDA provisions)
8. Governing law and dispute resolution (arbitration or judicial forum)

**Common Contract Types:**
- Prestação de Serviços: Service agreement. Must not characterize employment relationship.
- Contrato de Licença de Software (SaaS): Software license. Must address data processing, SLA, IP ownership.
- NDA (Acordo de Confidencialidade): Non-disclosure. Specify scope, duration, return of materials.
- Contrato Social: Corporate bylaws for LTDA. Filed with Junta Comercial.

**Force Majeure & Hardship:**
- Código Civil Art. 393: No liability for acts of God or force majeure (caso fortuito/força maior)
- Art. 478–480: Excessive onerosity (teoria da imprevisão) — party may request resolution or revision

**Digital Contracts:**
- Electronic signatures valid under MP 2.200-2/2001 and Lei 14.063/2020
- ICP-Brasil certificates provide legal presumption of validity
- Click-wrap and browse-wrap agreements enforceable if clearly presented
- Electronic documents admissible as evidence (CPC Art. 369)

**Arbitration:**
- Governed by Lei 9.307/96 (amended by Lei 13.129/2015)
- Arbitration clause is binding and separable from main contract
- Award has same force as judicial decision (no appeal on merits)
- Common chambers: CAM-CCBC, CIESP/FIESP, ICC Brazil`,
  },
];
