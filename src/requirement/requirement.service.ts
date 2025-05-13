import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRequirementDto } from './dto/create.requirement.dto';
import {
  AssignRequirementDto,
  ConfirmRequirementDto,
} from './dto/confirm-requirement.dto';
import { CreateReturnRequirementDto } from './dto/create-return-requirement.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class RequirementService {
  constructor(private readonly prisma: PrismaService) { }

  async createRequirement(dto: CreateRequirementDto, userId: string) {
    const now = dayjs();
    const pickupDate = dayjs(dto.pickupDate).startOf('day');
    if (pickupDate.isBefore(now.startOf('day'))) {
      throw new BadRequestException('Pickup date cannot be in the past');
    }
    if (pickupDate.isSame(now, 'day')) {
      const pickupDateTime = dayjs(
        `${pickupDate.format('YYYY-MM-DD')}T${dto.pickupTime}`,
      );
      if (pickupDateTime.isBefore(now)) {
        throw new BadRequestException('Pickup time must be in the future');
      }
    }
    const carType = await this.prisma.carType.findFirst({
      where: { id: dto.carType },
    });

    if (!carType) {
      throw new NotFoundException('Car type not found');
    }

    return this.prisma.requirement.create({
      data: {
        postedById: userId,
        fromCity: dto.fromCity,
        toCity: dto.toCity,
        pickupDate: dto.pickupDate,
        pickupTime: dto.pickupTime,
        carType: dto.carType,
        tripType: dto.tripType,
        budget: dto.budget,
        onlyVerified: dto.onlyVerified,
        comment: dto.comment,
        isDeleted: false,
        status: 'CREATED',
      },
    });
  }

  async confirmRequirement(dto: ConfirmRequirementDto, userId: string) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id: dto.requirementId },
    });

    if (!requirement || requirement.isDeleted) {
      throw new NotFoundException('Requirement not found');
    }

    if (requirement.postedById !== userId) {
      throw new BadRequestException('You cannot confirm this requirement');
    }
    if (!requirement || requirement.isDeleted) {
      throw new NotFoundException('Requirement not found');
    }

    return this.prisma.requirement.update({
      where: { id: dto.requirementId },
      data: {
        status: 'CONFIRMED',
      },
    });
  }

  async assignRequirement(dto: AssignRequirementDto, userId: string) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id: dto.requirementId },
    });

    if (!requirement || requirement.isDeleted) {
      throw new NotFoundException('Requirement not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentUser = await this.prisma.user.findFirst({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('Logged-in user not found');
    }

    if (currentUser.phoneNumber === dto.phoneNumber) {
      throw new BadRequestException(
        'You cannot assign the requirement to yourself',
      );
    }

    return this.prisma.requirement.update({
      where: { id: dto.requirementId },
      data: {
        assignedToId: user.id,
        status: 'ASSIGNED',
      },
    });
  }

  async deleteRequirement(id: string) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id },
    });

    if (!requirement) {
      throw new NotFoundException('Requirement not found');
    }

    return this.prisma.requirement.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async getActiveRequirements() {
    return this.prisma.requirement.findMany({
      where: {
        isDeleted: false,
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
        assignedTo: {
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

  async createReturnRequirement(
    dto: CreateReturnRequirementDto,
    userId: string,
  ) {
    // If originalRequirementId is provided, create return trip based on it
    if (dto.originalRequirementId) {
      const originalRequirement = await this.prisma.requirement.findUnique({
        where: { id: dto.originalRequirementId },
      });

      if (!originalRequirement || originalRequirement.isDeleted) {
        throw new NotFoundException('Original requirement not found');
      }

      if (originalRequirement.postedById !== userId) {
        throw new BadRequestException(
          'You can only create return trips for your own requirements',
        );
      }

      if (originalRequirement.tripType !== 'ONEWAY') {
        throw new BadRequestException(
          'Can only create return trips for one-way journeys',
        );
      }

      if (originalRequirement.isReturnTrip) {
        throw new BadRequestException(
          'Cannot create a return trip for another return trip',
        );
      }

      // Create the return requirement based on original trip
      return this.prisma.requirement.create({
        data: {
          postedById: userId,
          fromCity: originalRequirement.fromCity,
          toCity: originalRequirement.toCity,
          pickupDate: dto.returnPickupDate,
          pickupTime: dto.returnPickupTime,
          carType: originalRequirement.carType,
          tripType: 'ONEWAY',
          budget: dto.returnBudget,
          onlyVerified: dto.onlyVerified,
          comment: dto.comment,
          isDeleted: false,
          status: 'CREATED',
          returnTripId: originalRequirement.id,
          isReturnTrip: true,
        },
      });
    } else {
      // Create a new return requirement manually
      if (!dto.fromCity || !dto.toCity || !dto.carType) {
        throw new BadRequestException(
          'fromCity, toCity, and carType are required for manual return trip creation',
        );
      }

      const carType = await this.prisma.carType.findFirst({
        where: { id: dto.carType },
      });

      if (!carType) {
        throw new NotFoundException('Car type not found');
      }

      return this.prisma.requirement.create({
        data: {
          postedById: userId,
          fromCity: dto.fromCity,
          toCity: dto.toCity,
          pickupDate: dto.returnPickupDate,
          pickupTime: dto.returnPickupTime,
          carType: dto.carType,
          tripType: 'ONEWAY',
          budget: dto.returnBudget,
          onlyVerified: dto.onlyVerified,
          comment: dto.comment,
          isDeleted: false,
          status: 'CREATED',
          isReturnTrip: true,
        },
      });
    }
  }

  async getMyRequirements(
    userId: string,
    status?: string,
    fromDate?: string,
    toDate?: string,
    isReturnType?: boolean
  ) {
    const filters: any = {
      isDeleted: false,
      OR: [{ postedById: userId }, { assignedToId: userId }],
      isReturnTrip: isReturnType,
    };

    if (status) {
      filters.status = status.toUpperCase();
    }

    if (fromDate || toDate) {
      filters.createdAt = {};
      if (fromDate) {
        filters.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        // Add time to include the full day
        filters.createdAt.lte = new Date(
          new Date(toDate).setHours(23, 59, 59, 999),
        );
      }
    }


    return this.prisma.requirement.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: {
        postedBy: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          }
        }
      },
    });
  }

  async getAvailabeRequirements(
    userId: string,
    status?: string,
    fromDate?: string,
    toDate?: string,
    from?: string,
    to?: string,
    carTypes?: string | string[],
    page: number = 1,
    limit: number = 10,
  ) {
    const filters: any = {
      isDeleted: false,
    };

    const businessCities = await this.prisma.userBusinessCity.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const cityNames = businessCities.map((bc) => bc.cityName);

    if (status) {
      filters.status = status.toUpperCase();
    }

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
      filters.carType = { in: carTypeArray };
    }

    // Filter by creation date
    if (fromDate || toDate) {
      filters.createdAt = {};
      if (fromDate) {
        filters.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        filters.createdAt.lte = new Date(
          new Date(toDate).setHours(23, 59, 59, 999),
        );
      }
    }

    // Filter by pickup date
    if (from || to) {
      filters.pickupDate = {};
      if (from) {
        filters.pickupDate.gte = new Date(from);
      }
      if (to) {
        filters.pickupDate.lte = new Date(
          new Date(to).setHours(23, 59, 59, 999),
        );
      }
    }

    const whereConditions: any = {
      AND: [
        { isReturnTrip: true },
        filters,
      ],
      OR: [{ fromCity: { in: cityNames } }, { toCity: { in: cityNames } }],
    };

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const isUserIsVerified = user?.isVerified;

    if (!isUserIsVerified) {
      whereConditions.AND.push({ onlyVerified: false });
    }

    const skip = (page - 1) * limit;
    const [requirements, total] = await Promise.all([
      this.prisma.requirement.findMany({
        where: whereConditions,
        include: {
          postedBy: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              isVerified: isUserIsVerified ? true : false,
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
        orderBy: { createdAt: 'desc' },
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
