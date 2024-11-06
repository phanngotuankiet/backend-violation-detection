import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
<<<<<<< HEAD
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, AdminModule],
=======

@Module({
  imports: [PrismaModule],
>>>>>>> 177a9da (first commit)
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
