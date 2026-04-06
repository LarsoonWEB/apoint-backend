import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { RedisService } from '../common/redis.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, RedisService],
  exports: [BookingsService],
})
export class BookingsModule {}
