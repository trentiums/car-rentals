import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  InitiateLoginDto,
  VerifyOtpForAuthDto,
  ResendOtpDto,
} from './dto/auth.dto';
import { AdminLoginDto, AdminVerifyOtpDto } from './dto/admin-auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { successResponse } from 'src/common/response.helper';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration initiated successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    const data = await this.authService.register(registerDto);
    return successResponse(
      data,
      'Registration initiated successfully',
      HttpStatus.CREATED,
    );
  }

  @Post('verify-registration')
  @ApiOperation({ summary: 'Verify OTP for registration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration completed successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid OTP' })
  async verifyRegistration(@Body() verifyDto: VerifyOtpForAuthDto) {
    const data = await this.authService.verifyRegistration(verifyDto);
    return successResponse(data, 'Registration completed successfully');
  }

  @Post('login')
  @ApiOperation({ summary: 'Initiate login with OTP' })
  @ApiResponse({ status: HttpStatus.OK, description: 'OTP sent successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async initiateLogin(@Body() loginDto: InitiateLoginDto) {
    const data = await this.authService.initiateLogin(loginDto);
    return successResponse(data, 'OTP sent successfully');
  }

  @Post('verify-login')
  @ApiOperation({ summary: 'Verify OTP for login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login completed successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid OTP' })
  async verifyLogin(@Body() verifyDto: VerifyOtpForAuthDto) {
    const data = await this.authService.verifyLogin(verifyDto);
    return successResponse(data, 'Login completed successfully');
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
    const data = await this.authService.resendOtp(resendOtpDto.phoneNumber);
    return successResponse(data, 'OTP resent successfully');
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Initiate admin login with OTP' })
  @ApiResponse({ status: HttpStatus.OK, description: 'OTP sent successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async adminLogin(@Body() loginDto: AdminLoginDto) {
    const data = await this.authService.adminLogin(loginDto);
    return successResponse(data, 'OTP sent successfully');
  }

  @Post('admin/verify-login')
  @ApiOperation({ summary: 'Verify OTP for admin login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin login completed successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid OTP' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async adminVerifyLogin(@Body() verifyDto: AdminVerifyOtpDto) {
    const data = await this.authService.adminVerifyLogin(verifyDto);
    return successResponse(data, 'Admin login completed successfully');
  }
}
