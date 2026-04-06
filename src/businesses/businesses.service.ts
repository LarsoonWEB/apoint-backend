import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug, paginate } from '../common/utils/helpers';

@Injectable()
export class BusinessesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ── Business CRUD ─────────────────────────────────────────

  async create(userId: string, data: any) {
    let slug = generateSlug(data.name);

    // Ensure unique slug
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

    // Auto-create owner as worker
    await this.prisma.worker.create({
      data: {
        userId,
        businessId: business.id,
        businessRole: 'owner',
        displayName: `${data.ownerName || 'Owner'}`,
      },
    });

    // Update user type to provider
    await this.prisma.user.update({
      where: { id: userId },
      data: { userType: 'PROVIDER' },
    });

    return business;
  }

  async findById(id: string) {
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
    if (!business) throw new NotFoundException('Business not found');

    // Calculate average rating
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

  async findBySlug(slug: string) {
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
    if (!business) throw new NotFoundException('Business not found');

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

  async update(businessId: string, data: any) {
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

  // ── Locations ─────────────────────────────────────────────

  async addLocation(businessId: string, data: any) {
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

  async updateLocation(businessId: string, locationId: string, data: any) {
    return this.prisma.location.update({
      where: { id: locationId, businessId },
      data,
    });
  }

  async deleteLocation(businessId: string, locationId: string) {
    await this.prisma.location.delete({
      where: { id: locationId, businessId },
    });
    return { message: 'Location deleted' };
  }

  async getLocations(businessId: string) {
    return this.prisma.location.findMany({
      where: { businessId, isActive: true },
      include: { workingHours: true },
    });
  }

  // ── Working Hours ─────────────────────────────────────────

  async setWorkingHours(locationId: string, hours: any[]) {
    // Delete existing and recreate
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

  async getWorkingHours(businessId: string) {
    return this.prisma.workingHours.findMany({
      where: { location: { businessId } },
      include: { location: { select: { id: true, name: true } } },
    });
  }

  // ── Services ──────────────────────────────────────────────

  async addService(businessId: string, data: any) {
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

  async updateService(businessId: string, serviceId: string, data: any) {
    return this.prisma.service.update({
      where: { id: serviceId, businessId },
      data,
    });
  }

  async deleteService(businessId: string, serviceId: string) {
    await this.prisma.service.update({
      where: { id: serviceId, businessId },
      data: { isActive: false },
    });
    return { message: 'Service deactivated' };
  }

  async getServices(businessId: string) {
    return this.prisma.service.findMany({
      where: { businessId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ── Workers ───────────────────────────────────────────────

  async inviteWorker(businessId: string, data: any) {
    // Find or check user by email
    let user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Create a placeholder user account
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

    // Check if already a worker
    const existing = await this.prisma.worker.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
    });
    if (existing) {
      throw new ConflictException('User is already a team member');
    }

    const worker = await this.prisma.worker.create({
      data: {
        userId: user.id,
        businessId,
        businessRole: data.role || 'worker',
        displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      },
    });

    // Assign to locations if specified
    if (data.locationIds && data.locationIds.length > 0) {
      await this.prisma.workerLocation.createMany({
        data: data.locationIds.map((locId: string) => ({
          workerId: worker.id,
          locationId: locId,
        })),
      });
    }

    // Assign services if specified
    if (data.serviceIds && data.serviceIds.length > 0) {
      await this.prisma.workerService.createMany({
        data: data.serviceIds.map((svcId: string) => ({
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

  async updateWorker(businessId: string, workerId: string, data: any) {
    const worker = await this.prisma.worker.findFirst({
      where: { id: workerId, businessId },
    });
    if (!worker) throw new NotFoundException('Worker not found');

    // Cannot change owner role
    if (worker.businessRole === 'owner' && data.businessRole !== 'owner') {
      throw new ForbiddenException('Cannot change owner role');
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

  async removeWorker(businessId: string, workerId: string) {
    const worker = await this.prisma.worker.findFirst({
      where: { id: workerId, businessId },
    });
    if (!worker) throw new NotFoundException('Worker not found');
    if (worker.businessRole === 'owner') {
      throw new ForbiddenException('Cannot remove business owner');
    }

    await this.prisma.worker.update({
      where: { id: workerId },
      data: { isActive: false },
    });
    return { message: 'Worker removed' };
  }

  async getWorkers(businessId: string) {
    return this.prisma.worker.findMany({
      where: { businessId, isActive: true },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, avatarUrl: true } },
        workerLocations: { include: { location: { select: { id: true, name: true } } } },
        workerServices: { include: { service: { select: { id: true, name: true } } } },
      },
    });
  }
}
