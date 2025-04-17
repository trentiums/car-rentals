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
} from '@nestjs/common';
import { RequirementService } from './requirement.service';
import {
  CreateRequirementDto,
} from './dto/create.requirement.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AssignRequirementDto, ConfirmRequirementDto } from './dto/confirm-requirement.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('requirement')
@UseGuards(JwtAuthGuard)
@Controller('requirement')
export class RequirementController {
  constructor(private readonly service: RequirementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new requirement' })
  @ApiResponse({ status: 201, description: 'Requirement created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  create(@Body() dto: CreateRequirementDto, @Req() req) {
    return this.service.createRequirement(dto, req.user.id);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a requirement by ID' })
  @ApiResponse({ status: 200, description: 'Requirement confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid requirement ID or confirmation failed' })
  confirm(@Body() dto: ConfirmRequirementDto) {
    return this.service.confirmRequirement(dto);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign a requirement to a user' })
  @ApiResponse({ status: 200, description: 'Requirement assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid assignment request' })
  assign(@Body() dto: AssignRequirementDto , @Req() req) {
    if(!req.user.id){
      throw new UnauthorizedException('User not logged in');
    }
    return this.service.assignRequirement(dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a requirement by ID' })
  @ApiResponse({ status: 200, description: 'Requirement deleted (soft) successfully' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  softDelete(@Param('id') id: string) {
    return this.service.deleteRequirement(id);
  }

  @Get()
  @ApiOperation({ summary: 'List all active requirements' })
  @ApiResponse({ status: 200, description: 'List of active requirements returned successfully' })
  list() {
    return this.service.getActiveRequirements();
  }
}
