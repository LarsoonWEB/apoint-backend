"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const helpers_1 = require("../common/utils/helpers");
let ReviewsService = class ReviewsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createReview(userId, data) {
        if (data.rating < 1 || data.rating > 5) {
            throw new common_1.BadRequestException('Rating must be between 1 and 5');
        }
        const booking = await this.prisma.booking.findUnique({
            where: { id: data.bookingId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.status !== client_1.BookingStatus.COMPLETED) {
            throw new common_1.BadRequestException('Can only review completed bookings');
        }
        const existing = await this.prisma.review.findUnique({
            where: { bookingId: data.bookingId },
        });
        if (existing) {
            throw new common_1.BadRequestException('This booking has already been reviewed');
        }
        const isUser = booking.userId === userId;
        const revieweeType = isUser ? 'business' : 'user';
        const revieweeId = isUser ? booking.businessId : (booking.userId || '');
        if (!revieweeId) {
            throw new common_1.BadRequestException('Cannot review a guest booking');
        }
        return this.prisma.review.create({
            data: {
                bookingId: data.bookingId,
                reviewerId: userId,
                revieweeType,
                revieweeId,
                rating: data.rating,
                comment: data.comment,
            },
        });
    }
    async replyToReview(reviewId, userId, reply) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
            include: { booking: true },
        });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        const isProvider = await this.prisma.worker.findFirst({
            where: {
                userId,
                businessId: review.booking.businessId,
                businessRole: { in: ['owner', 'admin'] },
                isActive: true,
            },
        });
        if (!isProvider) {
            throw new common_1.ForbiddenException('Only business owners can reply to reviews');
        }
        return this.prisma.review.update({
            where: { id: reviewId },
            data: { reply, replyAt: new Date() },
        });
    }
    async getBusinessReviews(businessId, page = 1, perPage = 20) {
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
            meta: (0, helpers_1.paginate)(total, page, perPage),
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
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map