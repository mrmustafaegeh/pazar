'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { getToken, onAuthChanged } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ChatMessage {
  id: string;
  body: string;
  senderId: string;
  conversationId?: string;
  createdAt?: string;
}

export interface ChatNotification {
  conversationId: string;
  message: ChatMessage;
  listingTitle?: string | null;
}

interface ChatContextValue {
  socket: Socket | null;
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  joinConversation: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  toast: ChatNotification | null;
  dismissToast: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('messages');
  const pathname = usePathname();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<ChatNotification | null>(null);
  const activeConversationRef = useRef<string | null>(null);

  const refreshUnread = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count } = await api.getUnreadCount(token);
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const joinConversation = useCallback(
    (conversationId: string) => {
      activeConversationRef.current = conversationId;
      socket?.emit('join', { conversationId });
    },
    [socket],
  );

  const setActiveConversation = useCallback((conversationId: string | null) => {
    activeConversationRef.current = conversationId;
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let cancelled = false;
    let chatSocket: Socket | null = null;

    function connect() {
      const token = getToken();
      if (!token) {
        chatSocket?.disconnect();
        chatSocket = null;
        if (!cancelled) {
          setSocket(null);
          setUnreadCount(0);
        }
        return;
      }

      refreshUnread();

      chatSocket = io(`${API_URL}/chat`, { auth: { token } });

      chatSocket.on('notification', (payload: ChatNotification) => {
        if (cancelled) return;

        const onMessagesPage = pathname.includes('/mesajlar');
        const isActiveConversation =
          activeConversationRef.current === payload.conversationId;

        if (!onMessagesPage || !isActiveConversation) {
          setToast(payload);
          setUnreadCount((count) => count + 1);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chat:notification', { detail: payload }));
        }
      });

      if (!cancelled) setSocket(chatSocket);
    }

    connect();
    const unsubscribe = onAuthChanged(connect);

    return () => {
      cancelled = true;
      unsubscribe();
      chatSocket?.disconnect();
    };
  }, [pathname, refreshUnread]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(
    () => ({
      socket,
      unreadCount,
      refreshUnread,
      joinConversation,
      setActiveConversation,
      toast,
      dismissToast,
    }),
    [socket, unreadCount, refreshUnread, joinConversation, setActiveConversation, toast, dismissToast],
  );

  return (
    <ChatContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-6 start-4 end-4 z-50 mx-auto max-w-md animate-fade-in md:start-auto md:end-6">
          <Link
            href="/mesajlar"
            onClick={dismissToast}
            className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-2xl ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
          >
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t('newMessageTitle')}</p>
              {toast.listingTitle && (
                <p className="mt-0.5 truncate text-xs text-foreground/55">{toast.listingTitle}</p>
              )}
              <p className="mt-1 line-clamp-2 text-sm text-foreground/75">{toast.message.body}</p>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                dismissToast();
              }}
              className="shrink-0 text-foreground/40 hover:text-foreground"
              aria-label={t('dismiss')}
            >
              ×
            </button>
          </Link>
        </div>
      )}
    </ChatContext.Provider>
  );
}
