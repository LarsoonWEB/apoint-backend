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
var BusinessRolesGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
const roles_decorator_1 = require("../decorators/roles.decorator");
let BusinessRolesGuard = BusinessRolesGuard_1 = class BusinessRolesGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        const businessId = request.params.businessId ||
            request.params.id ||
            request.query.business_id ||
            request.body.businessId;
        if (!businessId) {
            throw new common_1.ForbiddenException('Business context required');
        }
        const worker = await this.prisma.worker.findUnique({
            where: {
                userId_businessId: {
                    userId: user.id,
                    businessId,
                },
            },
            select: { businessRole: true, isActive: true },
        });
        if (!worker || !worker.isActive) {
            throw new common_1.ForbiddenException('You are not a member of this business');
        }
        const userRoleLevel = BusinessRolesGuard_1.ROLE_HIERARCHY[worker.businessRole] || 0;
        const hasAccess = requiredRoles.some((role) => {
            const requiredLevel = BusinessRolesGuard_1.ROLE_HIERARCHY[role] || 0;
            return userRoleLevel >= requiredLevel;
        });
        if (!hasAccess) {
            throw new common_1.ForbiddenException('Insufficient permissions for this action');
        }
        request.worker = worker;
        return true;
    }
};
exports.BusinessRolesGuard = BusinessRolesGuard;
BusinessRolesGuard.ROLE_HIERARCHY = {
    owner: 4,
    admin: 3,
    location_manager: 2,
    worker: 1,
};
exports.BusinessRolesGuard = BusinessRolesGuard = BusinessRolesGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], BusinessRolesGuard);
//# sourceMappingURL=business-roles.guard.js.map