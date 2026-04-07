import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
export declare class PaymentsService {
    private prisma;
    private configService;
    private eventEmitter;
    private readonly logger;
    private stripe;
    constructor(prisma: PrismaService, configService: ConfigService, eventEmitter: EventEmitter2);
    createConnectAccount(businessId: string, userId: string): Promise<{
        accountId: any;
        onboardingUrl: any;
    }>;
    getConnectAccountStatus(businessId: string): Promise<{
        connected: boolean;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted?: undefined;
    } | {
        connected: boolean;
        chargesEnabled: any;
        payoutsEnabled: any;
        detailsSubmitted: any;
    }>;
    createConnectLoginLink(businessId: string): Promise<{
        url: any;
    }>;
    createPaymentIntent(bookingId: string, type: 'deposit' | 'full_payment'): Promise<{
        clientSecret: any;
        paymentIntentId: any;
        amount: number;
        currency: string;
    }>;
    refund(bookingId: string, amount?: number, reason?: string): Promise<{
        refunded: boolean;
        results: any[];
    }>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<{
        received: boolean;
    }>;
    private handlePaymentSuccess;
    private handlePaymentFailed;
    private handleAccountUpdated;
}
