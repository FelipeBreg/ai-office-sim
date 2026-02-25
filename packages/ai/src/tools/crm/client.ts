/**
 * RD Station CRM API client.
 * Docs: https://developers.rdstation.com/
 */

const RDSTATION_CRM_BASE = 'https://plugcrm.net/api/v1';
const FETCH_TIMEOUT_MS = 15_000;

export interface RdStationContact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RdStationDeal {
  id: string;
  name: string;
  amount?: number;
  stage?: string;
  contactId?: string;
  contactName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrmClient {
  searchContacts(query: string, limit?: number): Promise<{ contacts: RdStationContact[]; error?: string }>;
  createContact(data: { name: string; email?: string; phone?: string; title?: string; company?: string; tags?: string[] }): Promise<{ contact?: RdStationContact; error?: string }>;
  updateContact(id: string, data: { name?: string; email?: string; phone?: string; title?: string; company?: string; tags?: string[] }): Promise<{ contact?: RdStationContact; error?: string }>;
  listDeals(limit?: number): Promise<{ deals: RdStationDeal[]; error?: string }>;
  createDeal(data: { name: string; amount?: number; contactId?: string }): Promise<{ deal?: RdStationDeal; error?: string }>;
}

class RdStationCrmClient implements CrmClient {
  private token: string;

  constructor(accessToken: string) {
    this.token = accessToken;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = new URL(`${RDSTATION_CRM_BASE}${path}`);
    url.searchParams.set('token', this.token);

    const res = await fetch(url.toString(), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`RD Station API error (${res.status}): ${text}`);
    }

    return res.json() as Promise<T>;
  }

  async searchContacts(query: string, limit = 20): Promise<{ contacts: RdStationContact[]; error?: string }> {
    try {
      const data = await this.request<{ contacts: Array<Record<string, unknown>> }>(
        'GET',
        `/contacts?query=${encodeURIComponent(query)}&limit=${String(limit)}`,
      );

      const contacts: RdStationContact[] = (data.contacts ?? []).map((c) => ({
        id: String(c.id ?? ''),
        name: c.name as string | undefined,
        email: c.email as string | undefined,
        phone: c.phone as string | undefined,
        title: c.title as string | undefined,
        company: c.organization as string | undefined,
        tags: c.tags as string[] | undefined,
        createdAt: c.created_at as string | undefined,
        updatedAt: c.updated_at as string | undefined,
      }));

      return { contacts };
    } catch (err) {
      return { contacts: [], error: err instanceof Error ? err.message : 'Search failed' };
    }
  }

  async createContact(data: { name: string; email?: string; phone?: string; title?: string; company?: string; tags?: string[] }): Promise<{ contact?: RdStationContact; error?: string }> {
    try {
      const payload = {
        contact: {
          name: data.name,
          emails: data.email ? [{ email: data.email }] : undefined,
          phones: data.phone ? [{ phone: data.phone }] : undefined,
          title: data.title,
          organization: data.company,
          tags: data.tags,
        },
      };

      const result = await this.request<{ contact: Record<string, unknown> }>('POST', '/contacts', payload);

      return {
        contact: {
          id: String(result.contact.id ?? ''),
          name: result.contact.name as string | undefined,
          email: data.email,
          phone: data.phone,
        },
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Create failed' };
    }
  }

  async updateContact(id: string, data: { name?: string; email?: string; phone?: string; title?: string; company?: string; tags?: string[] }): Promise<{ contact?: RdStationContact; error?: string }> {
    try {
      const payload: Record<string, unknown> = {
        contact: {
          ...(data.name && { name: data.name }),
          ...(data.email && { emails: [{ email: data.email }] }),
          ...(data.phone && { phones: [{ phone: data.phone }] }),
          ...(data.title && { title: data.title }),
          ...(data.company && { organization: data.company }),
          ...(data.tags && { tags: data.tags }),
        },
      };

      const result = await this.request<{ contact: Record<string, unknown> }>('PUT', `/contacts/${id}`, payload);

      return {
        contact: {
          id: String(result.contact.id ?? ''),
          name: result.contact.name as string | undefined,
        },
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Update failed' };
    }
  }

  async listDeals(limit = 20): Promise<{ deals: RdStationDeal[]; error?: string }> {
    try {
      const data = await this.request<{ deals: Array<Record<string, unknown>> }>(
        'GET',
        `/deals?limit=${limit}`,
      );

      const deals: RdStationDeal[] = (data.deals ?? []).map((d) => ({
        id: String(d.id ?? ''),
        name: d.name as string ?? '',
        amount: d.amount as number | undefined,
        stage: d.deal_stage as string | undefined,
        contactId: d.contact_id as string | undefined,
        contactName: d.contact_name as string | undefined,
        createdAt: d.created_at as string | undefined,
        updatedAt: d.updated_at as string | undefined,
      }));

      return { deals };
    } catch (err) {
      return { deals: [], error: err instanceof Error ? err.message : 'List failed' };
    }
  }

  async createDeal(data: { name: string; amount?: number; contactId?: string }): Promise<{ deal?: RdStationDeal; error?: string }> {
    try {
      const payload = {
        deal: {
          name: data.name,
          amount: data.amount,
          contact_id: data.contactId,
        },
      };

      const result = await this.request<{ deal: Record<string, unknown> }>('POST', '/deals', payload);

      return {
        deal: {
          id: String(result.deal.id ?? ''),
          name: result.deal.name as string ?? '',
          amount: data.amount,
          contactId: data.contactId,
        },
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Create deal failed' };
    }
  }
}

export function createCrmClient(accessToken: string): CrmClient {
  return new RdStationCrmClient(accessToken);
}
