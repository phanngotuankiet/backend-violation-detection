import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { PrismaModule } from 'src/prisma/prisma.module';

import { VideoController } from './video.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  providers: [VideoService],
  controllers: [VideoController],
  exports: [VideoService],
})
export class VideoModule {}
