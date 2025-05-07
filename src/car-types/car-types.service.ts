import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarTypeDto, UpdateCarTypeDto } from './dto/car-type.dto';

@Injectable()
export class CarTypesService {
  constructor(private prisma: PrismaService) {}

  async create(createCarTypeDto: CreateCarTypeDto) {
    try {
      return await this.prisma.carType.create({
        data: createCarTypeDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Car type with this name already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.carType.findMany({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    const carType = await this.prisma.carType.findUnique({
      where: { id, isActive: true },
    });

    if (!carType) {
      throw new NotFoundException('Car type not found');
    }

    return carType;
  }

  async update(id: string, updateCarTypeDto: UpdateCarTypeDto) {
    try {
      return await this.prisma.carType.update({
        where: { id },
        data: updateCarTypeDto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Car type not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Car type with this name already exists');
      }
      throw error;
    }
  }

  async deactivate(id: string) {
    const carType = await this.prisma.carType.findUnique({
      where: { id },
    });

    if (!carType) {
      return null;
    }

    return await this.prisma.carType.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
