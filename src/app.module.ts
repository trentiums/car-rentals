import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { OtpModule } from './otp/otp.module';
import { CarTypesModule } from './car-types/car-types.module';
import { CitiesModule } from './cities/cities.module';
import { RequirementController } from './requirement/requirement.controller';
import { RequirementService } from './requirement/requirement.service';
import { RequirementModule } from './requirement/requirement.module';

@Module({
  imports: [ ConfigModule.forRoot({
    isGlobal: true,  
  }),PrismaModule, CitiesModule, OtpModule, AuthModule, CarTypesModule, RequirementModule],
  controllers: [AppController, RequirementController],
  providers: [AppService, RequirementService],
})
export class AppModule {}
