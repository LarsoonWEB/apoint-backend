import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/helpers';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(params: {
    query?: string;
    categorySlug?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    city?: string;
    page?: number;
    perPage?: number;
    sortBy?: string;
  }) {
    const {
      query,
      categorySlug,
      lat,
      lng,
      radiusKm = 10,
      city,
      page = 1,
      perPage = 20,
      sortBy = 'relevance',
    } = params;

    const where: any = { isActive: true };

    // Text search (name, description)
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { services: { some: { name: { contains: query, mode: 'insensitive' } } } },
      ];
    }

    // Category filter
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    // City filter
    if (city) {
      where.locations = {
        some: { city: { contains: city, mode: 'insensitive' }, isActive: true },
      };
    }

    // For geospatial search, we use raw SQL with PostGIS
    // For MVP, we use a simpler bounding box approach
    if (lat && lng) {
      const latDelta = radiusKm / 111.0; // ~111km per degree latitude
      const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));

      where.locations = {
        some: {
          isActive: true,
          latitude: { gte: lat - latDelta, lte: lat + latDelta },
          longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
        },
      };
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'name') orderBy = { name: 'asc' };
    // For rating sort, we'd need a computed field — defer to post-query sort

    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy,
        include: {
          category: { select: { name: true, nameHr: true, slug: true, icon: true } },
          locations: {
            where: { isActive: true, isPrimary: true },
            select: {
              id: true,
              name: true,
              city: true,
              addressLine1: true,
              latitude: true,
              longitude: true,
            },
            take: 1,
          },
          services: {
            where: { isActive: true },
            select: { id: true, name: true, price: true, durationMinutes: true },
            orderBy: { sortOrder: 'asc' },
            take: 5,
          },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.business.count({ where }),
    ]);

    // Enrich with average ratings
    const enriched = await Promise.all(
      businesses.map(async (b) => {
        const ratingAgg = await this.prisma.review.aggregate({
          where: { revieweeId: b.id, revieweeType: 'business', isPublished: true },
          _avg: { rating: true },
        });

        // Calculate distance if coordinates provided
        let distance: number | undefined;
        if (lat && lng && b.locations[0]) {
          const loc = b.locations[0];
          distance = haversineDistance(
            lat,
            lng,
            Number(loc.latitude),
            Number(loc.longitude),
          );
        }

        return {
          ...b,
          averageRating: ratingAgg._avg.rating || 0,
          distance,
        };
      }),
    );

    // Sort by distance if geospatial
    if (lat && lng && sortBy === 'distance') {
      enriched.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    // Sort by rating
    if (sortBy === 'rating') {
      enriched.sort((a, b) => b.averageRating - a.averageRating);
    }

    return { data: enriched, meta: paginate(total, page, perPage) };
  }

  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }
}

// Haversine distance in km
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
