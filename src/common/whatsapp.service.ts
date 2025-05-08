import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
    private readonly client;
    private readonly accessToken: string;
    private readonly phoneNumberId: string;
    private readonly apiVersion: string;
    private readonly apiUrl: string;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN')!;
        this.phoneNumberId = this.configService.get<string>('WHATSAPP_MOBILE_ID')!;
        this.apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION')!;
        this.apiUrl = this.configService.get<string>('WHATSAPP_API_URI')!;
    }

    async sendOtp(phoneNumber: string, purpose: string = 'VERIFICATION') {
        // Generate OTP
        const otp = this.generateOtp();

        // Store OTP in database
        const otpRecord = await this.prisma.whatsAppOtp.create({
            data: {
                phoneNumber,
                otp,
                purpose,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
            },
        });

        try {
            // Send OTP via WhatsApp
            const response = await this.sendWhatsAppMessage(phoneNumber, otp);
            return {
                sessionId: otpRecord.id,
                message: 'OTP sent successfully',
            };
        } catch (error) {
            // If WhatsApp sending fails, delete the OTP record
            await this.prisma.whatsAppOtp.delete({
                where: { id: otpRecord.id },
            });
            throw error;
        }
    }

    async verifyOtp(phoneNumber: string, otp: string, purpose: string = 'VERIFICATION') {
        // Find the most recent unverified OTP for this phone number and purpose
        const otpRecord = await this.prisma.whatsAppOtp.findFirst({
            where: {
                phoneNumber,
                purpose,
                verified: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!otpRecord) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        if (otpRecord.otp !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        // Mark OTP as verified
        await this.prisma.whatsAppOtp.update({
            where: { id: otpRecord.id },
            data: { verified: true },
        });

        return { message: 'OTP verified successfully' };
    }

    private async sendWhatsAppMessage(phoneNumber: string, otp: string) {
        const url = `${this.apiUrl}${this.apiVersion}/${this.phoneNumberId}/messages`;

        try {
            const response = await axios.post(
                url,
                {
                    messaging_product: 'whatsapp',
                    to: phoneNumber,
                    type: 'template',
                    template: {
                        name: 'otp_verification',
                        language: {
                            code: 'en',
                        },
                        components: [
                            {
                                type: 'body',
                                parameters: [
                                    {
                                        type: 'text',
                                        text: otp,
                                    },
                                ],
                            },
                            {
                                type: 'button',
                                sub_type: 'url',
                                index: 0,
                                parameters: [
                                    {
                                        type: 'text',
                                        text: otp,
                                    },
                                ],
                            },
                        ],
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            return response.data;
        } catch (error) {
            throw new Error(`Failed to send WhatsApp message: ${error.message}`);
        }
    }

    generateOtp(length: number = 6): string {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += Math.floor(Math.random() * 10);
        }
        return otp;
    }
} 