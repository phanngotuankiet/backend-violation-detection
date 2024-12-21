import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Thêm
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Add logging for debugging
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;
    console.log('Token from request:', token);

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Add logging for debugging
    console.log('Handling request:', { err, user, info });

    // Check for errors or missing user
    if (err || !user) {
      throw (
        err || new UnauthorizedException('Invalid token or no token provided')
      );
    }

    // Ensure user has required fields
    if (!user.id) {
      throw new UnauthorizedException('Invalid user data in token');
    }

    return user;
  }
}
