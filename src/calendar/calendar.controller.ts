import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { Roles } from '../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../common/guards/business-roles.guard';

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller('calendar')
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get(':businessId/day')
  @UseGuards(BusinessRolesGuard)
  @Roles('worker')
  @ApiOperation({ summary: 'Get day view for business calendar' })
  async getDayView(
    @Param('businessId') businessId: string,
    @Query('date') date: string,
    @Query('worker_id') workerId?: string,
  ) {
    return this.calendarService.getDayView(businessId, date, workerId);
  }

  @Get(':businessId/week')
  @UseGuards(BusinessRolesGuard)
  @Roles('worker')
  @ApiOperation({ summary: 'Get week view for business calendar' })
  async getWeekView(
    @Param('businessId') businessId: string,
    @Query('start_date') startDate: string,
    @Query('worker_id') workerId?: string,
  ) {
    return this.calendarService.getWeekView(businessId, startDate, workerId);
  }

  @Get(':businessId/month')
  @UseGuards(BusinessRolesGuard)
  @Roles('worker')
  @ApiOperation({ summary: 'Get month view for business calendar' })
  async getMonthView(
    @Param('businessId') businessId: string,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.calendarService.getMonthView(businessId, year, month);
  }

  @Post(':businessId/blocked-slots')
  @UseGuards(BusinessRolesGuard)
  @Roles('location_manager')
  @ApiOperation({ summary: 'Add a blocked slot (break, holiday)' })
  async addBlockedSlot(
    @Param('businessId') businessId: string,
    @Body() data: any,
  ) {
    return this.calendarService.addBlockedSlot(data);
  }

  @Delete(':businessId/blocked-slots/:id')
  @UseGuards(BusinessRolesGuard)
  @Roles('location_manager')
  @ApiOperation({ summary: 'Remove a blocked slot' })
  async removeBlockedSlot(@Param('id') id: string) {
    return this.calendarService.removeBlockedSlot(id);
  }

  @Get(':businessId/blocked-slots')
  @UseGuards(BusinessRolesGuard)
  @Roles('worker')
  @ApiOperation({ summary: 'Get blocked slots' })
  async getBlockedSlots(
    @Param('businessId') businessId: string,
    @Query('worker_id') workerId?: string,
  ) {
    return this.calendarService.getBlockedSlots(businessId, workerId);
  }
}
