import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class WhatsappService {
    private prisma;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    verifyWebhook(mode: string, token: string, challenge: string): string | null;
    handleIncomingMessage(body: any): Promise<void>;
    private handleInitialState;
    private handleServiceSelection;
    private handleDateSelection;
    private handleConfirmation;
    private sendMessage;
}
