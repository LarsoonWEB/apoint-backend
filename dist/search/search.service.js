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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const helpers_1 = require("../common/utils/helpers");
let SearchService = class SearchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(params) {
        const { query, categorySlug, lat, lng, radiusKm = 10, city, page = 1, perPage = 20, sortBy = 'relevance', } = params;
        const where = { isActive: true };
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { services: { some: { name: { contains: query, mode: 'insensitive' } } } },
            ];
        }
        if (categorySlug) {
            where.category = { slug: categorySlug };
        }
        if (city) {
            where.locations = {
                some: { city: { contains: city, mode: 'insensitive' }, isActive: true },
            };
        }
        if (lat && lng) {
            const latDelta = radiusKm / 111.0;
            const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));
            where.locations = {
                some: {
                    isActive: true,
                    latitude: { gte: lat - latDelta, lte: lat + latDelta },
                    longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
                },
            };
        }
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'name')
            orderBy = { name: 'asc' };
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
        const enriched = await Promise.all(businesses.map(async (b) => {
            const ratingAgg = await this.prisma.review.aggregate({
                where: { revieweeId: b.id, revieweeType: 'business', isPublished: true },
                _avg: { rating: true },
            });
            let distance;
            if (lat && lng && b.locations[0]) {
                const loc = b.locations[0];
                distance = haversineDistance(lat, lng, Number(loc.latitude), Number(loc.longitude));
            }
            return {
                ...b,
                averageRating: ratingAgg._avg.rating || 0,
                distance,
            };
        }));
        if (lat && lng && sortBy === 'distance') {
            enriched.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }
        if (sortBy === 'rating') {
            enriched.sort((a, b) => b.averageRating - a.averageRating);
        }
        return { data: enriched, meta: (0, helpers_1.paginate)(total, page, perPage) };
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
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
//# sourceMappingURL=search.service.js.map