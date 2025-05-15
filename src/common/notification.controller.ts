import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { successResponse } from './response.helper';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Post('register-token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Register push notification token' })
    @ApiResponse({
        status: 200,
        description: 'Token registered successfully',
    })
    async registerToken(@Request() req, @Body() body: { token: string }) {
        const data = await this.notificationService.savePushToken(req.user.id, body.token);
        return successResponse(data, 'Token registered successfully');
    }

    @Post('remove-token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Remove push notification token' })
    @ApiResponse({
        status: 200,
        description: 'Token removed successfully',
    })
    async removeToken(@Request() req) {
        const data = await this.notificationService.removePushToken(req.user.id);
        return successResponse(data, 'Token removed successfully');
    }

    @Post('test')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Send a test push notification to the current user' })
    @ApiResponse({
        status: 200,
        description: 'Test notification sent successfully',
    })
    async sendTestNotification(@Request() req) {
        const { id } = req.user;

        const data = await this.notificationService.sendPushNotification(
            id,
            'Test Notification',
            'This is a test push message from the backend.',
            { test: true }
        );

        return successResponse(data, 'Test notification sent successfully');
    }

} 