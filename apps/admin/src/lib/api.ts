const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function parseApiError(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const record = body as Record<string, unknown>;
  const message = record.message;

  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.map(String).join(', ');
  if (message && typeof message === 'object' && 'message' in message) {
    const nested = (message as { message?: unknown }).message;
    if (typeof nested === 'string') return nested;
    if (Array.isArray(nested)) return nested.map(String).join(', ');
  }

  return fallback;
}

export function apiUrl(path: string) {
  return `${API_URL}/v1${path}`;
}

async function fetchApi<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...init,
      headers,
      credentials: init.credentials ?? (init.method && init.method !== 'GET' ? 'include' : 'same-origin'),
    });
  } catch {
    throw new Error('API bağlantısı kurulamadı');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(parseApiError(err, res.statusText || 'API hatası'));
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (data: unknown) =>
    fetchApi<{
      accessToken: string;
      requires2fa?: boolean;
      tempToken?: string;
      user: { email: string; roles: string[] };
    }>('/auth/login', { method: 'POST', body: JSON.stringify(data), credentials: 'include' }),

  verify2fa: (data: unknown) =>
    fetchApi<{ accessToken: string; user: { email: string; roles: string[] } }>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include',
    }),

  me: (token: string) =>
    fetchApi<{ id: string; email: string; roles: string[] }>('/auth/me', { token }),

  analytics: (token: string) => fetchApi<AdminAnalytics>('/admin/analytics', { token }),

  moderationQueue: (token: string, params?: { limit?: string; offset?: string }) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi<{ items: ModerationListing[]; total: number }>(
      `/moderation/queue${qs ? `?${qs}` : ''}`,
      { token },
    );
  },

  approveListing: (token: string, id: string) =>
    fetchApi(`/moderation/${id}/approve`, { method: 'POST', token }),

  rejectListing: (token: string, id: string, reason: string) =>
    fetchApi(`/moderation/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      token,
    }),

  listUsers: (token: string, params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi<{ items: AdminUser[]; total: number; page: number; totalPages: number }>(
      `/admin/users?${qs}`,
      { token },
    );
  },

  getUser: (token: string, id: string) => fetchApi<AdminUserDetail>(`/admin/users/${id}`, { token }),

  updateUserRoles: (token: string, id: string, data: unknown) =>
    fetchApi(`/admin/users/${id}/roles`, { method: 'PATCH', body: JSON.stringify(data), token }),

  suspendUser: (token: string, id: string, justification: string) =>
    fetchApi(`/admin/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ justification }),
      token,
    }),

  listTickets: (token: string, params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi<{ items: Ticket[]; total: number; page: number; totalPages: number }>(
      `/tickets?${qs}`,
      { token },
    );
  },

  updateTicket: (token: string, id: string, data: unknown) =>
    fetchApi(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),

  listFeatureFlags: (token: string) => fetchApi<FeatureFlag[]>('/admin/feature-flags', { token }),

  updateFeatureFlag: (token: string, key: string, data: unknown) =>
    fetchApi(`/admin/feature-flags/${key}`, { method: 'PATCH', body: JSON.stringify(data), token }),

  auditLog: (token: string) =>
    fetchApi<{ items: AuditEntry[]; total: number }>('/admin/audit-log', { token }),

  listPayments: (token: string, params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi<{ items: AdminPayment[]; total: number; page: number; totalPages: number }>(
      `/payments${qs ? `?${qs}` : ''}`,
      { token },
    );
  },
};

export interface AdminAnalytics {
  users: { total: number; verified: number };
  listings: Record<string, number>;
  tickets: { open: number; inProgress: number; total: number };
  moderation: { pending: number };
}

export interface ModerationListing {
  id: string;
  title: string;
  description: string;
  price: string | null;
  city: string | null;
  district: string | null;
  createdAt: string;
  category: { name: string; slug: string };
  user: { id: string; email: string; phone: string | null };
  images: Array<{ id: string; status: string; publicKey?: string | null }>;
}

export interface AdminUser {
  id: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  roles: string[];
  totpEnabled: boolean;
  createdAt: string;
  listingCount: number;
}

export interface AdminUserDetail extends AdminUser {
  updatedAt: string;
  ticketCount: number;
}

export interface Ticket {
  id: string;
  type: string;
  status: string;
  priority: string;
  subject: string;
  body: string;
  createdAt: string;
  creator: { id: string; email: string };
  assignee: { id: string; email: string } | null;
}

export interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
}

export interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  justification: string;
  createdAt: string;
  admin: { email: string };
}

export interface AdminPayment {
  id: string;
  userId: string;
  listingId: string | null;
  amount: number;
  currency: string;
  status: string;
  pricingTier: string | null;
  createdAt: string;
  user?: { id: string; email: string };
  listing?: { id: string; title: string; slug: string } | null;
}
