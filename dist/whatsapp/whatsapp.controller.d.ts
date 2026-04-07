import { WhatsappService } from './whatsapp.service';
export declare class WhatsappController {
    private whatsappService;
    constructor(whatsappService: WhatsappService);
    verifyWebhook(mode: string, token: string, challenge: string, res: any): Promise<any>;
    handleWebhook(body: any): Promise<string>;
}
