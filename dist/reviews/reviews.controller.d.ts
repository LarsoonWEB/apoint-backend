import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private reviewsService;
    constructor(reviewsService: ReviewsService);
    create(userId: string, data: {
        bookingId: string;
        rating: number;
        comment?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        bookingId: string;
        rating: number;
        reviewerId: string;
        revieweeType: string;
        revieweeId: string;
        comment: string | null;
        reply: string | null;
        replyAt: Date | null;
        isPublished: boolean;
    }>;
    reply(id: string, userId: string, body: {
        reply: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        bookingId: string;
        rating: number;
        reviewerId: string;
        revieweeType: string;
        revieweeId: string;
        comment: string | null;
        reply: string | null;
        replyAt: Date | null;
        isPublished: boolean;
    }>;
    getBusinessReviews(businessId: string, page?: number, perPage?: number): Promise<{
        data: ({
            booking: {
                bookingServices: {
                    serviceName: string;
                }[];
            };
            reviewer: {
                firstName: string;
                lastName: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            rating: number;
            reviewerId: string;
            revieweeType: string;
            revieweeId: string;
            comment: string | null;
            reply: string | null;
            replyAt: Date | null;
            isPublished: boolean;
        })[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
        summary: {
            averageRating: number;
            totalReviews: number;
            distribution: {
                rating: number;
                count: number;
            }[];
        };
    }>;
}
