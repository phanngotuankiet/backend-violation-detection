import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    console.log('Validating JWT payload:', payload); // Debug log

    // Return user object that will be attached to Request
    return {
      id: payload.sub, // User ID from token
      email: payload.email, // Email from token
      role: payload.role, // Role if exists
    };
  }
}
