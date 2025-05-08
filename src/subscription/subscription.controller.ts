import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  UnauthorizedException,
  HttpStatus,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { successResponse } from 'src/common/response.helper';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import {
  AddFeatureDto,
  UpdateFeatureDto,
  RemoveFeatureDto,
} from './dto/feature-operation.dto';
import {
  AddBenefitDto,
  UpdateBenefitDto,
  RemoveBenefitDto,
} from './dto/benefit-operation.dto';

@ApiBearerAuth()
@ApiTags('subscription')
@UseGuards(JwtAuthGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  async create(@Body() dto: CreateSubscriptionDto, @Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.createSubscription(dto, req.user.id);
    return successResponse(
      data,
      'Subscription created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active subscription for the current user' })
  @ApiResponse({ status: 200, description: 'Active subscription found' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async getActive(@Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.getActiveSubscription(req.user.id);
    return successResponse(data, 'Active subscription found');
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel the active subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async cancel(@Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.cancelSubscription(req.user.id);
    return successResponse(data, 'Subscription cancelled successfully');
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  async getPlans() {
    const data = await this.service.getSubscriptionPlans();
    return successResponse(data, 'Subscription plans retrieved successfully');
  }
}

@ApiBearerAuth()
@ApiTags('subscription-plans')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('subscription-plans')
export class SubscriptionPlanController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  async createPlan(@Body() createPlanDto: CreateSubscriptionPlanDto) {
    return this.subscriptionService.createPlan(createPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiResponse({ status: 200, description: 'Returns all plans' })
  async getAllPlans(@Query('active') active?: boolean) {
    if (active === true) {
      return this.subscriptionService.getActivePlans();
    }
    return this.subscriptionService.getAllPlans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'Returns the plan' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanById(@Param('id') id: string) {
    return this.subscriptionService.getPlanById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionService.updatePlan(id, updatePlanDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async deletePlan(@Param('id') id: string) {
    return this.subscriptionService.deletePlan(id);
  }

  @Patch(':id/toggle-status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Toggle subscription plan status' })
  @ApiResponse({ status: 200, description: 'Plan status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async togglePlanStatus(@Param('id') id: string) {
    return this.subscriptionService.togglePlanStatus(id);
  }

  @Post(':id/features')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Add a feature to a subscription plan' })
  @ApiResponse({ status: 200, description: 'Feature added successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Feature already exists' })
  async addFeature(
    @Param('id') id: string,
    @Body() addFeatureDto: AddFeatureDto,
  ) {
    return this.subscriptionService.addFeatureToPlan(id, addFeatureDto.feature);
  }

  @Post(':id/benefits')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Add a benefit to a subscription plan' })
  @ApiResponse({ status: 200, description: 'Benefit added successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Benefit already exists' })
  async addBenefit(
    @Param('id') id: string,
    @Body() addBenefitDto: AddBenefitDto,
  ) {
    return this.subscriptionService.addBenefitToPlan(id, addBenefitDto.benefit);
  }

  @Patch(':id/features')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a feature in a subscription plan' })
  @ApiResponse({ status: 200, description: 'Feature updated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Feature not found or new feature already exists' })
  async updateFeature(
    @Param('id') id: string,
    @Body() updateFeatureDto: UpdateFeatureDto,
  ) {
    return this.subscriptionService.updateFeatureInPlan(
      id,
      updateFeatureDto.oldFeature,
      updateFeatureDto.newFeature,
    );
  }

  @Patch(':id/benefits')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a benefit in a subscription plan' })
  @ApiResponse({ status: 200, description: 'Benefit updated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Benefit not found or new benefit already exists' })
  async updateBenefit(
    @Param('id') id: string,
    @Body() updateBenefitDto: UpdateBenefitDto,
  ) {
    return this.subscriptionService.updateBenefitInPlan(
      id,
      updateBenefitDto.oldBenefit,
      updateBenefitDto.newBenefit,
    );
  }

  @Delete(':id/features')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove a feature from a subscription plan' })
  @ApiResponse({ status: 200, description: 'Feature removed successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Feature not found' })
  async removeFeature(
    @Param('id') id: string,
    @Body() removeFeatureDto: RemoveFeatureDto,
  ) {
    return this.subscriptionService.removeFeatureFromPlan(id, removeFeatureDto.feature);
  }

  @Delete(':id/benefits')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove a benefit from a subscription plan' })
  @ApiResponse({ status: 200, description: 'Benefit removed successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Benefit not found' })
  async removeBenefit(
    @Param('id') id: string,
    @Body() removeBenefitDto: RemoveBenefitDto,
  ) {
    return this.subscriptionService.removeBenefitFromPlan(id, removeBenefitDto.benefit);
  }
}
