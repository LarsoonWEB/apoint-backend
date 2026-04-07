import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        userType: import("@prisma/client").$Enums.UserType;
        id: string;
        avatarUrl: string;
        isVerified: boolean;
        locale: string;
        timezone: string;
        createdAt: Date;
    }>;
    updateProfile(userId: string, data: any): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        userType: import("@prisma/client").$Enums.UserType;
        id: string;
        avatarUrl: string;
        isVerified: boolean;
        locale: string;
        timezone: string;
    }>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
    getBookings(userId: string, page?: number, perPage?: number, status?: string): Promise<{
        data: ({
            business: {
                id: string;
                name: string;
                slug: string;
                logoUrl: string;
            };
            location: {
                id: string;
                name: string;
                addressLine1: string;
                city: string;
            };
            worker: {
                id: string;
                displayName: string;
            };
            bookingServices: {
                durationMinutes: number;
                serviceName: string;
                price: import("@prisma/client/runtime/library").Decimal;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            bookingNumber: string;
            startTime: Date;
            endTime: Date;
            durationMinutes: number;
            status: import("@prisma/client").$Enums.BookingStatus;
            guestName: string | null;
            guestEmail: string | null;
            guestPhone: string | null;
            customerAddress: string | null;
            customerAddressLat: import("@prisma/client/runtime/library").Decimal | null;
            customerAddressLng: import("@prisma/client/runtime/library").Decimal | null;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            depositAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            source: string | null;
            notes: string | null;
            cancellationReason: string | null;
            cancelledAt: Date | null;
            rescheduleProposedBy: string | null;
            rescheduleProposedAt: Date | null;
            businessId: string;
            locationId: string | null;
            workerId: string;
            rescheduledFromId: string | null;
        })[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    getFavorites(userId: string, page?: number, perPage?: number): Promise<{
        data: ({
            business: {
                category: {
                    name: string;
                    nameHr: string;
                };
                id: string;
                name: string;
                slug: string;
                logoUrl: string;
                coverPhotoUrl: string;
                locations: {
                    addressLine1: string;
                    city: string;
                    latitude: import("@prisma/client/runtime/library").Decimal;
                    longitude: import("@prisma/client/runtime/library").Decimal;
                }[];
            };
        } & {
            createdAt: Date;
            userId: string;
            businessId: string;
        })[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    addFavorite(userId: string, businessId: string): Promise<{
        message: string;
    }>;
    removeFavorite(userId: string, businessId: string): Promise<{
        message: string;
    }>;
    getNotifications(userId: string, page?: number, perPage?: number): Promise<{
        data: {
            type: string;
            title: string;
            id: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            body: string;
            channel: string;
            isRead: boolean;
            sentAt: Date;
            readAt: Date | null;
        }[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    markRead(userId: string, notificationId: string): Promise<{
        message: string;
    }>;
}
