import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebsocketModule],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
