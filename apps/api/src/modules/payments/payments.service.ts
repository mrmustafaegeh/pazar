import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentRecordStatus, PaymentStatus, PricingTier, Prisma } from '@prisma/client';
import type { CreateCheckoutInput, PaymentWebhookInput, PricingTier as Tier } from '@turkiye-pazaryeri/types';
import { PrismaService } from '../../database/prisma.service';
import { OutboxService } from '../outbox/outbox.service';
import { PaymentProviderService } from './payment-provider.service';
import {
  isPaidTier,
  PRICING_PLANS,
  TIER_DURATION_DAYS,
  TIER_PRICES_TRY,
} from './pricing.config';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: PaymentProviderService,
    private readonly outbox: OutboxService,
  ) {}

  async isPaymentsEnabled(): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: 'payments_enabled' },
    });
    return flag?.enabled ?? false;
  }

  getPricing() {
    return PRICING_PLANS;
  }

  async createCheckout(userId: string, input: CreateCheckoutInput) {
    if (!(await this.isPaymentsEnabled())) {
      throw new ForbiddenException('Ödemeler şu anda devre dışı');
    }

    const amount = TIER_PRICES_TRY[input.pricingTier as Tier];
    if (!amount || amount <= 0) {
      throw new BadRequestException('Geçersiz fiyatlandırma paketi');
    }

    const listing = await this.prisma.listing.findFirst({
      where: { id: input.listingId, userId, deletedAt: null },
    });

    if (!listing) throw new NotFoundException('İlan bulunamadı');
    if (listing.status !== 'DRAFT') {
      throw new BadRequestException('Yalnızca taslak ilanlar için ödeme yapılabilir');
    }

    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existing) {
      if (existing.status === PaymentRecordStatus.COMPLETED) {
        return this.formatPaymentResponse(existing);
      }
      if (existing.userId !== userId) {
        throw new ConflictException('Idempotency anahtarı başka kullanıcıya ait');
      }
      const session = await this.provider.createCheckoutSession({
        paymentId: existing.id,
        amount: Number(existing.amount),
        currency: existing.currency,
        userId,
        listingId: input.listingId,
        idempotencyKey: input.idempotencyKey,
      });
      return { ...this.formatPaymentResponse(existing), checkoutUrl: session.checkoutUrl };
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          userId,
          listingId: input.listingId,
          amount,
          currency: 'TRY',
          status: PaymentRecordStatus.PENDING,
          idempotencyKey: input.idempotencyKey,
          metadata: { pricingTier: input.pricingTier } as Prisma.InputJsonValue,
        },
      });

      await tx.listing.update({
        where: { id: input.listingId },
        data: {
          pricingTier: input.pricingTier as PricingTier,
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      return created;
    });

    const session = await this.provider.createCheckoutSession({
      paymentId: payment.id,
      amount,
      currency: 'TRY',
      userId,
      listingId: input.listingId,
      idempotencyKey: input.idempotencyKey,
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { providerRef: session.providerRef },
    });

    return {
      ...this.formatPaymentResponse(payment),
      checkoutUrl: session.checkoutUrl,
      providerRef: session.providerRef,
    };
  }

  async confirmPayment(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });
    if (!payment) throw new NotFoundException('Ödeme bulunamadı');

    return this.completePayment(payment.idempotencyKey, payment.providerRef ?? `manual_${paymentId}`);
  }

  async handleWebhook(input: PaymentWebhookInput) {
    if (input.status === 'FAILED') {
      await this.failPayment(input.idempotencyKey);
      return { received: true };
    }
    await this.completePayment(input.idempotencyKey, input.providerRef);
    return { received: true };
  }

  async completePayment(idempotencyKey: string, providerRef: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: { listing: true },
    });

    if (!payment) throw new NotFoundException('Ödeme bulunamadı');

    if (payment.status === PaymentRecordStatus.COMPLETED) {
      return this.formatPaymentResponse(payment);
    }

    const tier = (payment.metadata as { pricingTier?: Tier })?.pricingTier ?? 'STANDARD';
    const durationDays = TIER_DURATION_DAYS[tier];

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentRecordStatus.COMPLETED,
          providerRef,
        },
      });

      if (payment.listingId) {
        await tx.listing.update({
          where: { id: payment.listingId },
          data: {
            pricingTier: tier as PricingTier,
            paymentStatus: PaymentStatus.PAID,
            expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
          },
        });
      }

      await this.outbox.write(tx, {
        aggregateType: 'Payment',
        aggregateId: payment.id,
        eventType: 'payment.completed',
        payload: {
          paymentId: payment.id,
          userId: payment.userId,
          listingId: payment.listingId,
          amount: Number(payment.amount),
          pricingTier: tier,
        },
      });

      return row;
    });

    return this.formatPaymentResponse(updated);
  }

  async failPayment(idempotencyKey: string) {
    const payment = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
    if (!payment) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentRecordStatus.FAILED },
      });
      if (payment.listingId) {
        await tx.listing.update({
          where: { id: payment.listingId },
          data: { paymentStatus: PaymentStatus.FAILED },
        });
      }
    });
  }

  async findById(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });
    if (!payment) throw new NotFoundException('Ödeme bulunamadı');
    return this.formatPaymentResponse(payment);
  }

  async listMine(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: { listing: { select: { id: true, title: true, slug: true } } },
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    return {
      items: items.map((p) => this.formatPaymentResponse(p)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          user: { select: { id: true, email: true } },
          listing: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.payment.count(),
    ]);

    return { items: items.map((p) => this.formatPaymentResponse(p)), total, page, totalPages: Math.ceil(total / limit) };
  }

  async assertListingPaymentReady(listing: {
    pricingTier: PricingTier;
    paymentStatus: PaymentStatus;
  }): Promise<void> {
    if (!(await this.isPaymentsEnabled())) return;
    if (!isPaidTier(listing.pricingTier as Tier)) return;
    if (listing.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException(
        'Seçilen paket için ödeme tamamlanmalıdır. Önce ödemeyi yapın.',
      );
    }
  }

  private formatPaymentResponse(payment: {
    id: string;
    userId: string;
    listingId: string | null;
    amount: Prisma.Decimal;
    currency: string;
    status: PaymentRecordStatus;
    idempotencyKey: string;
    providerRef: string | null;
    metadata: unknown;
    createdAt: Date;
    listing?: { id: string; title: string; slug: string } | null;
    user?: { id: string; email: string };
  }) {
    return {
      id: payment.id,
      userId: payment.userId,
      listingId: payment.listingId,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      idempotencyKey: payment.idempotencyKey,
      providerRef: payment.providerRef,
      pricingTier: (payment.metadata as { pricingTier?: string })?.pricingTier ?? null,
      createdAt: payment.createdAt.toISOString(),
      listing: payment.listing ?? null,
      user: payment.user ?? null,
    };
  }
}
