import {
    Controller,
    Get,
    Param,
    UseGuards,
    UnauthorizedException,
    Req,
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

    @Get()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: 200,
        description: 'Current user profile retrieved successfully',
        type: UserProfileDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getCurrentUserProfile(@Req() req: any) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User ID is required');
        }

        const data = await this.service.getUserProfile(userId);
        return successResponse(data, 'User profile retrieved successfully');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user profile by ID' })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
        type: UserProfileDto,
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getUserProfileById(@Param('id') userId: string) {
        const data = await this.service.getUserProfile(userId);
        return successResponse(data, 'User profile retrieved successfully');
    }
}
