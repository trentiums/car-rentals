
import { CarTypesService } from './car-types.service';
import { CreateCarTypeDto, UpdateCarTypeDto } from './dto/car-type.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Controller, UseGuards } from '@nestjs/common/decorators/core';
import { Body, Delete, Get, Post } from '@nestjs/common/decorators/http';
import { Param } from '@nestjs/common/decorators/http';
import { NotFoundException } from '@nestjs/common';

@ApiTags('car-types')
@Controller('car-types')
@ApiBearerAuth()
export class CarTypesController {
  constructor(private readonly carTypesService: CarTypesService) { }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create a new car type (Admin only)' })
  @ApiResponse({ status: 201, description: 'Car type created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() createCarTypeDto: CreateCarTypeDto) {
    return this.carTypesService.create(createCarTypeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all car types' })
  @ApiResponse({ status: 200, description: 'List of car types' })
  findAll() {
    return this.carTypesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a car type by id' })
  @ApiResponse({ status: 200, description: 'Car type details' })
  @ApiResponse({ status: 404, description: 'Car type not found' })
  findOne(@Param('id') id: string) {
    return this.carTypesService.findOne(id);
  }

  @Post('update')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update a car type (Admin only)' })
  @ApiResponse({ status: 200, description: 'Car type updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Car type not found' })
  updateCarType(@Body() body: { id: string } & UpdateCarTypeDto) {
    return this.carTypesService.update(body.id, body);
  }


  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Deactivate a car type (Admin only)' })
  @ApiResponse({ status: 200, description: 'Car type deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Car type not found' })
  async deactivate(@Param('id') id: string) {
    // Call the service method to update isActive to false instead of deleting
    const carType = await this.carTypesService.deactivate(id);

    if (!carType) {
      throw new NotFoundException('Car type not found');
    }

    return { message: 'Car type deactivated successfully' };
  }

}
