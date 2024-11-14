import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard) // Route này yêu cầu JWT token hợp lệ
  @Get()
  getProtectedData() {
    return { message: 'This is protected data' };
  }
}
