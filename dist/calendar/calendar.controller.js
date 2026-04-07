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
exports.CalendarController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const calendar_service_1 = require("./calendar.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const business_roles_guard_1 = require("../common/guards/business-roles.guard");
let CalendarController = class CalendarController {
    constructor(calendarService) {
        this.calendarService = calendarService;
    }
    async getDayView(businessId, date, workerId) {
        return this.calendarService.getDayView(businessId, date, workerId);
    }
    async getWeekView(businessId, startDate, workerId) {
        return this.calendarService.getWeekView(businessId, startDate, workerId);
    }
    async getMonthView(businessId, year, month) {
        return this.calendarService.getMonthView(businessId, year, month);
    }
    async addBlockedSlot(businessId, data) {
        return this.calendarService.addBlockedSlot(data);
    }
    async removeBlockedSlot(id) {
        return this.calendarService.removeBlockedSlot(id);
    }
    async getBlockedSlots(businessId, workerId) {
        return this.calendarService.getBlockedSlots(businessId, workerId);
    }
};
exports.CalendarController = CalendarController;
__decorate([
    (0, common_1.Get)(':businessId/day'),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('worker'),
    (0, swagger_1.ApiOperation)({ summary: 'Get day view for business calendar' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('worker_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getDayView", null);
__decorate([
    (0, common_1.Get)(':businessId/week'),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('worker'),
    (0, swagger_1.ApiOperation)({ summary: 'Get week view for business calendar' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)('start_date')),
    __param(2, (0, common_1.Query)('worker_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getWeekView", null);
__decorate([
    (0, common_1.Get)(':businessId/month'),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('worker'),
    (0, swagger_1.ApiOperation)({ summary: 'Get month view for business calendar' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getMonthView", null);
__decorate([
    (0, common_1.Post)(':businessId/blocked-slots'),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('location_manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a blocked slot (break, holiday)' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "addBlockedSlot", null);
__decorate([
    (0, common_1.Delete)(':businessId/blocked-slots/:id'),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('location_manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a blocked slot' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "removeBlockedSlot", null);
__decorate([
    (0, common_1.Get)(':businessId/blocked-slots'),
    (0, common_1.UseGuards)(business_roles_guard_1.BusinessRolesGuard),
    (0, roles_decorator_1.Roles)('worker'),
    (0, swagger_1.ApiOperation)({ summary: 'Get blocked slots' }),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)('worker_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getBlockedSlots", null);
exports.CalendarController = CalendarController = __decorate([
    (0, swagger_1.ApiTags)('Calendar'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('calendar'),
    __metadata("design:paramtypes", [calendar_service_1.CalendarService])
], CalendarController);
//# sourceMappingURL=calendar.controller.js.map