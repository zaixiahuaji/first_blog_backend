import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtPayload = {
  sub: string;
  role: string;
  username?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev_secret_change_me'),
    });
  }

  validate(payload: JwtPayload) {
    // 这里返回的对象会挂到 req.user
    return {
      userId: payload.sub,
      role: payload.role,
      username: payload.username,
    };
  }
}
