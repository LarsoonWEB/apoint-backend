import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // ── Webhook Verification (GET) ────────────────────────────

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.configService.get<string>('whatsapp.verifyToken');
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  // ── Incoming Message Handler ──────────────────────────────

  async handleIncomingMessage(body: any) {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.[0]) return; // Not a message event

    const message = value.messages[0];
    const from = message.from; // phone number
    const text = message.text?.body?.toLowerCase().trim();
    const phoneNumberId = value.metadata?.phone_number_id;

    if (!text || !from) return;

    this.logger.log(`WhatsApp message from ${from}: ${text}`);

    // Find business by WhatsApp number
    const business = await this.prisma.business.findFirst({
      where: { whatsappNumber: phoneNumberId, whatsappConnected: true },
    });

    if (!business) {
      this.logger.warn(`No business found for WhatsApp number: ${phoneNumberId}`);
      return;
    }

    // Get or create conversation state
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

    // Process based on conversation state
    let reply: string;

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

    // Send reply
    await this.sendMessage(from, reply);

    // Update last message timestamp
    await this.prisma.whatsappConversation.update({
      where: { id: convo.id },
      data: { lastMessageAt: new Date() },
    });
  }

  // ── Conversation State Handlers ───────────────────────────

  private async handleInitialState(business: any, convo: any, text: string): Promise<string> {
    // Keyword detection
    const bookingKeywords = ['termin', 'zakaži', 'booking', 'naruči', 'rezerviraj', 'book'];
    const infoKeywords = ['info', 'radno', 'cijena', 'price', 'usluge', 'services'];

    if (bookingKeywords.some((k) => text.includes(k))) {
      // Show services
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

    // Default response
    return `Pozdrav! 👋 Dobrodošli u ${business.name}.\n\nPošaljite:\n• "termin" — za zakazivanje\n• "info" — za informacije\n\nIli posjetite: apoint.hr/${business.slug}`;
  }

  private async handleServiceSelection(business: any, convo: any, text: string): Promise<string> {
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

  private async handleDateSelection(business: any, convo: any, text: string): Promise<string> {
    // Parse Croatian date format DD.MM.YYYY
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

    // For MVP, suggest a link to complete booking in the app
    await this.prisma.whatsappConversation.update({
      where: { id: convo.id },
      data: {
        conversationState: 'initial',
        selectedSlot: date,
      },
    });

    return `Za završetak zakazivanja za ${day}.${month}.${year}, posjetite:\n\n🔗 apoint.hr/${business.slug}\n\nTamo možete odabrati točan termin i potvrditi rezervaciju. Hvala! 🙏`;
  }

  private async handleConfirmation(business: any, convo: any, text: string): Promise<string> {
    // Reset conversation
    await this.prisma.whatsappConversation.update({
      where: { id: convo.id },
      data: { conversationState: 'initial' },
    });

    return 'Hvala! Za novi termin, pošaljite "termin".';
  }

  // ── Send Message via Meta Cloud API ───────────────────────

  private async sendMessage(to: string, text: string) {
    const phoneNumberId = this.configService.get<string>('whatsapp.phoneNumberId');
    const accessToken = this.configService.get<string>('whatsapp.accessToken');

    if (!phoneNumberId || !accessToken) {
      this.logger.warn('WhatsApp not configured — message not sent');
      return;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
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
        },
      );

      if (!response.ok) {
        this.logger.error(`WhatsApp API error: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message', error);
    }
  }
}
