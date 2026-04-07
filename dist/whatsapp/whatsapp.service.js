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
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let WhatsappService = WhatsappService_1 = class WhatsappService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(WhatsappService_1.name);
    }
    verifyWebhook(mode, token, challenge) {
        const verifyToken = this.configService.get('whatsapp.verifyToken');
        if (mode === 'subscribe' && token === verifyToken) {
            return challenge;
        }
        return null;
    }
    async handleIncomingMessage(body) {
        const entry = body?.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        if (!value?.messages?.[0])
            return;
        const message = value.messages[0];
        const from = message.from;
        const text = message.text?.body?.toLowerCase().trim();
        const phoneNumberId = value.metadata?.phone_number_id;
        if (!text || !from)
            return;
        this.logger.log(`WhatsApp message from ${from}: ${text}`);
        const business = await this.prisma.business.findFirst({
            where: { whatsappNumber: phoneNumberId, whatsappConnected: true },
        });
        if (!business) {
            this.logger.warn(`No business found for WhatsApp number: ${phoneNumberId}`);
            return;
        }
        let convo = await this.prisma.whatsappConversation.findFirst({
            where: { businessId: business.id, waPhoneNumber: from },
        });
        if (!convo) {
            convo = await this.prisma.whatsappConversation.create({
                data: {
                    businessId: business.id,
                    waPhoneNumber: from,
                    conversationState: 'initial',
                },
            });
        }
        let reply;
        switch (convo.conversationState) {
            case 'initial':
                reply = await this.handleInitialState(business, convo, text);
                break;
            case 'awaiting_service':
                reply = await this.handleServiceSelection(business, convo, text);
                break;
            case 'awaiting_date':
                reply = await this.handleDateSelection(business, convo, text);
                break;
            case 'awaiting_confirmation':
                reply = await this.handleConfirmation(business, convo, text);
                break;
            default:
                reply = await this.handleInitialState(business, convo, text);
        }
        await this.sendMessage(from, reply);
        await this.prisma.whatsappConversation.update({
            where: { id: convo.id },
            data: { lastMessageAt: new Date() },
        });
    }
    async handleInitialState(business, convo, text) {
        const bookingKeywords = ['termin', 'zakaži', 'booking', 'naruči', 'rezerviraj', 'book'];
        const infoKeywords = ['info', 'radno', 'cijena', 'price', 'usluge', 'services'];
        if (bookingKeywords.some((k) => text.includes(k))) {
            const services = await this.prisma.service.findMany({
                where: { businessId: business.id, isActive: true },
                orderBy: { sortOrder: 'asc' },
            });
            if (services.length === 0) {
                return `Pozdrav! ${business.name} trenutno nema dostupnih usluga za online zakazivanje. Javite nam se direktno za više informacija.`;
            }
            const serviceList = services
                .map((s, i) => `${i + 1}. ${s.name} (${s.durationMinutes} min, €${s.price})`)
                .join('\n');
            await this.prisma.whatsappConversation.update({
                where: { id: convo.id },
                data: { conversationState: 'awaiting_service' },
            });
            return `Pozdrav! 👋 Dobrodošli u ${business.name}.\n\nOdaberite uslugu (pošaljite broj):\n\n${serviceList}`;
        }
        if (infoKeywords.some((k) => text.includes(k))) {
            return `ℹ️ ${business.name}\n\nZa zakazivanje termina, pošaljite "termin" ili posjetite:\napoint.hr/${business.slug}`;
        }
        return `Pozdrav! 👋 Dobrodošli u ${business.name}.\n\nPošaljite:\n• "termin" — za zakazivanje\n• "info" — za informacije\n\nIli posjetite: apoint.hr/${business.slug}`;
    }
    async handleServiceSelection(business, convo, text) {
        const services = await this.prisma.service.findMany({
            where: { businessId: business.id, isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        const index = parseInt(text) - 1;
        if (isNaN(index) || index < 0 || index >= services.length) {
            return `Molimo pošaljite broj usluge (1-${services.length}).`;
        }
        const selected = services[index];
        await this.prisma.whatsappConversation.update({
            where: { id: convo.id },
            data: {
                conversationState: 'awaiting_date',
                selectedServiceId: selected.id,
            },
        });
        return `Odabrali ste: ${selected.name} (${selected.durationMinutes} min, €${selected.price})\n\nKoji datum želite? (format: DD.MM.YYYY)\nNpr: 15.04.2026`;
    }
    async handleDateSelection(business, convo, text) {
        const match = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (!match) {
            return 'Molimo unesite datum u formatu DD.MM.YYYY (npr: 15.04.2026)';
        }
        const [, day, month, year] = match;
        const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const date = new Date(dateStr);
        if (isNaN(date.getTime()) || date < new Date()) {
            return 'Datum nije valjan ili je u prošlosti. Molimo unesite budući datum.';
        }
        await this.prisma.whatsappConversation.update({
            where: { id: convo.id },
            data: {
                conversationState: 'initial',
                selectedSlot: date,
            },
        });
        return `Za završetak zakazivanja za ${day}.${month}.${year}, posjetite:\n\n🔗 apoint.hr/${business.slug}\n\nTamo možete odabrati točan termin i potvrditi rezervaciju. Hvala! 🙏`;
    }
    async handleConfirmation(business, convo, text) {
        await this.prisma.whatsappConversation.update({
            where: { id: convo.id },
            data: { conversationState: 'initial' },
        });
        return 'Hvala! Za novi termin, pošaljite "termin".';
    }
    async sendMessage(to, text) {
        const phoneNumberId = this.configService.get('whatsapp.phoneNumberId');
        const accessToken = this.configService.get('whatsapp.accessToken');
        if (!phoneNumberId || !accessToken) {
            this.logger.warn('WhatsApp not configured — message not sent');
            return;
        }
        try {
            const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to,
                    type: 'text',
                    text: { body: text },
                }),
            });
            if (!response.ok) {
                this.logger.error(`WhatsApp API error: ${response.status}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to send WhatsApp message', error);
        }
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map