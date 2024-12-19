import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { QuestionModule } from './question/question.module';
import { AnswerModule } from './answer/answer.module';
import { CommentModule } from './comment/comment.module';
import { WebsocketModule } from './websocket/websocket.module';
import { SearchController } from './search/search.controller';
import { SearchService } from './search/search.service';
import { SearchModule } from './search/search.module';
// import { WebSocketGateway } from '@nestjs/websockets';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { VideoController } from './video/video.controller';
import { VideoModule } from './video/video.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    AdminModule,
    QuestionModule,
    AnswerModule,
    CommentModule,
    WebsocketModule,
    SearchModule,
    VideoModule,
    // AdminForumModule,
  ],
  controllers: [AppController, SearchController, VideoController],
  providers: [AppService, SearchService, WebsocketGateway],
})
export class AppModule {}
