import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { NotificationModule } from 'src/common/notification.module';
import { NotificationService } from 'src/common/notification.service';

@Module({
  imports: [PrismaModule, S3Module, NotificationModule],
  controllers: [PostsController],
  providers: [PostsService, NotificationService],
  exports: [PostsService],
})
export class PostsModule { }
