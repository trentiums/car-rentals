import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddBusinessCityDto } from './dto/add-business-city.dto';

@Injectable()
export class BusinessCitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async addBusinessCity(dto: AddBusinessCityDto, userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if city exists
    const city = await this.prisma.city.findUnique({
      where: { id: dto.cityId },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    // Check if user already has this city as a business city
    const existingBusinessCity = await this.prisma.userBusinessCity.findUnique({
      where: {
        userId_cityId: {
          userId,
          cityId: dto.cityId,
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
        cityId: dto.cityId,
      },
    });
  }

  async removeBusinessCity(cityId: string, userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if city exists
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    // Check if user has this city as a business city
    const businessCity = await this.prisma.userBusinessCity.findUnique({
      where: {
        userId_cityId: {
          userId,
          cityId,
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
      include: {
        city: true,
      },
    });
  }

  async getRequirementsByBusinessCities(userId: string) {
    // Get all active business cities for the user
    const businessCities = await this.prisma.userBusinessCity.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        city: true,
      },
    });

    if (businessCities.length === 0) {
      return [];
    }

    // Extract city IDs
    const cityIds = businessCities.map((bc) => bc.city.id);
    const cityNames = businessCities.map((bc) => bc.city.name);

    // Get requirements where fromCity or toCity matches any of the user's business cities
    return this.prisma.requirement.findMany({
      where: {
        OR: [
          {
            fromCity: {
              in: cityNames,
            },
          },
          {
            toCity: {
              in: cityNames,
            },
          },
        ],
        isDeleted: false,
        status: 'CREATED',
      },
      include: {
        postedBy: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            isVerified: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
