import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsAppModule } from '../common/whatsapp.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleGuard } from './guards/role.guard';
import { WhatsAppService } from 'src/common/whatsapp.service';

@Module({
  imports: [
    PrismaModule,
    WhatsAppModule,
    PassportModule,
    ConfigModule.forRoot({
      isGlobal: true,  // If you want the configuration to be available globally
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PrismaService,
    JwtAuthGuard,
    ConfigService,
    JwtService,
    RoleGuard,
    WhatsAppService
  ],
  exports: [
    AuthService,
    PrismaService,
    JwtStrategy,
    JwtModule,
    JwtAuthGuard,
    RoleGuard,
    WhatsAppService
  ]
})
export class AuthModule { }
