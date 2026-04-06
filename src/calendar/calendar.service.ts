import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getDayView(businessId: string, date: string, workerId?: string) {
    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59Z`);

    const where: any = {
      businessId,
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
      status: {
        notIn: [
          BookingStatus.CANCELLED_BY_USER,
          BookingStatus.CANCELLED_BY_PROVIDER,
          BookingStatus.REJECTED,
        ],
      },
    };
    if (workerId) where.workerId = workerId;

    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        worker: { select: { id: true, displayName: true } },
        bookingServices: { select: { serviceName: true, durationMinutes: true } },
      },
    });

    // Get blocked slots
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

  async getWeekView(businessId: string, startDate: string, workerId?: string) {
    const weekStart = new Date(startDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const where: any = {
      businessId,
      startTime: { gte: weekStart },
      endTime: { lte: weekEnd },
      status: {
        notIn: [
          BookingStatus.CANCELLED_BY_USER,
          BookingStatus.CANCELLED_BY_PROVIDER,
          BookingStatus.REJECTED,
        ],
      },
    };
    if (workerId) where.workerId = workerId;

    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        worker: { select: { id: true, displayName: true } },
        bookingServices: { select: { serviceName: true } },
      },
    });

    // Group by day
    const days: Record<string, any[]> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days[d.toISOString().split('T')[0]] = [];
    }
    for (const b of bookings) {
      const key = b.startTime.toISOString().split('T')[0];
      if (days[key]) days[key].push(b);
    }

    return { startDate, days };
  }

  async getMonthView(businessId: string, year: number, month: number) {
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

    // Get daily counts
    const dailyCounts = await this.prisma.$queryRaw<
      { date: string; count: bigint }[]
    >`
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

  // ── Blocked Slots Management ──────────────────────────────

  async addBlockedSlot(data: {
    locationId?: string;
    workerId?: string;
    startTime: string;
    endTime: string;
    reason?: string;
    isRecurring?: boolean;
  }) {
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

  async removeBlockedSlot(id: string) {
    await this.prisma.blockedSlot.delete({ where: { id } });
    return { message: 'Blocked slot removed' };
  }

  async getBlockedSlots(businessId: string, workerId?: string) {
    const where: any = {};
    if (workerId) {
      where.workerId = workerId;
    } else {
      where.location = { businessId };
    }
    return this.prisma.blockedSlot.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
  }
}
