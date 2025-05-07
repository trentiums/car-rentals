import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  InitiateLoginDto,
  VerifyOtpForAuthDto,
  ResendOtpDto,
} from './dto/auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration initiated successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-registration')
  @ApiOperation({ summary: 'Verify OTP for registration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration completed successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid OTP' })
  async verifyRegistration(@Body() verifyDto: VerifyOtpForAuthDto) {
    return this.authService.verifyRegistration(verifyDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Initiate login with OTP' })
  @ApiResponse({ status: HttpStatus.OK, description: 'OTP sent successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async initiateLogin(@Body() loginDto: InitiateLoginDto) {
    return this.authService.initiateLogin(loginDto);
  }

  @Post('verify-login')
  @ApiOperation({ summary: 'Verify OTP for login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login completed successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid OTP' })
  async verifyLogin(@Body() verifyDto: VerifyOtpForAuthDto) {
    return this.authService.verifyLogin(verifyDto);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP resent successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Too many attempts or invalid request',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto.phoneNumber);
  }
}
