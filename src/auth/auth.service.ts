import {
  Injectable,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  RegisterDto,
  InitiateLoginDto,
  VerifyOtpForAuthDto,
} from './dto/auth.dto';
import { AdminLoginDto, AdminVerifyOtpDto } from './dto/admin-auth.dto';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from '../common/whatsapp.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

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
    const otpResponse = await this.whatsAppService.sendOtp(registerDto.phoneNumber, 'REGISTRATION');

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

    return { sessionId: otpResponse.sessionId };
  }

  async verifyRegistration(verifyDto: VerifyOtpForAuthDto) {
    // Verify OTP
    await this.whatsAppService.verifyOtp(
      verifyDto.phoneNumber,
      verifyDto.otp,
      'REGISTRATION'
    );

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
    const otpResponse = await this.whatsAppService.sendOtp(loginDto.phoneNumber, 'LOGIN');

    return { sessionId: otpResponse.sessionId };
  }

  async verifyLogin(verifyDto: VerifyOtpForAuthDto) {
    // Verify OTP
    await this.whatsAppService.verifyOtp(
      verifyDto.phoneNumber,
      verifyDto.otp,
      'LOGIN'
    );

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
        isVerified: user.isVerified,
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

    const purpose = user.isVerified ? 'LOGIN' : 'REGISTRATION';
    const otpResponse = await this.whatsAppService.sendOtp(phoneNumber, purpose);

    return { sessionId: otpResponse.sessionId };
  }

  async adminLogin(loginDto: AdminLoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: loginDto.phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is admin
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Access denied. Admin privileges required.');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new ForbiddenException('Please complete your registration first');
    }

    // Send OTP
    const otpResponse = await this.whatsAppService.sendOtp(loginDto.phoneNumber, 'LOGIN');

    return { sessionId: otpResponse.sessionId };
  }

  async adminVerifyLogin(verifyDto: AdminVerifyOtpDto) {
    // Verify OTP
    await this.whatsAppService.verifyOtp(
      verifyDto.phoneNumber,
      verifyDto.otp,
      'LOGIN'
    );

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: verifyDto.phoneNumber },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify admin role
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Access denied. Admin privileges required.');
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
