import { PrismaService } from '../prisma/prisma.service';
export declare class CalendarService {
    private prisma;
    constructor(prisma: PrismaService);
    getDayView(businessId: string, date: string, workerId?: string): Promise<{
        date: string;
        bookings: ({
            user: {
                firstName: string;
                lastName: string;
                phone: string;
            };
            worker: {
                id: string;
                displayName: string;
            };
            bookingServices: {
                durationMinutes: number;
                serviceName: string;
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
        blockedSlots: {
            id: string;
            createdAt: Date;
            startTime: Date;
            endTime: Date;
            locationId: string | null;
            workerId: string | null;
            reason: string | null;
            isRecurring: boolean;
        }[];
    }>;
    getWeekView(businessId: string, startDate: string, workerId?: string): Promise<{
        startDate: string;
        days: Record<string, any[]>;
    }>;
    getMonthView(businessId: string, year: number, month: number): Promise<{
        year: number;
        month: number;
        summary: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.BookingGroupByOutputType, "status"[]> & {
            _count: number;
        })[];
        dailyCounts: {
            date: string;
            count: number;
        }[];
    }>;
    addBlockedSlot(data: {
        locationId?: string;
        workerId?: string;
        startTime: string;
        endTime: string;
        reason?: string;
        isRecurring?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        startTime: Date;
        endTime: Date;
        locationId: string | null;
        workerId: string | null;
        reason: string | null;
        isRecurring: boolean;
    }>;
    removeBlockedSlot(id: string): Promise<{
        message: string;
    }>;
    getBlockedSlots(businessId: string, workerId?: string): Promise<{
        id: string;
        createdAt: Date;
        startTime: Date;
        endTime: Date;
        locationId: string | null;
        workerId: string | null;
        reason: string | null;
        isRecurring: boolean;
    }[]>;
}
