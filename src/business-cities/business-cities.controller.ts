import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Delete,
  UnauthorizedException,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { BusinessCitiesService } from './business-cities.service';
import { AddBusinessCityDto } from './dto/add-business-city.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { successResponse } from 'src/common/response.helper';

@ApiBearerAuth()
@ApiTags('business-cities')
@UseGuards(JwtAuthGuard)
@Controller('business-cities')
export class BusinessCitiesController {
  constructor(private readonly service: BusinessCitiesService) {}

  @Post()
  @ApiOperation({ summary: "Add a city to user's business cities" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'City added successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request or validation failed',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async addBusinessCity(@Body() dto: AddBusinessCityDto, @Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.addBusinessCity(dto, req.user.id);
    return successResponse(data, 'City added successfully', HttpStatus.CREATED);
  }

  @Delete()
  @ApiOperation({ summary: "Remove a city from user's business cities" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'City removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or business city not found',
  })
  async removeBusinessCity(
    @Query('cityName') cityName: string,
    @Query('state') state: string,
    @Req() req,
  ) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.removeBusinessCity(
      cityName,
      state,
      req.user.id,
    );
    return successResponse(data, 'City removed successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all business cities for the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of business cities',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getUserBusinessCities(@Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.getUserBusinessCities(req.user.id);
    return successResponse(data, 'Fetched business cities successfully');
  }

  @Get('requirements')
  @ApiOperation({ summary: "Get requirements from user's business cities" })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of requirements' })
  async getRequirementsByBusinessCities(@Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.getRequirementsByBusinessCities(
      req.user.id,
    );
    return successResponse(data, 'Fetched requirements successfully');
  }
}
