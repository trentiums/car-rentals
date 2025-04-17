import {
  Injectable,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, InitiateLoginDto, VerifyOtpForAuthDto } from './dto/auth.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private otpService: OtpService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<ApiResponse<{ sessionId: string }>> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phoneNumber: registerDto.phoneNumber },
            { email: registerDto.email },
          ],
        },
      });

      if (existingUser) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'User with this phone number or email already exists',
          error: 'BAD_REQUEST',
        };
      }

      // Send OTP
      const otpResponse = await this.otpService.sendOtp(registerDto.phoneNumber);

      // Create unverified user
      const user = await this.prisma.user.create({
        data: registerDto,
      });

      // Store OTP verification record
      await this.prisma.otpVerification.create({
        data: {
          phoneNumber: registerDto.phoneNumber,
          sessionId: otpResponse.sessionId,
          purpose: 'REGISTRATION',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Registration initiated. Please verify your phone number.',
        data: { sessionId: otpResponse.sessionId },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to register user',
        error: error.message,
      };
    }
  }

  async verifyRegistration(verifyDto: VerifyOtpForAuthDto): Promise<ApiResponse<{ token: string; user: any }>> {
    try {
      // Verify OTP
      const otpVerifyResult = await this.otpService.verifyOtp(verifyDto.sessionId, verifyDto.otp);
      
      if (otpVerifyResult.Status === 'Error') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'OTP verification failed',
          error: otpVerifyResult.Details,
        };
      }

      // Update OTP verification record
      const otpVerification = await this.prisma.otpVerification.findFirst({
        where: {
          phoneNumber: verifyDto.phoneNumber,
          sessionId: verifyDto.sessionId,
          purpose: 'REGISTRATION',
          verified: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!otpVerification) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired OTP session',
          error: 'INVALID_SESSION',
        };
      }

      // Mark OTP as verified
      await this.prisma.otpVerification.update({
        where: { id: otpVerification.id },
        data: { verified: true },
      });

      // Mark user as verified
      const user = await this.prisma.user.update({
        where: { phoneNumber: verifyDto.phoneNumber },
        data: { isVerified: true },
      });

      if (!user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        };
      }

      // Generate JWT token
      const token = await this.generateToken(user.id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Registration completed successfully',
        data: {
          token,
          user: {
            id: user.id,
            phoneNumber: user.phoneNumber,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          },
        },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to verify registration',
        error: error.message,
      };
    }
  }

  async initiateLogin(loginDto: InitiateLoginDto): Promise<ApiResponse<{ sessionId: string }>> {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { phoneNumber: loginDto.phoneNumber },
      });

      if (!user) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        };
      }

      // Check if user is verified
      if (!user.isVerified) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Please complete your registration first',
          error: 'UNVERIFIED_USER',
        };
      }

      // Send OTP
      const otpResponse = await this.otpService.sendOtp(loginDto.phoneNumber);

      // Store OTP verification record
      await this.prisma.otpVerification.create({
        data: {
          phoneNumber: loginDto.phoneNumber,
          sessionId: otpResponse.sessionId,
          purpose: 'LOGIN',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'OTP sent successfully',
        data: { sessionId: otpResponse.sessionId },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to initiate login',
        error: error.message,
      };
    }
  }

  async verifyLogin(verifyDto: VerifyOtpForAuthDto): Promise<ApiResponse<{ token: string; user: any }>> {
    try {
      // Verify OTP
      const otpVerifyResult = await this.otpService.verifyOtp(verifyDto.sessionId, verifyDto.otp);
      
      if (otpVerifyResult.Status === 'Error') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'OTP verification failed',
          error: otpVerifyResult.Details,
        };
      }

      // Update OTP verification record
      const otpVerification = await this.prisma.otpVerification.findFirst({
        where: {
          phoneNumber: verifyDto.phoneNumber,
          sessionId: verifyDto.sessionId,
          purpose: 'LOGIN',
          verified: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!otpVerification) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired OTP session',
          error: 'INVALID_SESSION',
        };
      }

      // Mark OTP as verified
      await this.prisma.otpVerification.update({
        where: { id: otpVerification.id },
        data: { verified: true },
      });

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { phoneNumber: verifyDto.phoneNumber },
      });

      if (!user) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        };
      }

      // Generate JWT token
      const token = await this.generateToken(user.id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            phoneNumber: user.phoneNumber,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          },
        },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to verify login',
        error: error.message,
      };
    }
  }

  private async generateToken(userId: string): Promise<string> {
    return this.jwtService.sign({ sub: userId }, { secret: this.configService.get<string>('JWT_SECRET') });
  }

  async resendOtp(phoneNumber: string): Promise<ApiResponse<any>> {
    return this.otpService.resendOtp(phoneNumber);
  }
}
