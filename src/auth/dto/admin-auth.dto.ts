import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class AdminLoginDto {
    @ApiProperty({ example: '9925736905' })
    @IsString()
    @Length(10, 10)
    @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
    phoneNumber: string;
}

export class AdminVerifyOtpDto {
    @ApiProperty({ example: '9925736905' })
    @IsString()
    @Length(10, 10)
    @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
    phoneNumber: string;

    @ApiProperty({ example: 'session-id-from-2factor' })
    @IsString()
    sessionId: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @Length(6, 6)
    @Matches(/^[0-9]+$/, { message: 'OTP must contain only digits' })
    otp: string;
} 