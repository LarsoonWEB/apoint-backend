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
var BookingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../common/redis.service");
const helpers_1 = require("../common/utils/helpers");
const client_1 = require("@prisma/client");
let BookingsService = BookingsService_1 = class BookingsService {
    constructor(prisma, redis, eventEmitter) {
        this.prisma = prisma;
        this.redis = redis;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(BookingsService_1.name);
    }
    async getAvailableSlots(businessId, workerId, date, serviceIds) {
        const services = await this.prisma.service.findMany({
            where: { id: { in: serviceIds }, businessId, isActive: true },
        });
        if (services.length !== serviceIds.length) {
            throw new common_1.BadRequestException('One or more services not found');
        }
        const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
        const worker = await this.prisma.worker.findUnique({
            where: { id: workerId },
            include: {
                workerLocations: {
                    include: {
                        location: {
                            include: { workingHours: true },
                        },
                    },
                },
            },
        });
        if (!worker)
            throw new common_1.NotFoundException('Worker not found');
        const targetDate = new Date(date);
        const dayOfWeek = (targetDate.getDay() + 6) % 7;
        const windows = [];
        for (const wl of worker.workerLocations) {
            const wh = wl.location.workingHours.find((h) => h.dayOfWeek === dayOfWeek && !h.isClosed);
            if (wh) {
                windows.push({
                    locationId: wl.locationId,
                    openMin: (0, helpers_1.timeToMinutes)(wh.openTime),
                    closeMin: (0, helpers_1.timeToMinutes)(wh.closeTime),
                    breakStartMin: wh.breakStart ? (0, helpers_1.timeToMinutes)(wh.breakStart) : undefined,
                    breakEndMin: wh.breakEnd ? (0, helpers_1.timeToMinutes)(wh.breakEnd) : undefined,
                });
            }
        }
        if (windows.length === 0) {
            return { date, slots: [], totalDuration };
        }
        const dayStart = new Date(`${date}T00:00:00Z`);
        const dayEnd = new Date(`${date}T23:59:59Z`);
        const existingBookings = await this.prisma.booking.findMany({
            where: {
                workerId,
                startTime: { gte: dayStart },
                endTime: { lte: dayEnd },
                status: {
                    in: [
                        client_1.BookingStatus.PENDING,
                        client_1.BookingStatus.CONFIRMED,
                        client_1.BookingStatus.IN_PROGRESS,
                    ],
                },
            },
            select: { startTime: true, endTime: true },
        });
        const blockedSlots = await this.prisma.blockedSlot.findMany({
            where: {
                workerId,
                startTime: { lte: dayEnd },
                endTime: { gte: dayStart },
            },
        });
        const slots = [];
        const slotInterval = 15;
        for (const window of windows) {
            let currentMin = window.openMin;
            const maxStartMin = window.closeMin - totalDuration;
            while (currentMin <= maxStartMin) {
                const slotEnd = currentMin + totalDuration;
                if (window.breakStartMin !== undefined &&
                    window.breakEndMin !== undefined) {
                    if (currentMin < window.breakEndMin && slotEnd > window.breakStartMin) {
                        currentMin = window.breakEndMin;
                        continue;
                    }
                }
                const slotStartTime = new Date(`${date}T${minutesToTimeStr(currentMin)}:00Z`);
                const slotEndTime = new Date(`${date}T${minutesToTimeStr(slotEnd)}:00Z`);
                const hasConflict = existingBookings.some((b) => slotStartTime < b.endTime && slotEndTime > b.startTime);
                const isBlocked = blockedSlots.some((b) => slotStartTime < b.endTime && slotEndTime > b.startTime);
                const isLocked = await this.redis.isSlotLocked(workerId, slotStartTime.toISOString());
                if (!hasConflict && !isBlocked && !isLocked) {
                    slots.push({
                        time: minutesToTimeStr(currentMin),
                        locationId: window.locationId,
                    });
                }
                currentMin += slotInterval;
            }
        }
        return { date, slots, totalDuration, services };
    }
    async create(userId, data) {
        const { businessId, workerId, locationId, serviceIds, startTime, guestName, guestEmail, guestPhone, notes, customerAddress, customerAddressLat, customerAddressLng, source, } = data;
        const services = await this.prisma.service.findMany({
            where: { id: { in: serviceIds }, businessId, isActive: true },
        });
        if (services.length !== serviceIds.length) {
            throw new common_1.BadRequestException('One or more services not found');
        }
        const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
        const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
        const start = new Date(startTime);
        const end = new Date(start.getTime() + totalDuration * 60000);
        const lockAcquired = await this.redis.acquireSlotLock(workerId, start.toISOString());
        if (!lockAcquired) {
            throw new common_1.ConflictException({
                code: 'SLOT_LOCKED',
                message: 'This time slot is currently being booked by another user',
            });
        }
        try {
            const conflicting = await this.prisma.booking.findFirst({
                where: {
                    workerId,
                    status: {
                        in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.IN_PROGRESS],
                    },
                    startTime: { lt: end },
                    endTime: { gt: start },
                },
            });
            if (conflicting) {
                throw new common_1.ConflictException({
                    code: 'SLOT_TAKEN',
                    message: 'This time slot is no longer available',
                });
            }
            const business = await this.prisma.business.findUnique({
                where: { id: businessId },
            });
            if (!business)
                throw new common_1.NotFoundException('Business not found');
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            const dailyCount = await this.prisma.booking.count({
                where: {
                    createdAt: { gte: todayStart, lte: todayEnd },
                },
            });
            const bookingNumber = (0, helpers_1.generateBookingNumber)(dailyCount + 1);
            const initialStatus = business.bookingMode === 'instant'
                ? client_1.BookingStatus.CONFIRMED
                : client_1.BookingStatus.PENDING;
            let depositAmount = 0;
            if (business.depositType === 'fixed') {
                depositAmount = Number(business.depositAmount);
            }
            else if (business.depositType === 'percentage') {
                depositAmount = totalPrice * (Number(business.depositAmount) / 100);
            }
            const booking = await this.prisma.booking.create({
                data: {
                    bookingNumber,
                    userId,
                    businessId,
                    locationId,
                    workerId,
                    startTime: start,
                    endTime: end,
                    durationMinutes: totalDuration,
                    status: initialStatus,
                    guestName,
                    guestEmail,
                    guestPhone,
                    totalPrice,
                    depositAmount,
                    paymentStatus: client_1.PaymentStatus.NONE,
                    notes,
                    customerAddress,
                    customerAddressLat,
                    customerAddressLng,
                    source: source || 'app',
                    bookingServices: {
                        create: services.map((s, i) => ({
                            serviceId: s.id,
                            serviceName: s.name,
                            durationMinutes: s.durationMinutes,
                            price: s.price,
                            sortOrder: i,
                        })),
                    },
                },
                include: {
                    bookingServices: true,
                    business: { select: { name: true, slug: true } },
                    worker: { select: { displayName: true } },
                    location: { select: { name: true, addressLine1: true, city: true } },
                },
            });
            this.eventEmitter.emit('booking.created', {
                booking,
                userId,
                businessId,
            });
            return booking;
        }
        finally {
            await this.redis.releaseSlotLock(workerId, start.toISOString());
        }
    }
    async findById(bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                bookingServices: true,
                business: { select: { id: true, name: true, slug: true, logoUrl: true, cancellationHours: true } },
                worker: { select: { id: true, displayName: true } },
                location: { select: { id: true, name: true, addressLine1: true, city: true } },
                payments: true,
                review: true,
            },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        return booking;
    }
    async findByNumber(bookingNumber) {
        const booking = await this.prisma.booking.findUnique({
            where: { bookingNumber },
            include: {
                bookingServices: true,
                business: { select: { id: true, name: true, slug: true } },
                worker: { select: { id: true, displayName: true } },
                location: { select: { id: true, name: true, addressLine1: true, city: true } },
            },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        return booking;
    }
    async cancel(bookingId, userId, reason) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { business: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        const isUser = booking.userId === userId;
        const isProvider = await this.prisma.worker.findFirst({
            where: { userId, businessId: booking.businessId, isActive: true },
        });
        if (!isUser && !isProvider) {
            throw new common_1.ForbiddenException('Not authorized to cancel this booking');
        }
        const cancellableStatuses = [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED];
        if (!cancellableStatuses.includes(booking.status)) {
            throw new common_1.BadRequestException({
                code: 'NOT_CANCELLABLE',
                message: `Cannot cancel a booking with status: ${booking.status}`,
            });
        }
        const status = isUser
            ? client_1.BookingStatus.CANCELLED_BY_USER
            : client_1.BookingStatus.CANCELLED_BY_PROVIDER;
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status,
                cancellationReason: reason,
                cancelledAt: new Date(),
            },
        });
        const hoursUntilBooking = (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
        const isWithinPolicy = hoursUntilBooking >= booking.business.cancellationHours;
        this.eventEmitter.emit('booking.cancelled', {
            booking: updated,
            cancelledBy: isUser ? 'user' : 'provider',
            isWithinPolicy,
        });
        return updated;
    }
    async confirm(bookingId, userId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.status !== client_1.BookingStatus.PENDING) {
            throw new common_1.BadRequestException('Booking is not pending');
        }
        const isProvider = await this.prisma.worker.findFirst({
            where: { userId, businessId: booking.businessId, isActive: true },
        });
        if (!isProvider)
            throw new common_1.ForbiddenException('Not authorized');
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: client_1.BookingStatus.CONFIRMED },
        });
        this.eventEmitter.emit('booking.confirmed', { booking: updated });
        return updated;
    }
    async reject(bookingId, userId, reason) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.status !== client_1.BookingStatus.PENDING) {
            throw new common_1.BadRequestException('Booking is not pending');
        }
        const isProvider = await this.prisma.worker.findFirst({
            where: { userId, businessId: booking.businessId, isActive: true },
        });
        if (!isProvider)
            throw new common_1.ForbiddenException('Not authorized');
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: client_1.BookingStatus.REJECTED,
                cancellationReason: reason,
            },
        });
        this.eventEmitter.emit('booking.rejected', { booking: updated });
        return updated;
    }
    async complete(bookingId, userId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        const isProvider = await this.prisma.worker.findFirst({
            where: { userId, businessId: booking.businessId, isActive: true },
        });
        if (!isProvider)
            throw new common_1.ForbiddenException('Not authorized');
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: client_1.BookingStatus.COMPLETED },
        });
        this.eventEmitter.emit('booking.completed', { booking: updated });
        return updated;
    }
    async noShow(bookingId, userId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        const isProvider = await this.prisma.worker.findFirst({
            where: { userId, businessId: booking.businessId, isActive: true },
        });
        if (!isProvider)
            throw new common_1.ForbiddenException('Not authorized');
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: client_1.BookingStatus.NO_SHOW },
        });
        this.eventEmitter.emit('booking.noShow', { booking: updated });
        return updated;
    }
    async reschedule(bookingId, userId, newStartTime) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { bookingServices: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        const isUser = booking.userId === userId;
        const isProvider = await this.prisma.worker.findFirst({
            where: { userId, businessId: booking.businessId, isActive: true },
        });
        if (!isUser && !isProvider) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: isUser
                    ? client_1.BookingStatus.CANCELLED_BY_USER
                    : client_1.BookingStatus.CANCELLED_BY_PROVIDER,
                cancellationReason: 'Rescheduled',
                cancelledAt: new Date(),
            },
        });
        const newStart = new Date(newStartTime);
        const newEnd = new Date(newStart.getTime() + booking.durationMinutes * 60000);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const dailyCount = await this.prisma.booking.count({
            where: { createdAt: { gte: todayStart, lte: todayEnd } },
        });
        const newBooking = await this.prisma.booking.create({
            data: {
                bookingNumber: (0, helpers_1.generateBookingNumber)(dailyCount + 1),
                userId: booking.userId,
                businessId: booking.businessId,
                locationId: booking.locationId,
                workerId: booking.workerId,
                startTime: newStart,
                endTime: newEnd,
                durationMinutes: booking.durationMinutes,
                status: client_1.BookingStatus.CONFIRMED,
                totalPrice: booking.totalPrice,
                depositAmount: booking.depositAmount,
                paymentStatus: booking.paymentStatus,
                notes: booking.notes,
                source: booking.source,
                rescheduledFromId: bookingId,
                rescheduleProposedBy: isUser ? 'user' : 'provider',
                rescheduleProposedAt: new Date(),
                bookingServices: {
                    create: booking.bookingServices.map((bs) => ({
                        serviceId: bs.serviceId,
                        serviceName: bs.serviceName,
                        durationMinutes: bs.durationMinutes,
                        price: bs.price,
                        sortOrder: bs.sortOrder,
                    })),
                },
            },
            include: {
                bookingServices: true,
                business: { select: { name: true } },
                worker: { select: { displayName: true } },
            },
        });
        this.eventEmitter.emit('booking.rescheduled', {
            oldBooking: booking,
            newBooking,
        });
        return newBooking;
    }
    async getBusinessBookings(businessId, page = 1, perPage = 20, status, dateFrom, dateTo) {
        const where = { businessId };
        if (status) {
            where.status = status.toUpperCase();
        }
        if (dateFrom) {
            where.startTime = { ...(where.startTime || {}), gte: new Date(dateFrom) };
        }
        if (dateTo) {
            where.startTime = { ...(where.startTime || {}), lte: new Date(dateTo) };
        }
        const [bookings, total] = await Promise.all([
            this.prisma.booking.findMany({
                where,
                skip: (page - 1) * perPage,
                take: perPage,
                orderBy: { startTime: 'asc' },
                include: {
                    user: { select: { firstName: true, lastName: true, phone: true } },
                    worker: { select: { displayName: true } },
                    location: { select: { name: true } },
                    bookingServices: { select: { serviceName: true, price: true } },
                },
            }),
            this.prisma.booking.count({ where }),
        ]);
        return { data: bookings, meta: (0, helpers_1.paginate)(total, page, perPage) };
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = BookingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        event_emitter_1.EventEmitter2])
], BookingsService);
function minutesToTimeStr(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
//# sourceMappingURL=bookings.service.js.map