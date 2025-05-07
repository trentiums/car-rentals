import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { successResponse } from 'src/common/response.helper';

@ApiBearerAuth()
@ApiTags('subscription')
@UseGuards(JwtAuthGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

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
