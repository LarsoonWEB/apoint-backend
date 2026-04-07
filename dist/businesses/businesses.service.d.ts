import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
export declare class BusinessesService {
    private prisma;
    private eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    create(userId: string, data: any): Promise<{
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
    }>;
    findById(id: string): Promise<{
        averageRating: number;
        reviewCount: number;
        category: {
            name: string;
            slug: string;
            nameHr: string;
            icon: string;
        };
        _count: {
            bookings: number;
            reviews: number;
        };
        locations: ({
            workingHours: {
                id: string;
                locationId: string;
                dayOfWeek: number;
                openTime: string;
                closeTime: string;
                breakStart: string | null;
                breakEnd: string | null;
                isClosed: boolean;
            }[];
        } & {
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            businessId: string;
            isActive: boolean;
            addressLine1: string;
            addressLine2: string | null;
            city: string;
            postalCode: string | null;
            country: string;
            latitude: import("@prisma/client/runtime/library").Decimal;
            longitude: import("@prisma/client/runtime/library").Decimal;
            isPrimary: boolean;
        })[];
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
    }>;
    findBySlug(slug: string): Promise<{
        averageRating: number;
        reviewCount: number;
        category: {
            name: string;
            slug: string;
            nameHr: string;
            icon: string;
        };
        locations: ({
            workingHours: {
                id: string;
                locationId: string;
                dayOfWeek: number;
                openTime: string;
                closeTime: string;
                breakStart: string | null;
                breakEnd: string | null;
                isClosed: boolean;
            }[];
        } & {
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            businessId: string;
            isActive: boolean;
            addressLine1: string;
            addressLine2: string | null;
            city: string;
            postalCode: string | null;
            country: string;
            latitude: import("@prisma/client/runtime/library").Decimal;
            longitude: import("@prisma/client/runtime/library").Decimal;
            isPrimary: boolean;
        })[];
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
    }>;
    update(businessId: string, data: any): Promise<{
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
    }>;
    addLocation(businessId: string, data: any): Promise<{
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        businessId: string;
        isActive: boolean;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        postalCode: string | null;
        country: string;
        latitude: import("@prisma/client/runtime/library").Decimal;
        longitude: import("@prisma/client/runtime/library").Decimal;
        isPrimary: boolean;
    }>;
    updateLocation(businessId: string, locationId: string, data: any): Promise<{
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        businessId: string;
        isActive: boolean;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        postalCode: string | null;
        country: string;
        latitude: import("@prisma/client/runtime/library").Decimal;
        longitude: import("@prisma/client/runtime/library").Decimal;
        isPrimary: boolean;
    }>;
    deleteLocation(businessId: string, locationId: string): Promise<{
        message: string;
    }>;
    getLocations(businessId: string): Promise<({
        workingHours: {
            id: string;
            locationId: string;
            dayOfWeek: number;
            openTime: string;
            closeTime: string;
            breakStart: string | null;
            breakEnd: string | null;
            isClosed: boolean;
        }[];
    } & {
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        businessId: string;
        isActive: boolean;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        postalCode: string | null;
        country: string;
        latitude: import("@prisma/client/runtime/library").Decimal;
        longitude: import("@prisma/client/runtime/library").Decimal;
        isPrimary: boolean;
    })[]>;
    setWorkingHours(locationId: string, hours: any[]): Promise<{
        id: string;
        locationId: string;
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        breakStart: string | null;
        breakEnd: string | null;
        isClosed: boolean;
    }[]>;
    getWorkingHours(businessId: string): Promise<({
        location: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        locationId: string;
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        breakStart: string | null;
        breakEnd: string | null;
        isClosed: boolean;
    })[]>;
    addService(businessId: string, data: any): Promise<{
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
    }>;
    updateService(businessId: string, serviceId: string, data: any): Promise<{
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
    }>;
    deleteService(businessId: string, serviceId: string): Promise<{
        message: string;
    }>;
    getServices(businessId: string): Promise<{
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
    }[]>;
    inviteWorker(businessId: string, data: any): Promise<{
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        businessId: string;
        isActive: boolean;
        businessRole: string;
        displayName: string | null;
    }>;
    updateWorker(businessId: string, workerId: string, data: any): Promise<{
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        businessId: string;
        isActive: boolean;
        businessRole: string;
        displayName: string | null;
    }>;
    removeWorker(businessId: string, workerId: string): Promise<{
        message: string;
    }>;
    getWorkers(businessId: string): Promise<({
        user: {
            email: string;
            firstName: string;
            lastName: string;
            avatarUrl: string;
        };
        workerLocations: ({
            location: {
                id: string;
                name: string;
            };
        } & {
            locationId: string;
            workerId: string;
        })[];
        workerServices: ({
            service: {
                id: string;
                name: string;
            };
        } & {
            workerId: string;
            serviceId: string;
        })[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        businessId: string;
        isActive: boolean;
        businessRole: string;
        displayName: string | null;
    })[]>;
}
