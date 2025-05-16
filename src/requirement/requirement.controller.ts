import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Delete,
  Param,
  Get,
  UnauthorizedException,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { RequirementService } from './requirement.service';
import { CreateRequirementDto } from './dto/create.requirement.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  AssignRequirementDto,
  ConfirmRequirementDto,
} from './dto/confirm-requirement.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateReturnRequirementDto } from './dto/create-return-requirement.dto';
import { BusinessCitiesService } from 'src/business-cities/business-cities.service';
import { successResponse } from 'src/common/response.helper';
import { EditRequirementDto } from './dto/edit-requirement.dto';
import { EditReturnRequirementDto } from './dto/edit-return-requirement.dto';

@ApiBearerAuth()
@ApiTags('requirement')
@UseGuards(JwtAuthGuard)
@Controller('requirement')
export class RequirementController {
  constructor(
    private readonly service: RequirementService,
    private readonly businessCitiesService: BusinessCitiesService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new requirement' })
  @ApiResponse({ status: 201, description: 'Requirement created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  async create(@Body() dto: CreateRequirementDto, @Req() req) {
    const data = await this.service.createRequirement(dto, req.user.id);
    return successResponse(
      data,
      'Requirement created successfully',
      HttpStatus.CREATED,
    );
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a requirement by ID' })
  @ApiResponse({
    status: 200,
    description: 'Requirement confirmed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid requirement ID or confirmation failed',
  })
  async confirm(@Body() dto: ConfirmRequirementDto, @Req() req) {
    const data = await this.service.confirmRequirement(dto, req.user.id);
    return successResponse(data, 'Requirement confirmed successfully');
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign a requirement to a user' })
  @ApiResponse({
    status: 200,
    description: 'Requirement assigned successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid assignment request' })
  async assign(@Body() dto: AssignRequirementDto, @Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.assignRequirement(dto, req.user.id);
    return successResponse(data, 'Requirement assigned successfully');
  }

  @Post('return')
  @ApiOperation({
    summary:
      'Create a return trip requirement based on an existing one-way trip',
  })
  @ApiResponse({
    status: 201,
    description: 'Return trip requirement created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  @ApiResponse({ status: 404, description: 'Original requirement not found' })
  async createReturnTrip(@Body() dto: CreateReturnRequirementDto, @Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.createReturnRequirement(dto, req.user.id);
    return successResponse(
      data,
      'Return trip requirement created successfully',
      HttpStatus.CREATED,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a requirement by ID' })
  @ApiResponse({
    status: 200,
    description: 'Requirement deleted (soft) successfully',
  })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  async softDelete(@Param('id') id: string) {
    const data = await this.service.deleteRequirement(id);
    return successResponse(data, 'Requirement deleted successfully');
  }

  @Get()
  @ApiOperation({ summary: "List all requirements for user's business cities" })
  @ApiResponse({
    status: 200,
    description: 'List of requirements returned successfully',
  })
  async list(
    @Req() req,
    @Query('carTypes') carTypes?: string,
    @Query('pickupDateFrom') pickupDateFrom?: string,
    @Query('pickupDateTo') pickupDateTo?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }

    const carTypeArray = carTypes ? carTypes.split(',') : undefined;

    const data =
      await this.businessCitiesService.getRequirementsByBusinessCities(
        req.user.id,
        carTypeArray,
        pickupDateFrom,
        pickupDateTo,
        page,
        limit,
      );
    return successResponse(data, 'Requirements fetched successfully');
  }

  @Get('my-requirements')
  @ApiOperation({ summary: 'List requirements posted by the logged-in user' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List returned successfully' })
  @ApiQuery({ name: 'isReturnType', required: false, type: Boolean })
  async listMyRequirements(
    @Req() req,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('isReturnType') isReturnType?: boolean,
  ) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.getMyRequirements(
      req.user.id,
      status,
      fromDate,
      toDate,
      isReturnType
    );
    return successResponse(data, 'Requirements fetched successfully');
  }

  @Get('available-requirements')
  @ApiOperation({ summary: 'List available requirements' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'fromCity', required: false, type: String })
  @ApiQuery({ name: 'toCity', required: false, type: String })
  @ApiQuery({ name: 'carTypes', required: false, type: [String] })
  @ApiResponse({ status: 200, description: 'List returned successfully' })
  async getAvailableRequirements(@Req() req,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('fromCity') fromCity?: string,
    @Query('toCity') toCity?: string,
    @Query('carTypes') carTypes?: string[],
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.getAvailabeRequirements(
      req.user.id,
      status,
      fromDate,
      toDate,
      fromCity,
      toCity,
      carTypes,
      page,
      limit,
    );
    return successResponse(data, 'Available requirements fetched successfully');
  }

  @Post('edit')
  @ApiOperation({ summary: 'Edit an existing requirement' })
  @ApiResponse({ status: 200, description: 'Requirement updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  async edit(@Body() dto: EditRequirementDto, @Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.editRequirement(dto, req.user.id);
    return successResponse(data, 'Requirement updated successfully');
  }

  @Post('edit-return')
  @ApiOperation({ summary: 'Edit an existing return trip requirement' })
  @ApiResponse({ status: 200, description: 'Return trip requirement updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  @ApiResponse({ status: 404, description: 'Return trip requirement not found' })
  async editReturn(@Body() dto: EditReturnRequirementDto, @Req() req) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not logged in');
    }
    const data = await this.service.editReturnRequirement(dto, req.user.id);
    return successResponse(data, 'Return trip requirement updated successfully');
  }
}
