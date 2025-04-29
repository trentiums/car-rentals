import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateSubscriptionDto,
  SubscriptionPlanEnum,
} from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionService {
  private readonly PLAN_PRICES = {
    [SubscriptionPlanEnum.ONE_MONTH]: 300,
    [SubscriptionPlanEnum.SIX_MONTHS]: 1500,
    [SubscriptionPlanEnum.ONE_YEAR]: 2500,
  };

  private readonly PLAN_DURATIONS = {
    [SubscriptionPlanEnum.ONE_MONTH]: 30, // days
    [SubscriptionPlanEnum.SIX_MONTHS]: 180, // days
    [SubscriptionPlanEnum.ONE_YEAR]: 365, // days
  };

  constructor(private readonly prisma: PrismaService) {}

  async createSubscription(dto: CreateSubscriptionDto, userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has an active subscription
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: {
          gt: new Date(),
        },
      },
    });

    if (activeSubscription) {
      throw new BadRequestException('User already has an active subscription');
    }

    // Calculate subscription end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + this.PLAN_DURATIONS[dto.plan]);

    // Calculate price (with promo code discount if applicable)
    let price = this.PLAN_PRICES[dto.plan];

    if (dto.promoCode) {
      const promoCode = await this.prisma.promoCode.findFirst({
        where: {
          code: dto.promoCode,
          isActive: true,
          startDate: {
            lte: new Date(),
          },
          endDate: {
            gte: new Date(),
          },
        },
      });

      if (promoCode) {
        price = price * (1 - promoCode.discountPercentage / 100);
      }
    }

    // Create subscription
    return this.prisma.subscription.create({
      data: {
        userId,
        plan: dto.plan,
        startDate,
        endDate,
        price,
        isActive: true,
        promoCodeUsed: dto.promoCode,
      },
    });
  }

  async getActiveSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: {
          gt: new Date(),
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    return subscription;
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: {
          gt: new Date(),
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        isActive: false,
        cancelledAt: new Date(),
      },
    });
  }

  async getSubscriptionPlans() {
    return Object.entries(this.PLAN_PRICES).map(([plan, price]) => ({
      plan,
      price,
      duration: this.PLAN_DURATIONS[plan],
    }));
  }
}
