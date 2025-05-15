import { Module } from '@nestjs/common';
import { RequirementService } from './requirement.service';
import { RequirementController } from './requirement.controller';
import { BusinessCitiesModule } from 'src/business-cities/business-cities.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/common/notification.module';

@Module({
  imports: [BusinessCitiesModule, PrismaModule, NotificationModule],
  controllers: [RequirementController],
  providers: [RequirementService],
})
export class RequirementModule { }
