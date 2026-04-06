import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard that checks if the current user has the required business role.
 * Expects `businessId` in route params or body.
 * Roles hierarchy: owner > admin > location_manager > worker
 */
@Injectable()
export class BusinessRolesGuard implements CanActivate {
  private static readonly ROLE_HIERARCHY: Record<string, number> = {
    owner: 4,
    admin: 3,
    location_manager: 2,
    worker: 1,
  };

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Get businessId from params, query, or body
    const businessId =
      request.params.businessId ||
      request.params.id ||
      request.query.business_id ||
      request.body.businessId;

    if (!businessId) {
      throw new ForbiddenException('Business context required');
    }

    // Find worker record for this user in this business
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
      throw new ForbiddenException(
        'You are not a member of this business',
      );
    }

    // Check if the worker's role meets the minimum required role
    const userRoleLevel =
      BusinessRolesGuard.ROLE_HIERARCHY[worker.businessRole] || 0;
    const hasAccess = requiredRoles.some((role) => {
      const requiredLevel = BusinessRolesGuard.ROLE_HIERARCHY[role] || 0;
      return userRoleLevel >= requiredLevel;
    });

    if (!hasAccess) {
      throw new ForbiddenException(
        'Insufficient permissions for this action',
      );
    }

    // Attach worker info to request for downstream use
    request.worker = worker;
    return true;
  }
}
