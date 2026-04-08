import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { paginate } from '../common/utils/helpers';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, data: {
    bookingId: string;
    rating: number;
    comment?: string;
  }) {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Get booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Must be completed
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed bookings');
    }

    // Check if already reviewed
    const existing = await this.prisma.review.findUnique({
      where: { bookingId: data.bookingId },
    });
    if (existing) {
      throw new BadRequestException('This booking has already been reviewed');
    }

    // Determine reviewee type
    const isUser = booking.userId === userId;
    const revieweeType = isUser ? 'business' : 'user';
    const revieweeId = isUser ? booking.businessId : (booking.userId || '');

    if (!revieweeId) {
      throw new BadRequestException('Cannot review a guest booking');
    }

    return this.prisma.review.create({
      data: {
        bookingId: data.bookingId,
        reviewerId: userId,
        revieweeType,
        revieweeId,
        rating: data.rating,
        comment: data.comment,
      } as any,
    });
  }

  async replyToReview(reviewId: string, userId: string, reply: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { booking: true },
    });
    if (!review) throw new NotFoundException('Review not found');

    // Only the business owner/admin can reply
    const isProvider = await this.prisma.worker.findFirst({
      where: {
        userId,
        businessId: review.booking.businessId,
        businessRole: { in: ['owner', 'admin'] },
        isActive: true,
      },
    });
    if (!isProvider) {
      throw new ForbiddenException('Only business owners can reply to reviews');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { reply, replyAt: new Date() },
    });
  }

  async getBusinessReviews(
    businessId: string,
    page = 1,
    perPage = 20,
  ) {
    const where = {
      revieweeId: businessId,
      revieweeType: 'business',
      isPublished: true,
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { firstName: true, lastName: true, avatarUrl: true } },
          booking: {
            select: {
              bookingServices: { select: { serviceName: true } },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    // Get rating distribution
    const distribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: true,
    });

    const ratingAgg = await this.prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: true,
    });

    return {
      data: reviews,
      meta: paginate(total, page, perPage),
      summary: {
        averageRating: ratingAgg._avg.rating || 0,
        totalReviews: ratingAgg._count,
        distribution: distribution.map((d) => ({
          rating: d.rating,
          count: d._count,
        })),
      },
    };
  }
}
