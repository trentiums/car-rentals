import {
  Injectable,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { JwtService } from '@nestjs/jwt';
import {
  RegisterDto,
  InitiateLoginDto,
  VerifyOtpForAuthDto,
} from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private otpService: OtpService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
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
      throw new BadRequestException(
        'User with this phone number or email already exists',
      );
    }

    // Send OTP
    const otpResponse = await this.otpService.sendOtp(registerDto.phoneNumber);

    // Create unverified user
    const user = await this.prisma.user.create({
      data: {
        phoneNumber: registerDto.phoneNumber,
        fullName: registerDto.fullName,
        email: registerDto.email,
        businessName: registerDto.businessName,
        businessDescription: registerDto.businessDescription,
        city: registerDto.city,
        state: registerDto.state,
        pinCode: registerDto.pinCode,
        isVerified: false,
        role: 'USER',
      },
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

    return { sessionId: otpResponse.sessionId };
  }

  async verifyRegistration(verifyDto: VerifyOtpForAuthDto) {
    // Verify OTP
    const otpVerifyResult = await this.otpService.verifyOtp(
      verifyDto.sessionId,
      verifyDto.otp,
    );

    if (otpVerifyResult.Status === 'Error') {
      throw new BadRequestException('OTP verification failed');
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
      throw new BadRequestException('Invalid or expired OTP session');
    }

    // Mark OTP as verified
    await this.prisma.otpVerification.update({
      where: { id: otpVerification.id },
      data: { verified: true },
    });

    // Get user with their city and state
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: verifyDto.phoneNumber },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Mark user as verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    // Add user's city as a business city
    await this.prisma.userBusinessCity.create({
      data: {
        userId: user.id,
        cityName: user.city,
        state: user.state,
        isActive: true,
      },
    });

    // Generate JWT token
    const token = await this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async initiateLogin(loginDto: InitiateLoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: loginDto.phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new ForbiddenException('Please complete your registration first');
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

    return { sessionId: otpResponse.sessionId };
  }

  async verifyLogin(verifyDto: VerifyOtpForAuthDto) {
    // Verify OTP
    const otpVerifyResult = await this.otpService.verifyOtp(
      verifyDto.sessionId,
      verifyDto.otp,
    );

    if (otpVerifyResult.Status === 'Error') {
      throw new BadRequestException('OTP verification failed');
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
      throw new BadRequestException('Invalid or expired OTP session');
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
      throw new NotFoundException('User not found');
    }

    // Generate JWT token
    const token = await this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async resendOtp(phoneNumber: string) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otpResponse = await this.otpService.sendOtp(phoneNumber);

    // Store OTP verification record
    await this.prisma.otpVerification.create({
      data: {
        phoneNumber,
        sessionId: otpResponse.sessionId,
        purpose: user.isVerified ? 'LOGIN' : 'REGISTRATION',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    return { sessionId: otpResponse.sessionId };
  }

  private async generateToken(userId: string): Promise<string> {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '30d',
      },
    );
  }
}
