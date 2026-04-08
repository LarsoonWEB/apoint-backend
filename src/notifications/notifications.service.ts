import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // ── Event Listeners ───────────────────────────────────────

  @OnEvent('booking.created')
  async onBookingCreated(payload: any) {
    const { booking, userId, businessId } = payload;

    // Notify user
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

    // Notify provider (business owner + assigned worker)
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

  @OnEvent('booking.confirmed')
  async onBookingConfirmed(payload: any) {
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

  @OnEvent('booking.cancelled')
  async onBookingCancelled(payload: any) {
    const { booking, cancelledBy } = payload;

    if (cancelledBy === 'user') {
      // Notify provider
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
    } else {
      // Notify user
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

  @OnEvent('booking.rescheduled')
  async onBookingRescheduled(payload: any) {
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

  @OnEvent('booking.completed')
  async onBookingCompleted(payload: any) {
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

  @OnEvent('booking.rejected')
  async onBookingRejected(payload: any) {
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

  @OnEvent('payment.succeeded')
  async onPaymentSucceeded(payload: any) {
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

  @OnEvent('user.registered')
  async onUserRegistered(payload: any) {
    const { userId, email, firstName } = payload;
    // Send welcome email (placeholder — actual email sending via Resend)
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

  @OnEvent('worker.invited')
  async onWorkerInvited(payload: any) {
    this.logger.log(`Worker invitation email queued for ${payload.email}`);
  }

  // ── Core Notification Creator ─────────────────────────────

  private async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    channel: string;
    data?: any;
  }) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type as any,
          title: data.title,
          body: data.body,
          data: data.data || {},
        },
      });

      // Send push notification
      if (data.channel === 'push') {
        await this.sendPushNotification(data.userId, {
          title: data.title,
          body: data.body,
          data: data.data,
        });
      }

      return notification;
    } catch (error) {
      this.logger.error('Failed to create notification', error);
    }
  }

  // ── Push Notification Sender (FCM placeholder) ────────────

  private async sendPushNotification(
    userId: string,
    payload: { title: string; body: string; data?: any },
  ) {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
    });

    if (tokens.length === 0) return;

    // TODO: Implement Firebase Cloud Messaging
    // For MVP, log the push notification
    this.logger.log(
      `Push → user:${userId} | ${payload.title}: ${payload.body} | devices:${tokens.length}`,
    );
  }

  // ── Register Device Token ─────────────────────────────────

  async registerDeviceToken(
    userId: string,
    token: string,
    platform: string,
  ) {
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform: platform as any },
      update: { userId, platform: platform as any },
    });
    return { message: 'Device registered' };
  }

  async unregisterDeviceToken(token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { token } });
    return { message: 'Device unregistered' };
  }
}
