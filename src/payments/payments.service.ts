import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, BookingStatus } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const StripeLib = require('stripe');

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (secretKey) {
      this.stripe = new StripeLib(secretKey, { apiVersion: '2024-12-18.acacia' });
    } else {
      this.logger.warn('Stripe not configured — payments disabled');
    }
  }

  // ── Stripe Connect: Onboard Provider ──────────────────────

  async createConnectAccount(businessId: string, userId: string) {
    if (!this.stripe) throw new BadRequestException('Payments not configured');

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: true },
    });
    if (!business) throw new NotFoundException('Business not found');
    if (business.ownerId !== userId) {
      throw new BadRequestException('Only the business owner can set up payments');
    }

    // Create Stripe Express account
    const account = await this.stripe.accounts.create({
      type: 'express',
      country: 'HR',
      email: business.owner.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        businessId,
        userId,
      },
    });

    // Save Stripe account ID
    await this.prisma.business.update({
      where: { id: businessId },
      data: { stripeAccountId: account.id },
    });

    // Create onboarding link
    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${this.configService.get('app.apiUrl')}/api/v1/payments/connect/refresh?business_id=${businessId}`,
      return_url: `${this.configService.get('app.appScheme')}payments/connect/success?business_id=${businessId}`,
      type: 'account_onboarding',
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  }

  async getConnectAccountStatus(businessId: string) {
    if (!this.stripe) throw new BadRequestException('Payments not configured');

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business?.stripeAccountId) {
      return { connected: false, chargesEnabled: false, payoutsEnabled: false };
    }

    const account = await this.stripe.accounts.retrieve(
      business.stripeAccountId,
    );

    return {
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };
  }

  async createConnectLoginLink(businessId: string) {
    if (!this.stripe) throw new BadRequestException('Payments not configured');

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business?.stripeAccountId) {
      throw new BadRequestException('Stripe account not connected');
    }

    const loginLink = await this.stripe.accounts.createLoginLink(
      business.stripeAccountId,
    );
    return { url: loginLink.url };
  }

  // ── Create Payment Intent ─────────────────────────────────

  async createPaymentIntent(bookingId: string, type: 'deposit' | 'full_payment') {
    if (!this.stripe) throw new BadRequestException('Payments not configured');

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!booking.business.stripeAccountId) {
      throw new BadRequestException('Provider has not set up payments');
    }

    const amount =
      type === 'deposit'
        ? Number(booking.depositAmount)
        : Number(booking.totalPrice);

    if (amount <= 0) {
      throw new BadRequestException('No payment required');
    }

    // Calculate platform fee
    const feePercent = this.configService.get<number>('stripe.platformFeePercent') || 0;
    const platformFee = Math.round(amount * (feePercent / 100) * 100); // in cents
    const amountCents = Math.round(amount * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: booking.business.stripeAccountId,
      },
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        businessId: booking.businessId,
        type,
      },
    });

    // Record payment in DB
    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency: 'EUR',
        type,
        status: 'pending',
        platformFee: platformFee / 100,
        providerPayout: (amountCents - platformFee) / 100,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency: 'EUR',
    };
  }

  // ── Refund ────────────────────────────────────────────────

  async refund(bookingId: string, amount?: number, reason?: string) {
    if (!this.stripe) throw new BadRequestException('Payments not configured');

    const payments = await this.prisma.payment.findMany({
      where: {
        bookingId,
        status: 'succeeded',
      },
    });

    if (payments.length === 0) {
      throw new BadRequestException('No successful payments to refund');
    }

    const results: any[] = [];

    for (const payment of payments) {
      if (!payment.stripePaymentIntentId) continue;

      const refundAmount = amount
        ? Math.round(amount * 100)
        : Math.round(Number(payment.amount) * 100);

      const refund = await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: refundAmount,
        reason: 'requested_by_customer',
      });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'refunded',
          refundAmount: refundAmount / 100,
          refundReason: reason || 'Booking cancelled',
        },
      });

      results.push(refund);
    }

    // Update booking payment status
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: amount
          ? PaymentStatus.PARTIALLY_REFUNDED
          : PaymentStatus.REFUNDED,
      },
    });

    return { refunded: true, results };
  }

  // ── Stripe Webhook Handler ────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) return;

    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret!,
      );
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      case 'account.updated':
        await this.handleAccountUpdated(event.data.object);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });
    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'succeeded' },
    });

    const type = paymentIntent.metadata.type;
    const paymentStatus =
      type === 'deposit' ? PaymentStatus.DEPOSIT_PAID : PaymentStatus.FULLY_PAID;

    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: { paymentStatus },
    });

    this.eventEmitter.emit('payment.succeeded', {
      bookingId: payment.bookingId,
      amount: payment.amount,
      type,
    });
  }

  private async handlePaymentFailed(paymentIntent: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });
    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'failed' },
    });

    this.eventEmitter.emit('payment.failed', {
      bookingId: payment.bookingId,
    });
  }

  private async handleAccountUpdated(account: any) {
    if (!account.metadata?.businessId) return;

    this.logger.log(
      `Account ${account.id} updated: charges_enabled=${account.charges_enabled}`,
    );
  }
}
