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
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

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

  constructor(private readonly prisma: PrismaService) { }

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
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlan(createPlanDto: CreateSubscriptionPlanDto) {
    return this.prisma.subscriptionPlan.create({
      data: {
        ...createPlanDto,
        features: createPlanDto.features,
        benefits: createPlanDto.benefits,
      },
    });
  }

  async getAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActivePlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }

  async updatePlan(id: string, updatePlanDto: UpdateSubscriptionPlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...updatePlanDto,
        features: updatePlanDto.features ? updatePlanDto.features : undefined,
        benefits: updatePlanDto.benefits ? updatePlanDto.benefits : undefined,
      },
    });
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return this.prisma.subscriptionPlan.delete({
      where: { id },
    });
  }

  async togglePlanStatus(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        isActive: !plan.isActive,
      },
    });
  }

  async addFeatureToPlan(id: string, feature: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const features = plan.features as string[];
    if (features.includes(feature)) {
      throw new BadRequestException('Feature already exists in the plan');
    }

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        features: [...features, feature],
      },
    });
  }

  async addBenefitToPlan(id: string, benefit: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const benefits = plan.benefits as string[];
    if (benefits.includes(benefit)) {
      throw new BadRequestException('Benefit already exists in the plan');
    }

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        benefits: [...benefits, benefit],
      },
    });
  }

  async updateFeatureInPlan(id: string, oldFeature: string, newFeature: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const features = plan.features as string[];
    if (!features.includes(oldFeature)) {
      throw new BadRequestException('Feature not found in the plan');
    }

    if (features.includes(newFeature)) {
      throw new BadRequestException('New feature already exists in the plan');
    }

    const updatedFeatures = features.map(f =>
      f === oldFeature ? newFeature : f
    );

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        features: updatedFeatures,
      },
    });
  }

  async updateBenefitInPlan(id: string, oldBenefit: string, newBenefit: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const benefits = plan.benefits as string[];
    if (!benefits.includes(oldBenefit)) {
      throw new BadRequestException('Benefit not found in the plan');
    }

    if (benefits.includes(newBenefit)) {
      throw new BadRequestException('New benefit already exists in the plan');
    }

    const updatedBenefits = benefits.map(b =>
      b === oldBenefit ? newBenefit : b
    );

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        benefits: updatedBenefits,
      },
    });
  }

  async removeFeatureFromPlan(id: string, feature: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const features = plan.features as string[];
    if (!features.includes(feature)) {
      throw new BadRequestException('Feature not found in the plan');
    }

    const updatedFeatures = features.filter(f => f !== feature);

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        features: updatedFeatures,
      },
    });
  }

  async removeBenefitFromPlan(id: string, benefit: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const benefits = plan.benefits as string[];
    if (!benefits.includes(benefit)) {
      throw new BadRequestException('Benefit not found in the plan');
    }

    const updatedBenefits = benefits.filter(b => b !== benefit);

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        benefits: updatedBenefits,
      },
    });
  }
}
