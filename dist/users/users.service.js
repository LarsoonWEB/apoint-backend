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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const helpers_1 = require("../common/utils/helpers");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                userType: true,
                isVerified: true,
                locale: true,
                timezone: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async updateProfile(userId, data) {
        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                userType: true,
                isVerified: true,
                locale: true,
                timezone: true,
            },
        });
    }
    async deleteAccount(userId) {
        await this.prisma.$transaction([
            this.prisma.booking.updateMany({
                where: { userId },
                data: {
                    userId: null,
                    guestName: null,
                    guestEmail: null,
                    guestPhone: null,
                },
            }),
            this.prisma.user.delete({
                where: { id: userId },
            }),
        ]);
        return { message: 'Account deleted successfully' };
    }
    async getUserBookings(userId, page = 1, perPage = 20, status) {
        const where = { userId };
        if (status === 'upcoming') {
            where.startTime = { gte: new Date() };
            where.status = { in: ['pending', 'confirmed'] };
        }
        else if (status === 'past') {
            where.OR = [
                { startTime: { lt: new Date() } },
                { status: { in: ['completed', 'cancelled_by_user', 'cancelled_by_provider', 'no_show'] } },
            ];
        }
        const [bookings, total] = await Promise.all([
            this.prisma.booking.findMany({
                where,
                skip: (page - 1) * perPage,
                take: perPage,
                orderBy: { startTime: status === 'past' ? 'desc' : 'asc' },
                include: {
                    business: { select: { id: true, name: true, slug: true, logoUrl: true } },
                    location: { select: { id: true, name: true, city: true, addressLine1: true } },
                    worker: { select: { id: true, displayName: true } },
                    bookingServices: { select: { serviceName: true, durationMinutes: true, price: true } },
                },
            }),
            this.prisma.booking.count({ where }),
        ]);
        return { data: bookings, meta: (0, helpers_1.paginate)(total, page, perPage) };
    }
    async getFavorites(userId, page = 1, perPage = 20) {
        const [favorites, total] = await Promise.all([
            this.prisma.favorite.findMany({
                where: { userId },
                skip: (page - 1) * perPage,
                take: perPage,
                orderBy: { createdAt: 'desc' },
                include: {
                    business: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            logoUrl: true,
                            coverPhotoUrl: true,
                            category: { select: { name: true, nameHr: true } },
                            locations: {
                                where: { isPrimary: true },
                                select: { city: true, addressLine1: true, latitude: true, longitude: true },
                                take: 1,
                            },
                        },
                    },
                },
            }),
            this.prisma.favorite.count({ where: { userId } }),
        ]);
        return { data: favorites, meta: (0, helpers_1.paginate)(total, page, perPage) };
    }
    async addFavorite(userId, businessId) {
        await this.prisma.favorite.upsert({
            where: { userId_businessId: { userId, businessId } },
            create: { userId, businessId },
            update: {},
        });
        return { message: 'Added to favorites' };
    }
    async removeFavorite(userId, businessId) {
        await this.prisma.favorite.deleteMany({
            where: { userId, businessId },
        });
        return { message: 'Removed from favorites' };
    }
    async getNotifications(userId, page = 1, perPage = 20) {
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                skip: (page - 1) * perPage,
                take: perPage,
                orderBy: { sentAt: 'desc' },
            }),
            this.prisma.notification.count({ where: { userId } }),
        ]);
        return { data: notifications, meta: (0, helpers_1.paginate)(total, page, perPage) };
    }
    async markNotificationRead(userId, notificationId) {
        await this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true, readAt: new Date() },
        });
        return { message: 'Notification marked as read' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map