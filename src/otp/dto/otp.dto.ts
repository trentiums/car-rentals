import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: 'Phone number to send OTP to (10 digits)',
    example: '9925736905'
  })
  @IsString()
  @Length(10, 10)
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  phoneNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Session ID received when sending OTP',
    example: 'session-id-from-2factor'
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'OTP received on phone',
    example: '123456'
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]+$/, { message: 'OTP must contain only digits' })
  otp: string;
}
