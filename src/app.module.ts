import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { SearchModule } from './search/search.module';
import { CalendarModule } from './calendar/calendar.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Event system (for notifications)
    EventEmitterModule.forRoot(),

    // Scheduled tasks (reminders, daily summaries, token cleanup)
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 60,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 120,
      },
    ]),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    BusinessesModule,
    BookingsModule,
    PaymentsModule,
    SearchModule,
    CalendarModule,
    ReviewsModule,
    NotificationsModule,
    WhatsappModule,
    HealthModule,
  ],
  providers: [
    // Register ThrottlerGuard globally so rate limiting is enforced on all endpoints
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
