import { CarTypesService } from './car-types.service';
import { CreateCarTypeDto, UpdateCarTypeDto } from './dto/car-type.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Controller, UseGuards } from '@nestjs/common/decorators/core';
import { Body, Delete, Get, Post } from '@nestjs/common/decorators/http';
import { Param } from '@nestjs/common/decorators/http';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { successResponse } from 'src/common/response.helper';

@ApiTags('car-types')
@Controller('car-types')
@ApiBearerAuth()
export class CarTypesController {
  constructor(private readonly carTypesService: CarTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create a new car type (Admin only)' })
  @ApiResponse({ status: 201, description: 'Car type created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async create(@Body() createCarTypeDto: CreateCarTypeDto) {
    const data = await this.carTypesService.create(createCarTypeDto);
    return successResponse(
      data,
      'Car type created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all car types' })
  @ApiResponse({ status: 200, description: 'List of car types' })
  async findAll() {
    const data = await this.carTypesService.findAll();
    return successResponse(data, 'Car types retrieved successfully');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a car type by id' })
  @ApiResponse({ status: 200, description: 'Car type details' })
  @ApiResponse({ status: 404, description: 'Car type not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.carTypesService.findOne(id);
    return successResponse(data, 'Car type retrieved successfully');
  }

  @Post('update')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update a car type (Admin only)' })
  @ApiResponse({ status: 200, description: 'Car type updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Car type not found' })
  async updateCarType(@Body() body: { id: string } & UpdateCarTypeDto) {
    const data = await this.carTypesService.update(body.id, body);
    return successResponse(data, 'Car type updated successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Deactivate a car type (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Car type deactivated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Car type not found' })
  async deactivate(@Param('id') id: string) {
    const data = await this.carTypesService.deactivate(id);
    if (!data) {
      throw new NotFoundException('Car type not found');
    }
    return successResponse(data, 'Car type deactivated successfully');
  }
}
