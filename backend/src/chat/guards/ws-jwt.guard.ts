import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Unauthorized');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'secretKey',
      });
      // Assign user to socket instance for later access
      client.data.user = payload;
      return true;
    } catch (err) {
      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: Socket): string | undefined {
    const auth = client.handshake.auth;
    if (auth && auth.token) {
      const [type, token] = auth.token.split(' ');
      return type === 'Bearer' ? token : auth.token;
    }
    // Fallback to headers if needed, or query params
    const headers = client.handshake.headers;
    if (headers.authorization) {
       const [type, token] = headers.authorization.split(' ');
       return type === 'Bearer' ? token : headers.authorization;
    }
    return undefined;
  }
}

