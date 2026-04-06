import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../common/guards/business-roles.guard';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  // ── Availability (Public) ─────────────────────────────────

  @Public()
  @Get('availability')
  @ApiOperation({ summary: 'Get available time slots' })
  async getAvailability(
    @Query('business_id') businessId: string,
    @Query('worker_id') workerId: string,
    @Query('date') date: string,
    @Query('service_ids') serviceIds: string, // comma-separated
  ) {
    const ids = serviceIds.split(',').filter(Boolean);
    return this.bookingsService.getAvailableSlots(businessId, workerId, date, ids);
  }

  // ── Create Booking ────────────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking' })
  async create(@CurrentUser('id') userId: string, @Body() data: any) {
    return this.bookingsService.create(userId, data);
  }

  @Public()
  @Post('guest')
  @ApiOperation({ summary: 'Create a guest booking (no account)' })
  async createGuest(@Body() data: any) {
    return this.bookingsService.create(null, data);
  }

  // ── Get Booking ───────────────────────────────────────────

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking by ID' })
  async findById(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Public()
  @Get('number/:bookingNumber')
  @ApiOperation({ summary: 'Get booking by booking number' })
  async findByNumber(@Param('bookingNumber') bookingNumber: string) {
    return this.bookingsService.findByNumber(bookingNumber);
  }

  // ── User Actions ──────────────────────────────────────────

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.cancel(id, userId, body.reason);
  }

  @Patch(':id/reschedule')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule a booking' })
  async reschedule(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { newStartTime: string },
  ) {
    return this.bookingsService.reschedule(id, userId, body.newStartTime);
  }

  // ── Provider Actions ──────────────────────────────────────

  @Patch(':id/confirm')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a pending booking (provider)' })
  async confirm(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.confirm(id, userId);
  }

  @Patch(':id/reject')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending booking (provider)' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.reject(id, userId, body.reason);
  }

  @Patch(':id/complete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark booking as completed (provider)' })
  async complete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.complete(id, userId);
  }

  @Patch(':id/no-show')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark booking as no-show (provider)' })
  async noShow(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.noShow(id, userId);
  }

  // ── Provider: Business Bookings ───────────────────────────

  @Get('business/:businessId')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('worker')
  @ApiOperation({ summary: 'Get all bookings for a business' })
  async getBusinessBookings(
    @Param('businessId') businessId: string,
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
    @Query('status') status?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    return this.bookingsService.getBusinessBookings(
      businessId,
      page || 1,
      perPage || 20,
      status,
      dateFrom,
      dateTo,
    );
  }
}
