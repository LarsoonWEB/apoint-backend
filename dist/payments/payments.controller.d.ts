import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    createConnectAccount(businessId: string, userId: string): Promise<{
        accountId: any;
        onboardingUrl: any;
    }>;
    getConnectStatus(businessId: string): Promise<{
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
    getConnectDashboard(businessId: string): Promise<{
        url: any;
    }>;
    connectRefresh(businessId: string): Promise<{
        message: string;
    }>;
    createPaymentIntent(bookingId: string, body: {
        type: 'deposit' | 'full_payment';
    }): Promise<{
        clientSecret: any;
        paymentIntentId: any;
        amount: number;
        currency: string;
    }>;
    refund(bookingId: string, body: {
        amount?: number;
        reason?: string;
    }): Promise<{
        refunded: boolean;
        results: any[];
    }>;
    webhook(req: any, signature: string): Promise<{
        received: boolean;
    } | {
        error: string;
    }>;
}
