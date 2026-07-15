import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, NotificationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface DispatchInput {
  userId?: string;
  channel: NotificationChannel;
  eventType: string;
  recipient: string;
  subject?: string;
  body: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly emailFrom: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.emailFrom = config.get('NOTIFIER_EMAIL_FROM', 'noreply@turkiye-pazaryeri.local');
  }

  async dispatch(input: DispatchInput): Promise<void> {
    try {
      await this.send(input);
      await this.log(input, NotificationStatus.SENT);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.log(input, NotificationStatus.FAILED, message);
      throw error;
    }
  }

  async dispatchBestEffort(input: DispatchInput): Promise<void> {
    try {
      await this.dispatch(input);
    } catch (error) {
      this.logger.error(`Notification failed: ${input.eventType}`, error);
    }
  }

  async handleEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
    switch (eventType) {
      case 'listing.submitted':
        await this.notifyListingSubmitted(payload);
        break;
      case 'listing.approved':
        await this.notifyListingApproved(payload);
        break;
      case 'listing.rejected':
        await this.notifyListingRejected(payload);
        break;
      case 'ticket.created':
        await this.notifyTicketCreated(payload);
        break;
      case 'ticket.updated':
        await this.notifyTicketUpdated(payload);
        break;
      case 'otp.send':
        await this.sendOtp(payload);
        break;
      case 'kvkk.export.ready':
        await this.notifyKvkkExportReady(payload);
        break;
      case 'kvkk.erasure.completed':
        await this.notifyKvkkErasureCompleted(payload);
        break;
      case 'payment.completed':
        await this.notifyPaymentCompleted(payload);
        break;
      default:
        this.logger.warn(`Unhandled notification event: ${eventType}`);
    }
  }

  private async notifyListingSubmitted(payload: Record<string, unknown>) {
    const listingId = String(payload.listingId ?? '');
    await this.dispatchBestEffort({
      channel: NotificationChannel.EMAIL,
      eventType: 'listing.submitted',
      recipient: 'moderators@turkiye-pazaryeri.local',
      subject: 'Yeni ilan moderasyonda',
      body: `İlan ${listingId} moderasyon kuyruğuna eklendi.`,
      payload,
    });
  }

  private async notifyListingApproved(payload: Record<string, unknown>) {
    const userId = String(payload.userId ?? '');
    const user = await this.findUser(userId);
    if (!user?.email) return;

    await this.dispatchBestEffort({
      userId,
      channel: NotificationChannel.EMAIL,
      eventType: 'listing.approved',
      recipient: user.email,
      subject: 'İlanınız yayınlandı',
      body: `İlanınız (${payload.listingId}) onaylandı ve yayına alındı.`,
      payload,
    });
  }

  private async notifyListingRejected(payload: Record<string, unknown>) {
    const userId = String(payload.userId ?? '');
    const user = await this.findUser(userId);
    if (!user?.email) return;

    await this.dispatchBestEffort({
      userId,
      channel: NotificationChannel.EMAIL,
      eventType: 'listing.rejected',
      recipient: user.email,
      subject: 'İlanınız reddedildi',
      body: `İlanınız reddedildi. Sebep: ${payload.reason ?? 'Belirtilmedi'}`,
      payload,
    });
  }

  private async notifyTicketCreated(payload: Record<string, unknown>) {
    const creatorEmail = String(payload.creatorEmail ?? '');
    if (creatorEmail) {
      await this.dispatchBestEffort({
        userId: payload.creatorId ? String(payload.creatorId) : undefined,
        channel: NotificationChannel.EMAIL,
        eventType: 'ticket.created.creator',
        recipient: creatorEmail,
        subject: 'Talebiniz alındı',
        body: `Destek talebiniz (${payload.ticketId}) kaydedildi.`,
        payload,
      });
    }

    await this.dispatchBestEffort({
      channel: NotificationChannel.EMAIL,
      eventType: 'ticket.created.support',
      recipient: 'support@turkiye-pazaryeri.local',
      subject: 'Yeni destek talebi',
      body: `Yeni talep: ${payload.subject}`,
      payload,
    });
  }

  private async notifyTicketUpdated(payload: Record<string, unknown>) {
    const creatorEmail = String(payload.creatorEmail ?? '');
    if (!creatorEmail) return;

    await this.dispatchBestEffort({
      userId: payload.creatorId ? String(payload.creatorId) : undefined,
      channel: NotificationChannel.EMAIL,
      eventType: 'ticket.updated',
      recipient: creatorEmail,
      subject: 'Talebiniz güncellendi',
      body: `Talep durumu: ${payload.status}`,
      payload,
    });
  }

  private async sendOtp(payload: Record<string, unknown>) {
    const phone = String(payload.phone ?? '');
    const code = String(payload.code ?? '');
    const userId = payload.userId ? String(payload.userId) : undefined;

    await this.dispatchBestEffort({
      userId,
      channel: NotificationChannel.SMS,
      eventType: 'otp.send',
      recipient: phone,
      body: `Türkiye Pazaryeri doğrulama kodunuz: ${code}`,
      payload: { ...payload, code: '[REDACTED]' },
    });
  }

  private async notifyPaymentCompleted(payload: Record<string, unknown>) {
    const userId = String(payload.userId ?? '');
    const user = await this.findUser(userId);
    if (!user?.email) return;

    await this.dispatchBestEffort({
      userId,
      channel: NotificationChannel.EMAIL,
      eventType: 'payment.completed',
      recipient: user.email,
      subject: 'Ödemeniz alındı',
      body: `İlan öne çıkarma ödemeniz (${payload.amount} TRY) tamamlandı. Paket: ${payload.pricingTier}`,
      payload,
    });
  }

  private async notifyKvkkExportReady(payload: Record<string, unknown>) {
    const email = String(payload.email ?? '');
    const userId = String(payload.userId ?? '');
    if (!email) return;

    await this.dispatchBestEffort({
      userId,
      channel: NotificationChannel.EMAIL,
      eventType: 'kvkk.export.ready',
      recipient: email,
      subject: 'KVKK veri paketiniz hazır',
      body: `Veri dışa aktarma talebiniz tamamlandı. İndirme anahtarı: ${payload.exportKey}`,
      payload,
    });
  }

  private async notifyKvkkErasureCompleted(payload: Record<string, unknown>) {
    const email = String(payload.email ?? '');
    const userId = String(payload.userId ?? '');
    if (!email) return;

    await this.dispatchBestEffort({
      userId,
      channel: NotificationChannel.EMAIL,
      eventType: 'kvkk.erasure.completed',
      recipient: email,
      subject: 'Hesap silme talebiniz tamamlandı',
      body: 'Kişisel verileriniz KVKK kapsamında silindi veya anonimleştirildi.',
      payload,
    });
  }

  private async send(input: DispatchInput): Promise<void> {
    const message = {
      from: this.emailFrom,
      to: input.recipient,
      subject: input.subject,
      body: input.body,
      channel: input.channel,
      eventType: input.eventType,
    };

    if (this.config.get('NODE_ENV') === 'production') {
      // Production: integrate SES/Twilio/Netgsm here.
      this.logger.log(`[PROD STUB] Would send ${input.channel} notification`);
    } else {
      this.logger.log(JSON.stringify({ event: 'notification_sent', ...message }));
    }
  }

  private async log(
    input: DispatchInput,
    status: NotificationStatus,
    error?: string,
  ): Promise<void> {
    await this.prisma.notificationLog.create({
      data: {
        userId: input.userId,
        channel: input.channel,
        eventType: input.eventType,
        recipient: input.recipient,
        status,
        payload: (input.payload ?? { body: input.body }) as Prisma.InputJsonValue,
        error,
      },
    });
  }

  private findUser(userId: string) {
    if (!userId) return null;
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true, phone: true },
    });
  }
}
