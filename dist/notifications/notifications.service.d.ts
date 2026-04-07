import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    onBookingCreated(payload: any): Promise<void>;
    onBookingConfirmed(payload: any): Promise<void>;
    onBookingCancelled(payload: any): Promise<void>;
    onBookingRescheduled(payload: any): Promise<void>;
    onBookingCompleted(payload: any): Promise<void>;
    onBookingRejected(payload: any): Promise<void>;
    onPaymentSucceeded(payload: any): Promise<void>;
    onUserRegistered(payload: any): Promise<void>;
    onWorkerInvited(payload: any): Promise<void>;
    private createNotification;
    private sendPushNotification;
    registerDeviceToken(userId: string, token: string, platform: string): Promise<{
        message: string;
    }>;
    unregisterDeviceToken(token: string): Promise<{
        message: string;
    }>;
}
