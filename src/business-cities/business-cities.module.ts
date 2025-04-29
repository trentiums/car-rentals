import { Module } from '@nestjs/common';
import { BusinessCitiesController } from './business-cities.controller';
import { BusinessCitiesService } from './business-cities.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [BusinessCitiesController],
  providers: [BusinessCitiesService, PrismaService],
  exports: [BusinessCitiesService],
})
export class BusinessCitiesModule {}
