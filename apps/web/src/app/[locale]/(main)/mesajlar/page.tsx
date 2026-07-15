'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api, type ChatMessage, type ConversationSummary } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { formatApiError } from '@/lib/validation';
import { useChat } from '@/components/ChatProvider';

function formatTime(iso: string, locale: string) {
  const tag = locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'tr-TR';
  return new Date(iso).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' });
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('messages');
  const tCommon = useTranslations('common');
  const tAll = useTranslations();
  const locale = useLocale();
  const { socket, refreshUnread, joinConversation, setActiveConversation } = useChat();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  function showError(err: unknown, fallback: string) {
    const message = err instanceof Error ? err.message : fallback;
    setError(formatApiError(message, tAll) || fallback);
  }

  function upsertConversationFromNotification(
    payload: { conversationId: string; message: ChatMessage; listingTitle?: string | null },
  ) {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === payload.conversationId);
      if (existing) {
        return prev
          .map((c) =>
            c.id === payload.conversationId
              ? {
                  ...c,
                  unreadCount: activeId === c.id ? 0 : c.unreadCount + 1,
                  updatedAt: new Date().toISOString(),
                  lastMessage: {
                    id: payload.message.id,
                    body: payload.message.body,
                    senderId: payload.message.senderId,
                    createdAt: payload.message.createdAt ?? new Date().toISOString(),
                  },
                }
              : c,
          )
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      }

      return [
        {
          id: payload.conversationId,
          otherPartyId: payload.message.senderId,
          role: 'seller' as const,
          unreadCount: activeId === payload.conversationId ? 0 : 1,
          updatedAt: new Date().toISOString(),
          listing: payload.listingTitle
            ? { id: '', title: payload.listingTitle, slug: '' }
            : null,
          lastMessage: {
            id: payload.message.id,
            body: payload.message.body,
            senderId: payload.message.senderId,
            createdAt: payload.message.createdAt ?? new Date().toISOString(),
          },
        },
        ...prev,
      ];
    });
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeId]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;

    api
      .me(token)
      .then((user) => {
        if (!cancelled) setCurrentUserId((user as { id: string }).id);
      })
      .catch(() => {
        if (!cancelled) setCurrentUserId(null);
      });

    api
      .getConversations(token)
      .then((items) => {
        if (!cancelled) setConversations(items);
      })
      .catch((err) => {
        if (!cancelled) showError(err, t('loadFailed'));
      });

    const sellerId = searchParams.get('seller');
    const listingId = searchParams.get('listing');

    if (sellerId) {
      api
        .me(token)
        .then((user) => {
          const userId = (user as { id: string }).id;
          if (userId === sellerId) {
            setError(tAll('errors.cannotMessageSelf'));
            return null;
          }
          return api.startConversation(token, { sellerId, listingId: listingId ?? undefined });
        })
        .then(async (c) => {
          if (!c || cancelled) return;
          setError('');
          setActiveId(c.id);
          setActiveConversation(c.id);
          joinConversation(c.id);
          const [msgs, items] = await Promise.all([
            api.getMessages(token, c.id),
            api.getConversations(token),
          ]);
          if (!cancelled) {
            setMessages(msgs);
            setConversations(items);
            refreshUnread();
          }
        })
        .catch((err) => {
          if (!cancelled) showError(err, t('startFailed'));
        });
    }

    return () => {
      cancelled = true;
      setActiveConversation(null);
    };
  }, [searchParams, t, tAll, joinConversation, refreshUnread, setActiveConversation]);

  useEffect(() => {
    if (!socket) return;

    function onMessage(msg: ChatMessage) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    }

    function onNotification(event: Event) {
      const payload = (event as CustomEvent).detail as {
        conversationId: string;
        message: ChatMessage;
        listingTitle?: string | null;
      };
      upsertConversationFromNotification(payload);
      if (payload.conversationId === activeId) {
        setMessages((prev) =>
          prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message],
        );
      }
    }

    socket.on('message', onMessage);
    window.addEventListener('chat:notification', onNotification);

    return () => {
      socket.off('message', onMessage);
      window.removeEventListener('chat:notification', onNotification);
    };
  }, [socket, activeId]);

  async function send() {
    const token = getToken();
    if (!token || !activeId || !text.trim() || sending) return;

    setSending(true);
    setError('');

    try {
      if (socket) {
        socket.emit('send', { conversationId: activeId, body: text.trim() });
      } else {
        await api.sendMessage(token, activeId, text.trim());
      }
      setText('');
    } catch (err) {
      showError(err, t('sendFailed'));
    } finally {
      setSending(false);
    }
  }

  async function selectConversation(id: string) {
    setActiveId(id);
    setActiveConversation(id);
    setError('');
    joinConversation(id);

    const token = getToken();
    if (!token) return;

    try {
      const msgs = await api.getMessages(token, id);
      setMessages(msgs);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
      );
      await refreshUnread();
    } catch (err) {
      showError(err, t('loadFailed'));
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-foreground bg-surface" style={{ boxShadow: 'var(--shadow-brutal)' }}>
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 border-b border-destructive/20 bg-red-50 px-4 py-3 text-sm text-destructive"
        >
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="shrink-0">
            ×
          </button>
        </div>
      )}

      <div className="grid min-h-[32rem] lg:grid-cols-[22rem_1fr]">
        <aside className="border-b-2 border-foreground/10 lg:border-b-0 lg:border-e-2">
          <div className="border-b-2 border-foreground/10 bg-muted/40 px-4 py-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">{t('conversations')}</h2>
            <p className="mt-0.5 text-xs text-foreground/55">{t('conversationsHint')}</p>
          </div>
          <ul className="max-h-[28rem] overflow-y-auto">
            {conversations.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-foreground/50">{t('noConversations')}</li>
            )}
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => selectConversation(c.id)}
                  className={`flex w-full gap-3 border-b border-border/50 px-4 py-4 text-start transition-all duration-200 hover:bg-muted/60 ${
                    activeId === c.id ? 'bg-primary/8 border-s-4 border-s-primary' : ''
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-foreground bg-secondary/30 text-sm font-bold text-primary">
                    {c.otherPartyId.slice(-2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {c.listing?.title ?? t('directChat')}
                      </span>
                      {c.lastMessage && (
                        <span className="shrink-0 text-[10px] text-foreground/45">
                          {formatTime(c.lastMessage.createdAt, locale)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-xs text-foreground/55">
                        {c.lastMessage?.body ?? tCommon('newConversation')}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="ms-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground/50">
                      {c.role === 'buyer' ? t('roleBuyer') : t('roleSeller')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex min-h-[28rem] flex-col">
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-4">
                <div>
                  <p className="font-heading font-semibold text-foreground">
                    {activeConversation.listing?.title ?? t('directChat')}
                  </p>
                  <p className="text-xs text-foreground/55">
                    {activeConversation.role === 'buyer' ? t('roleBuyer') : t('roleSeller')}
                  </p>
                </div>
                {activeConversation.listing?.slug && (
                  <Link
                    href={`/ilan/${activeConversation.listing.slug}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-accent hover:bg-muted"
                  >
                    {t('viewListing')}
                  </Link>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-muted/10 to-white p-5">
                {messages.map((m) => {
                  const isOwn = currentUserId === m.senderId;
                  return (
                    <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl border-2 px-4 py-2.5 text-sm ${
                          isOwn
                            ? 'rounded-ee-md border-foreground bg-accent text-white'
                            : 'rounded-es-md border-foreground bg-surface text-foreground'
                        }`}
                      >
                        <p>{m.body}</p>
                        {m.createdAt && (
                          <p className={`mt-1 text-[10px] ${isOwn ? 'text-white/70' : 'text-foreground/45'}`}>
                            {formatTime(m.createdAt, locale)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="flex gap-2 border-t border-border bg-white p-4">
                <input
                  className="input-field flex-1"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('placeholder')}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={sending || !text.trim()}
                  className="btn-primary shrink-0 px-5 py-2 text-sm disabled:opacity-60"
                >
                  {t('send')}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-foreground/35">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              <p className="text-sm text-foreground/55">{t('emptyChat')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const t = useTranslations('messages');
  const tCommon = useTranslations('common');

  return (
    <div>
      <div className="mb-8">
        <span className="badge-pill mb-3">{t('title')}</span>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">{t('subtitle')}</h1>
      </div>
      <Suspense fallback={<p className="text-foreground/60">{tCommon('loading')}</p>}>
        <MessagesContent />
      </Suspense>
    </div>
  );
}
