import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export interface CheckoutSession {
  providerRef: string;
  checkoutUrl: string;
}

@Injectable()
export class PaymentProviderService {
  constructor(private readonly config: ConfigService) {}

  async createCheckoutSession(params: {
    paymentId: string;
    amount: number;
    currency: string;
    userId: string;
    listingId: string;
    idempotencyKey: string;
  }): Promise<CheckoutSession> {
    const provider = this.config.get('PAYMENT_PROVIDER', 'mock');
    const providerRef = `${provider}_${params.idempotencyKey}`;

    if (provider === 'mock') {
      const baseUrl = this.config.get('API_PUBLIC_URL', 'http://localhost:4000');
      return {
        providerRef,
        checkoutUrl: `${baseUrl}/v1/payments/mock-checkout?ref=${providerRef}&paymentId=${params.paymentId}`,
      };
    }

    // Production: integrate iyzico / PayTR / Stripe here.
    return {
      providerRef,
      checkoutUrl: `https://payment-provider.example/checkout/${providerRef}`,
    };
  }

  verifyWebhookSignature(_payload: string, _signature: string | undefined): boolean {
    const provider = this.config.get('PAYMENT_PROVIDER', 'mock');
    if (provider === 'mock') return true;
    // Provider-specific HMAC verification
    return false;
  }

  generateMockProviderRef(): string {
    return `mock_${randomUUID()}`;
  }
}
