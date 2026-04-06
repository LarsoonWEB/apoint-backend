import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
import { generateBookingNumber, paginate, timeToMinutes } from '../common/utils/helpers';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ── Availability Engine ───────────────────────────────────

  async getAvailableSlots(
    businessId: string,
    workerId: string,
    date: string, // YYYY-MM-DD
    serviceIds: string[],
  ) {
    // 1. Calculate total duration
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds }, businessId, isActive: true },
    });
    if (services.length !== serviceIds.length) {
      throw new BadRequestException('One or more services not found');
    }
    const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);

    // 2. Get worker's location(s) and working hours for the day
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
    if (!worker) throw new NotFoundException('Worker not found');

    const targetDate = new Date(date);
    const dayOfWeek = (targetDate.getDay() + 6) % 7; // Convert to 0=Monday

    // Collect all working hour windows for this day
    const windows: { locationId: string; openMin: number; closeMin: number; breakStartMin?: number; breakEndMin?: number }[] = [];
    for (const wl of worker.workerLocations) {
      const wh = wl.location.workingHours.find(
        (h) => h.dayOfWeek === dayOfWeek && !h.isClosed,
      );
      if (wh) {
        windows.push({
          locationId: wl.locationId,
          openMin: timeToMinutes(wh.openTime),
          closeMin: timeToMinutes(wh.closeTime),
          breakStartMin: wh.breakStart ? timeToMinutes(wh.breakStart) : undefined,
          breakEndMin: wh.breakEnd ? timeToMinutes(wh.breakEnd) : undefined,
        });
      }
    }

    if (windows.length === 0) {
      return { date, slots: [], totalDuration };
    }

    // 3. Get existing bookings for this worker on this date
    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59Z`);

    const existingBookings = await this.prisma.booking.findMany({
      where: {
        workerId,
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.IN_PROGRESS,
          ],
        },
      },
      select: { startTime: true, endTime: true },
    });

    // 4. Get blocked slots
    const blockedSlots = await this.prisma.blockedSlot.findMany({
      where: {
        workerId,
        startTime: { lte: dayEnd },
        endTime: { gte: dayStart },
      },
    });

    // 5. Generate available slots (15-minute intervals)
    const slots: { time: string; locationId: string }[] = [];
    const slotInterval = 15; // minutes

    for (const window of windows) {
      let currentMin = window.openMin;
      const maxStartMin = window.closeMin - totalDuration;

      while (currentMin <= maxStartMin) {
        const slotEnd = currentMin + totalDuration;

        // Check break overlap
        if (
          window.breakStartMin !== undefined &&
          window.breakEndMin !== undefined
        ) {
          if (currentMin < window.breakEndMin && slotEnd > window.breakStartMin) {
            currentMin = window.breakEndMin;
            continue;
          }
        }

        // Check booking overlap
        const slotStartTime = new Date(`${date}T${minutesToTimeStr(currentMin)}:00Z`);
        const slotEndTime = new Date(`${date}T${minutesToTimeStr(slotEnd)}:00Z`);

        const hasConflict = existingBookings.some(
          (b) => slotStartTime < b.endTime && slotEndTime > b.startTime,
        );

        const isBlocked = blockedSlots.some(
          (b) => slotStartTime < b.endTime && slotEndTime > b.startTime,
        );

        // Check Redis soft lock
        const isLocked = await this.redis.isSlotLocked(
          workerId,
          slotStartTime.toISOString(),
        );

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

  // ── Create Booking ────────────────────────────────────────

  async create(userId: string | null, data: any) {
    const {
      businessId,
      workerId,
      locationId,
      serviceIds,
      startTime,
      guestName,
      guestEmail,
      guestPhone,
      notes,
      customerAddress,
      customerAddressLat,
      customerAddressLng,
      source,
    } = data;

    // 1. Validate services
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds }, businessId, isActive: true },
    });
    if (services.length !== serviceIds.length) {
      throw new BadRequestException('One or more services not found');
    }

    const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalPrice = services.reduce(
      (sum, s) => sum + Number(s.price),
      0,
    );

    const start = new Date(startTime);
    const end = new Date(start.getTime() + totalDuration * 60000);

    // 2. Acquire Redis slot lock
    const lockAcquired = await this.redis.acquireSlotLock(
      workerId,
      start.toISOString(),
    );
    if (!lockAcquired) {
      throw new ConflictException({
        code: 'SLOT_LOCKED',
        message: 'This time slot is currently being booked by another user',
      });
    }

    try {
      // 3. Double-booking check (DB level)
      const conflicting = await this.prisma.booking.findFirst({
        where: {
          workerId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
          },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });

      if (conflicting) {
        throw new ConflictException({
          code: 'SLOT_TAKEN',
          message: 'This time slot is no longer available',
        });
      }

      // 4. Get business for booking mode
      const business = await this.prisma.business.findUnique({
        where: { id: businessId },
      });
      if (!business) throw new NotFoundException('Business not found');

      // 5. Generate booking number
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const dailyCount = await this.prisma.booking.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });

      const bookingNumber = generateBookingNumber(dailyCount + 1);

      // 6. Determine initial status
      const initialStatus =
        business.bookingMode === 'instant'
          ? BookingStatus.CONFIRMED
          : BookingStatus.PENDING;

      // 7. Calculate deposit
      let depositAmount = 0;
      if (business.depositType === 'fixed') {
        depositAmount = Number(business.depositAmount);
      } else if (business.depositType === 'percentage') {
        depositAmount = totalPrice * (Number(business.depositAmount) / 100);
      }

      // 8. Create booking in transaction
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
          paymentStatus: PaymentStatus.NONE,
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

      // 9. Emit events
      this.eventEmitter.emit('booking.created', {
        booking,
        userId,
        businessId,
      });

      return booking;
    } finally {
      // Release lock after booking is created (or failed)
      await this.redis.releaseSlotLock(workerId, start.toISOString());
    }
  }

  // ── Get Booking ───────────────────────────────────────────

  async findById(bookingId: string) {
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
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async findByNumber(bookingNumber: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingNumber },
      include: {
        bookingServices: true,
        business: { select: { id: true, name: true, slug: true } },
        worker: { select: { id: true, displayName: true } },
        location: { select: { id: true, name: true, addressLine1: true, city: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  // ── Cancel Booking ────────────────────────────────────────

  async cancel(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Check permission
    const isUser = booking.userId === userId;
    const isProvider = await this.prisma.worker.findFirst({
      where: { userId, businessId: booking.businessId, isActive: true },
    });

    if (!isUser && !isProvider) {
      throw new ForbiddenException('Not authorized to cancel this booking');
    }

    // Check if cancellable
    const cancellableStatuses: string[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException({
        code: 'NOT_CANCELLABLE',
        message: `Cannot cancel a booking with status: ${booking.status}`,
      });
    }

    const status = isUser
      ? BookingStatus.CANCELLED_BY_USER
      : BookingStatus.CANCELLED_BY_PROVIDER;

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
    });

    // Check refund eligibility
    const hoursUntilBooking =
      (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    const isWithinPolicy = hoursUntilBooking >= booking.business.cancellationHours;

    this.eventEmitter.emit('booking.cancelled', {
      booking: updated,
      cancelledBy: isUser ? 'user' : 'provider',
      isWithinPolicy,
    });

    return updated;
  }

  // ── Confirm / Reject (Provider) ───────────────────────────

  async confirm(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not pending');
    }

    const isProvider = await this.prisma.worker.findFirst({
      where: { userId, businessId: booking.businessId, isActive: true },
    });
    if (!isProvider) throw new ForbiddenException('Not authorized');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });

    this.eventEmitter.emit('booking.confirmed', { booking: updated });
    return updated;
  }

  async reject(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not pending');
    }

    const isProvider = await this.prisma.worker.findFirst({
      where: { userId, businessId: booking.businessId, isActive: true },
    });
    if (!isProvider) throw new ForbiddenException('Not authorized');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.REJECTED,
        cancellationReason: reason,
      },
    });

    this.eventEmitter.emit('booking.rejected', { booking: updated });
    return updated;
  }

  // ── Complete / No-Show (Provider) ─────────────────────────

  async complete(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const isProvider = await this.prisma.worker.findFirst({
      where: { userId, businessId: booking.businessId, isActive: true },
    });
    if (!isProvider) throw new ForbiddenException('Not authorized');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED },
    });

    this.eventEmitter.emit('booking.completed', { booking: updated });
    return updated;
  }

  async noShow(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const isProvider = await this.prisma.worker.findFirst({
      where: { userId, businessId: booking.businessId, isActive: true },
    });
    if (!isProvider) throw new ForbiddenException('Not authorized');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.NO_SHOW },
    });

    this.eventEmitter.emit('booking.noShow', { booking: updated });
    return updated;
  }

  // ── Reschedule ────────────────────────────────────────────

  async reschedule(bookingId: string, userId: string, newStartTime: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingServices: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const isUser = booking.userId === userId;
    const isProvider = await this.prisma.worker.findFirst({
      where: { userId, businessId: booking.businessId, isActive: true },
    });

    if (!isUser && !isProvider) {
      throw new ForbiddenException('Not authorized');
    }

    // Cancel old booking
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: isUser
          ? BookingStatus.CANCELLED_BY_USER
          : BookingStatus.CANCELLED_BY_PROVIDER,
        cancellationReason: 'Rescheduled',
        cancelledAt: new Date(),
      },
    });

    // Create new booking with reference to old one
    const newStart = new Date(newStartTime);
    const newEnd = new Date(
      newStart.getTime() + booking.durationMinutes * 60000,
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const dailyCount = await this.prisma.booking.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    });

    const newBooking = await this.prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(dailyCount + 1),
        userId: booking.userId,
        businessId: booking.businessId,
        locationId: booking.locationId,
        workerId: booking.workerId,
        startTime: newStart,
        endTime: newEnd,
        durationMinutes: booking.durationMinutes,
        status: BookingStatus.CONFIRMED,
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

  // ── Provider: Get Business Bookings ───────────────────────

  async getBusinessBookings(
    businessId: string,
    page = 1,
    perPage = 20,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const where: any = { businessId };

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

    return { data: bookings, meta: paginate(total, page, perPage) };
  }
}

// Helper
function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
