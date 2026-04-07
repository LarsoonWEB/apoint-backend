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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bookings_service_1 = require("./bookings.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const business_roles_guard_1 = require("../common/guards/business-roles.guard");
let BookingsController = class BookingsController {
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    async getAvailability(businessId, workerId, date, serviceIds) {
        const ids = serviceIds.split(',').filter(Boolean);
        return this.bookingsService.getAvailableSlots(businessId, workerId, date, ids);
    }
    async create(userId, data) {
        return this.bookingsService.create(userId, data);
    }
    async createGuest(data) {
        return this.bookingsService.create(null, data);
    }
    async findById(id) {
        return this.bookingsService.findById(id);
    }
    async findByNumber(bookingNumber) {
        return this.bookingsService.findByNumber(bookingNumber);
    }
    async cancel(id, userId, body) {
        return this.bookingsService.cancel(id, userId, body.reason);
    }
    async reschedule(id, userId, body) {
        return this.bookingsService.reschedule(id, userId, body.newStartTime);
    }
    async confirm(id, userId) {
        return this.bookingsService.confirm(id, userId);
    }
    async reject(id, userId, body) {
        return this.bookingsService.reject(id, userId, body.reason);
    }
    async complete(id, userId) {
        return this.bookingsService.complete(id, userId);
    }
    async noShow(id, userId) {
        return this.bookingsService.noShow(id, userId);
    }
    async getBusinessBookings(businessId, page, perPage, status, dateFrom, dateTo) {
        return this.bookingsService.getBusinessBookings(businessId, page || 1, perPage || 20, status, dateFrom, dateTo);
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available time slots' }),
    __param(0, (0, common_1.Query)('business_id')),
    __param(1, (0, common_1.Query)('worker_id')),
    __param(2, (0, common_1.Query)('date')),
    __param(3, (0, common_1.Query)('service_ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new booking' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "create", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('guest'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a guest booking (no account)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "createGuest", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findById", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('number/:bookingNumber'),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking by booking number' }),
    __param(0, (0, common_1.Param)('bookingNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findByNumber", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a booking' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Patch)(':id/reschedule'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reschedule a booking' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "reschedule", null);
__decorate([
    (0, common_1.Patch)(':id/confirm'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm a pending booking (provider)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a pending booking (provider)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark booking as completed (provider)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(':id/no-show'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark booking as no-show (provider)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "noShow", null);
__decorate([
    (0, common_1.Get)('business/:businessId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('worker'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all bookings for a business' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('per_page')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('date_from')),
    __param(5, (0, common_1.Query)('date_to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getBusinessBookings", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('Bookings'),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map