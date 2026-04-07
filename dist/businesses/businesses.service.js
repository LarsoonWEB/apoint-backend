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
exports.BusinessesService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const helpers_1 = require("../common/utils/helpers");
let BusinessesService = class BusinessesService {
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async create(userId, data) {
        let slug = (0, helpers_1.generateSlug)(data.name);
        const existing = await this.prisma.business.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }
        const business = await this.prisma.business.create({
            data: {
                ownerId: userId,
                name: data.name,
                slug,
                description: data.description,
                categoryId: data.categoryId,
                logoUrl: data.logoUrl,
                coverPhotoUrl: data.coverPhotoUrl,
                website: data.website,
                instagram: data.instagram,
                facebook: data.facebook,
                bookingMode: data.bookingMode || 'instant',
                cancellationHours: data.cancellationHours || 24,
                depositType: data.depositType || 'none',
                depositAmount: data.depositAmount || 0,
            },
        });
        await this.prisma.worker.create({
            data: {
                userId,
                businessId: business.id,
                businessRole: 'owner',
                displayName: `${data.ownerName || 'Owner'}`,
            },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { userType: 'PROVIDER' },
        });
        return business;
    }
    async findById(id) {
        const business = await this.prisma.business.findUnique({
            where: { id },
            include: {
                category: { select: { name: true, nameHr: true, slug: true, icon: true } },
                locations: {
                    where: { isActive: true },
                    include: { workingHours: true },
                },
                services: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
                _count: { select: { reviews: true, bookings: true } },
            },
        });
        if (!business)
            throw new common_1.NotFoundException('Business not found');
        const ratingAgg = await this.prisma.review.aggregate({
            where: { revieweeId: id, revieweeType: 'business', isPublished: true },
            _avg: { rating: true },
            _count: true,
        });
        return {
            ...business,
            averageRating: ratingAgg._avg.rating || 0,
            reviewCount: ratingAgg._count,
        };
    }
    async findBySlug(slug) {
        const business = await this.prisma.business.findUnique({
            where: { slug },
            include: {
                category: { select: { name: true, nameHr: true, slug: true, icon: true } },
                locations: {
                    where: { isActive: true },
                    include: { workingHours: true },
                },
                services: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        if (!business)
            throw new common_1.NotFoundException('Business not found');
        const ratingAgg = await this.prisma.review.aggregate({
            where: { revieweeId: business.id, revieweeType: 'business', isPublished: true },
            _avg: { rating: true },
            _count: true,
        });
        return {
            ...business,
            averageRating: ratingAgg._avg.rating || 0,
            reviewCount: ratingAgg._count,
        };
    }
    async update(businessId, data) {
        return this.prisma.business.update({
            where: { id: businessId },
            data: {
                name: data.name,
                description: data.description,
                categoryId: data.categoryId,
                logoUrl: data.logoUrl,
                coverPhotoUrl: data.coverPhotoUrl,
                website: data.website,
                instagram: data.instagram,
                facebook: data.facebook,
                bookingMode: data.bookingMode,
                cancellationHours: data.cancellationHours,
                depositType: data.depositType,
                depositAmount: data.depositAmount,
            },
        });
    }
    async addLocation(businessId, data) {
        return this.prisma.location.create({
            data: {
                businessId,
                name: data.name,
                addressLine1: data.addressLine1,
                addressLine2: data.addressLine2,
                city: data.city,
                postalCode: data.postalCode,
                country: data.country || 'HR',
                latitude: data.latitude,
                longitude: data.longitude,
                phone: data.phone,
                isPrimary: data.isPrimary || false,
            },
        });
    }
    async updateLocation(businessId, locationId, data) {
        return this.prisma.location.update({
            where: { id: locationId, businessId },
            data,
        });
    }
    async deleteLocation(businessId, locationId) {
        await this.prisma.location.delete({
            where: { id: locationId, businessId },
        });
        return { message: 'Location deleted' };
    }
    async getLocations(businessId) {
        return this.prisma.location.findMany({
            where: { businessId, isActive: true },
            include: { workingHours: true },
        });
    }
    async setWorkingHours(locationId, hours) {
        await this.prisma.workingHours.deleteMany({ where: { locationId } });
        const data = hours.map((h) => ({
            locationId,
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            breakStart: h.breakStart,
            breakEnd: h.breakEnd,
            isClosed: h.isClosed || false,
        }));
        await this.prisma.workingHours.createMany({ data });
        return this.prisma.workingHours.findMany({ where: { locationId } });
    }
    async getWorkingHours(businessId) {
        return this.prisma.workingHours.findMany({
            where: { location: { businessId } },
            include: { location: { select: { id: true, name: true } } },
        });
    }
    async addService(businessId, data) {
        return this.prisma.service.create({
            data: {
                businessId,
                name: data.name,
                description: data.description,
                durationMinutes: data.durationMinutes,
                price: data.price,
                currency: data.currency || 'EUR',
                categoryId: data.categoryId,
                requiresDeposit: data.requiresDeposit || false,
                sortOrder: data.sortOrder || 0,
                locationType: data.locationType || 'at_business',
                travelSurcharge: data.travelSurcharge || 0,
                travelRadiusKm: data.travelRadiusKm || 0,
            },
        });
    }
    async updateService(businessId, serviceId, data) {
        return this.prisma.service.update({
            where: { id: serviceId, businessId },
            data,
        });
    }
    async deleteService(businessId, serviceId) {
        await this.prisma.service.update({
            where: { id: serviceId, businessId },
            data: { isActive: false },
        });
        return { message: 'Service deactivated' };
    }
    async getServices(businessId) {
        return this.prisma.service.findMany({
            where: { businessId, isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async inviteWorker(businessId, data) {
        let user = await this.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: data.email,
                    firstName: data.firstName || 'Invited',
                    lastName: data.lastName || 'Worker',
                    authProvider: 'email',
                    userType: 'PROVIDER',
                },
            });
        }
        const existing = await this.prisma.worker.findUnique({
            where: { userId_businessId: { userId: user.id, businessId } },
        });
        if (existing) {
            throw new common_1.ConflictException('User is already a team member');
        }
        const worker = await this.prisma.worker.create({
            data: {
                userId: user.id,
                businessId,
                businessRole: data.role || 'worker',
                displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            },
        });
        if (data.locationIds && data.locationIds.length > 0) {
            await this.prisma.workerLocation.createMany({
                data: data.locationIds.map((locId) => ({
                    workerId: worker.id,
                    locationId: locId,
                })),
            });
        }
        if (data.serviceIds && data.serviceIds.length > 0) {
            await this.prisma.workerService.createMany({
                data: data.serviceIds.map((svcId) => ({
                    workerId: worker.id,
                    serviceId: svcId,
                })),
            });
        }
        this.eventEmitter.emit('worker.invited', {
            workerId: worker.id,
            email: data.email,
            businessId,
        });
        return worker;
    }
    async updateWorker(businessId, workerId, data) {
        const worker = await this.prisma.worker.findFirst({
            where: { id: workerId, businessId },
        });
        if (!worker)
            throw new common_1.NotFoundException('Worker not found');
        if (worker.businessRole === 'owner' && data.businessRole !== 'owner') {
            throw new common_1.ForbiddenException('Cannot change owner role');
        }
        return this.prisma.worker.update({
            where: { id: workerId },
            data: {
                businessRole: data.businessRole,
                displayName: data.displayName,
                isActive: data.isActive,
            },
        });
    }
    async removeWorker(businessId, workerId) {
        const worker = await this.prisma.worker.findFirst({
            where: { id: workerId, businessId },
        });
        if (!worker)
            throw new common_1.NotFoundException('Worker not found');
        if (worker.businessRole === 'owner') {
            throw new common_1.ForbiddenException('Cannot remove business owner');
        }
        await this.prisma.worker.update({
            where: { id: workerId },
            data: { isActive: false },
        });
        return { message: 'Worker removed' };
    }
    async getWorkers(businessId) {
        return this.prisma.worker.findMany({
            where: { businessId, isActive: true },
            include: {
                user: { select: { email: true, firstName: true, lastName: true, avatarUrl: true } },
                workerLocations: { include: { location: { select: { id: true, name: true } } } },
                workerServices: { include: { service: { select: { id: true, name: true } } } },
            },
        });
    }
};
exports.BusinessesService = BusinessesService;
exports.BusinessesService = BusinessesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], BusinessesService);
//# sourceMappingURL=businesses.service.js.map