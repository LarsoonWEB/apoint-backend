"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const StripeLib = require('stripe');
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, configService, eventEmitter) {
        this.prisma = prisma;
        this.configService = configService;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(PaymentsService_1.name);
        const secretKey = this.configService.get('stripe.secretKey');
        if (secretKey) {
            this.stripe = new StripeLib(secretKey, { apiVersion: '2024-12-18.acacia' });
        }
        else {
            this.logger.warn('Stripe not configured — payments disabled');
        }
    }
    async createConnectAccount(businessId, userId) {
        if (!this.stripe)
            throw new common_1.BadRequestException('Payments not configured');
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            include: { owner: true },
        });
        if (!business)
            throw new common_1.NotFoundException('Business not found');
        if (business.ownerId !== userId) {
            throw new common_1.BadRequestException('Only the business owner can set up payments');
        }
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
        await this.prisma.business.update({
            where: { id: businessId },
            data: { stripeAccountId: account.id },
        });
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
    async getConnectAccountStatus(businessId) {
        if (!this.stripe)
            throw new common_1.BadRequestException('Payments not configured');
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business?.stripeAccountId) {
            return { connected: false, chargesEnabled: false, payoutsEnabled: false };
        }
        const account = await this.stripe.accounts.retrieve(business.stripeAccountId);
        return {
            connected: true,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
        };
    }
    async createConnectLoginLink(businessId) {
        if (!this.stripe)
            throw new common_1.BadRequestException('Payments not configured');
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business?.stripeAccountId) {
            throw new common_1.BadRequestException('Stripe account not connected');
        }
        const loginLink = await this.stripe.accounts.createLoginLink(business.stripeAccountId);
        return { url: loginLink.url };
    }
    async createPaymentIntent(bookingId, type) {
        if (!this.stripe)
            throw new common_1.BadRequestException('Payments not configured');
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { business: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (!booking.business.stripeAccountId) {
            throw new common_1.BadRequestException('Provider has not set up payments');
        }
        const amount = type === 'deposit'
            ? Number(booking.depositAmount)
            : Number(booking.totalPrice);
        if (amount <= 0) {
            throw new common_1.BadRequestException('No payment required');
        }
        const feePercent = this.configService.get('stripe.platformFeePercent') || 0;
        const platformFee = Math.round(amount * (feePercent / 100) * 100);
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
    async refund(bookingId, amount, reason) {
        if (!this.stripe)
            throw new common_1.BadRequestException('Payments not configured');
        const payments = await this.prisma.payment.findMany({
            where: {
                bookingId,
                status: 'succeeded',
            },
        });
        if (payments.length === 0) {
            throw new common_1.BadRequestException('No successful payments to refund');
        }
        const results = [];
        for (const payment of payments) {
            if (!payment.stripePaymentIntentId)
                continue;
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
        await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                paymentStatus: amount
                    ? client_1.PaymentStatus.PARTIALLY_REFUNDED
                    : client_1.PaymentStatus.REFUNDED,
            },
        });
        return { refunded: true, results };
    }
    async handleWebhook(rawBody, signature) {
        if (!this.stripe)
            return;
        const webhookSecret = this.configService.get('stripe.webhookSecret');
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        }
        catch (err) {
            this.logger.error('Webhook signature verification failed', err);
            throw new common_1.BadRequestException('Invalid webhook signature');
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
    async handlePaymentSuccess(paymentIntent) {
        const payment = await this.prisma.payment.findUnique({
            where: { stripePaymentIntentId: paymentIntent.id },
        });
        if (!payment)
            return;
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'succeeded' },
        });
        const type = paymentIntent.metadata.type;
        const paymentStatus = type === 'deposit' ? client_1.PaymentStatus.DEPOSIT_PAID : client_1.PaymentStatus.FULLY_PAID;
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
    async handlePaymentFailed(paymentIntent) {
        const payment = await this.prisma.payment.findUnique({
            where: { stripePaymentIntentId: paymentIntent.id },
        });
        if (!payment)
            return;
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'failed' },
        });
        this.eventEmitter.emit('payment.failed', {
            bookingId: payment.bookingId,
        });
    }
    async handleAccountUpdated(account) {
        if (!account.metadata?.businessId)
            return;
        this.logger.log(`Account ${account.id} updated: charges_enabled=${account.charges_enabled}`);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        event_emitter_1.EventEmitter2])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map