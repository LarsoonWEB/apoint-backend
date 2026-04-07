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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async onBookingCreated(payload) {
        const { booking, userId, businessId } = payload;
        if (userId) {
            await this.createNotification({
                userId,
                type: 'booking_created',
                title: 'Termin zakazan!',
                body: `Vaš termin kod ${booking.business?.name || 'pružatelja'} je ${booking.status === 'confirmed' ? 'potvrđen' : 'na čekanju'}.`,
                channel: 'push',
                data: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
            });
        }
        const workers = await this.prisma.worker.findMany({
            where: {
                businessId,
                businessRole: { in: ['owner', 'admin'] },
                isActive: true,
            },
            select: { userId: true },
        });
        for (const worker of workers) {
            await this.createNotification({
                userId: worker.userId,
                type: 'new_booking',
                title: 'Novi termin!',
                body: `Novi termin zakazan za ${new Date(booking.startTime).toLocaleString('hr-HR')}.`,
                channel: 'push',
                data: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
            });
        }
    }
    async onBookingConfirmed(payload) {
        const { booking } = payload;
        if (booking.userId) {
            await this.createNotification({
                userId: booking.userId,
                type: 'booking_confirmed',
                title: 'Termin potvrđen!',
                body: `Vaš termin ${booking.bookingNumber} je potvrđen.`,
                channel: 'push',
                data: { bookingId: booking.id },
            });
        }
    }
    async onBookingCancelled(payload) {
        const { booking, cancelledBy } = payload;
        if (cancelledBy === 'user') {
            const workers = await this.prisma.worker.findMany({
                where: {
                    businessId: booking.businessId,
                    businessRole: { in: ['owner', 'admin'] },
                    isActive: true,
                },
                select: { userId: true },
            });
            for (const worker of workers) {
                await this.createNotification({
                    userId: worker.userId,
                    type: 'booking_cancelled',
                    title: 'Termin otkazan',
                    body: `Termin ${booking.bookingNumber} je otkazan od strane korisnika.`,
                    channel: 'push',
                    data: { bookingId: booking.id },
                });
            }
        }
        else {
            if (booking.userId) {
                await this.createNotification({
                    userId: booking.userId,
                    type: 'booking_cancelled',
                    title: 'Termin otkazan',
                    body: `Vaš termin ${booking.bookingNumber} je otkazan od strane pružatelja.`,
                    channel: 'push',
                    data: { bookingId: booking.id },
                });
            }
        }
    }
    async onBookingRescheduled(payload) {
        const { oldBooking, newBooking } = payload;
        if (newBooking.userId) {
            await this.createNotification({
                userId: newBooking.userId,
                type: 'booking_rescheduled',
                title: 'Termin premješten',
                body: `Vaš termin je premješten na ${new Date(newBooking.startTime).toLocaleString('hr-HR')}.`,
                channel: 'push',
                data: { bookingId: newBooking.id },
            });
        }
    }
    async onBookingCompleted(payload) {
        const { booking } = payload;
        if (booking.userId) {
            await this.createNotification({
                userId: booking.userId,
                type: 'booking_completed',
                title: 'Termin završen',
                body: 'Kako je prošlo? Ostavite recenziju!',
                channel: 'push',
                data: { bookingId: booking.id, action: 'review' },
            });
        }
    }
    async onBookingRejected(payload) {
        const { booking } = payload;
        if (booking.userId) {
            await this.createNotification({
                userId: booking.userId,
                type: 'booking_rejected',
                title: 'Termin odbijen',
                body: `Nažalost, vaš termin ${booking.bookingNumber} je odbijen.`,
                channel: 'push',
                data: { bookingId: booking.id },
            });
        }
    }
    async onPaymentSucceeded(payload) {
        const { bookingId, amount, type } = payload;
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (booking?.userId) {
            await this.createNotification({
                userId: booking.userId,
                type: 'payment_success',
                title: 'Plaćanje uspješno',
                body: `Uplata od €${amount} za termin ${booking.bookingNumber} je uspješna.`,
                channel: 'push',
                data: { bookingId },
            });
        }
    }
    async onUserRegistered(payload) {
        const { userId, email, firstName } = payload;
        this.logger.log(`Welcome email queued for ${email}`);
        await this.createNotification({
            userId,
            type: 'welcome',
            title: 'Dobrodošli u aPoint!',
            body: `Bok ${firstName}! Vaš račun je kreiran. Istražite lokalne usluge i zakažite prvi termin.`,
            channel: 'push',
            data: {},
        });
    }
    async onWorkerInvited(payload) {
        this.logger.log(`Worker invitation email queued for ${payload.email}`);
    }
    async createNotification(data) {
        try {
            const notification = await this.prisma.notification.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    body: data.body,
                    channel: data.channel,
                    data: data.data || {},
                },
            });
            if (data.channel === 'push') {
                await this.sendPushNotification(data.userId, {
                    title: data.title,
                    body: data.body,
                    data: data.data,
                });
            }
            return notification;
        }
        catch (error) {
            this.logger.error('Failed to create notification', error);
        }
    }
    async sendPushNotification(userId, payload) {
        const tokens = await this.prisma.deviceToken.findMany({
            where: { userId },
        });
        if (tokens.length === 0)
            return;
        this.logger.log(`Push → user:${userId} | ${payload.title}: ${payload.body} | devices:${tokens.length}`);
    }
    async registerDeviceToken(userId, token, platform) {
        await this.prisma.deviceToken.upsert({
            where: { token },
            create: { userId, token, platform },
            update: { userId, platform },
        });
        return { message: 'Device registered' };
    }
    async unregisterDeviceToken(token) {
        await this.prisma.deviceToken.deleteMany({ where: { token } });
        return { message: 'Device unregistered' };
    }
};
exports.NotificationsService = NotificationsService;
__decorate([
    (0, event_emitter_1.OnEvent)('booking.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onBookingCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.confirmed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onBookingConfirmed", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.cancelled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onBookingCancelled", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.rescheduled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onBookingRescheduled", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onBookingCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.rejected'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onBookingRejected", null);
__decorate([
    (0, event_emitter_1.OnEvent)('payment.succeeded'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onPaymentSucceeded", null);
__decorate([
    (0, event_emitter_1.OnEvent)('user.registered'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onUserRegistered", null);
__decorate([
    (0, event_emitter_1.OnEvent)('worker.invited'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onWorkerInvited", null);
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map