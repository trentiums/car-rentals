import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, InitiateLoginDto, VerifyOtpForAuthDto, ResendOtpDto } from './dto/auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Registration initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-registration')
  @ApiOperation({ summary: 'Verify OTP for registration' })
  @ApiResponse({ status: 200, description: 'Registration completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async verifyRegistration(@Body() verifyDto: VerifyOtpForAuthDto) {
    return this.authService.verifyRegistration(verifyDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Initiate login with OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initiateLogin(@Body() loginDto: InitiateLoginDto) {
    return this.authService.initiateLogin(loginDto);
  }

  @Post('verify-login')
  @ApiOperation({ summary: 'Verify OTP for login' })
  @ApiResponse({ status: 200, description: 'Login completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async verifyLogin(@Body() verifyDto: VerifyOtpForAuthDto) {
    return this.authService.verifyLogin(verifyDto);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({ status: 400, description: 'Too many attempts or invalid request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto.phoneNumber);
  }
}
