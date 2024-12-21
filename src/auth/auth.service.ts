import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async register(email: string, password: string, name?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch {
      throw new Error('Error creating user');
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({
        email: user.email,
        sub: user.id,
      }),
      this.generateRefreshToken(user.id),
    ]);

    const { password: _, ...userWithoutPassword } = user;

    console.log({
      user: userWithoutPassword,
      access_token: accessToken,
      refresh_token: refreshToken,
      email: user.email,
    });

    return {
      user: userWithoutPassword,
      access_token: accessToken,
      refresh_token: refreshToken,
      email: user.email,
    };
  }

  async generateRefreshToken(userId: number): Promise<string> {
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      { expiresIn: '7d' },
    );

    // Lưu refresh token vào database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return refreshToken;
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken);

      // Check if token exists in database
      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: payload.sub,
          expiresAt: {
            gt: new Date(), // Check if token hasn't expired
          },
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newAccessToken = await this.jwtService.signAsync({
        email: payload.email,
        sub: payload.sub,
      });

      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
