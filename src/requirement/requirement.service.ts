import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateRequirementDto,
} from './dto/create.requirement.dto';
import { AssignRequirementDto, ConfirmRequirementDto } from './dto/confirm-requirement.dto';

@Injectable()
export class RequirementService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequirement(dto: CreateRequirementDto, userId: string) {
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

  async confirmRequirement(dto: ConfirmRequirementDto) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id: dto.requirementId },
    });

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
      throw new BadRequestException('You cannot assign the requirement to yourself');
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
