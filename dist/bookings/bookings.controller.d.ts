import { BookingsService } from './bookings.service';
export declare class BookingsController {
    private bookingsService;
    constructor(bookingsService: BookingsService);
    getAvailability(businessId: string, workerId: string, date: string, serviceIds: string): Promise<{
        date: string;
        slots: any[];
        totalDuration: number;
        services?: undefined;
    } | {
        date: string;
        slots: {
            time: string;
            locationId: string;
        }[];
        totalDuration: number;
        services: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            durationMinutes: number;
            businessId: string;
            categoryId: string | null;
            isActive: boolean;
            price: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            currency: string;
            requiresDeposit: boolean;
            locationType: string;
            travelSurcharge: import("@prisma/client/runtime/library").Decimal;
            travelRadiusKm: number;
        }[];
    }>;
    create(userId: string, data: any): Promise<{
        business: {
            name: string;
            slug: string;
        };
        location: {
            name: string;
            addressLine1: string;
            city: string;
        };
        worker: {
            displayName: string;
        };
        bookingServices: {
            id: string;
            durationMinutes: number;
            bookingId: string;
            serviceId: string;
            serviceName: string;
            price: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
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
    }>;
    createGuest(data: any): Promise<{
        business: {
            name: string;
            slug: string;
        };
        location: {
            name: string;
            addressLine1: string;
            city: string;
        };
        worker: {
            displayName: string;
        };
        bookingServices: {
            id: string;
            durationMinutes: number;
            bookingId: string;
            serviceId: string;
            serviceName: string;
            price: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
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
    }>;
    findById(id: string): Promise<{
        business: {
            id: string;
            name: string;
            slug: string;
            logoUrl: string;
            cancellationHours: number;
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
        review: {
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
        };
        bookingServices: {
            id: string;
            durationMinutes: number;
            bookingId: string;
            serviceId: string;
            serviceName: string;
            price: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
        }[];
        payments: {
            type: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            bookingId: string;
            currency: string;
            stripePaymentIntentId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            platformFee: import("@prisma/client/runtime/library").Decimal;
            providerPayout: import("@prisma/client/runtime/library").Decimal;
            stripeTransferId: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            refundReason: string | null;
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
    }>;
    findByNumber(bookingNumber: string): Promise<{
        business: {
            id: string;
            name: string;
            slug: string;
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
            id: string;
            durationMinutes: number;
            bookingId: string;
            serviceId: string;
            serviceName: string;
            price: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
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
    }>;
    cancel(id: string, userId: string, body: {
        reason?: string;
    }): Promise<{
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
    }>;
    reschedule(id: string, userId: string, body: {
        newStartTime: string;
    }): Promise<{
        business: {
            name: string;
        };
        worker: {
            displayName: string;
        };
        bookingServices: {
            id: string;
            durationMinutes: number;
            bookingId: string;
            serviceId: string;
            serviceName: string;
            price: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
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
    }>;
    confirm(id: string, userId: string): Promise<{
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
    }>;
    reject(id: string, userId: string, body: {
        reason?: string;
    }): Promise<{
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
    }>;
    complete(id: string, userId: string): Promise<{
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
    }>;
    noShow(id: string, userId: string): Promise<{
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
    }>;
    getBusinessBookings(businessId: string, page?: number, perPage?: number, status?: string, dateFrom?: string, dateTo?: string): Promise<{
        data: ({
            user: {
                firstName: string;
                lastName: string;
                phone: string;
            };
            location: {
                name: string;
            };
            worker: {
                displayName: string;
            };
            bookingServices: {
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
}
