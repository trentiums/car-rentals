import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  UnauthorizedException,
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
  create(@Body() dto: CreateSubscriptionDto, @Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    return this.service.createSubscription(dto, req.user.id);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active subscription for the current user' })
  @ApiResponse({ status: 200, description: 'Active subscription found' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  getActive(@Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    return this.service.getActiveSubscription(req.user.id);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel the active subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  cancel(@Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    return this.service.cancelSubscription(req.user.id);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  getPlans() {
    return this.service.getSubscriptionPlans();
  }
}
