import {
    Controller,
    Get,
    Query,
    UseGuards,
    Req,
    UnauthorizedException,
    ParseEnumPipe,
    ParseBoolPipe,
    DefaultValuePipe,
    ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { successResponse } from 'src/common/response.helper';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { Role, RentalStatus } from '@prisma/client';

@ApiBearerAuth()
@ApiTags('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('dashboard-stats')
    @ApiOperation({ summary: 'Get admin dashboard statistics' })
    @ApiResponse({
        status: 200,
        description: 'Dashboard statistics retrieved successfully',
    })
    async getDashboardStats(@Req() req) {
        if (!req.user.id) {
            throw new UnauthorizedException('User not logged in');
        }
        const data = await this.adminService.getDashboardStats();
        return successResponse(data, 'Dashboard statistics retrieved successfully');
    }

    @Get('users')
    @ApiOperation({ summary: 'Get all users with filters' })
    @ApiResponse({
        status: 200,
        description: 'Users retrieved successfully',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    @ApiQuery({ name: 'role', required: false, enum: Role })
    @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getUsers(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
        @Query('role', new ParseEnumPipe(Role, { optional: true })) role?: Role,
        @Query('isVerified', new ParseBoolPipe({ optional: true })) isVerified?: boolean,
        @Query('search') search?: string,
    ) {
        const data = await this.adminService.getUsers(page, pageSize, role, isVerified, search);
        return successResponse(data, 'Users retrieved successfully');
    }

    @Get('rentals')
    @ApiOperation({ summary: 'Get all rentals with filters' })
    @ApiResponse({
        status: 200,
        description: 'Rentals retrieved successfully',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, enum: RentalStatus })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getRentals(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
        @Query('status', new ParseEnumPipe(RentalStatus, { optional: true })) status?: RentalStatus,
        @Query('search') search?: string,
    ) {
        const data = await this.adminService.getRentals(page, pageSize, status, search);
        return successResponse(data, 'Rentals retrieved successfully');
    }
} 