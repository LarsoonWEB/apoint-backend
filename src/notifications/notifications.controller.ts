import {
  Controller,
  Post,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register device token for push notifications' })
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body() body: { token: string; platform: string },
  ) {
    return this.notificationsService.registerDeviceToken(
      userId,
      body.token,
      body.platform,
    );
  }

  @Delete('device')
  @ApiOperation({ summary: 'Unregister device token' })
  async unregisterDevice(@Body() body: { token: string }) {
    return this.notificationsService.unregisterDeviceToken(body.token);
  }
}
