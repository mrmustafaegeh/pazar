import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async getConversations(userId: string) {
    const rows = await this.prisma.conversation.findMany({
      where: {
        deletedAt: null,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true, slug: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return Promise.all(
      rows.map(async (conversation) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            readAt: null,
          },
        });

        const otherPartyId =
          conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
        const role = conversation.buyerId === userId ? 'buyer' : 'seller';
        const last = conversation.messages[0];

        return {
          id: conversation.id,
          listing: conversation.listing,
          otherPartyId,
          role,
          unreadCount,
          updatedAt: conversation.updatedAt.toISOString(),
          lastMessage: last
            ? {
                id: last.id,
                body: last.body,
                senderId: last.senderId,
                createdAt: last.createdAt.toISOString(),
              }
            : null,
        };
      }),
    );
  }

  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: {
          deletedAt: null,
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
      },
    });
  }

  async getMessages(userId: string, conversationId: string) {
    const conversation = await this.getConversationForUser(userId, conversationId);

    await this.markConversationRead(userId, conversation.id);

    return this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async startConversation(buyerId: string, sellerId: string, listingId?: string) {
    if (buyerId === sellerId) {
      throw new ForbiddenException('Kendinizle mesajlaşamazsınız');
    }

    const existing = await this.prisma.conversation.findFirst({
      where: { buyerId, sellerId, listingId: listingId ?? null, deletedAt: null },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: { buyerId, sellerId, listingId },
    });
  }

  async sendMessage(userId: string, conversationId: string, body: string) {
    const conversation = await this.getConversationForUser(userId, conversationId);

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId, senderId: userId, body },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return created;
    });

    const listing = conversation.listingId
      ? await this.prisma.listing.findFirst({
          where: { id: conversation.listingId },
          select: { title: true },
        })
      : null;

    const recipientId = this.getRecipientId(conversation, userId);
    await this.notifyRecipient(recipientId, userId, message, conversation, listing?.title ?? null);

    return { message, conversation, recipientId, listingTitle: listing?.title ?? null };
  }

  getRecipientId(
    conversation: { buyerId: string; sellerId: string },
    senderId: string,
  ): string {
    return conversation.buyerId === senderId ? conversation.sellerId : conversation.buyerId;
  }

  async markConversationRead(userId: string, conversationId: string) {
    await this.getConversationForUser(userId, conversationId);
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  private async notifyRecipient(
    recipientId: string,
    senderId: string,
    message: { id: string; body: string; conversationId: string },
    conversation: { id: string; listingId: string | null },
    listingTitle: string | null,
  ) {
    const [recipient, sender] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: recipientId, deletedAt: null },
        select: { id: true, email: true },
      }),
      this.prisma.user.findFirst({
        where: { id: senderId, deletedAt: null },
        select: { email: true },
      }),
    ]);

    if (!recipient?.email) return;

    const senderLabel = sender?.email?.split('@')[0] ?? 'Kullanıcı';
    const listingLabel = listingTitle ? ` (${listingTitle})` : '';

    await this.notifications.dispatchBestEffort({
      userId: recipient.id,
      channel: NotificationChannel.EMAIL,
      eventType: 'message.received',
      recipient: recipient.email,
      subject: 'Yeni mesajınız var',
      body: `${senderLabel} size bir mesaj gönderdi${listingLabel}: ${message.body.slice(0, 160)}`,
      payload: {
        conversationId: conversation.id,
        messageId: message.id,
        senderId,
        recipientId,
      },
    });
  }

  private async getConversationForUser(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        deletedAt: null,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });

    if (!conversation) throw new NotFoundException('Konuşma bulunamadı');
    return conversation;
  }
}
