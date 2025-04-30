import {
  IsString,
  IsEmail,
  Length,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({ example: '9925736905' })
  @IsString()
  @Length(10, 10)
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  phoneNumber: string;
}
export class RegisterDto {
  @ApiProperty({ example: '9925736905' })
  @IsString()
  @Length(10, 10)
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  phoneNumber: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({ example: 'johndoe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'My Business Name' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  businessName?: string;

  @ApiProperty({ example: 'Description of my business' })
  @IsOptional()
  @IsString()
  businessDescription?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @Length(2, 50)
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @Length(2, 50)
  state: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]+$/, { message: 'Pin code must contain only digits' })
  pinCode: string;
}

export class InitiateLoginDto {
  @ApiProperty({ example: '9925736905' })
  @IsString()
  @Length(10, 10)
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  phoneNumber: string;
}

export class VerifyOtpForAuthDto {
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
