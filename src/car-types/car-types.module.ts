import { Module } from '@nestjs/common';
import { CarTypesService } from './car-types.service';
import { CarTypesController } from './car-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CarTypesController],
  providers: [CarTypesService],
})
export class CarTypesModule {}
