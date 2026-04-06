import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a completed booking' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() data: { bookingId: string; rating: number; comment?: string },
  ) {
    return this.reviewsService.createReview(userId, data);
  }

  @Patch(':id/reply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a review (provider)' })
  async reply(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reply: string },
  ) {
    return this.reviewsService.replyToReview(id, userId, body.reply);
  }

  @Public()
  @Get('business/:businessId')
  @ApiOperation({ summary: 'Get reviews for a business' })
  async getBusinessReviews(
    @Param('businessId') businessId: string,
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
  ) {
    return this.reviewsService.getBusinessReviews(
      businessId,
      page || 1,
      perPage || 20,
    );
  }
}
