import { Module } from '@nestjs/common';
import { AnswerService } from './answer.service';
import { AnswerController } from './answer.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebsocketModule],
  providers: [AnswerService],
  controllers: [AnswerController],
})
export class AnswerModule {}
