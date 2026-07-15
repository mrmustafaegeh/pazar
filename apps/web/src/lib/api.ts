const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'access_token';
const AUTH_CHANGED_EVENT = 'auth-changed';

type FetchOptions = RequestInit & { token?: string; _authRetried?: boolean };

let refreshInFlight: Promise<string | null> | null = null;

function persistToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

function clearPersistedToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(apiUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string };
      persistToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export const emptyBrowseResult = {
  items: [] as ListingCard[],
  total: 0,
  page: 1,
  totalPages: 0,
};

export function apiUrl(path: string) {
  return `${API_URL}/v1${path}`;
}

function extractApiErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'API error';

  const body = payload as Record<string, unknown>;
  const message = body.message;

  if (typeof message === 'string') return message;

  if (Array.isArray(message)) {
    const first = message[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'message' in first) {
      const nested = (first as Record<string, unknown>).message;
      if (typeof nested === 'string') return nested;
    }
  }

  if (message && typeof message === 'object' && 'message' in message) {
    const nested = (message as Record<string, unknown>).message;
    if (typeof nested === 'string') return nested;
    if (Array.isArray(nested) && typeof nested[0] === 'string') return nested[0];
  }

  return 'API error';
}

export function mediaUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/v1/')) return `${API_URL}${path}`;
  return `${API_URL}/v1${path.startsWith('/') ? path : `/${path}`}`;
}

async function fetchApi<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, _authRetried, ...init } = options;
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
      credentials: init.credentials ?? (token ? 'include' : 'same-origin'),
      next: init.method ? undefined : { revalidate: 60 },
    });
  } catch {
    throw new Error('API bağlantısı kurulamadı');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = extractApiErrorMessage(err);

    if (res.status === 401 && token && !_authRetried) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return fetchApi<T>(path, { ...options, token: newToken, _authRetried: true });
      }
      clearPersistedToken();
    }

    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

async function authedFetch(path: string, init: RequestInit & { token: string; _authRetried?: boolean }): Promise<Response> {
  const { token, _authRetried, ...rest } = init;
  const res = await fetch(apiUrl(path), {
    ...rest,
    headers: {
      ...(rest.headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (res.status === 401 && !_authRetried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return authedFetch(path, { ...init, token: newToken, _authRetried: true });
    }
    clearPersistedToken();
  }

  return res;
}

export const api = {
  getCategories: () => fetchApi<Array<{ id: string; slug: string; name: string; children: unknown[] }>>('/categories'),
  getCategory: (slug: string) => fetchApi<{ id: string; slug: string; name: string; attributeSchema: unknown }>(`/categories/${slug}`),
  browseListings: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi<{ items: ListingCard[]; total: number; page: number; totalPages: number }>(`/listings?${qs}`);
  },
  searchListings: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi<{ items: ListingCard[]; total: number; page: number; totalPages: number }>(`/search?${qs}`);
  },
  getListingBySlug: (slug: string) => fetchApi<ListingDetail>(`/listings/slug/${slug}`),
  getSellerProfile: (id: string) => fetchApi<SellerProfile>(`/users/${id}/profile`),
  register: (data: unknown) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: unknown) =>
    fetchApi<{
      accessToken?: string;
      user?: unknown;
      requires2fa?: boolean;
      tempToken?: string;
    }>('/auth/login', { method: 'POST', body: JSON.stringify(data), credentials: 'include' }),
  verify2fa: (data: { tempToken: string; code: string }) =>
    fetchApi<{ accessToken: string; user: unknown }>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include',
    }),
  me: (token: string) =>
    fetchApi<{ id: string; email: string; phone: string | null; phoneVerified: boolean }>('/auth/me', { token }),
  sendPhoneOtp: (token: string, phone: string) =>
    fetchApi('/auth/phone/send-otp', { method: 'POST', body: JSON.stringify({ phone }), token }),
  verifyPhone: (token: string, phone: string, code: string) =>
    fetchApi<{ phoneVerified: boolean }>('/auth/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
      token,
    }),
  createListing: (token: string, data: unknown) =>
    fetchApi<{ id: string; slug: string }>('/listings', { method: 'POST', body: JSON.stringify(data), token }),
  updateListing: (token: string, id: string, data: unknown) =>
    fetchApi<{ id: string }>(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
  submitListing: (token: string, id: string) =>
    fetchApi<{ id: string; status: string }>(`/listings/${id}/submit`, { method: 'POST', token }),
  uploadListingImage: async (token: string, listingId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await authedFetch(`/listings/${listingId}/images`, {
      method: 'POST',
      token,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(extractApiErrorMessage(err) || 'Görsel yüklenemedi');
    }
    return res.json() as Promise<{ id: string }>;
  },
  getConversations: (token: string) =>
    fetchApi<ConversationSummary[]>('/messaging/conversations', { token }),
  getUnreadCount: (token: string) =>
    fetchApi<{ count: number }>('/messaging/unread-count', { token }),
  getMessages: (token: string, conversationId: string) =>
    fetchApi<ChatMessage[]>(`/messaging/conversations/${conversationId}/messages`, { token }),
  markConversationRead: (token: string, conversationId: string) =>
    fetchApi<{ ok: boolean }>(`/messaging/conversations/${conversationId}/read`, {
      method: 'POST',
      token,
    }),
  startConversation: (token: string, data: unknown) =>
    fetchApi<{ id: string }>('/messaging/conversations', { method: 'POST', body: JSON.stringify(data), token }),
  sendMessage: (token: string, conversationId: string, body: string) =>
    fetchApi(`/messaging/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
      token,
    }),
  createTicket: (token: string, data: unknown) =>
    fetchApi<{ id: string }>('/tickets', { method: 'POST', body: JSON.stringify(data), token }),
  reportListing: (token: string, data: unknown) =>
    fetchApi<{ id: string }>('/tickets/report-listing', { method: 'POST', body: JSON.stringify(data), token }),
  myTickets: (token: string) =>
    fetchApi<{ items: Array<{ id: string; subject: string; status: string; createdAt: string }> }>(
      '/tickets/mine',
      { token },
    ),
  requestKvkkExport: (token: string) =>
    fetchApi<{ ticketId: string }>('/kvkk/data-export', {
      method: 'POST',
      body: JSON.stringify({ confirmation: true }),
      token,
    }),
  requestKvkkDeletion: (token: string, reason?: string) =>
    fetchApi<{ ticketId: string }>('/kvkk/deletion-request', {
      method: 'POST',
      body: JSON.stringify({ confirmation: true, reason }),
      token,
    }),
  kvkkPreview: (token: string) =>
    fetchApi<{ categories: { profile: boolean; listings: number; tickets: number; messages: number } }>(
      '/kvkk/preview',
      { token },
    ),
  getPricing: () =>
    fetchApi<Array<{ tier: string; name: string; description: string; price: number; currency: string; features: string[] }>>(
      '/payments/pricing',
    ),
  paymentsEnabled: () => fetchApi<{ enabled: boolean }>('/payments/enabled'),
  createCheckout: (token: string, data: unknown) =>
    fetchApi<{ id: string; checkoutUrl?: string; status: string }>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
  confirmPayment: (token: string, paymentId: string) =>
    fetchApi<{ id: string; status: string }>(`/payments/${paymentId}/confirm`, { method: 'POST', token }),
};

export const apiServer = {
  getCategories: () =>
    api.getCategories().catch(() => [] as Awaited<ReturnType<typeof api.getCategories>>),
  browseListings: (params: Record<string, string>) =>
    api.browseListings(params).catch(() => emptyBrowseResult),
  searchListings: (params: Record<string, string>) =>
    api.searchListings(params).catch(() => emptyBrowseResult),
};

export interface ChatMessage {
  id: string;
  body: string;
  senderId: string;
  conversationId?: string;
  createdAt?: string;
  readAt?: string | null;
}

export interface ConversationSummary {
  id: string;
  otherPartyId: string;
  role: 'buyer' | 'seller';
  unreadCount: number;
  updatedAt: string;
  listing: { id: string; title: string; slug: string } | null;
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
  } | null;
}

export interface ListingCard {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  city: string | null;
  district: string | null;
  publishedAt: string | null;
  category: { slug: string; name: string };
  imageUrl: string | null;
  pricingTier?: string;
  isPromoted?: boolean;
}

export interface ListingDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  city: string | null;
  district: string | null;
  attributes: Record<string, unknown>;
  publishedAt: string | null;
  category: { slug: string; name: string };
  images: Array<{ publicKey: string | null }>;
  user: {
    id: string;
    phoneVerifiedAt?: string | null;
    createdAt?: string;
  };
}

export interface SellerProfile {
  id: string;
  memberSince: string;
  phoneVerified: boolean;
  listingCount: number;
  listings: ListingCard[];
}
