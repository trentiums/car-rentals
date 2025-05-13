import {
    Controller,
    Get,
    Param,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { UserProfileDto } from './dto/user-profile.dto';
import { successResponse } from '../common/response.helper';

@ApiBearerAuth()
@ApiTags('users')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly service: UsersService) { }

    @Get(':id')
    @ApiOperation({ summary: 'Get user profile with documents' })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
        type: UserProfileDto,
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getUserProfile(@Param('id') userId: string) {
        if (!userId) {
            throw new UnauthorizedException('User ID is required');
        }
        const data = await this.service.getUserProfile(userId);
        return successResponse(data, 'User profile retrieved successfully');
    }
} 