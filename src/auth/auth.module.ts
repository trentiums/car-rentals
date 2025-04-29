import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OtpModule } from '../otp/otp.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleGuard } from './guards/role.guard';

@Module({
  imports: [
    PrismaModule,
    OtpModule,
    PassportModule,
    ConfigModule.forRoot({
      isGlobal: true,  // If you want the configuration to be available globally
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule here to use it
      inject: [ConfigService], // Inject ConfigService into the factory
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-default-secret-key',
        signOptions: { expiresIn: '1d' }, // You can adjust the expiry time as needed
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PrismaService,
    OtpService,
    JwtAuthGuard,
    ConfigService,
    JwtService,
    RoleGuard
  ],
  exports: [
    AuthService,
    PrismaService,
    JwtStrategy,
    OtpService,
    JwtModule,
    JwtAuthGuard,
    RoleGuard
  ]
})
export class AuthModule { }
