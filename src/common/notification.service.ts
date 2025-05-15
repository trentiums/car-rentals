import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class NotificationService {
    private readonly expoAccessToken: string;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.expoAccessToken = this.configService.get<string>('EXPO_ACCESS_TOKEN')!;
    }

    async savePushToken(userId: string, token: string) {
        return this.prisma.pushNotificationToken.upsert({
            where: { userId },
            update: { token },
            create: {
                userId,
                token,
            },
        });
    }

    async removePushToken(userId: string) {
        return this.prisma.pushNotificationToken.delete({
            where: { userId },
        });
    }

    async sendPushNotification(userId: string, title: string, body: string, data?: any) {
        const userToken = await this.prisma.pushNotificationToken.findUnique({
            where: { userId },
        });

        if (!userToken) {
            return null;
        }

        const message = {
            to: userToken.token,
            sound: 'default',
            title,
            body,
            data: data || {},
        };

        try {
            const response = await axios.post(
                'https://exp.host/--/api/v2/push/send',
                message,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.expoAccessToken}`,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error sending push notification:', error);
            throw error;
        }
    }

    async sendBulkPushNotifications(userIds: string[], title: string, body: string, data?: any) {
        const userTokens = await this.prisma.pushNotificationToken.findMany({
            where: {
                userId: {
                    in: userIds,
                },
            },
        });

        if (userTokens.length === 0) {
            return null;
        }

        const messages = userTokens.map((token) => ({
            to: token.token,
            sound: 'default',
            title,
            body,
            data: data || {},
        }));

        try {
            const response = await axios.post(
                'https://exp.host/--/api/v2/push/send',
                messages,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.expoAccessToken}`,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error sending bulk push notifications:', error);
            throw error;
        }
    }
} 