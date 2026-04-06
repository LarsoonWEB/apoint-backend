import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() data: any,
  ) {
    return this.usersService.updateProfile(userId, data);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete account (GDPR)' })
  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.usersService.deleteAccount(userId);
  }

  @Get('me/bookings')
  @ApiOperation({ summary: "Get user's bookings" })
  async getBookings(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
    @Query('status') status?: string,
  ) {
    return this.usersService.getUserBookings(userId, page || 1, perPage || 20, status);
  }

  @Get('me/favorites')
  @ApiOperation({ summary: "Get user's favorite providers" })
  async getFavorites(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
  ) {
    return this.usersService.getFavorites(userId, page || 1, perPage || 20);
  }

  @Post('me/favorites/:businessId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add provider to favorites' })
  async addFavorite(
    @CurrentUser('id') userId: string,
    @Param('businessId') businessId: string,
  ) {
    return this.usersService.addFavorite(userId, businessId);
  }

  @Delete('me/favorites/:businessId')
  @ApiOperation({ summary: 'Remove from favorites' })
  async removeFavorite(
    @CurrentUser('id') userId: string,
    @Param('businessId') businessId: string,
  ) {
    return this.usersService.removeFavorite(userId, businessId);
  }

  @Get('me/notifications')
  @ApiOperation({ summary: "Get user's notifications" })
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
  ) {
    return this.usersService.getNotifications(userId, page || 1, perPage || 20);
  }

  @Patch('me/notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.usersService.markNotificationRead(userId, notificationId);
  }
}
