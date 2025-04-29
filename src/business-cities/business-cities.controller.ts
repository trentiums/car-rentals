import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Delete,
  Param,
  UnauthorizedException,
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

@ApiBearerAuth()
@ApiTags('business-cities')
@UseGuards(JwtAuthGuard)
@Controller('business-cities')
export class BusinessCitiesController {
  constructor(private readonly service: BusinessCitiesService) {}

  @Post()
  @ApiOperation({ summary: "Add a city to user's business cities" })
  @ApiResponse({ status: 201, description: 'City added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  @ApiResponse({ status: 404, description: 'User or city not found' })
  addBusinessCity(@Body() dto: AddBusinessCityDto, @Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    return this.service.addBusinessCity(dto, req.user.id);
  }

  @Delete(':cityId')
  @ApiOperation({ summary: "Remove a city from user's business cities" })
  @ApiResponse({ status: 200, description: 'City removed successfully' })
  @ApiResponse({
    status: 404,
    description: 'User, city, or business city not found',
  })
  removeBusinessCity(@Param('cityId') cityId: string, @Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    return this.service.removeBusinessCity(cityId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all business cities for the current user' })
  @ApiResponse({ status: 200, description: 'List of business cities' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserBusinessCities(@Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    return this.service.getUserBusinessCities(req.user.id);
  }

  @Get('requirements')
  @ApiOperation({ summary: "Get requirements from user's business cities" })
  @ApiResponse({ status: 200, description: 'List of requirements' })
  getRequirementsByBusinessCities(@Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    return this.service.getRequirementsByBusinessCities(req.user.id);
  }
}
