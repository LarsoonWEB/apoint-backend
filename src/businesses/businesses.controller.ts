import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../common/guards/business-roles.guard';

@ApiTags('Businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  // ── Public Endpoints ──────────────────────────────────────

  @Public()
  @Get(':slug/public')
  @ApiOperation({ summary: 'Get business public profile by slug' })
  async getPublicProfile(@Param('slug') slug: string) {
    return this.businessesService.findBySlug(slug);
  }

  // ── Business CRUD (Owner) ─────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new business' })
  async create(@CurrentUser('id') userId: string, @Body() data: any) {
    return this.businessesService.create(userId, data);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('worker')
  @ApiOperation({ summary: 'Get business details (team members)' })
  async findById(@Param('id') id: string) {
    return this.businessesService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update business settings' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.businessesService.update(id, data);
  }

  // ── Locations ─────────────────────────────────────────────

  @Get(':businessId/locations')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('worker')
  @ApiOperation({ summary: 'Get all locations' })
  async getLocations(@Param('businessId') businessId: string) {
    return this.businessesService.getLocations(businessId);
  }

  @Post(':businessId/locations')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Add a new location' })
  async addLocation(
    @Param('businessId') businessId: string,
    @Body() data: any,
  ) {
    return this.businessesService.addLocation(businessId, data);
  }

  @Patch(':businessId/locations/:locationId')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('location_manager')
  @ApiOperation({ summary: 'Update a location' })
  async updateLocation(
    @Param('businessId') businessId: string,
    @Param('locationId') locationId: string,
    @Body() data: any,
  ) {
    return this.businessesService.updateLocation(businessId, locationId, data);
  }

  @Delete(':businessId/locations/:locationId')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a location' })
  async deleteLocation(
    @Param('businessId') businessId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.businessesService.deleteLocation(businessId, locationId);
  }

  // ── Working Hours ─────────────────────────────────────────

  @Get(':businessId/working-hours')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('worker')
  @ApiOperation({ summary: 'Get working hours for all locations' })
  async getWorkingHours(@Param('businessId') businessId: string) {
    return this.businessesService.getWorkingHours(businessId);
  }

  @Post(':businessId/locations/:locationId/working-hours')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('location_manager')
  @ApiOperation({ summary: 'Set working hours for a location' })
  async setWorkingHours(
    @Param('locationId') locationId: string,
    @Body() data: { hours: any[] },
  ) {
    return this.businessesService.setWorkingHours(locationId, data.hours);
  }

  // ── Services ──────────────────────────────────────────────

  @Public()
  @Get(':businessId/services')
  @ApiOperation({ summary: 'Get business services (public)' })
  async getServices(@Param('businessId') businessId: string) {
    return this.businessesService.getServices(businessId);
  }

  @Post(':businessId/services')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Add a service' })
  async addService(
    @Param('businessId') businessId: string,
    @Body() data: any,
  ) {
    return this.businessesService.addService(businessId, data);
  }

  @Patch(':businessId/services/:serviceId')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update a service' })
  async updateService(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @Body() data: any,
  ) {
    return this.businessesService.updateService(businessId, serviceId, data);
  }

  @Delete(':businessId/services/:serviceId')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate a service' })
  async deleteService(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.businessesService.deleteService(businessId, serviceId);
  }

  // ── Workers (Team) ────────────────────────────────────────

  @Get(':businessId/workers')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('location_manager')
  @ApiOperation({ summary: 'Get team members' })
  async getWorkers(@Param('businessId') businessId: string) {
    return this.businessesService.getWorkers(businessId);
  }

  @Post(':businessId/workers')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Invite a team member' })
  async inviteWorker(
    @Param('businessId') businessId: string,
    @Body() data: any,
  ) {
    return this.businessesService.inviteWorker(businessId, data);
  }

  @Patch(':businessId/workers/:workerId')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update team member' })
  async updateWorker(
    @Param('businessId') businessId: string,
    @Param('workerId') workerId: string,
    @Body() data: any,
  ) {
    return this.businessesService.updateWorker(businessId, workerId, data);
  }

  @Delete(':businessId/workers/:workerId')
  @ApiBearerAuth()
  @UseGuards(BusinessRolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Remove team member' })
  async removeWorker(
    @Param('businessId') businessId: string,
    @Param('workerId') workerId: string,
  ) {
    return this.businessesService.removeWorker(businessId, workerId);
  }
}
