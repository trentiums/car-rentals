import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarTypeDto, UpdateCarTypeDto } from './dto/car-type.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Injectable()
export class CarTypesService {
  constructor(private prisma: PrismaService) {}

  async create(createCarTypeDto: CreateCarTypeDto): Promise<ApiResponse<any>> {
    try {
      const carType = await this.prisma.carType.create({
        data: createCarTypeDto,
      });

      return {
        statusCode: 201,
        message: 'Car type created successfully',
        data: carType,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        return {
          statusCode: 400,
          message: 'Car type with this name already exists',
          error: 'DUPLICATE_NAME',
        };
      }
      throw error;
    }
  }

  async findAll(): Promise<ApiResponse<any>> {
    const carTypes = await this.prisma.carType.findMany({
      where: { isActive: true },
    });
    return {
      statusCode: 200,
      message: 'Car types retrieved successfully',
      data: carTypes,
    };
  }

  async findOne(id: string): Promise<ApiResponse<any>> {
    const carType = await this.prisma.carType.findUnique({
      where: { id, isActive: true },
    });

    if (!carType) {
      return {
        statusCode: 404,
        message: 'Car type not found',
        error: 'NOT_FOUND',
      };
    }

    return {
      statusCode: 200,
      message: 'Car type retrieved successfully',
      data: carType,
    };
  }

  async update(id: string, updateCarTypeDto: UpdateCarTypeDto): Promise<ApiResponse<any>> {
    try {
      const carType = await this.prisma.carType.update({
        where: { id },
        data: updateCarTypeDto,
      });
  
      return {
        statusCode: 200,
        message: 'Car type updated successfully',
        data: carType,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        return {
          statusCode: 404,
          message: 'Car type not found',
          error: 'NOT_FOUND',
        };
      }
      if (error.code === 'P2002') {
        return {
          statusCode: 400,
          message: 'Car type with this name already exists',
          error: 'DUPLICATE_NAME',
        };
      }
      throw error;
    }
  }
  
  async deactivate(id: string) {
    // Check if the car type exists
    const carType = await this.prisma.carType.findUnique({
      where: { id },
    });

    if (!carType) {
      return null; // If not found, return null to indicate that the car type doesn't exist
    }

    // Update the car type to set isActive to false
    return this.prisma.carType.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
