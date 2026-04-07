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
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CalendarService = class CalendarService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDayView(businessId, date, workerId) {
        const dayStart = new Date(`${date}T00:00:00Z`);
        const dayEnd = new Date(`${date}T23:59:59Z`);
        const where = {
            businessId,
            startTime: { gte: dayStart },
            endTime: { lte: dayEnd },
            status: {
                notIn: [
                    client_1.BookingStatus.CANCELLED_BY_USER,
                    client_1.BookingStatus.CANCELLED_BY_PROVIDER,
                    client_1.BookingStatus.REJECTED,
                ],
            },
        };
        if (workerId)
            where.workerId = workerId;
        const bookings = await this.prisma.booking.findMany({
            where,
            orderBy: { startTime: 'asc' },
            include: {
                user: { select: { firstName: true, lastName: true, phone: true } },
                worker: { select: { id: true, displayName: true } },
                bookingServices: { select: { serviceName: true, durationMinutes: true } },
            },
        });
        const blockedSlots = await this.prisma.blockedSlot.findMany({
            where: {
                OR: [
                    { location: { businessId } },
                    workerId ? { workerId } : {},
                ],
                startTime: { lte: dayEnd },
                endTime: { gte: dayStart },
            },
        });
        return { date, bookings, blockedSlots };
    }
    async getWeekView(businessId, startDate, workerId) {
        const weekStart = new Date(startDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const where = {
            businessId,
            startTime: { gte: weekStart },
            endTime: { lte: weekEnd },
            status: {
                notIn: [
                    client_1.BookingStatus.CANCELLED_BY_USER,
                    client_1.BookingStatus.CANCELLED_BY_PROVIDER,
                    client_1.BookingStatus.REJECTED,
                ],
            },
        };
        if (workerId)
            where.workerId = workerId;
        const bookings = await this.prisma.booking.findMany({
            where,
            orderBy: { startTime: 'asc' },
            include: {
                user: { select: { firstName: true, lastName: true } },
                worker: { select: { id: true, displayName: true } },
                bookingServices: { select: { serviceName: true } },
            },
        });
        const days = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            days[d.toISOString().split('T')[0]] = [];
        }
        for (const b of bookings) {
            const key = b.startTime.toISOString().split('T')[0];
            if (days[key])
                days[key].push(b);
        }
        return { startDate, days };
    }
    async getMonthView(businessId, year, month) {
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59);
        const bookings = await this.prisma.booking.groupBy({
            by: ['status'],
            where: {
                businessId,
                startTime: { gte: monthStart },
                endTime: { lte: monthEnd },
            },
            _count: true,
        });
        const dailyCounts = await this.prisma.$queryRaw `
      SELECT DATE(start_time AT TIME ZONE 'Europe/Zagreb') as date, COUNT(*) as count
      FROM bookings
      WHERE business_id = ${businessId}::uuid
        AND start_time >= ${monthStart}
        AND start_time <= ${monthEnd}
        AND status NOT IN ('cancelled_by_user', 'cancelled_by_provider', 'rejected')
      GROUP BY DATE(start_time AT TIME ZONE 'Europe/Zagreb')
      ORDER BY date
    `;
        return {
            year,
            month,
            summary: bookings,
            dailyCounts: dailyCounts.map((d) => ({
                date: d.date,
                count: Number(d.count),
            })),
        };
    }
    async addBlockedSlot(data) {
        return this.prisma.blockedSlot.create({
            data: {
                locationId: data.locationId,
                workerId: data.workerId,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                reason: data.reason,
                isRecurring: data.isRecurring || false,
            },
        });
    }
    async removeBlockedSlot(id) {
        await this.prisma.blockedSlot.delete({ where: { id } });
        return { message: 'Blocked slot removed' };
    }
    async getBlockedSlots(businessId, workerId) {
        const where = {};
        if (workerId) {
            where.workerId = workerId;
        }
        else {
            where.location = { businessId };
        }
        return this.prisma.blockedSlot.findMany({
            where,
            orderBy: { startTime: 'asc' },
        });
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map