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
exports.BusinessesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const businesses_service_1 = require("./businesses.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const business_roles_guard_1 = require("../common/guards/business-roles.guard");
let BusinessesController = class BusinessesController {
    constructor(businessesService) {
        this.businessesService = businessesService;
    }
    async getPublicProfile(slug) {
        return this.businessesService.findBySlug(slug);
    }
    async create(userId, data) {
        return this.businessesService.create(userId, data);
    }
    async findById(id) {
        return this.businessesService.findById(id);
    }
    async update(id, data) {
        return this.businessesService.update(id, data);
    }
    async getLocations(businessId) {
        return this.businessesService.getLocations(businessId);
    }
    async addLocation(businessId, data) {
        return this.businessesService.addLocation(businessId, data);
    }
    async updateLocation(businessId, locationId, data) {
        return this.businessesService.updateLocation(businessId, locationId, data);
    }
    async deleteLocation(businessId, locationId) {
        return this.businessesService.deleteLocation(businessId, locationId);
    }
    async getWorkingHours(businessId) {
        return this.businessesService.getWorkingHours(businessId);
    }
    async setWorkingHours(locationId, data) {
        return this.businessesService.setWorkingHours(locationId, data.hours);
    }
    async getServices(businessId) {
        return this.businessesService.getServices(businessId);
    }
    async addService(businessId, data) {
        return this.businessesService.addService(businessId, data);
    }
    async updateService(businessId, serviceId, data) {
        return this.businessesService.updateService(businessId, serviceId, data);
    }
    async deleteService(businessId, serviceId) {
        return this.businessesService.deleteService(businessId, serviceId);
    }
    async getWorkers(businessId) {
        return this.businessesService.getWorkers(businessId);
    }
    async inviteWorker(businessId, data) {
        return this.businessesService.inviteWorker(businessId, data);
    }
    async updateWorker(businessId, workerId, data) {
        return this.businessesService.updateWorker(businessId, workerId, data);
    }
    async removeWorker(businessId, workerId) {
        return this.businessesService.removeWorker(businessId, workerId);
    }
};
exports.BusinessesController = BusinessesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':slug/public'),
    (0, swagger_1.ApiOperation)({ summary: 'Get business public profile by slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "getPublicProfile", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new business' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('worker'),
    (0, swagger_1.ApiOperation)({ summary: 'Get business details (team members)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update business settings' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':businessId/locations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('worker'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all locations' }),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "getLocations", null);
__decorate([
    (0, common_1.Post)(':businessId/locations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new location' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "addLocation", null);
__decorate([
    (0, common_1.Patch)(':businessId/locations/:locationId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('location_manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a location' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Param)('locationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Delete)(':businessId/locations/:locationId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a location' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Param)('locationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "deleteLocation", null);
__decorate([
    (0, common_1.Get)(':businessId/working-hours'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('worker'),
    (0, swagger_1.ApiOperation)({ summary: 'Get working hours for all locations' }),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "getWorkingHours", null);
__decorate([
    (0, common_1.Post)(':businessId/locations/:locationId/working-hours'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('location_manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Set working hours for a location' }),
    __param(0, (0, common_1.Param)('locationId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "setWorkingHours", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':businessId/services'),
    (0, swagger_1.ApiOperation)({ summary: 'Get business services (public)' }),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "getServices", null);
__decorate([
    (0, common_1.Post)(':businessId/services'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a service' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "addService", null);
__decorate([
    (0, common_1.Patch)(':businessId/services/:serviceId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a service' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Param)('serviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "updateService", null);
__decorate([
    (0, common_1.Delete)(':businessId/services/:serviceId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a service' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Param)('serviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "deleteService", null);
__decorate([
    (0, common_1.Get)(':businessId/workers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('location_manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Get team members' }),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "getWorkers", null);
__decorate([
    (0, common_1.Post)(':businessId/workers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Invite a team member' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "inviteWorker", null);
__decorate([
    (0, common_1.Patch)(':businessId/workers/:workerId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update team member' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Param)('workerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "updateWorker", null);
__decorate([
    (0, common_1.Delete)(':businessId/workers/:workerId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove team member' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Param)('workerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "removeWorker", null);
exports.BusinessesController = BusinessesController = __decorate([
    (0, swagger_1.ApiTags)('Businesses'),
    (0, common_1.Controller)('businesses'),
    __metadata("design:paramtypes", [businesses_service_1.BusinessesService])
], BusinessesController);
//# sourceMappingURL=businesses.controller.js.map