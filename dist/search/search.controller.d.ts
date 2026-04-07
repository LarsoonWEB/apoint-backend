import { SearchService } from './search.service';
export declare class SearchController {
    private searchService;
    constructor(searchService: SearchService);
    search(query?: string, categorySlug?: string, lat?: number, lng?: number, radiusKm?: number, city?: string, page?: number, perPage?: number, sortBy?: string): Promise<{
        data: {
            averageRating: number;
            distance: number;
            category: {
                name: string;
                slug: string;
                nameHr: string;
                icon: string;
            };
            _count: {
                reviews: number;
            };
            locations: {
                id: string;
                name: string;
                addressLine1: string;
                city: string;
                latitude: import("@prisma/client/runtime/library").Decimal;
                longitude: import("@prisma/client/runtime/library").Decimal;
            }[];
            services: {
                id: string;
                name: string;
                durationMinutes: number;
                price: import("@prisma/client/runtime/library").Decimal;
            }[];
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            depositAmount: import("@prisma/client/runtime/library").Decimal;
            ownerId: string;
            slug: string;
            categoryId: string | null;
            logoUrl: string | null;
            coverPhotoUrl: string | null;
            website: string | null;
            instagram: string | null;
            facebook: string | null;
            isActive: boolean;
            bookingMode: string;
            cancellationHours: number;
            depositType: string;
            stripeAccountId: string | null;
            whatsappNumber: string | null;
            whatsappConnected: boolean;
        }[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    getCategories(): Promise<({
        children: {
            id: string;
            name: string;
            slug: string;
            isActive: boolean;
            sortOrder: number;
            parentId: string | null;
            nameHr: string;
            icon: string | null;
        }[];
    } & {
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
        sortOrder: number;
        parentId: string | null;
        nameHr: string;
        icon: string | null;
    })[]>;
}
