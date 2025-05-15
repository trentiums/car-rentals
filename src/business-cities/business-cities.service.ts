import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddBusinessCityDto } from './dto/add-business-city.dto';

@Injectable()
export class BusinessCitiesService {
  constructor(private readonly prisma: PrismaService) { }

  async addBusinessCity(dto: AddBusinessCityDto, userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has this city as a business city
    const existingBusinessCity = await this.prisma.userBusinessCity.findUnique({
      where: {
        userId_cityName_state: {
          userId,
          cityName: dto.cityName,
          state: dto.state,
        },
      },
    });

    if (existingBusinessCity) {
      if (existingBusinessCity.isActive) {
        throw new BadRequestException(
          'City is already added as a business city',
        );
      } else {
        // Reactivate the existing business city
        return this.prisma.userBusinessCity.update({
          where: { id: existingBusinessCity.id },
          data: { isActive: true },
        });
      }
    }

    // Create new business city
    return this.prisma.userBusinessCity.create({
      data: {
        userId,
        cityName: dto.cityName,
        state: dto.state,
      },
    });
  }

  async removeBusinessCity(cityName: string, state: string, userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has this city as a business city
    const businessCity = await this.prisma.userBusinessCity.findUnique({
      where: {
        userId_cityName_state: {
          userId,
          cityName: cityName,
          state: state,
        },
      },
    });

    if (!businessCity) {
      throw new NotFoundException('City is not added as a business city');
    }

    // Soft delete the business city
    return this.prisma.userBusinessCity.update({
      where: { id: businessCity.id },
      data: { isActive: false },
    });
  }

  async getUserBusinessCities(userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all active business cities for the user
    return this.prisma.userBusinessCity.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  async getRequirementsByBusinessCities(
    userId: string,
    carTypes?: string | string[],
    pickupDateFrom?: string,
    pickupDateTo?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const businessCities = await this.prisma.userBusinessCity.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const isUserIsVerified = user?.isVerified;
    const cityNames = businessCities.map((bc) => bc.cityName);

    const whereConditions: any = {
      AND: [
        { isDeleted: false },
        {
          status: { in: ['CREATED', 'ASSIGNED'] },
        },
        // {
        //   OR: [{ fromCity: { in: cityNames } }, { toCity: { in: cityNames } }],
        // },
        { NOT: { postedById: userId } },
      ],
    };

    // Handle carTypes - convert string to array if needed
    let carTypeArray: string[] = [];
    if (carTypes) {
      if (typeof carTypes === 'string') {
        carTypeArray = carTypes.split(',').map(type => type.trim());
      } else {
        carTypeArray = carTypes;
      }
    }

    if (carTypeArray.length > 0) {
      whereConditions.AND.push({ carType: { in: carTypeArray } });
    }

    if (pickupDateFrom || pickupDateTo) {
      const dateFilter: any = {};
      if (pickupDateFrom) dateFilter.gte = new Date(pickupDateFrom);
      if (pickupDateTo) dateFilter.lte = new Date(pickupDateTo);
      whereConditions.AND.push({ pickupDate: dateFilter });
    }

    const skip = (page - 1) * limit;

    if (!isUserIsVerified) {
      whereConditions.AND.push({ onlyVerified: false });
    }

    const [requirements, total] = await Promise.all([
      this.prisma.requirement.findMany({
        where: whereConditions,
        include: {
          postedBy: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.requirement.count({
        where: whereConditions,
      }),
    ]);

    return {
      requirements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
